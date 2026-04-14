-- ============================================================================
-- Mindset — Phase 3A.2: "Send a Cheer" from coach / parent
-- Run this once in Supabase SQL Editor.
--
-- Cheers reuse the existing `feedback` table with a new target_type of
-- "cheer". target_id is set to the athlete's own id (stable, satisfies
-- the not-null constraint, and lets the cheer live in the same feed as
-- notes).
-- ============================================================================

alter table public.feedback
  drop constraint if exists feedback_target_type_check;

alter table public.feedback
  add constraint feedback_target_type_check
  check (target_type in ('match', 'video', 'practice', 'cheer'));
