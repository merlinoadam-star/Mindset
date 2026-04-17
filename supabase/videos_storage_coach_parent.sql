-- ============================================================================
-- Mindset — Allow coaches and parents to upload videos into connected
-- athletes' folders.
--
-- When coach/parent uploads were added, the public.videos TABLE RLS was
-- updated but the storage.objects policy was not. Storage still enforced
-- the athlete-only "folder must be your own uid" rule — so coach uploads
-- always failed with "new row violates row-level security policy".
--
-- This migration widens the storage insert policy to also allow connected
-- coaches/parents (is_connected_to_athlete gate — accepted connections only).
--
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================================

drop policy if exists "videos_insert_own" on storage.objects;

create policy "videos_insert_own_or_connected" on storage.objects
  for insert with check (
    bucket_id = 'videos'
    and (
      -- Athlete uploading to their own folder
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        -- Coach/parent uploading to a connected athlete's folder.
        (storage.foldername(name))[1] ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_connected_to_athlete(
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );

-- Also widen UPDATE/DELETE so coaches/parents can remove their own uploads
-- if needed. Athletes can still delete any video in their folder.
drop policy if exists "videos_update_own" on storage.objects;
create policy "videos_update_own_or_connected" on storage.objects
  for update using (
    bucket_id = 'videos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_connected_to_athlete(
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );

drop policy if exists "videos_delete_own" on storage.objects;
create policy "videos_delete_own_or_connected" on storage.objects
  for delete using (
    bucket_id = 'videos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_connected_to_athlete(
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );
