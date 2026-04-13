-- ============================================================================
-- Mindset — RLS fix for the connection invite flow
-- Run this once in Supabase's SQL Editor if you already ran the full schema.
-- ============================================================================

-- 1. Let users read accounts they share a connection with (in addition to
--    their own). Needed so the Connections page can display the other
--    party's name/email/role.
drop policy if exists "own account read" on public.accounts;
drop policy if exists "accounts read" on public.accounts;
create policy "accounts read" on public.accounts
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.connections c
      where (
        (c.athlete_account_id = auth.uid() and c.other_account_id = accounts.id)
        or (c.other_account_id = auth.uid() and c.athlete_account_id = accounts.id)
      )
    )
  );

-- 2. Secure lookup by email for the invite sender. Runs with elevated
--    privileges but only returns id + role (no email, no display name,
--    no PII beyond what the caller already supplied).
create or replace function public.find_account_by_email(lookup_email text)
returns table (id uuid, role text)
language sql
security definer
stable
set search_path = public
as $$
  select a.id, a.role
  from public.accounts a
  where lower(a.email) = lower(trim(lookup_email))
  limit 1;
$$;

grant execute on function public.find_account_by_email(text) to authenticated;
