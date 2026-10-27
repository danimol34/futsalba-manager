-- =========================================================
-- FUTSALBA MANAGER
-- live_match_functions.sql
-- =========================================================

-- 1. MODIFICACIONES DE ESQUEMA (IDEMPOTENTES)
do $$
begin
  -- Reloj
  if not exists (select 1 from information_schema.columns where table_name='matches' and column_name='clock_status') then
    alter table public.matches add column clock_status text default 'PAUSED';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='matches' and column_name='clock_last_started_at') then
    alter table public.matches add column clock_last_started_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='matches' and column_name='clock_base_seconds') then
    alter table public.matches add column clock_base_seconds integer default 0;
  end if;

  -- Idempotencia (doble click)
  if not exists (select 1 from information_schema.columns where table_name='match_events' and column_name='client_event_id') then
    alter table public.match_events add column client_event_id uuid unique;
  end if;

  -- Enlace sanción -> evento
  if not exists (select 1 from information_schema.columns where table_name='sanctions' and column_name='match_event_id') then
    alter table public.sanctions add column match_event_id uuid references public.match_events(id) on delete cascade;
  end if;

  -- Límite de timeouts por periodo
  if not exists (select 1 from information_schema.columns where table_name='league_settings' and column_name='timeouts_per_team_per_period') then
    alter table public.league_settings add column timeouts_per_team_per_period integer not null default 1;
  end if;
end $$;


-- =========================================================
-- FUNCIONES PARA REGISTRO DE EVENTOS EN VIVO DE FORMA TRANSACCIONAL
-- =========================================================

