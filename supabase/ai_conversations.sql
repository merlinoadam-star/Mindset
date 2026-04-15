-- ============================================================================
-- Mindset — Phase 4F.3: AI Coach Q&A conversation history
-- Run this once in Supabase SQL Editor.
--
-- Each row is one question + its answer. The athlete's history is
-- visible to them and to their connected coaches/parents so everyone
-- on the team sees what's being asked.
-- ============================================================================

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  asker_id uuid not null references public.accounts(id) on delete cascade,
  asker_role text not null check (asker_role in ('athlete', 'coach', 'parent')),
  question text not null,
  answer text,               -- populated once the API call returns
  model text,
  asked_at timestamptz not null default now(),
  answered_at timestamptz,
  error text                 -- populated if generation failed
);

create index if not exists ai_conversations_athlete_idx
  on public.ai_conversations(athlete_id, asked_at desc);
create index if not exists ai_conversations_asker_idx
  on public.ai_conversations(asker_id, asked_at desc);

alter table public.ai_conversations enable row level security;

-- Athletes and connected parties can read the athlete's Q&A log.
drop policy if exists "ai_conv_read" on public.ai_conversations;
create policy "ai_conv_read" on public.ai_conversations
  for select using (
    auth.uid() = athlete_id
    or auth.uid() = asker_id
    or public.is_connected_to_athlete(athlete_id)
  );

-- Askers can delete their own questions (if they want to remove something).
drop policy if exists "ai_conv_delete_own" on public.ai_conversations;
create policy "ai_conv_delete_own" on public.ai_conversations
  for delete using (auth.uid() = asker_id);

do $$ begin
  alter publication supabase_realtime add table public.ai_conversations;
exception when duplicate_object then null;
end $$;
