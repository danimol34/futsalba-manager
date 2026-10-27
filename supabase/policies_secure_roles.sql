-- ==============================================================================
-- FUTSALBA MANAGER - POLÍTICAS RLS SEGURAS BASADAS EN ROLES (RBAC)
-- ==============================================================================
-- Este script implementa la seguridad estricta para la plataforma FUTSALBA:
--
-- 1. Rol 'anon' (Visitantes sin sesión):
--    - SOLO LECTURA (SELECT) de datos públicos (equipos, partidos, tablas, etc.)
--    - NUNCA puede crear, modificar ni eliminar datos (INSERT/UPDATE/DELETE bloqueados).
--
-- 2. Rol 'authenticated' (Usuarios con sesión válida Supabase Auth):
--    - Operaciones administrativas autorizadas según su rol en 'public.user_roles':
--      * SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR: Gestión completa (CRUD)
--      * MESA_TECNICA: Actualizar partidos en vivo y registrar eventos/alineaciones
--      * ARBITRO: Registrar eventos de partido asignados
--      * LOGISTICA: Leer y actualizar checklist logístico de canchas
--      * PUBLICO: Solo lectura
--
-- 3. Vistas con 'security_invoker = true':
--    - 'standings', 'player_statistics', 'public_players'
--
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- ==============================================================================
-- SECCIÓN 1: ELIMINACIÓN DE TODAS LAS POLÍTICAS ANTERIORES E INSEGURAS
-- ==============================================================================

-- 1.1 Eliminar políticas inseguras de 'policies_anon_crud.sql' (si fueron aplicadas)
drop policy if exists "Anon can insert teams" on public.teams;
drop policy if exists "Anon can update teams" on public.teams;
drop policy if exists "Anon can delete teams" on public.teams;

drop policy if exists "Anon can insert players" on public.players;
drop policy if exists "Anon can update players" on public.players;
drop policy if exists "Anon can delete players" on public.players;

drop policy if exists "Anon can insert matches" on public.matches;
drop policy if exists "Anon can update matches" on public.matches;
drop policy if exists "Anon can delete matches" on public.matches;

drop policy if exists "Anon can insert seasons" on public.seasons;
drop policy if exists "Anon can update seasons" on public.seasons;
drop policy if exists "Anon can delete seasons" on public.seasons;

drop policy if exists "Anon can insert competitions" on public.competitions;
drop policy if exists "Anon can update competitions" on public.competitions;
drop policy if exists "Anon can delete competitions" on public.competitions;

drop policy if exists "Anon can insert matchdays" on public.matchdays;
drop policy if exists "Anon can update matchdays" on public.matchdays;
drop policy if exists "Anon can delete matchdays" on public.matchdays;

drop policy if exists "Anon can insert venues" on public.venues;
drop policy if exists "Anon can update venues" on public.venues;
drop policy if exists "Anon can delete venues" on public.venues;

drop policy if exists "Anon can insert match_events" on public.match_events;
drop policy if exists "Anon can update match_events" on public.match_events;
drop policy if exists "Anon can delete match_events" on public.match_events;

-- 1.2 Eliminar políticas anteriores de 'schema.sql' para evitar conflictos o duplicados
drop policy if exists "Public read seasons" on public.seasons;
drop policy if exists "Admins manage seasons" on public.seasons;
drop policy if exists "Admins insert seasons" on public.seasons;
drop policy if exists "Admins update seasons" on public.seasons;
drop policy if exists "Admins delete seasons" on public.seasons;

drop policy if exists "Public read competitions" on public.competitions;
drop policy if exists "Admins manage competitions" on public.competitions;
drop policy if exists "Admins insert competitions" on public.competitions;
drop policy if exists "Admins update competitions" on public.competitions;
drop policy if exists "Admins delete competitions" on public.competitions;

drop policy if exists "Public read teams" on public.teams;
drop policy if exists "Admins manage teams" on public.teams;
drop policy if exists "Admins insert teams" on public.teams;
drop policy if exists "Admins update teams" on public.teams;
drop policy if exists "Admins delete teams" on public.teams;

drop policy if exists "Public read players" on public.players;
drop policy if exists "Admins manage players" on public.players;
drop policy if exists "Admins insert players" on public.players;
drop policy if exists "Admins update players" on public.players;
drop policy if exists "Admins delete players" on public.players;

