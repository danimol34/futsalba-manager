-- ==============================================================================
-- FUTSALBA MANAGER - LIMPIEZA SEGURA DE DATOS DE PRUEBA (EXCLUSIVO SUPER_ADMIN)
-- Archivo: supabase/super_admin_test_cleanup.sql
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE y crea las funciones RPC transaccionales:
--   1. public.is_super_admin()
--   2. public.inspect_match_dependencies(p_match_id uuid)
--   3. public.delete_test_match(p_match_id uuid)
--   4. public.inspect_team_dependencies(p_team_id uuid)
--   5. public.delete_test_team(p_team_id uuid)
--
-- Seguridad:
--   - Verifica auth.uid() y exige rol 'SUPER_ADMIN' en public.user_roles.
--   - No utiliza claves secretas en cliente.
--   - Elimina dependencias en el orden exacto de claves foráneas dentro de una
--     única transacción (rollback completo automático ante cualquier fallo).
--   - Impide eliminar un equipo de prueba si todavía tiene partidos asociados.
-- ==============================================================================

-- 1. FUNCIÓN AUXILIAR: VERIFICAR EXCLUSIVAMENTE ROL SUPER_ADMIN
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'SUPER_ADMIN'
  );
$$;

revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;


-- 2. DIAGNÓSTICO DE DEPENDENCIAS DE UN PARTIDO
create or replace function public.inspect_match_dependencies(
  p_match_id uuid
)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_match record;
  v_official_events integer := 0;
  v_aux_events integer := 0;
  v_total_events integer := 0;
  v_sanctions integer := 0;
  v_players integer := 0;
  v_referees integer := 0;
  v_logistics integer := 0;
  v_event_types text[] := array[]::text[];
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'No autorizado para inspeccionar dependencias del partido.';
  end if;

  select
    id,
    status,
    home_score,
    away_score,
    home_fouls,
    away_fouls,
    home_timeouts,
    away_timeouts
  into v_match
  from public.matches
  where id = p_match_id;

  if not found then
    return json_build_object('found', false);
  end if;

  select
    count(*),
    count(*) filter (
      where event_type in (
        'goal',
        'assist',
        'yellow_card',
        'red_card',
        'foul',
        'penalty',
        'double_penalty'
      )
    ),
    count(*) filter (
      where event_type in (
        'substitution',
        'timeout',
        'injury',
        'note'
      )
    ),
    coalesce(array_agg(distinct event_type::text), array[]::text[])
  into
    v_total_events,
    v_official_events,
    v_aux_events,
    v_event_types
  from public.match_events
  where match_id = p_match_id;

  select count(*) into v_sanctions from public.sanctions where match_id = p_match_id;
  select count(*) into v_players from public.match_players where match_id = p_match_id;
  select count(*) into v_referees from public.match_referees where match_id = p_match_id;
  select count(*) into v_logistics from public.logistics_tasks where match_id = p_match_id;

  return json_build_object(
    'found', true,
    'status', v_match.status,
    'home_score', coalesce(v_match.home_score, 0),
    'away_score', coalesce(v_match.away_score, 0),
    'home_fouls', coalesce(v_match.home_fouls, 0),
    'away_fouls', coalesce(v_match.away_fouls, 0),
    'home_timeouts', coalesce(v_match.home_timeouts, 0),
    'away_timeouts', coalesce(v_match.away_timeouts, 0),
    'total_events_count', coalesce(v_total_events, 0),
    'official_events_count', coalesce(v_official_events, 0),
    'auxiliary_events_count', coalesce(v_aux_events, 0),
    'event_types', coalesce(v_event_types, array[]::text[]),
    'sanctions_count', coalesce(v_sanctions, 0),
    'match_players_count', coalesce(v_players, 0),
    'match_referees_count', coalesce(v_referees, 0),
    'logistics_tasks_count', coalesce(v_logistics, 0)
  );
end;
$$;

revoke all on function public.inspect_match_dependencies(uuid) from public, anon;
grant execute on function public.inspect_match_dependencies(uuid) to authenticated;


