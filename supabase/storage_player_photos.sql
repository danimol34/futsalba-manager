-- ==============================================================================
-- FUTSALBA MANAGER
-- CONFIGURACIÓN DE SUPABASE STORAGE: BUCKET 'player-photos' Y POLÍTICAS RLS
-- Archivo: supabase/storage_player_photos.sql
-- ==============================================================================

-- 1. CREACIÓN IDEMPOTENTE DEL BUCKET PÚBLICO 'player-photos'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'player-photos',
  'player-photos',
  true,
  5242880, -- 5 MB (5 * 1024 * 1024 bytes)
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 2. POLÍTICAS RLS EN storage.objects PARA EL BUCKET 'player-photos'

-- 2.1 Lectura pública (Cualquier visitante o aficionado puede ver las fotografías)
drop policy if exists "Public read player photos" on storage.objects;
create policy "Public read player photos"
on storage.objects for select
to public
using (bucket_id = 'player-photos');

-- 2.2 Inserción: Solo administradores autorizados para gestión deportiva
drop policy if exists "Admins insert player photos" on storage.objects;
create policy "Admins insert player photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'player-photos'
  and (select public.is_admin())
);

-- 2.3 Actualización/Reemplazo: Solo administradores autorizados
drop policy if exists "Admins update player photos" on storage.objects;
create policy "Admins update player photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'player-photos'
  and (select public.is_admin())
)
with check (
  bucket_id = 'player-photos'
  and (select public.is_admin())
);

-- 2.4 Eliminación: Solo administradores autorizados
drop policy if exists "Admins delete player photos" on storage.objects;
create policy "Admins delete player photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'player-photos'
  and (select public.is_admin())
);