drop policy if exists "Public read coaches" on public.coaches;
drop policy if exists "Admins manage coaches" on public.coaches;
drop policy if exists "Admins insert coaches" on public.coaches;
drop policy if exists "Admins update coaches" on public.coaches;
drop policy if exists "Admins delete coaches" on public.coaches;

drop policy if exists "Public read venues" on public.venues;
drop policy if exists "Admins manage venues" on public.venues;
drop policy if exists "Admins insert venues" on public.venues;
drop policy if exists "Admins update venues" on public.venues;
drop policy if exists "Admins delete venues" on public.venues;

drop policy if exists "Public read matchdays" on public.matchdays;
drop policy if exists "Admins manage matchdays" on public.matchdays;
drop policy if exists "Admins insert matchdays" on public.matchdays;
drop policy if exists "Admins update matchdays" on public.matchdays;
drop policy if exists "Admins delete matchdays" on public.matchdays;

drop policy if exists "Public read referees" on public.referees;
drop policy if exists "Admins manage referees" on public.referees;
drop policy if exists "Admins insert referees" on public.referees;
drop policy if exists "Admins update referees" on public.referees;
drop policy if exists "Admins delete referees" on public.referees;

drop policy if exists "Public read matches" on public.matches;
drop policy if exists "Admins manage matches" on public.matches;
drop policy if exists "Admins insert matches" on public.matches;
drop policy if exists "Authorized update matches" on public.matches;
drop policy if exists "Admins delete matches" on public.matches;

drop policy if exists "Public read match players" on public.match_players;
drop policy if exists "Admins manage match players" on public.match_players;
drop policy if exists "Authorized manage match players" on public.match_players;

drop policy if exists "Public read match referees" on public.match_referees;
drop policy if exists "Admins manage match referees" on public.match_referees;

drop policy if exists "Public read match events" on public.match_events;
drop policy if exists "Authorized users create match events" on public.match_events;
drop policy if exists "Authorized users update match events" on public.match_events;
drop policy if exists "Authorized users delete match events" on public.match_events;
drop policy if exists "Authorized insert match events" on public.match_events;
drop policy if exists "Authorized update match events" on public.match_events;
drop policy if exists "Authorized delete match events" on public.match_events;

drop policy if exists "Public read sanctions" on public.sanctions;
drop policy if exists "Admins manage sanctions" on public.sanctions;
drop policy if exists "Admins insert sanctions" on public.sanctions;
drop policy if exists "Admins update sanctions" on public.sanctions;
drop policy if exists "Admins delete sanctions" on public.sanctions;

drop policy if exists "Admins manage logistics" on public.logistics_tasks;
drop policy if exists "Logistics role read tasks" on public.logistics_tasks;
drop policy if exists "Logistics role update tasks" on public.logistics_tasks;
drop policy if exists "Authorized read logistics" on public.logistics_tasks;
drop policy if exists "Admins insert logistics" on public.logistics_tasks;
drop policy if exists "Authorized update logistics" on public.logistics_tasks;
drop policy if exists "Admins delete logistics" on public.logistics_tasks;

drop policy if exists "Public read league settings" on public.league_settings;
drop policy if exists "Admins manage league settings" on public.league_settings;
drop policy if exists "Admins insert league settings" on public.league_settings;
drop policy if exists "Admins update league settings" on public.league_settings;
drop policy if exists "Admins delete league settings" on public.league_settings;

drop policy if exists "Users read own roles" on public.user_roles;
drop policy if exists "Admins insert user roles" on public.user_roles;
drop policy if exists "Admins update user roles" on public.user_roles;
drop policy if exists "Admins delete user roles" on public.user_roles;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;

-- ==============================================================================
-- SECCIÓN 2: FUNCIONES AUXILIARES DE AUTORIZACIÓN (SECURITY DEFINER)
-- ==============================================================================

-- 2.1 Verifica si el usuario actual tiene un rol específico
create or replace function public.has_role(required_role user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role = required_role
  );
$$;

-- 2.2 Verifica si el usuario actual es Administrador Deportivo de la liga
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role in (
      'SUPER_ADMIN',
      'PRESIDENTE',
      'ADMINISTRADOR'
    )
  );
$$;

-- 2.3 Mesa Técnica + Administradores: pueden controlar el partido en vivo (reloj, marcador, estado)
create or replace function public.can_manage_match()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role in (
      'SUPER_ADMIN',
      'PRESIDENTE',
      'ADMINISTRADOR',
      'MESA_TECNICA'
    )
  );