-- 2. Registro de evento (Gol, Falta, Tarjeta, etc.)
create or replace function public.register_match_event(
  p_match_id uuid,
  p_team_id uuid,
  p_player_id uuid,
  p_secondary_player_id uuid,
  p_event_type public.match_event_type,
  p_period integer,
  p_minute integer,
  p_second integer,
  p_notes text default null,
  p_client_event_id uuid default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match record;
  v_event record;
  v_user_id uuid;
  v_player_team uuid;
  v_sec_player_team uuid;
  v_timeout_limit integer;
begin
  v_user_id := auth.uid();

  -- Validar autenticación y permisos
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not public.can_create_match_event() then
    raise exception 'No autorizado para crear eventos de partido';
  end if;

  -- Obtener y bloquear el partido
  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Partido no encontrado';
  end if;

  -- Validar estado del partido
  if v_match.status in ('FINALIZADO', 'CANCELADO', 'SUSPENDIDO') then
    raise exception 'El partido está % y no admite eventos', v_match.status;
  end if;

  -- Validar TEAM_ID
  if p_team_id is null then
    raise exception 'El equipo es obligatorio';
  end if;

  if p_team_id is distinct from v_match.home_team_id and p_team_id is distinct from v_match.away_team_id then
    raise exception 'El equipo no pertenece a este partido';
  end if;

  -- Validar PLAYER_ID
  if p_player_id is not null then
    select team_id into v_player_team from public.players where id = p_player_id;
    if not found then
      raise exception 'Jugador principal no encontrado';
    end if;
    if v_player_team is distinct from p_team_id then
      raise exception 'El jugador principal no pertenece al equipo seleccionado';
    end if;
  end if;

  -- Validar SECONDARY_PLAYER_ID
  if p_secondary_player_id is not null then
    select team_id into v_sec_player_team from public.players where id = p_secondary_player_id;
    if not found then
      raise exception 'Jugador secundario no encontrado';
    end if;
    if v_sec_player_team is distinct from p_team_id then
      raise exception 'El jugador secundario no pertenece al equipo seleccionado';
    end if;
    if p_player_id = p_secondary_player_id then
      raise exception 'El jugador principal y secundario no pueden ser el mismo';
    end if;
  end if;

  -- Validar convocatoria si el partido tiene jugadores registrados en match_players
  if exists (select 1 from public.match_players where match_id = p_match_id) then
    if p_player_id is not null and not exists (
      select 1 from public.match_players where match_id = p_match_id and player_id = p_player_id and team_id = p_team_id
    ) then
      raise exception 'El jugador principal no está convocado para este partido';
    end if;
    if p_secondary_player_id is not null and not exists (
      select 1 from public.match_players where match_id = p_match_id and player_id = p_secondary_player_id and team_id = p_team_id
    ) then
      raise exception 'El jugador secundario no está convocado para este partido';
    end if;
  end if;

  -- Idempotencia: Verificar si el evento ya existe
  if p_client_event_id is not null then
    select * into v_event from public.match_events where client_event_id = p_client_event_id;
    if found then
      if v_event.match_id != p_match_id then
        raise exception 'Inconsistencia: el identificador de evento ya fue usado en otro partido';
      end if;
      -- Ya existe, devolvemos el partido actual directamente
      return json_build_object(
        'success', true,
        'event_id', v_event.id,
        'home_score', v_match.home_score,
        'away_score', v_match.away_score,
        'home_fouls', v_match.home_fouls,
        'away_fouls', v_match.away_fouls,
        'status', v_match.status,
        'period', v_match.period,
        'home_timeouts', v_match.home_timeouts,
        'away_timeouts', v_match.away_timeouts
      );
    end if;
  end if;

  -- Insertar el evento
  insert into public.match_events (
    match_id, team_id, player_id, secondary_player_id,
    event_type, period, minute, second, notes, created_by, client_event_id
  ) values (
    p_match_id, p_team_id, p_player_id, p_secondary_player_id,
    p_event_type, p_period, p_minute, p_second, p_notes, v_user_id, p_client_event_id
  ) returning * into v_event;

  -- Actualizar el marcador/faltas/timeouts según el tipo de evento
  if p_event_type = 'goal' then
    if p_team_id = v_match.home_team_id then
      update public.matches set home_score = home_score + 1 where id = p_match_id;
    elsif p_team_id = v_match.away_team_id then
      update public.matches set away_score = away_score + 1 where id = p_match_id;
    else
      raise exception 'Equipo inválido para este partido';
    end if;
  elsif p_event_type = 'foul' then
    if p_team_id = v_match.home_team_id then
      update public.matches set home_fouls = home_fouls + 1 where id = p_match_id;
    elsif p_team_id = v_match.away_team_id then
      update public.matches set away_fouls = away_fouls + 1 where id = p_match_id;
    else
      raise exception 'Equipo inválido para este partido';
    end if;
  elsif p_event_type = 'timeout' then
    -- Leer límite de timeouts
    select timeouts_per_team_per_period into v_timeout_limit from public.league_settings limit 1;
    v_timeout_limit := coalesce(v_timeout_limit, 1);

    if p_team_id = v_match.home_team_id then
      if v_match.home_timeouts >= v_timeout_limit then
        raise exception 'El equipo ya alcanzó el máximo de tiempos muertos permitidos';
      end if;
      update public.matches set home_timeouts = home_timeouts + 1 where id = p_match_id;
    elsif p_team_id = v_match.away_team_id then
      if v_match.away_timeouts >= v_timeout_limit then
        raise exception 'El equipo ya alcanzó el máximo de tiempos muertos permitidos';
      end if;
      update public.matches set away_timeouts = away_timeouts + 1 where id = p_match_id;
    else
      raise exception 'Equipo inválido para este partido';
    end if;
  elsif p_event_type = 'red_card' then
    -- Crear sanción opcional enlazada al evento (se borrará en cascada)
    insert into public.sanctions (
      player_id, team_id, match_id, reason, status, match_event_id
    ) values (
      p_player_id, p_team_id, p_match_id, 'Expulsión durante partido', 'PENDIENTE', v_event.id
    );
  end if;

  -- Registrar en auditoría
  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, new_data
  ) values (
    v_user_id, 
    case 
      when p_event_type = 'goal' then 'GOAL_CREATED'
      when p_event_type = 'foul' then 'FOUL_CREATED'
      else 'EVENT_CREATED_' || upper(p_event_type::text)
    end,
    'match_events',
    v_event.id,
    row_to_json(v_event)
  );

  -- Volver a leer el partido
  select * into v_match from public.matches where id = p_match_id;

  return json_build_object(
    'success', true,
    'event_id', v_event.id,
    'home_score', v_match.home_score,
    'away_score', v_match.away_score,
    'home_fouls', v_match.home_fouls,
    'away_fouls', v_match.away_fouls,
    'status', v_match.status,
    'period', v_match.period,
    'home_timeouts', v_match.home_timeouts,
    'away_timeouts', v_match.away_timeouts,
    'event', row_to_json(v_event)
  );
end;
$$;

