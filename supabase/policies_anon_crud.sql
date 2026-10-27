-- ==============================================================================
-- [OBSOLETO - NO EJECUTAR] POLÍTICAS ANON CRUD
-- ==============================================================================
-- ADVERTENCIA: Este archivo ha sido DEPRECADO por motivos de seguridad.
-- NO otorga permisos de escritura (INSERT, UPDATE, DELETE) al rol 'anon'.
--
-- UTILIZA EN SU LUGAR EL ARCHIVO SEGURO:
-- supabase/policies_secure_roles.sql
--
-- A continuación se incluyen únicamente instrucciones para ELIMINAR cualquier
-- política insegura que haya sido creada previamente:
-- ==============================================================================

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

-- ==============================================================================
-- FIN: EJECUTA 'supabase/policies_secure_roles.sql' PARA LAS NUEVAS POLÍTICAS
-- ==============================================================================
