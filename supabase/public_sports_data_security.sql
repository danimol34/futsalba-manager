-- ==============================================================================
-- FUTSALBA MANAGER - SEGURIDAD Y PRIVACIDAD DE DATOS DEPORTIVOS (HARDENED)
-- Archivo: supabase/public_sports_data_security.sql
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE y aplica el PRINCIPIO DE MÍNIMO PRIVILEGIO:
--
-- 1. VISTAS SEGURAS PÚBLICAS (Para AFICIONADOS, PRENSA, LOGÍSTICA y afines):
--    - 'public_players', 'public_teams', 'public_matches', 'public_match_events',
--      'public_coaches', 'public_referees'.
--    - 'standings' y 'player_statistics'.
--    - Ejecutadas con:
--        * security_barrier = true  -> Previene fugas por optimización/funciones maliciosas.
--        * security_invoker = false -> Ejecuta con privilegios del propietario (postgres)
--          permitiendo calcular estadísticas sin dar SELECT a tablas base privadas.
--    - Permisos: Únicamente SELECT para 'authenticated'. Ningún permiso a 'anon'.
--
-- 2. TABLAS BASE CON INFORMACIÓN SENSIBLE (Cédulas/DNI, teléfonos, correos, notas):
--    - 'players' (DNI, fecha nacimiento): Solo Administración y Mesa Técnica (para chequear planilla).
--    - 'teams' (Teléfonos, correos, delegado): Solo Administración deportiva (is_admin).
--    - 'coaches' y 'referees' (Teléfono y correo privado): Solo Administración deportiva (is_admin).
--    - 'matches' y 'match_events' (Notas de actas e incidencias): Solo Mesa Técnica, Árbitros y Admins.
--    - Roles como PRENSA, LOGÍSTICA, DIRECTOR_TÉCNICO y PÚBLICO NO acceden a datos privados.
--
-- 3. TABLAS DEPORTIVAS SIN DATOS PRIVADOS (venues, matchdays, competitions, seasons, etc.):
--    - Solo lectura para usuarios autenticados ('authenticated').
--    - Bloqueadas para visitantes anónimos ('anon').
-- ==============================================================================

-- ==============================================================================
-- SECCIÓN 1: FUNCIONES DE EVALUACIÓN DE PRIVILEGIO MÍNIMO (SECURITY DEFINER)
-- ==============================================================================

-- 1.1 Administradores Deportivos con acceso a contratos, teléfonos de clubes y datos institucionales
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

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 1.2 Personal autorizado para cotejar documento de identidad / DNI de jugadores (Planilla de Mesa)
create or replace function public.can_read_sensitive_players()
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

revoke execute on function public.can_read_sensitive_players() from public, anon;
grant execute on function public.can_read_sensitive_players() to authenticated;

-- 1.3 Personal autorizado para gestionar el partido y ver actas/notas de mesa
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

revoke execute on function public.can_manage_match() from public, anon;
grant execute on function public.can_manage_match() to authenticated;

-- 1.4 Personal autorizado para registrar incidencias de partido (Árbitros, Mesa, Admins)
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

revoke execute on function public.can_create_match_event() from public, anon;
grant execute on function public.can_create_match_event() to authenticated;

-- ==============================================================================
-- SECCIÓN 2: VISTAS SEGURAS PÚBLICAS ENDURECIDAS (security_barrier = true)
-- ==============================================================================

-- 2.1 Vista Segura de Jugadores (NO expone document_number ni birth_date)
create or replace view public.public_players
with (security_barrier = true, security_invoker = false)
as
select
  id,
  team_id,
  first_name,
  last_name,
  jersey_number,
  position,
  photo_url,
  status
from public.players;

-- 2.2 Vista Segura de Equipos (NO expone phone, email ni delegate_name)
create or replace view public.public_teams
with (security_barrier = true, security_invoker = false)
as
select
  id,
  name,
  short_name,
  logo_url,
  primary_color,
  secondary_color,
  city,
  coach_name,
  status
from public.teams;