-- 3. Eliminar/Corregir evento
create or replace function public.delete_match_event(
  p_event_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event record;
  v_match record;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  -- Validar permisos
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not public.can_manage_match() then
    raise exception 'No autorizado para eliminar eventos de partido';
  end if;

  -- Obtener el evento
  select * into v_event from public.match_events where id = p_event_id for update;
  if not found then
    raise exception 'Evento no encontrado';
  end if;

  -- Obtener el partido asociado
  select * into v_match from public.matches where id = v_event.match_id for update;
  if not found then
    raise exception 'Partido asociado no encontrado';
  end if;

  -- Revertir el marcador/faltas/timeouts (lanzando error si intenta bajar de 0)
  if v_event.event_type = 'goal' then
    if v_event.team_id = v_match.home_team_id then
      if v_match.home_score <= 0 then
        raise exception 'Inconsistencia de marcador: no se puede revertir el gol local porque el marcador ya está en 0';
      end if;
      update public.matches set home_score = home_score - 1 where id = v_match.id;
    elsif v_event.team_id = v_match.away_team_id then
      if v_match.away_score <= 0 then
        raise exception 'Inconsistencia de marcador: no se puede revertir el gol visitante porque el marcador ya está en 0';
      end if;
      update public.matches set away_score = away_score - 1 where id = v_match.id;
    else
      raise exception 'El equipo del evento no pertenece al partido';
    end if;
  elsif v_event.event_type = 'foul' then
    if v_event.team_id = v_match.home_team_id then
      if v_match.home_fouls <= 0 then
        raise exception 'Inconsistencia: no se puede revertir la falta local porque el contador ya está en 0';
      end if;
      update public.matches set home_fouls = home_fouls - 1 where id = v_match.id;
    elsif v_event.team_id = v_match.away_team_id then
      if v_match.away_fouls <= 0 then
        raise exception 'Inconsistencia: no se puede revertir la falta visitante porque el contador ya está en 0';
      end if;
      update public.matches set away_fouls = away_fouls - 1 where id = v_match.id;
    else
      raise exception 'El equipo del evento no pertenece al partido';
    end if;
  elsif v_event.event_type = 'timeout' then
    if v_event.team_id = v_match.home_team_id then
      if v_match.home_timeouts <= 0 then
        raise exception 'Inconsistencia: no se puede revertir el tiempo muerto local porque el contador ya está en 0';
      end if;
      update public.matches set home_timeouts = home_timeouts - 1 where id = v_match.id;
    elsif v_event.team_id = v_match.away_team_id then
      if v_match.away_timeouts <= 0 then
        raise exception 'Inconsistencia: no se puede revertir el tiempo muerto visitante porque el contador ya está en 0';
      end if;
      update public.matches set away_timeouts = away_timeouts - 1 where id = v_match.id;
    else
      raise exception 'El equipo del evento no pertenece al partido';
    end if;
  end if;

  -- (La sanción asociada se elimina sola por el ON DELETE CASCADE del match_event_id)

  -- Eliminar el evento
  delete from public.match_events where id = p_event_id;

  -- Registrar en auditoría
  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, old_data
  ) values (
    v_user_id, 
    case 
      when v_event.event_type = 'goal' then 'GOAL_DELETED'
      else 'EVENT_DELETED'
    end,
    'match_events',
    v_event.id,
    row_to_json(v_event)
  );

  -- Re-query the match to get the final state
  select * into v_match from public.matches where id = v_match.id;

  return json_build_object(
    'success', true,
    'home_score', v_match.home_score,
    'away_score', v_match.away_score,
    'home_fouls', v_match.home_fouls,
    'away_fouls', v_match.away_fouls,
    'status', v_match.status,
    'period', v_match.period,
    'home_timeouts', v_match.home_timeouts,
    'away_timeouts', v_match.away_timeouts
  );
end;
$$;

