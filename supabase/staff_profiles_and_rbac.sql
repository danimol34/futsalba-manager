-- ==============================================================================
-- FUTSALBA MANAGER
-- MÓDULO PERSONAL DE LA LIGA (STAFF) Y SEGURIDAD RBAC
-- Archivo: supabase/staff_profiles_and_rbac.sql
-- ==============================================================================

-- 1. FUNCIÓN DE SEGURIDAD: is_super_admin()
-- Implementa SECURITY DEFINER con search_path vacío ('') y referencias totalmente
-- calificadas para blindar la ejecución contra ataques de inyección de búsqueda.
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
    where user_id = (select auth.uid())
    and role = 'SUPER_ADMIN'::public.user_role
  );
$$;

-- Restricción de privilegios: Revocar ejecución pública y conceder solo a usuarios autenticados y servicio
revoke execute on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated, service_role;

-- 2. TABLA staff_profiles
-- Almacena información estrictamente administrativa del personal de la liga.
-- La fuente de verdad para permisos y autorización sigue siendo exclusivamente public.user_roles.
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  position text not null,
  responsibilities text,
  phone text,
  status text not null default 'ACTIVO' check (status in ('ACTIVO', 'INACTIVO')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger de actualización automática para updated_at con search_path blindado
create or replace function public.set_staff_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists trigger_set_staff_profiles_updated_at on public.staff_profiles;
create trigger trigger_set_staff_profiles_updated_at
before update on public.staff_profiles
for each row execute function public.set_staff_updated_at();

-- 3. HABILITACIÓN DE RLS Y POLÍTICAS DE ACCESO EN staff_profiles
alter table public.staff_profiles enable row level security;

-- Política de lectura: Exclusiva para SUPER_ADMIN
drop policy if exists "SUPER_ADMIN can select staff_profiles" on public.staff_profiles;
create policy "SUPER_ADMIN can select staff_profiles"
on public.staff_profiles for select
to authenticated
using ((select public.is_super_admin()));

-- Política de inserción: Exclusiva para SUPER_ADMIN
drop policy if exists "SUPER_ADMIN can insert staff_profiles" on public.staff_profiles;
create policy "SUPER_ADMIN can insert staff_profiles"
on public.staff_profiles for insert
to authenticated
with check ((select public.is_super_admin()));

-- Política de actualización: Exclusiva para SUPER_ADMIN
drop policy if exists "SUPER_ADMIN can update staff_profiles" on public.staff_profiles;
create policy "SUPER_ADMIN can update staff_profiles"
on public.staff_profiles for update
to authenticated
using ((select public.is_super_admin()))
with check ((select public.is_super_admin()));

-- Política de eliminación: Exclusiva para SUPER_ADMIN (no se expone en UI para preservar auditoría)
drop policy if exists "SUPER_ADMIN can delete staff_profiles" on public.staff_profiles;
create policy "SUPER_ADMIN can delete staff_profiles"
on public.staff_profiles for delete
to authenticated
using ((select public.is_super_admin()));

-- 4. FUNCIÓN TRIGGER handle_new_user() REFORZADA
-- Garantiza que cualquier usuario registrado por cuenta propia reciba ÚNICAMENTE el rol 'PUBLICO'
-- Ignora por completo cualquier 'role' que intente enviar el cliente en raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Inserta perfil base del usuario
  insert into public.profiles (
    id,
    full_name,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;

  -- Asigna de manera estricta y exclusiva el rol 'PUBLICO' a nuevos usuarios
  insert into public.user_roles (
    user_id,
    role
  )
  values (
    new.id,
    'PUBLICO'::public.user_role
  )
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Restricción de privilegios en el trigger de auth
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role, postgres;

-- 5. TRIGGER IDEMPOTENTE AFTER INSERT ON auth.users
-- Se asegura de registrar el trigger si no existía o actualizarlo sin duplicados
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
