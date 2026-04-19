-- ============================================================================
-- Mindset — Video annotation timestamps
--
-- Extends the existing feedback table so coach/parent notes on videos can
-- be pinned to a specific moment in the clip. Nullable: existing rows and
-- non-video feedback (match notes, cheers) keep working unchanged.
--
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================

alter table public.feedback
  add column if not exists timestamp_sec numeric;

-- Informational only — we don't enforce at the DB level. Client side
-- ensures timestamp_sec is only set when target_type = 'video'.
comment on column public.feedback.timestamp_sec is
  'Video playback position (seconds) this note is pinned to. NULL for non-video feedback.';
