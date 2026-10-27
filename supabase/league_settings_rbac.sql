-- ==============================================================================
-- FUTSALBA MANAGER
-- SEGURIDAD Y POLÍTICAS RLS PARA LA CONFIGURACIÓN OFICIAL (public.league_settings)
-- Archivo: supabase/league_settings_rbac.sql
-- ==============================================================================

-- 1. ASEGURAR QUE RLS ESTÉ ACTIVADO EN public.league_settings
alter table public.league_settings enable row level security;

-- 2. ASEGURAR QUE LAS COLUMNAS CLAVE EXISTAN CON SUS DEFAULTS
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='timeouts_per_team_per_period') then
    alter table public.league_settings add column timeouts_per_team_per_period integer not null default 1;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='max_fouls_per_period') then
    alter table public.league_settings add column max_fouls_per_period integer not null default 5;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='period_duration_minutes') then
    alter table public.league_settings add column period_duration_minutes integer not null default 20;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='points_win') then
    alter table public.league_settings add column points_win integer not null default 3;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='points_draw') then
    alter table public.league_settings add column points_draw integer not null default 1;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='league_settings' and column_name='points_loss') then
    alter table public.league_settings add column points_loss integer not null default 0;
  end if;
end $$;

-- 3. SEMILLA IDEMPOTENTE: Garantizar al menos un registro inicial si la tabla está vacía
insert into public.league_settings (
  league_name,
  points_win,
  points_draw,
  points_loss,
  match_duration_minutes,
  periods,
  period_duration_minutes,
  max_fouls_per_period,
  timeouts_per_team_per_period
)
select
  'FUTSALBA',
  3,
  1,
  0,
  40,
  2,
  20,
  5,
  1
where not exists (
  select 1 from public.league_settings
);

-- 4. LIMPIEZA IDEMPOTENTE DE POLÍTICAS ANTERIORES
drop policy if exists "Public read league settings" on public.league_settings;
drop policy if exists "Admins manage league settings" on public.league_settings;
drop policy if exists "Admins insert league settings" on public.league_settings;
drop policy if exists "Admins update league settings" on public.league_settings;
drop policy if exists "Admins delete league settings" on public.league_settings;

-- 5. CREACIÓN DE POLÍTICAS RLS ESTRICTAS BASADAS EN public.is_admin()
-- Roles autorizados para modificar: SUPER_ADMIN, PRESIDENTE y ADMINISTRADOR.
-- Roles denegados: PUBLICO, MESA_TECNICA, ARBITRO, DIRECTOR_TECNICO, LOGISTICA y PRENSA.

-- 5.1 Lectura pública (anónimos y autenticados pueden consultar las reglas oficiales)
create policy "Public read league settings"
on public.league_settings for select
to anon, authenticated
using (true);

-- 5.2 Inserción: Solo administradores de la liga
create policy "Admins insert league settings"
on public.league_settings for insert
to authenticated
with check ((select public.is_admin()));

-- 5.3 Actualización: Solo administradores de la liga
create policy "Admins update league settings"
on public.league_settings for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 5.4 Eliminación: Solo administradores de la liga
create policy "Admins delete league settings"
on public.league_settings for delete
to authenticated
using ((select public.is_admin()));

-- 6. PERMISOS DE TABLA (GRANTS)
grant select on public.league_settings to anon, authenticated;
grant insert, update, delete on public.league_settings to authenticated;
