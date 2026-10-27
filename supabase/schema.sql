-- =========================================================
-- FUTSALBA MANAGER
-- Base de datos inicial para Supabase / PostgreSQL
-- =========================================================

create extension if not exists "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

create type user_role as enum (
  'SUPER_ADMIN',
  'PRESIDENTE',
  'ADMINISTRADOR',
  'MESA_TECNICA',
  'ARBITRO',
  'DIRECTOR_TECNICO',
  'LOGISTICA',
  'PRENSA',
  'PUBLICO'
);

create type season_status as enum (
  'BORRADOR',
  'ACTIVA',
  'FINALIZADA'
);

create type match_status as enum (
  'PROGRAMADO',
  'EN_PREPARACION',
  'EN_VIVO',
  'DESCANSO',
  'FINALIZADO',
  'SUSPENDIDO',
  'CANCELADO'
);

create type sanction_status as enum (
  'PENDIENTE',
  'ACTIVA',
  'CUMPLIDA',
  'ANULADA'
);

create type player_position as enum (
  'PORTERO',
  'CIERRE',
  'ALA',
  'PIVOT',
  'UNIVERSAL'
);

create type match_event_type as enum (
  'goal',
  'assist',
  'yellow_card',
  'red_card',
  'foul',
  'penalty',
  'double_penalty',
  'substitution',
  'timeout',
  'injury',
  'note'
);

create type referee_role as enum (
  'ARBITRO_PRINCIPAL',
  'SEGUNDO_ARBITRO',
  'TERCER_ARBITRO',
  'CRONOMETRADOR'
);

-- =========================================================
-- PROFILES
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  avatar_url text,
  phone text,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- ROLES
-- =========================================================

create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role user_role not null default 'PUBLICO',
  created_at timestamptz default now(),
  unique(user_id, role)
);

-- =========================================================
-- SEASONS
-- =========================================================