$$;

-- 2.4 Árbitros + Mesa Técnica + Administradores: pueden registrar eventos de partido (goles, faltas, tarjetas)
create or replace function public.can_create_match_event()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role in (
      'SUPER_ADMIN',
      'PRESIDENTE',
      'ADMINISTRADOR',
      'MESA_TECNICA',
      'ARBITRO'
    )
  );
$$;

-- 2.5 Logística + Administradores: lectura y actualización del checklist de logística
create or replace function public.can_manage_logistics()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role in (
      'SUPER_ADMIN',
      'PRESIDENTE',
      'ADMINISTRADOR',
      'LOGISTICA'
    )
  );
$$;

-- ==============================================================================
-- SECCIÓN 3: ASEGURAR QUE RLS ESTÉ HABILITADO EN TODAS LAS TABLAS
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.seasons enable row level security;
alter table public.competitions enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.coaches enable row level security;
alter table public.venues enable row level security;
alter table public.matchdays enable row level security;
alter table public.referees enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_referees enable row level security;
alter table public.match_events enable row level security;
alter table public.sanctions enable row level security;
alter table public.logistics_tasks enable row level security;
alter table public.league_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- ==============================================================================
-- SECCIÓN 4: POLÍTICAS GRANULARES - EQUIPOS (teams)
-- ==============================================================================

-- Lectura pública para visitantes y usuarios
create policy "Public read teams"
on public.teams for select
to anon, authenticated
using (true);

-- Escritura exclusivamente para administradores autenticados
create policy "Admins insert teams"
on public.teams for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update teams"
on public.teams for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete teams"
on public.teams for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 5: POLÍTICAS GRANULARES - JUGADORES (players)
-- ==============================================================================

create policy "Public read players"
on public.players for select
to anon, authenticated
using (true);

create policy "Admins insert players"
on public.players for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update players"
on public.players for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete players"
on public.players for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 6: POLÍTICAS GRANULARES - CUERPO TÉCNICO (coaches)
-- ==============================================================================

create policy "Public read coaches"
on public.coaches for select
to anon, authenticated
using (true);

create policy "Admins insert coaches"
on public.coaches for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update coaches"
on public.coaches for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete coaches"
on public.coaches for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 7: POLÍTICAS GRANULARES - TEMPORADAS (seasons)
-- ==============================================================================

create policy "Public read seasons"
on public.seasons for select
to anon, authenticated
using (true);

create policy "Admins insert seasons"
on public.seasons for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update seasons"
on public.seasons for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete seasons"
on public.seasons for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 8: POLÍTICAS GRANULARES - COMPETICIONES (competitions)
-- ==============================================================================

create policy "Public read competitions"
on public.competitions for select
to anon, authenticated
using (true);

create policy "Admins insert competitions"
on public.competitions for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update competitions"
on public.competitions for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete competitions"
on public.competitions for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 9: POLÍTICAS GRANULARES - JORNADAS (matchdays)
-- ==============================================================================

create policy "Public read matchdays"
on public.matchdays for select
to anon, authenticated
using (true);

create policy "Admins insert matchdays"
on public.matchdays for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update matchdays"
on public.matchdays for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete matchdays"
on public.matchdays for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 10: POLÍTICAS GRANULARES - CANCHAS Y SEDES (venues)
-- ==============================================================================

create policy "Public read venues"
on public.venues for select
to anon, authenticated
using (true);

create policy "Admins insert venues"
on public.venues for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update venues"
on public.venues for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete venues"
on public.venues for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 11: POLÍTICAS GRANULARES - ÁRBITROS (referees)
-- ==============================================================================

create policy "Public read referees"
on public.referees for select
to anon, authenticated
using (true);

create policy "Admins insert referees"
on public.referees for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update referees"
on public.referees for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete referees"
on public.referees for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 12: POLÍTICAS GRANULARES - PARTIDOS (matches)
-- ==============================================================================
-- 1. Lectura pública (resultados, marcadores, calendario)
create policy "Public read matches"
on public.matches for select
to anon, authenticated
using (true);

-- 2. Creación: solo administradores
create policy "Admins insert matches"
on public.matches for insert
to authenticated
with check ((select public.is_admin()));

