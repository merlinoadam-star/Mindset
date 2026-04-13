-- ============================================================================
-- Mindset — Phase 2E: push notification subscriptions
-- Run once in Supabase SQL Editor.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  unique (endpoint)
);

create index if not exists push_subscriptions_account_idx
  on public.push_subscriptions(account_id);

alter table public.push_subscriptions enable row level security;

-- Owners can CRUD their own subscriptions.
drop policy if exists "push_subs_own_all" on public.push_subscriptions;
create policy "push_subs_own_all" on public.push_subscriptions
  for all using (auth.uid() = account_id) with check (auth.uid() = account_id);

-- Add to the realtime publication so clients can refresh their own
-- subscription list live if needed (optional but cheap).
do $$ begin
  alter publication supabase_realtime add table public.push_subscriptions;
exception when duplicate_object then null;
end $$;