-- 2.3 Vista Segura de Partidos (NO expone notes ni observaciones arbitrales internas)
create or replace view public.public_matches
with (security_barrier = true, security_invoker = false)
as
select
  id,
  season_id,
  competition_id,
  matchday_id,
  home_team_id,
  away_team_id,
  venue_id,
  match_date,
  kickoff_time,
  status,
  home_score,
  away_score,
  period,
  match_clock_seconds,
  home_fouls,
  away_fouls,
  home_timeouts,
  away_timeouts,
  created_at,
  updated_at
from public.matches;

-- 2.4 Vista Segura de Eventos de Partido (NO expone created_by ni notes internas)
create or replace view public.public_match_events
with (security_barrier = true, security_invoker = false)
as
select
  id,
  match_id,
  team_id,
  player_id,
  secondary_player_id,
  event_type,
  period,
  minute,
  second,
  created_at
from public.match_events;

-- 2.5 Vista Segura de Cuerpo Técnico (NO expone phone ni email)
create or replace view public.public_coaches
with (security_barrier = true, security_invoker = false)
as
select
  id,
  team_id,
  full_name,
  status,
  created_at,
  updated_at
from public.coaches;

-- 2.6 Vista Segura de Árbitros (NO expone phone ni email)
create or replace view public.public_referees
with (security_barrier = true, security_invoker = false)
as
select
  id,
  full_name,
  photo_url,
  category,
  status,
  created_at,
  updated_at
from public.referees;

-- 2.7 Recreación de Vista de Clasificación (Standings) endurecida
create or replace view public.standings
with (security_barrier = true, security_invoker = false)
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

-- 2.8 Recreación de Vista de Estadísticas de Jugadores endurecida
create or replace view public.player_statistics
with (security_barrier = true, security_invoker = false)
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

-- ==============================================================================
-- SECCIÓN 3: PERMISOS SELECT EN VISTAS SEGURAS (GRANT Y REVOKE ESTRICTOS)
-- ==============================================================================

-- 3.1 Bloquear completamente a visitantes anónimos ('anon' y 'public')
revoke all on public.public_players from public, anon;
revoke all on public.public_teams from public, anon;
revoke all on public.public_matches from public, anon;
revoke all on public.public_match_events from public, anon;
revoke all on public.public_coaches from public, anon;
revoke all on public.public_referees from public, anon;
revoke all on public.standings from public, anon;
revoke all on public.player_statistics from public, anon;

-- 3.2 Conceder ÚNICAMENTE SELECT a usuarios autenticados (sin INSERT, UPDATE, DELETE ni TRUNCATE)
grant select on public.public_players to authenticated;
grant select on public.public_teams to authenticated;
grant select on public.public_matches to authenticated;
grant select on public.public_match_events to authenticated;
grant select on public.public_coaches to authenticated;
grant select on public.public_referees to authenticated;
grant select on public.standings to authenticated;
grant select on public.player_statistics to authenticated;

-- ==============================================================================
-- SECCIÓN 4: REEMPLAZO DE POLÍTICAS SELECT EN TABLAS BASE SENSIBLES (MÍNIMO PRIVILEGIO)
-- ==============================================================================

-- 4.1 JUGADORES (players): Solo Administración y Mesa Técnica leen DNI/cédula
drop policy if exists "Public read players" on public.players;
drop policy if exists "Staff read players" on public.players;
drop policy if exists "Authorized read players" on public.players;
create policy "Authorized read players"
on public.players for select
to authenticated
using ((select public.can_read_sensitive_players()));

-- 4.2 EQUIPOS (teams): Solo Administración lee datos de contacto (teléfono, email, delegado)
drop policy if exists "Public read teams" on public.teams;
drop policy if exists "Staff read teams" on public.teams;
drop policy if exists "Admins read teams" on public.teams;
create policy "Admins read teams"
on public.teams for select
to authenticated
using ((select public.is_admin()));

