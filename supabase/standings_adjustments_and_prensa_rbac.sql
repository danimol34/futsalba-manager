-- ==============================================================================
-- FUTSALBA MANAGER - SISTEMA DE AJUSTES DE PUNTOS Y RESTRICCIONES RBAC PARA PRENSA
-- Archivo: supabase/standings_adjustments_and_prensa_rbac.sql
-- ==============================================================================
-- Este script es 100% IDEMPOTENTE y no destructivo.
--
-- Contenido:
-- 1. FUNCIÓN 'can_read_adjustments_history':
--    - Autoriza la lectura del historial de ajustes exclusivamente a:
--      SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR, MESA_TECNICA y PRENSA.
--    - PUBLICO, ARBITRO, DIRECTOR_TECNICO y LOGISTICA reciben 0 filas.
--
-- 2. TABLA 'standings_adjustments' (AUDITORÍA INMUTABLE CON PROTECCIÓN CONTRA DOBLE REVERSIÓN):
--    - Columna: reverses_adjustment_id uuid references public.standings_adjustments(id)
--    - Restricción: No autoreversión (reverses_adjustment_id <> id).
--    - ÍNDICE ÚNICO PARCIAL: idx_standings_adjustments_unique_reversal
--      Garantiza que un mismo ajuste NUNCA pueda revertirse dos veces en la base de datos.
--    - INMUTABILIDAD TOTAL: No se permiten UPDATE ni DELETE en la tabla.
--    - RLS estricto: Solo SUPER_ADMIN, PRESIDENTE y ADMINISTRADOR pueden crear ajustes.
--
-- 3. VISTA SEGURA 'public_standings_adjustments':
--    - Expone (id, team_id, competition_id, season_id, points_delta, reason, reverses_adjustment_id, created_at).
--    - OMISE expresamente 'created_by' (privacidad de autores).
--    - Filtro estricto: WHERE (select public.can_read_adjustments_history()).
--      Roles no autorizados obtienen exactamente 0 filas.
--
-- 4. VISTA 'standings' DINÁMICA CON 'league_settings':
--    - NO HARDCODEA 3 / 1. Consulta dinámicamente:
--      * league_settings.points_win (default 3)
--      * league_settings.points_draw (default 1)
--      * league_settings.points_loss (default 0)
--    - Calcula 'match_points' = (wins * pts_win) + (draws * pts_draw) + (losses * pts_loss).
--    - Suma 'points_adjustment' desde standings_adjustments.
--    - Puntos oficiales 'points' = match_points + points_adjustment.
--    - Criterio oficial de desempate: points DESC, goal_difference DESC, goals_for DESC.
--
-- 5. VISTA SEGURA 'public_sanctions':
--    - Expone sanciones deportivas excluyendo la columna sensible 'notes'.
--    - Protege la tabla base 'sanctions' para que solo administradores lean notas internas.
-- ==============================================================================

-- ==============================================================================
-- SECCIÓN 1: FUNCIÓN DE AUTORIZACIÓN PARA LECTURA DE HISTORIAL
-- ==============================================================================

create or replace function public.can_read_adjustments_history()
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
    and role in (
      'SUPER_ADMIN',
      'PRESIDENTE',
      'ADMINISTRADOR',
      'MESA_TECNICA',
      'PRENSA'
    )
  );
$$;

revoke execute on function public.can_read_adjustments_history() from public, anon;
grant execute on function public.can_read_adjustments_history() to authenticated;


-- ==============================================================================
-- SECCIÓN 2: TABLA 'standings_adjustments' Y BLOQUEO DE DOBLE REVERSIÓN
-- ==============================================================================

create table if not exists public.standings_adjustments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  competition_id uuid references public.competitions(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  points_delta integer not null,
  reason text not null,
  created_by uuid references auth.users(id) on delete set null,
  reverses_adjustment_id uuid references public.standings_adjustments(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standings_adjustments_points_delta_nonzero check (points_delta <> 0),
  constraint standings_adjustments_reason_not_empty check (length(trim(reason)) > 0)
);

-- Asegurar columna reverses_adjustment_id si la tabla ya existía previamente
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'standings_adjustments'
    and column_name = 'reverses_adjustment_id'
  ) then
    alter table public.standings_adjustments
    add column reverses_adjustment_id uuid references public.standings_adjustments(id) on delete restrict;
  end if;
end $$;

-- Asegurar restricción de no auto-reversión de forma 100% idempotente
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'standings_adjustments_no_self_reversal'
      and conrelid = 'public.standings_adjustments'::regclass
  ) then
    alter table public.standings_adjustments
    add constraint standings_adjustments_no_self_reversal
    check (
      reverses_adjustment_id is null
      or reverses_adjustment_id <> id
    );
  end if;
end $$;

-- PROTECCIÓN FÍSICA CONTRA DOBLE REVERSIÓN:
-- Un índice único parcial asegura que un ajuste específico solo pueda ser referenciado
-- como 'reverses_adjustment_id' UNA SOLA VEZ. Cualquier intento duplicado fallará con error único.
create unique index if not exists idx_standings_adjustments_unique_reversal
on public.standings_adjustments(reverses_adjustment_id)
where reverses_adjustment_id is not null;

-- Índices de consulta rápida
create index if not exists idx_standings_adjustments_team on public.standings_adjustments(team_id);
create index if not exists idx_standings_adjustments_season on public.standings_adjustments(season_id);
create index if not exists idx_standings_adjustments_competition on public.standings_adjustments(competition_id);
create index if not exists idx_standings_adjustments_created_at on public.standings_adjustments(created_at desc);

-- Habilitar Row Level Security
alter table public.standings_adjustments enable row level security;

-- Bloqueo total de accesos públicos y anónimos
revoke all on public.standings_adjustments from public, anon;