-- 3. Actualización: Administradores Y Mesa Técnica (durante el partido)
create policy "Authorized update matches"
on public.matches for update
to authenticated
using ((select public.can_manage_match()))
with check ((select public.can_manage_match()));

-- 4. Eliminación: exclusivamente administradores (Mesa Técnica no puede borrar)
create policy "Admins delete matches"
on public.matches for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 13: CONVOCATORIAS / ALINEACIONES (match_players & match_referees)
-- ==============================================================================

create policy "Public read match players"
on public.match_players for select
to anon, authenticated
using (true);

create policy "Authorized manage match players"
on public.match_players for all
to authenticated
using ((select public.can_manage_match()))
with check ((select public.can_manage_match()));

create policy "Public read match referees"
on public.match_referees for select
to anon, authenticated
using (true);

create policy "Admins manage match referees"
on public.match_referees for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 14: POLÍTICAS GRANULARES - EVENTOS DE PARTIDO (match_events)
-- ==============================================================================

-- Lectura pública (goles, tarjetas para aficionados)
create policy "Public read match events"
on public.match_events for select
to anon, authenticated
using (true);

-- Registro: Admins, Mesa Técnica y Árbitro oficial
create policy "Authorized insert match events"
on public.match_events for insert
to authenticated
with check ((select public.can_create_match_event()));

-- Modificación / Corrección: Admins y Mesa Técnica
create policy "Authorized update match events"
on public.match_events for update
to authenticated
using ((select public.can_manage_match()))
with check ((select public.can_manage_match()));

-- Anulación / Eliminación: Admins y Mesa Técnica
create policy "Authorized delete match events"
on public.match_events for delete
to authenticated
using ((select public.can_manage_match()));

-- ==============================================================================
-- SECCIÓN 15: POLÍTICAS GRANULARES - LOGÍSTICA (logistics_tasks)
-- ==============================================================================

-- Lectura: Administradores y rol LOGISTICA (no público anon)
create policy "Authorized read logistics"
on public.logistics_tasks for select
to authenticated
using ((select public.can_manage_logistics()));

-- Creación: Administradores
create policy "Admins insert logistics"
on public.logistics_tasks for insert
to authenticated
with check ((select public.is_admin()));

-- Actualización (marcar completado, notas): Admins y rol LOGISTICA
create policy "Authorized update logistics"
on public.logistics_tasks for update
to authenticated
using ((select public.can_manage_logistics()))
with check ((select public.can_manage_logistics()));

-- Eliminación: Administradores
create policy "Admins delete logistics"
on public.logistics_tasks for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 16: POLÍTICAS GRANULARES - SANCIONES Y CONFIGURACIÓN
-- ==============================================================================

-- Sanciones
create policy "Public read sanctions"
on public.sanctions for select
to anon, authenticated
using (true);

create policy "Admins insert sanctions"
on public.sanctions for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update sanctions"
on public.sanctions for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete sanctions"
on public.sanctions for delete
to authenticated
using ((select public.is_admin()));

-- Configuración de la Liga
create policy "Public read league settings"
on public.league_settings for select
to anon, authenticated
using (true);

create policy "Admins insert league settings"
on public.league_settings for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update league settings"
on public.league_settings for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete league settings"
on public.league_settings for delete
to authenticated
using ((select public.is_admin()));

-- ==============================================================================
-- SECCIÓN 17: CONTROL DE ACCESO A ROLES DE USUARIO (user_roles) Y PERFILES
-- ==============================================================================

-- Cada usuario puede consultar sus propios roles, y los admins pueden ver todos
create policy "Users read own roles"
on public.user_roles for select
to authenticated
using (
  auth.uid() = user_id
  or (select public.is_admin())
);

-- Solo administradores pueden asignar o revocar roles
create policy "Admins insert user roles"
on public.user_roles for insert
to authenticated
with check ((select public.is_admin()));

create policy "Admins update user roles"
on public.user_roles for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete user roles"
on public.user_roles for delete
to authenticated
using ((select public.is_admin()));

-- Perfiles
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
  or (select public.is_admin())
);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (
  auth.uid() = id
  or (select public.is_admin())
);

-- Notificaciones
create policy "Users read own notifications"
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

create policy "Users update own notifications"
on public.notifications for update
to authenticated
using (auth.uid() = user_id);