-- 3. ELIMINACIÓN TRANSACCIONAL DE PARTIDO DE PRUEBA (EXCLUSIVO SUPER_ADMIN)
create or replace function public.delete_test_match(
  p_match_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_match record;
  v_deleted_sanctions integer := 0;
  v_deleted_events integer := 0;
  v_deleted_players integer := 0;
  v_deleted_referees integer := 0;
  v_deleted_logistics integer := 0;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_super_admin() then
    raise exception 'Acceso denegado: únicamente SUPER_ADMIN puede eliminar datos de prueba.';
  end if;

  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'El partido especificado no existe o ya fue eliminado.';
  end if;

  -- Orden estricto de limpieza de dependencias antes de eliminar el partido:
  -- 3.1 Sanciones vinculadas a este partido (o a eventos de este partido)
  delete from public.sanctions
  where match_id = p_match_id
     or match_event_id in (
       select id from public.match_events where match_id = p_match_id
     );
  get diagnostics v_deleted_sanctions = row_count;

  -- 3.2 Eventos del partido (goles, faltas, tarjetas, notas, tiempos muertos)
  delete from public.match_events
  where match_id = p_match_id;
  get diagnostics v_deleted_events = row_count;

  -- 3.3 Convocatoria / alineación del partido
  delete from public.match_players
  where match_id = p_match_id;
  get diagnostics v_deleted_players = row_count;

  -- 3.4 Designaciones arbitrales del partido
  delete from public.match_referees
  where match_id = p_match_id;
  get diagnostics v_deleted_referees = row_count;

  -- 3.5 Tareas logísticas asociadas al partido
  delete from public.logistics_tasks
  where match_id = p_match_id;
  get diagnostics v_deleted_logistics = row_count;

  -- 3.6 Eliminar finalmente el partido
  delete from public.matches
  where id = p_match_id;

  -- 3.7 Registrar en bitácora de auditoría
  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) values (
    v_user_id,
    'TEST_MATCH_DELETED',
    'matches',
    p_match_id,
    row_to_json(v_match)::jsonb,
    jsonb_build_object(
      'deleted_sanctions', v_deleted_sanctions,
      'deleted_events', v_deleted_events,
      'deleted_match_players', v_deleted_players,
      'deleted_match_referees', v_deleted_referees,
      'deleted_logistics_tasks', v_deleted_logistics
    )
  );

  return json_build_object(
    'success', true,
    'deleted_match_id', p_match_id,
    'deleted_sanctions', v_deleted_sanctions,
    'deleted_events', v_deleted_events,
    'deleted_match_players', v_deleted_players,
    'deleted_match_referees', v_deleted_referees,
    'deleted_logistics_tasks', v_deleted_logistics
  );
end;
$$;

revoke all on function public.delete_test_match(uuid) from public, anon;
grant execute on function public.delete_test_match(uuid) to authenticated;


-- 4. DIAGNÓSTICO DE DEPENDENCIAS DE UN EQUIPO
create or replace function public.inspect_team_dependencies(
  p_team_id uuid
)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_team record;
  v_matches_count integer := 0;
  v_players_count integer := 0;
  v_coaches_count integer := 0;
  v_sanctions_count integer := 0;
  v_adjustments_count integer := 0;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'No autorizado para inspeccionar dependencias del equipo.';
  end if;

  select id, name, short_name into v_team
  from public.teams
  where id = p_team_id;

  if not found then
    return json_build_object('found', false);
  end if;

  select count(*) into v_matches_count
  from public.matches
  where home_team_id = p_team_id or away_team_id = p_team_id;

  select count(*) into v_players_count
  from public.players
  where team_id = p_team_id;

  select count(*) into v_coaches_count
  from public.coaches
  where team_id = p_team_id;

  select count(*) into v_sanctions_count
  from public.sanctions
  where team_id = p_team_id;

  select count(*) into v_adjustments_count
  from public.standings_adjustments
  where team_id = p_team_id;

  return json_build_object(
    'found', true,
    'matches_count', coalesce(v_matches_count, 0),
    'players_count', coalesce(v_players_count, 0),
    'coaches_count', coalesce(v_coaches_count, 0),
    'sanctions_count', coalesce(v_sanctions_count, 0),
    'adjustments_count', coalesce(v_adjustments_count, 0)
  );
