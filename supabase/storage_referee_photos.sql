-- ==============================================================================
-- FUTSALBA MANAGER
-- CONFIGURACIÓN DE SUPABASE STORAGE: BUCKET 'referee-photos' Y POLÍTICAS RLS
-- Archivo: supabase/storage_referee_photos.sql
-- ==============================================================================

-- 1. CREACIÓN IDEMPOTENTE DEL BUCKET PÚBLICO 'referee-photos'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'referee-photos',
  'referee-photos',
  true,
  5242880, -- 5 MB (5 * 1024 * 1024 bytes)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. POLÍTICAS RLS EN storage.objects PARA EL BUCKET 'referee-photos'

-- 2.1 Lectura pública (Cualquier visitante o usuario puede ver las fotos de los árbitros)
drop policy if exists "Public read referee photos" on storage.objects;
create policy "Public read referee photos"
on storage.objects for select
to public
using (bucket_id = 'referee-photos');

-- 2.2 Inserción: Solo administradores autorizados (SUPER_ADMIN, PRESIDENTE, ADMINISTRADOR)
drop policy if exists "Admins insert referee photos" on storage.objects;
create policy "Admins insert referee photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'referee-photos'
  and (select public.is_admin())
);

-- 2.3 Actualización/Reemplazo: Solo administradores autorizados
drop policy if exists "Admins update referee photos" on storage.objects;
create policy "Admins update referee photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'referee-photos'
  and (select public.is_admin())
)
with check (
  bucket_id = 'referee-photos'
  and (select public.is_admin())
);

-- 2.4 Eliminación: Solo administradores autorizados
drop policy if exists "Admins delete referee photos" on storage.objects;
create policy "Admins delete referee photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'referee-photos'
  and (select public.is_admin())
);