-- ==============================================================================
-- SECCIÓN 18: RECREACIÓN DE VISTAS CON 'security_invoker = true'
-- ==============================================================================
-- Esto asegura que las consultas a las vistas respeten estrictamente las políticas
-- RLS de las tablas subyacentes evaluadas para el usuario invocador.

-- 18.1 Vista de Estadísticas de Jugadores
create or replace view public.player_statistics
with (security_invoker = true)
as
select
  p.id as player_id,
  p.first_name,
  p.last_name,
  p.team_id,
  count(case when me.event_type = 'goal' then 1 end) as goals,
  count(case when me.event_type = 'assist' then 1 end) as assists,
  count(case when me.event_type = 'yellow_card' then 1 end) as yellow_cards,
  count(case when me.event_type = 'red_card' then 1 end) as red_cards
from public.players p
left join public.match_events me on me.player_id = p.id
group by p.id, p.first_name, p.last_name, p.team_id;

-- 18.2 Vista de Tabla de Posiciones (Standings)
create or replace view public.standings
with (security_invoker = true)
as
with games as (
  select
    id as match_id,
    home_team_id as team_id,
    home_score as goals_for,
    away_score as goals_against,
    case when home_score > away_score then 1 else 0 end as wins,
    case when home_score = away_score then 1 else 0 end as draws,
    case when home_score < away_score then 1 else 0 end as losses
  from public.matches
  where status = 'FINALIZADO'

  union all

  select
    id as match_id,
    away_team_id as team_id,
    away_score as goals_for,
    home_score as goals_against,
    case when away_score > home_score then 1 else 0 end as wins,
    case when away_score = home_score then 1 else 0 end as draws,
    case when away_score < home_score then 1 else 0 end as losses
  from public.matches
  where status = 'FINALIZADO'
)
select
  t.id as team_id,
  t.name,
  t.short_name,
  t.logo_url,
  count(g.match_id) as played,
  coalesce(sum(g.wins), 0) as wins,
  coalesce(sum(g.draws), 0) as draws,
  coalesce(sum(g.losses), 0) as losses,
  coalesce(sum(g.goals_for), 0) as goals_for,
  coalesce(sum(g.goals_against), 0) as goals_against,
  coalesce(sum(g.goals_for) - sum(g.goals_against), 0) as goal_difference,
  (coalesce(sum(g.wins), 0) * 3 + coalesce(sum(g.draws), 0)) as points
from public.teams t
left join games g on g.team_id = t.id
group by t.id, t.name, t.short_name, t.logo_url
order by points desc, goal_difference desc, goals_for desc;

-- 18.3 Vista Segura Pública de Jugadores (sin cédula, teléfono ni datos privados)
create or replace view public.public_players
with (security_invoker = true)
as
select
  id,
  team_id,
  first_name,
  last_name,
  birth_date,
  jersey_number,
  position,
  photo_url,
  status,
  created_at,
  updated_at
from public.players;

-- Permisos de lectura en vistas
grant select on public.player_statistics to anon, authenticated;
grant select on public.standings to anon, authenticated;
grant select on public.public_players to anon, authenticated;

-- ==============================================================================
-- SECCIÓN 19: INSTRUCCIÓN PARA ASIGNAR EL PRIMER SUPER_ADMIN
-- ==============================================================================
-- Pasos obligatorios para configurar el primer administrador:
-- 1. Regístrate o crea tu cuenta en tu aplicación (/login) o en Supabase Dashboard:
--    Dashboard -> Authentication -> Users -> 'Add User'
-- 2. Copia tu User UID (ejemplo: '4fa38c80-60b6-455b-b9fb-7546059b02a1')
-- 3. Ejecuta la siguiente consulta en el SQL Editor reemplazando con tu UUID real:
--
-- insert into public.user_roles (user_id, role)
-- values ('TU_USER_UUID_AQUI', 'SUPER_ADMIN')
-- on conflict (user_id, role) do nothing;
--
-- Opcional (remover rol público predeterminado):
-- delete from public.user_roles
-- where user_id = 'TU_USER_UUID_AQUI' and role = 'PUBLICO';
--
-- Alternativa automática por correo electrónico:
-- insert into public.user_roles (user_id, role)
-- select id, 'SUPER_ADMIN'::user_role
-- from auth.users
-- where email = 'tu_correo@ejemplo.com'
-- on conflict (user_id, role) do nothing;
-- ==============================================================================
