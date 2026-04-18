-- ============================================================================
-- Mindset — personal records
--
-- One logged attempt at a PR category per row. "Current best" for a category
-- is computed on read as the min or max of value depending on
-- category_direction. Run once in the SQL Editor.
-- ============================================================================

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  category_key text not null,
  category_label text not null,
  unit text not null,
  direction text not null check (direction in ('higher', 'lower')),
  value numeric not null,
  achieved_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists personal_records_athlete_idx
  on public.personal_records(athlete_id);
create index if not exists personal_records_category_idx
  on public.personal_records(athlete_id, category_key);

-- RLS — athlete owns their own rows; connected coaches/parents can read.
alter table public.personal_records enable row level security;

drop policy if exists personal_records_select on public.personal_records;
create policy personal_records_select
  on public.personal_records
  for select
  to authenticated
  using (
    athlete_id = auth.uid()
    or exists (
      select 1 from public.connections c
      where c.athlete_account_id = personal_records.athlete_id
        and c.other_account_id = auth.uid()
        and c.status = 'accepted'
    )
  );

drop policy if exists personal_records_write on public.personal_records;
create policy personal_records_write
  on public.personal_records
  for all
  to authenticated
  using (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

-- Enable realtime so the coach view refreshes when the athlete logs a PR.
-- Idempotent — swallow the error if the table is already in the publication.
do $$
begin
  alter publication supabase_realtime add table public.personal_records;
exception
  when duplicate_object then null;
end $$;