-- 4. Cambiar estado del partido (Iniciar, Finalizar, Descanso)
create or replace function public.change_match_status(
  p_match_id uuid,
  p_status public.match_status,
  p_period integer default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_old_match record;
  v_match record;
  v_action text;
  v_elapsed integer;
begin
  v_user_id := auth.uid();

  -- Validar permisos
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not public.can_manage_match() then
    raise exception 'No autorizado para gestionar partidos';
  end if;

  select * into v_old_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Partido no encontrado';
  end if;

  if p_status = 'EN_VIVO' and v_old_match.status != 'EN_VIVO' then
    if v_old_match.status = 'DESCANSO' then
      v_action := 'MATCH_RESUMED';
    else
      v_action := 'MATCH_STARTED';
    end if;

    -- Iniciar o reanudar
    update public.matches 
    set status = p_status, 
        period = coalesce(p_period, period),
        home_fouls = case when p_period is not null and p_period > v_old_match.period then 0 else home_fouls end,
        away_fouls = case when p_period is not null and p_period > v_old_match.period then 0 else away_fouls end,
        home_timeouts = case when p_period is not null and p_period > v_old_match.period then 0 else home_timeouts end,
        away_timeouts = case when p_period is not null and p_period > v_old_match.period then 0 else away_timeouts end,
        clock_status = 'RUNNING',
        clock_last_started_at = now()
    where id = p_match_id;
  else
    if p_status = 'DESCANSO' then
      v_action := 'MATCH_HALFTIME';
    elsif p_status = 'FINALIZADO' then
      v_action := 'MATCH_FINISHED';
    else
      v_action := 'MATCH_STATUS_CHANGED';
    end if;

    -- Otros cambios: Si estaba corriendo y lo pausamos (ya sea por DESCANSO o FINALIZADO)
    if v_old_match.clock_status = 'RUNNING' then
      v_elapsed := extract(epoch from (now() - v_old_match.clock_last_started_at))::integer;
    else
      v_elapsed := 0;
    end if;

    update public.matches 
    set status = p_status,
        period = coalesce(p_period, period),
        home_fouls = case when p_period is not null and p_period > v_old_match.period then 0 else home_fouls end,
        away_fouls = case when p_period is not null and p_period > v_old_match.period then 0 else away_fouls end,
        home_timeouts = case when p_period is not null and p_period > v_old_match.period then 0 else home_timeouts end,
        away_timeouts = case when p_period is not null and p_period > v_old_match.period then 0 else away_timeouts end,
        clock_status = 'PAUSED',
        clock_base_seconds = clock_base_seconds + coalesce(v_elapsed, 0),
        clock_last_started_at = null
    where id = p_match_id;
  end if;

  -- Registrar en auditoría
  insert into public.audit_logs (
    user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    v_user_id, 
    v_action,
    'matches',
    p_match_id,
    jsonb_build_object('status', v_old_match.status, 'period', v_old_match.period),
    jsonb_build_object('status', p_status, 'period', p_period)
  );

  select * into v_match from public.matches where id = p_match_id;

  return json_build_object(
    'success', true,
    'status', v_match.status,
    'period', v_match.period,
    'home_fouls', v_match.home_fouls,
    'away_fouls', v_match.away_fouls,
    'clock_status', v_match.clock_status,
    'clock_last_started_at', v_match.clock_last_started_at,
    'clock_base_seconds', v_match.clock_base_seconds
  );
end;
$$;

-- 5. Actualizar estado del reloj (Pausar / Ajustar base_seconds)
create or replace function public.update_match_clock(
  p_match_id uuid,
  p_clock_status text,
  p_manual_override_seconds integer default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_match record;
  v_elapsed integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  if not public.can_manage_match() then
    raise exception 'No autorizado para gestionar el reloj';
  end if;

  if p_clock_status not in ('RUNNING', 'PAUSED') then
    raise exception 'Estado de reloj inválido';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Partido no encontrado';
  end if;

  if v_match.clock_status = 'RUNNING' and p_clock_status = 'PAUSED' then
    v_elapsed := extract(epoch from (now() - v_match.clock_last_started_at))::integer;
    update public.matches 
    set clock_status = 'PAUSED', 
        clock_base_seconds = v_match.clock_base_seconds + coalesce(v_elapsed, 0), 
        clock_last_started_at = null 
    where id = p_match_id;
  elsif v_match.clock_status = 'PAUSED' and p_clock_status = 'RUNNING' then
    update public.matches 
    set clock_status = 'RUNNING', 
        clock_last_started_at = now() 
    where id = p_match_id;
  elsif p_manual_override_seconds is not null then
    -- Si el estado no cambia pero hay un override manual de segundos
    if p_manual_override_seconds < 0 then
      raise exception 'El reloj no puede tener segundos negativos';
    end if;
    update public.matches
    set clock_base_seconds = p_manual_override_seconds,
        clock_last_started_at = case when p_clock_status = 'RUNNING' then now() else null end
    where id = p_match_id;
  end if;

  select * into v_match from public.matches where id = p_match_id;

  return json_build_object(
    'success', true,
    'clock_status', v_match.clock_status,
    'clock_last_started_at', v_match.clock_last_started_at,
    'clock_base_seconds', v_match.clock_base_seconds
  );
end;
$$;

-- =========================================================
-- PERMISOS EXPLÍCITOS (GRANT/REVOKE)
-- =========================================================

revoke all on function public.register_match_event(uuid, uuid, uuid, uuid, public.match_event_type, integer, integer, integer, text, uuid) from public;
revoke all on function public.register_match_event(uuid, uuid, uuid, uuid, public.match_event_type, integer, integer, integer, text, uuid) from anon;
grant execute on function public.register_match_event(uuid, uuid, uuid, uuid, public.match_event_type, integer, integer, integer, text, uuid) to authenticated;

revoke all on function public.delete_match_event(uuid) from public;
revoke all on function public.delete_match_event(uuid) from anon;
grant execute on function public.delete_match_event(uuid) to authenticated;

revoke all on function public.change_match_status(uuid, public.match_status, integer) from public;
revoke all on function public.change_match_status(uuid, public.match_status, integer) from anon;
grant execute on function public.change_match_status(uuid, public.match_status, integer) to authenticated;

revoke all on function public.update_match_clock(uuid, text, integer) from public;
revoke all on function public.update_match_clock(uuid, text, integer) from anon;
grant execute on function public.update_match_clock(uuid, text, integer) to authenticated;
