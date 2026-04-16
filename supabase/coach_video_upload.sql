-- ============================================================================
-- Mindset — Video sharing: allow connected coaches/parents to upload
-- Run this once in Supabase SQL Editor.
--
-- Updates RLS on both the storage bucket and the videos metadata table
-- so connected coaches and parents can upload videos FOR an athlete.
-- ============================================================================

-- 1. Storage: let connected coaches insert into the athlete's folder
drop policy if exists "videos_insert_own" on storage.objects;
create policy "videos_insert_own_or_connected" on storage.objects
  for insert with check (
    bucket_id = 'videos'
    and (
      -- Athlete uploading to their own folder
      (storage.foldername(name))[1] = auth.uid()::text
      -- Connected coach/parent uploading to athlete's folder
      or (
        (storage.foldername(name))[1] ~
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_connected_to_athlete(
          ((storage.foldername(name))[1])::uuid
        )
      )
    )
  );

-- 2. Videos table: let connected coaches insert metadata rows
drop policy if exists "videos_write" on storage.objects;
drop policy if exists "video_insert" on public.videos;
create policy "video_insert" on public.videos
  for insert with check (
    auth.uid() = uploader_account_id
    and (
      auth.uid() = athlete_id
      or public.is_connected_to_athlete(athlete_id)
    )
  );

-- 3. Let the uploader update/delete their own video rows
drop policy if exists "video_update" on public.videos;
create policy "video_update" on public.videos
  for update using (
    auth.uid() = athlete_id or auth.uid() = uploader_account_id
  );

drop policy if exists "video_delete" on public.videos;
create policy "video_delete" on public.videos
  for delete using (
    auth.uid() = athlete_id or auth.uid() = uploader_account_id
  );