end;
$$;

revoke all on function public.inspect_team_dependencies(uuid) from public, anon;
grant execute on function public.inspect_team_dependencies(uuid) to authenticated;


-- 5. ELIMINACIÓN TRANSACCIONAL DE EQUIPO DE PRUEBA (EXCLUSIVO SUPER_ADMIN)
create or replace function public.delete_test_team(
  p_team_id uuid
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_team record;
  v_matches_count integer := 0;
  v_deleted_sanctions integer := 0;
  v_deleted_events integer := 0;
  v_deleted_match_players integer := 0;
  v_deleted_adjustments integer := 0;
  v_deleted_coaches integer := 0;
  v_deleted_players integer := 0;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'No autenticado.';
  end if;

  if not public.is_super_admin() then
    raise exception 'Acceso denegado: únicamente SUPER_ADMIN puede eliminar equipos de prueba.';
  end if;

  select * into v_team
  from public.teams
  where id = p_team_id
  for update;

  if not found then
    raise exception 'El equipo especificado no existe o ya fue eliminado.';
  end if;

  -- Regla obligatoria: NO borrar partidos automáticamente al eliminar un equipo.
  select count(*) into v_matches_count
  from public.matches
  where home_team_id = p_team_id
     or away_team_id = p_team_id;

  if v_matches_count > 0 then
    raise exception 'Este equipo todavía tiene partidos registrados. Elimina primero sus partidos de prueba.';
  end if;

  -- Orden estricto de limpieza de dependencias del equipo:
  -- 5.1 Sanciones del equipo o de sus jugadores
  delete from public.sanctions
  where team_id = p_team_id
     or player_id in (select id from public.players where team_id = p_team_id);
  get diagnostics v_deleted_sanctions = row_count;

  -- 5.2 Eventos residuales huérfanos asociados al equipo o sus jugadores
  delete from public.match_events
  where team_id = p_team_id
     or player_id in (select id from public.players where team_id = p_team_id)
     or secondary_player_id in (select id from public.players where team_id = p_team_id);
  get diagnostics v_deleted_events = row_count;

  -- 5.3 Convocatorias residuales del equipo o sus jugadores
  delete from public.match_players
  where team_id = p_team_id
     or player_id in (select id from public.players where team_id = p_team_id);
  get diagnostics v_deleted_match_players = row_count;

  -- 5.4 Ajustes de puntos de prueba asociados a este equipo
  update public.standings_adjustments
  set reverses_adjustment_id = null
  where team_id = p_team_id
     or reverses_adjustment_id in (
       select id from public.standings_adjustments where team_id = p_team_id
     );

  delete from public.standings_adjustments
  where team_id = p_team_id;
  get diagnostics v_deleted_adjustments = row_count;

  -- 5.5 Cuerpo técnico del equipo
  delete from public.coaches
  where team_id = p_team_id;
  get diagnostics v_deleted_coaches = row_count;

  -- 5.6 Jugadores del equipo
  delete from public.players
  where team_id = p_team_id;
  get diagnostics v_deleted_players = row_count;

  -- 5.7 Eliminar finalmente el equipo
  delete from public.teams
  where id = p_team_id;

  -- 5.8 Registrar en bitácora de auditoría
  insert into public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data
  ) values (
    v_user_id,
    'TEST_TEAM_DELETED',
    'teams',
    p_team_id,
    row_to_json(v_team)::jsonb,
    jsonb_build_object(
      'deleted_players', v_deleted_players,
      'deleted_coaches', v_deleted_coaches,
      'deleted_sanctions', v_deleted_sanctions,
      'deleted_adjustments', v_deleted_adjustments,
      'deleted_events', v_deleted_events,
      'deleted_match_players', v_deleted_match_players
    )
  );

  return json_build_object(
    'success', true,
    'deleted_team_id', p_team_id,
    'deleted_players', v_deleted_players,
    'deleted_coaches', v_deleted_coaches,
    'deleted_sanctions', v_deleted_sanctions,
    'deleted_adjustments', v_deleted_adjustments
  );
end;
$$;

revoke all on function public.delete_test_team(uuid) from public, anon;
grant execute on function public.delete_test_team(uuid) to authenticated;
