-- ============================================================================
-- Mindset — Phase 4F.1: AI-generated insights cache
-- Run this once in Supabase SQL Editor.
--
-- One row per (athlete, kind, context_key). The edge function `ai-coach`
-- looks up the cache before calling the Claude API, so each weekly
-- wrap-up (for example) costs at most one API call per athlete per week.
-- ============================================================================

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  kind text not null,            -- e.g. "weekly-wrap-up", "reflection", "tip"
  context_key text not null,     -- e.g. "2026-04-13" (week start Monday)
  content text not null,         -- the generated text
  model text,                    -- which Claude model produced it
  generated_at timestamptz not null default now(),
  expires_at timestamptz,        -- optional TTL; null = no expiry
  unique (athlete_id, kind, context_key)
);

create index if not exists ai_insights_athlete_idx
  on public.ai_insights(athlete_id);
create index if not exists ai_insights_lookup_idx
  on public.ai_insights(athlete_id, kind, context_key);

alter table public.ai_insights enable row level security;

-- Athletes + connected coaches/parents can read the cached insights.
-- Writes only happen through the edge function (service role, bypasses RLS).
drop policy if exists "ai_insights_read" on public.ai_insights;
create policy "ai_insights_read" on public.ai_insights
  for select using (
    auth.uid() = athlete_id
    or public.is_connected_to_athlete(athlete_id)
  );

-- Realtime nicety — so the dashboard card can refresh when a new
-- insight lands.
do $$ begin
  alter publication supabase_realtime add table public.ai_insights;
exception when duplicate_object then null;
end $$;