create table public.seasons (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  start_date date,
  end_date date,
  status season_status default 'BORRADOR',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- COMPETITIONS
-- =========================================================

create table public.competitions (
  id uuid primary key default uuid_generate_v4(),
  season_id uuid references public.seasons(id) on delete cascade,
  name text not null,
  competition_type text,
  format text,
  number_of_teams integer default 0,
  start_date date,
  end_date date,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- TEAMS
-- =========================================================

create table public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  short_name text,
  logo_url text,
  primary_color text,
  secondary_color text,
  city text,
  coach_name text,
  delegate_name text,
  phone text,
  email text,
  status boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- PLAYERS
-- =========================================================

create table public.players (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams(id) on delete set null,

  first_name text not null,
  last_name text not null,

  birth_date date,
  document_number text unique,
  jersey_number integer,

  position player_position,

  photo_url text,

  status boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(team_id, jersey_number)
);

-- =========================================================
-- COACHES
-- =========================================================

create table public.coaches (
  id uuid primary key default uuid_generate_v4(),

  team_id uuid references public.teams(id) on delete cascade,

  full_name text not null,
  phone text,
  email text,

  status boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- VENUES
-- =========================================================

create table public.venues (
  id uuid primary key default uuid_generate_v4(),

  name text not null,
  address text,

  capacity integer,

  surface_type text,

  status boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- MATCHDAYS
-- =========================================================

create table public.matchdays (
  id uuid primary key default uuid_generate_v4(),

  competition_id uuid references public.competitions(id) on delete cascade,

  name text not null,
  matchday_number integer,

  start_date date,
  end_date date,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- REFEREES
-- =========================================================

create table public.referees (
  id uuid primary key default uuid_generate_v4(),

  full_name text not null,
  photo_url text,

  category text,

  phone text,
  email text,

  status boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- MATCHES
-- =========================================================

create table public.matches (
  id uuid primary key default uuid_generate_v4(),

  season_id uuid references public.seasons(id) on delete set null,
  competition_id uuid references public.competitions(id) on delete set null,
  matchday_id uuid references public.matchdays(id) on delete set null,

  home_team_id uuid not null references public.teams(id),
  away_team_id uuid not null references public.teams(id),

  venue_id uuid references public.venues(id) on delete set null,

  match_date date not null,
  kickoff_time time,

  status match_status default 'PROGRAMADO',

  home_score integer default 0,
  away_score integer default 0,

  period integer default 1,

  match_clock_seconds integer default 0,

  home_fouls integer default 0,
  away_fouls integer default 0,

  home_timeouts integer default 0,
  away_timeouts integer default 0,

  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint teams_must_be_different check (home_team_id <> away_team_id)
);

-- =========================================================
-- MATCH PLAYERS
-- Convocatoria / alineación
-- =========================================================

create table public.match_players (
  id uuid primary key default uuid_generate_v4(),

  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,

  is_starting boolean default false,

  jersey_number integer,

  created_at timestamptz default now(),

  unique(match_id, player_id)
);

-- =========================================================
-- MATCH REFEREES
-- =========================================================

create table public.match_referees (
  id uuid primary key default uuid_generate_v4(),

  match_id uuid not null references public.matches(id) on delete cascade,
  referee_id uuid not null references public.referees(id) on delete cascade,

  role referee_role not null,

  created_at timestamptz default now(),

  unique(match_id, referee_id, role)
);

-- =========================================================
-- MATCH EVENTS
-- =========================================================

create table public.match_events (
  id uuid primary key default uuid_generate_v4(),

  match_id uuid not null references public.matches(id) on delete cascade,

  team_id uuid references public.teams(id) on delete set null,

  player_id uuid references public.players(id) on delete set null,

  secondary_player_id uuid references public.players(id) on delete set null,

  event_type match_event_type not null,

  period integer default 1,

  minute integer default 0,
  second integer default 0,

  notes text,

  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz default now()
);

-- =========================================================
-- SANCTIONS
-- =========================================================

create table public.sanctions (
  id uuid primary key default uuid_generate_v4(),

  player_id uuid references public.players(id) on delete cascade,

  team_id uuid references public.teams(id) on delete cascade,

  match_id uuid references public.matches(id) on delete set null,

  reason text not null,

  suspension_matches integer default 1,

  start_date date,

  end_date date,

  status sanction_status default 'PENDIENTE',

  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- LOGISTICS TASKS
-- =========================================================

create table public.logistics_tasks (
  id uuid primary key default uuid_generate_v4(),

  match_id uuid not null references public.matches(id) on delete cascade,

  title text not null,
  description text,

  category text,

  assigned_user_id uuid references public.profiles(id) on delete set null,

  is_critical boolean default false,

  completed boolean default false,

  completed_at timestamptz,

  notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- LEAGUE SETTINGS
-- =========================================================

create table public.league_settings (
  id uuid primary key default uuid_generate_v4(),

  league_name text default 'FUTSALBA',

  logo_url text,

  primary_color text default '#0B1F3A',
  secondary_color text default '#0EA5E9',

  points_win integer default 3,
  points_draw integer default 1,
  points_loss integer default 0,

  match_duration_minutes integer default 40,

  periods integer default 2,

  period_duration_minutes integer default 20,

  max_fouls_per_period integer default 5,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid references public.profiles(id) on delete cascade,

  title text not null,
  message text,

  type text,

  is_read boolean default false,

  created_at timestamptz default now()
);

-- =========================================================
-- AUDIT LOG
-- =========================================================

create table public.audit_logs (
  id uuid primary key default uuid_generate_v4(),

  user_id uuid references public.profiles(id) on delete set null,

  action text not null,

  entity_type text,
  entity_id uuid,

  old_data jsonb,
  new_data jsonb,

  created_at timestamptz default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_players_team_id
on public.players(team_id);

create index idx_matches_date
on public.matches(match_date);

create index idx_matches_home_team
on public.matches(home_team_id);

create index idx_matches_away_team
on public.matches(away_team_id);

create index idx_match_events_match_id
on public.match_events(match_id);

create index idx_match_events_player_id
on public.match_events(player_id);

create index idx_sanctions_player_id
on public.sanctions(player_id);

create index idx_logistics_match_id
on public.logistics_tasks(match_id);

-- =========================================================
-- AUTO CREATE PROFILE WHEN USER REGISTERS
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );

  insert into public.user_roles (
    user_id,
    role
  )
  values (
    new.id,
    'PUBLICO'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_teams_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger set_players_updated_at
before update on public.players
for each row execute function public.set_updated_at();

create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

create trigger set_logistics_updated_at
before update on public.logistics_tasks
for each row execute function public.set_updated_at();

-- =========================================================
-- HELPER FUNCTION: CHECK ROLE
-- =========================================================

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

-- =========================================================
-- ADMIN CHECK
-- =========================================================

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

-- =========================================================
-- ENABLE RLS
-- =========================================================

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

-- =========================================================
-- PUBLIC READ POLICIES
-- =========================================================

create policy "Public read seasons"
on public.seasons
for select
using (true);

create policy "Public read competitions"
on public.competitions
for select
using (true);

create policy "Public read teams"
on public.teams
for select
using (true);

create policy "Public read players"
on public.players
for select
using (true);

create policy "Public read venues"
on public.venues
for select
using (true);

create policy "Public read matchdays"
on public.matchdays
for select
using (true);

create policy "Public read matches"
on public.matches
for select
using (true);

create policy "Public read match events"
on public.match_events
for select
using (true);

create policy "Public read referees"
on public.referees
for select
using (true);

create policy "Public read match referees"
on public.match_referees
for select
using (true);

create policy "Public read league settings"
on public.league_settings
for select
using (true);

-- =========================================================
-- PROFILE POLICIES
-- =========================================================

create policy "Users can read own profile"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_admin()
);

create policy "Users can update own profile"
on public.profiles
for update
using (
  auth.uid() = id
);

-- =========================================================
-- ADMIN POLICIES
-- =========================================================

create policy "Admins manage seasons"
on public.seasons
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage competitions"
on public.competitions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage teams"
on public.teams
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage players"
on public.players
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage coaches"
on public.coaches
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage venues"
on public.venues
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage matchdays"
on public.matchdays
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage referees"
on public.referees
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage matches"
on public.matches
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage match players"
on public.match_players
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage match referees"
on public.match_referees
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage sanctions"
on public.sanctions
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage logistics"
on public.logistics_tasks
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage league settings"
on public.league_settings
for all
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- MATCH EVENTS
-- Admin + Mesa Técnica
-- =========================================================

create policy "Authorized users create match events"
on public.match_events
for insert
with check (
  public.is_admin()
  or public.has_role('MESA_TECNICA')
  or public.has_role('ARBITRO')
);

create policy "Authorized users update match events"
on public.match_events
for update
using (
  public.is_admin()
  or public.has_role('MESA_TECNICA')
);

create policy "Authorized users delete match events"
on public.match_events
for delete
using (
  public.is_admin()
  or public.has_role('MESA_TECNICA')
);

-- =========================================================
-- LOGISTICS USER POLICIES
-- =========================================================

create policy "Logistics role read tasks"
on public.logistics_tasks
for select
using (
  public.is_admin()
  or public.has_role('LOGISTICA')
);

create policy "Logistics role update tasks"
on public.logistics_tasks
for update
using (
  public.is_admin()
  or public.has_role('LOGISTICA')
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

create policy "Users read own notifications"
on public.notifications
for select
using (
  auth.uid() = user_id
);

create policy "Users update own notifications"
on public.notifications
for update
using (
  auth.uid() = user_id
);

-- =========================================================
-- VIEW: PLAYER STATISTICS
-- =========================================================

create or replace view public.player_statistics as

select

  p.id as player_id,

  p.first_name,
  p.last_name,

  p.team_id,

  count(
    case
      when me.event_type = 'goal'
      then 1
    end
  ) as goals,

  count(
    case
      when me.event_type = 'assist'
      then 1
    end
  ) as assists,

  count(
    case
      when me.event_type = 'yellow_card'
      then 1
    end
  ) as yellow_cards,

  count(
    case
      when me.event_type = 'red_card'
      then 1
    end
  ) as red_cards

from public.players p

left join public.match_events me
  on me.player_id = p.id

group by
  p.id,
  p.first_name,
  p.last_name,
  p.team_id;

-- =========================================================
-- VIEW: STANDINGS
-- Tabla de posiciones calculada
-- =========================================================

create or replace view public.standings as

with games as (

  select

    id as match_id,

    home_team_id as team_id,

    home_score as goals_for,

    away_score as goals_against,

    case
      when home_score > away_score then 1
      else 0
    end as wins,

    case
      when home_score = away_score then 1
      else 0
    end as draws,

    case
      when home_score < away_score then 1
      else 0
    end as losses

  from public.matches

  where status = 'FINALIZADO'

  union all

  select

    id as match_id,

    away_team_id as team_id,

    away_score as goals_for,

    home_score as goals_against,

    case
      when away_score > home_score then 1
      else 0
    end as wins,

    case
      when away_score = home_score then 1
      else 0
    end as draws,

    case
      when away_score < home_score then 1
      else 0
    end as losses

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

  coalesce(
    sum(g.goals_for) - sum(g.goals_against),
    0
  ) as goal_difference,

  (
    coalesce(sum(g.wins), 0) * 3
    +
    coalesce(sum(g.draws), 0)
  ) as points

from public.teams t

left join games g
  on g.team_id = t.id

group by
  t.id,
  t.name,
  t.short_name,
  t.logo_url

order by
  points desc,
  goal_difference desc,
  goals_for desc;

-- =========================================================
-- SUPABASE REALTIME CONFIGURATION
-- =========================================================

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_events;
alter publication supabase_realtime add table public.logistics_tasks;

-- =========================================================
-- DEMO SETTINGS
-- =========================================================

insert into public.league_settings (
  league_name,
  points_win,
  points_draw,
  points_loss,
  match_duration_minutes,
  periods,
  period_duration_minutes,
  max_fouls_per_period
)
values (
  'FUTSALBA',
  3,
  1,
  0,
  40,
  2,
  20,
  5
);

-- =========================================================
-- DEMO SEASON
-- =========================================================

insert into public.seasons (
  name,
  start_date,
  end_date,
  status
)
values (
  'Temporada 2026',
  '2026-01-01',
  '2026-12-31',
  'ACTIVA'
);

-- =========================================================
-- DEMO TEAMS
-- =========================================================

insert into public.teams (
  name,
  short_name,
  primary_color,
  secondary_color,
  city
)
values

(
  'Tigres FC',
  'TIG',
  '#F59E0B',
  '#111827',
  'Ciudad A'
),

(
  'Leones FC',
  'LEO',
  '#2563EB',
  '#FFFFFF',
  'Ciudad B'
),

(
  'Dragones FC',
  'DRA',
  '#DC2626',
  '#111827',
  'Ciudad C'
),

(
  'Titanes FC',
  'TIT',
  '#7C3AED',
  '#FFFFFF',
  'Ciudad D'
);