-- 4.3 CUERPO TÉCNICO (coaches): Solo Administración lee teléfonos y correos
drop policy if exists "Public read coaches" on public.coaches;
drop policy if exists "Staff read coaches" on public.coaches;
drop policy if exists "Admins read coaches" on public.coaches;
create policy "Admins read coaches"
on public.coaches for select
to authenticated
using ((select public.is_admin()));

-- 4.4 ÁRBITROS (referees): Solo Administración lee teléfonos y correos privados
drop policy if exists "Public read referees" on public.referees;
drop policy if exists "Staff read referees" on public.referees;
drop policy if exists "Admins read referees" on public.referees;
create policy "Admins read referees"
on public.referees for select
to authenticated
using ((select public.is_admin()));

-- 4.5 PARTIDOS (matches): Solo Administración y Mesa Técnica leen tabla base con actas y notas
drop policy if exists "Public read matches" on public.matches;
drop policy if exists "Staff read matches" on public.matches;
drop policy if exists "Authorized read matches" on public.matches;
create policy "Authorized read matches"
on public.matches for select
to authenticated
using ((select public.can_manage_match()));

-- 4.6 EVENTOS DE PARTIDO (match_events): Solo Mesa Técnica, Árbitros oficiales y Admins
drop policy if exists "Public read match events" on public.match_events;
drop policy if exists "Staff read match events" on public.match_events;
drop policy if exists "Authorized read match events" on public.match_events;
create policy "Authorized read match events"
on public.match_events for select
to authenticated
using ((select public.can_create_match_event()));

-- 4.7 Revocar SELECT en tablas base sensibles a 'anon'
revoke select on public.players from anon;
revoke select on public.teams from anon;
revoke select on public.coaches from anon;
revoke select on public.referees from anon;
revoke select on public.matches from anon;
revoke select on public.match_events from anon;

-- ==============================================================================
-- SECCIÓN 5: POLÍTICAS SELECT EN TABLAS DEPORTIVAS SIN DATOS PRIVADOS
-- ==============================================================================

-- 5.1 Convocatorias / Alineaciones de partido (match_players)
drop policy if exists "Public read match players" on public.match_players;
drop policy if exists "Authenticated read match players" on public.match_players;
create policy "Authenticated read match players"
on public.match_players for select
to authenticated
using (true);

-- 5.2 Designaciones arbitrales de partido (match_referees)
drop policy if exists "Public read match referees" on public.match_referees;
drop policy if exists "Authenticated read match referees" on public.match_referees;
create policy "Authenticated read match referees"
on public.match_referees for select
to authenticated
using (true);

-- 5.3 Sedes / Canchas (venues)
drop policy if exists "Public read venues" on public.venues;
drop policy if exists "Authenticated read venues" on public.venues;
create policy "Authenticated read venues"
on public.venues for select
to authenticated
using (true);

-- 5.4 Jornadas (matchdays)
drop policy if exists "Public read matchdays" on public.matchdays;
drop policy if exists "Authenticated read matchdays" on public.matchdays;
create policy "Authenticated read matchdays"
on public.matchdays for select
to authenticated
using (true);

-- 5.5 Competiciones (competitions)
drop policy if exists "Public read competitions" on public.competitions;
drop policy if exists "Authenticated read competitions" on public.competitions;
create policy "Authenticated read competitions"
on public.competitions for select
to authenticated
using (true);

-- 5.6 Temporadas (seasons)
drop policy if exists "Public read seasons" on public.seasons;
drop policy if exists "Authenticated read seasons" on public.seasons;
create policy "Authenticated read seasons"
on public.seasons for select
to authenticated
using (true);

-- Revocar SELECT a 'anon' en tablas protegidas
revoke select on public.match_players from anon;
revoke select on public.match_referees from anon;
revoke select on public.venues from anon;
revoke select on public.matchdays from anon;
revoke select on public.competitions from anon;
revoke select on public.seasons from anon;

-- Conceder SELECT a 'authenticated'
grant select on public.match_players to authenticated;
grant select on public.match_referees to authenticated;
grant select on public.venues to authenticated;
grant select on public.matchdays to authenticated;
grant select on public.competitions to authenticated;
grant select on public.seasons to authenticated;
