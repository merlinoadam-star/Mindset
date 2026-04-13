-- ============================================================================
-- Mindset — Phase 2B.6: videos Storage bucket + RLS
-- Run this once in Supabase SQL Editor (idempotent — safe to re-run).
-- ============================================================================

-- 1. Create the `videos` bucket. Private (no public listing / anon access).
--    File size cap 100 MB should be plenty for a minute or two of phone video.
insert into storage.buckets (id, name, public, file_size_limit)
values ('videos', 'videos', false, 104857600)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit;

-- 2. RLS on storage.objects for the videos bucket.
--    Path convention: videos/<athlete_id>/<video_id>.<ext>
--    so foldername(name)[1] is the athlete UUID.

-- Athletes can insert into their own folder.
drop policy if exists "videos_insert_own" on storage.objects;
create policy "videos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Athletes can read their own videos. Coaches / parents connected to the
-- athlete can also read them (is_connected_to_athlete is the RPC we already
-- defined in the main schema).
drop policy if exists "videos_read_own_or_connected" on storage.objects;
create policy "videos_read_own_or_connected" on storage.objects
  for select using (
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

-- Athletes can update / delete their own.
drop policy if exists "videos_update_own" on storage.objects;
create policy "videos_update_own" on storage.objects
  for update using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "videos_delete_own" on storage.objects;
create policy "videos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
