-- ============================================================================
-- Mindset — loss recovery flow on matches
--
-- Adds five columns to public.matches that capture the athlete's
-- structured "process the loss" answers. Idempotent (uses
-- `add column if not exists`). Run once in the SQL Editor.
--
-- The recovery flow is only offered when result = 'loss', but the
-- columns themselves don't enforce that — they're just nullable text /
-- text-with-check fields. RLS already covers them via the existing
-- matches policies (any policy that allows update on matches now
-- covers these columns).
-- ============================================================================

alter table public.matches
  add column if not exists loss_recovery_feeling text
    check (
      loss_recovery_feeling is null
      or loss_recovery_feeling in (
        'frustrated',
        'disappointed',
        'angry',
        'sad',
        'numb',
        'embarrassed',
        'proud-anyway',
        'other'
      )
    );

alter table public.matches
  add column if not exists loss_recovery_lesson text;

alter table public.matches
  add column if not exists loss_recovery_carry_type text
    check (
      loss_recovery_carry_type is null
      or loss_recovery_carry_type in ('did-well', 'do-different', 'phrase')
    );

alter table public.matches
  add column if not exists loss_recovery_carry text;

alter table public.matches
  add column if not exists loss_recovery_completed_at timestamptz;