-- AUDITORÍA INMUTABLE: Revocar explícitamente UPDATE y DELETE para todos los roles
revoke update, delete on public.standings_adjustments from authenticated;

-- Eliminar políticas residuales de update o delete
drop policy if exists "Admins update standings adjustments" on public.standings_adjustments;
drop policy if exists "Admins delete standings adjustments" on public.standings_adjustments;
drop policy if exists "Authenticated read standings adjustments" on public.standings_adjustments;
drop policy if exists "Admins insert standings adjustments" on public.standings_adjustments;
drop policy if exists "Staff read standings adjustments" on public.standings_adjustments;

-- Conceder únicamente SELECT e INSERT controlados a authenticated
grant select, insert on public.standings_adjustments to authenticated;

-- Política de Lectura Privada en tabla base:
-- Únicamente SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR y MESA_TECNICA leen directamente
-- la tabla base (con el campo interno 'created_by').
create policy "Staff read standings adjustments"
on public.standings_adjustments for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
    and role in ('SUPER_ADMIN', 'PRESIDENTE', 'ADMINISTRADOR', 'MESA_TECNICA')
  )
);

-- Política de Inserción:
-- Exclusiva para SUPER_ADMIN, PRESIDENTE y ADMINISTRADOR.
create policy "Admins insert standings adjustments"
on public.standings_adjustments for insert
to authenticated
with check ((select public.is_admin()));


-- ==============================================================================
-- SECCIÓN 3: VISTA SEGURA 'public_standings_adjustments' (PRENSA Y COBERTURA)
-- ==============================================================================
-- 1. No incluye 'created_by' (privacidad de autores).
-- 2. Filtra mediante can_read_adjustments_history():
--    PUBLICO, ARBITRO, DIRECTOR_TECNICO y LOGISTICA reciben 0 filas.

create or replace view public.public_standings_adjustments
with (security_barrier = true, security_invoker = false)
as
select
  id,
  team_id,
  competition_id,
  season_id,
  points_delta,
  reason,
  reverses_adjustment_id,
  created_at
from public.standings_adjustments
where (select public.can_read_adjustments_history());

revoke all on public.public_standings_adjustments from public, anon;
grant select on public.public_standings_adjustments to authenticated;


-- ==============================================================================
-- SECCIÓN 4: RECREACIÓN DE VISTA 'standings' DINÁMICA CON LEAGUE_SETTINGS
-- ==============================================================================
-- Lee dinámicamente los puntos por victoria, empate y derrota de public.league_settings.
-- Jamás hardcodea 3 / 1.

create or replace view public.standings
with (security_barrier = true, security_invoker = false)
as
with settings as (
  select
    coalesce(points_win, 3) as pts_win,
    coalesce(points_draw, 1) as pts_draw,
    coalesce(points_loss, 0) as pts_loss
  from public.league_settings
  limit 1
),
cfg as (
  select
    coalesce((select pts_win from settings), 3) as pts_win,
    coalesce((select pts_draw from settings), 1) as pts_draw,
    coalesce((select pts_loss from settings), 0) as pts_loss
),
games as (
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
),
adjustments as (
  select
    team_id,
    coalesce(sum(points_delta), 0) as points_adjustment
  from public.standings_adjustments
  group by team_id
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
  (
    (
      coalesce(sum(g.wins), 0) * (select pts_win from cfg) +
      coalesce(sum(g.draws), 0) * (select pts_draw from cfg) +
      coalesce(sum(g.losses), 0) * (select pts_loss from cfg)
    ) + coalesce(adj.points_adjustment, 0)
  ) as points,
  (
    coalesce(sum(g.wins), 0) * (select pts_win from cfg) +
    coalesce(sum(g.draws), 0) * (select pts_draw from cfg) +
    coalesce(sum(g.losses), 0) * (select pts_loss from cfg)
  ) as match_points,
  coalesce(adj.points_adjustment, 0) as points_adjustment
from public.teams t
left join games g on g.team_id = t.id
left join adjustments adj on adj.team_id = t.id
group by t.id, t.name, t.short_name, t.logo_url, adj.points_adjustment
order by points desc, goal_difference desc, goals_for desc;

-- Permisos para la vista standings:
-- Lectura permitida a usuarios autenticados; el público aficionado consulta la vista.
revoke all on public.standings from public, anon;
grant select on public.standings to authenticated;


-- ==============================================================================
-- SECCIÓN 5: VISTA SEGURA 'public_sanctions' (SIN NOTAS INTERNAS)
-- ==============================================================================

create or replace view public.public_sanctions
with (security_barrier = true, security_invoker = false)
as
select
  id,
  player_id,
  team_id,
  match_id,
  reason,
  suspension_matches,
  start_date,
  end_date,
  status,
  created_at,
  updated_at
from public.sanctions;

revoke all on public.public_sanctions from public, anon;
grant select on public.public_sanctions to authenticated;

-- Restricción en tabla base 'sanctions': notas privadas solo para administradores
drop policy if exists "Admins read sanctions" on public.sanctions;
drop policy if exists "Public read sanctions" on public.sanctions;
create policy "Admins read sanctions"
on public.sanctions for select
to authenticated
using ((select public.is_admin()));


-- ==============================================================================
-- SECCIÓN 6: BLINDAJE DE PRIVILEGIO MÍNIMO
-- ==============================================================================
-- PRENSA carece de membresía en is_admin(), can_manage_match() y can_create_match_event().
-- Por consiguiente:
-- - INSERT/UPDATE/DELETE en standings_adjustments bloqueado por RLS.
-- - INSERT/UPDATE/DELETE en matches, match_events, teams, players bloqueado por RLS.
-- - SELECT sobre DNI, teléfonos, correos y notas bloqueado por RLS.
