# Supabase migrations

This directory holds the SQL that defines the app's cloud schema. Vercel
deploys the JS but does **not** apply these migrations — each file has to
be run manually in the Supabase SQL Editor (or via `supabase db push` if
you've wired up the CLI).

Every file is designed to be **idempotent** (`create table if not exists`,
`add column if not exists`, `drop policy if exists` + re-create, etc.),
so re-running is safe.

## Ship order

### Applying to a fresh database

Run in this order:

1. **`schema.sql`** — core tables, RLS policies, and the generic policy
   builder for athlete-owned data. Everything else assumes this exists.
2. **Feature files** — apply any or all of the others below. Order
   doesn't matter between them; most add an isolated feature table.
3. **Schema patches** (see "Incremental changes" below) — apply in any
   order.

### Applying a new deploy to an existing database

Only run the files that were added since the last deploy. If you're not
sure, every file is idempotent, so running the whole directory is safe
(just slower).

## File index

### Core

- **`schema.sql`** — foundation. Accounts, athletes, connections, all
  the athlete-owned data tables (habits, practices, mental_checkins,
  matches, mental_sessions, recovery_checkins, nutrition_logs, weekly
  reviews, power phrases, unlocked badges, tournaments, awards,
  opponents, videos), and the RLS policies. Also defines
  `public.is_connected_to_athlete(uuid)` which is used by every
  coach-read policy.
- **`realtime.sql`** — enables Supabase realtime on the tables that
  subscribe via `useRealtime`.

### Feature tables

- `adult_chats.sql` — coach↔parent DM threads pinned to a specific
  athlete.
- `ai_conversations.sql` / `ai_insights.sql` — Ask Coach chat + cached
  insights.
- `app_feedback.sql` + `app_feedback_replies.sql` — in-app feedback
  tickets with threaded replies.
- `cheers.sql` — quick 1-tap reactions from parents/coaches to athlete
  moments.
- `coach_practice_plans.sql` — coach-authored plans pushed to athletes.
- `coach_video_upload.sql` — coach upload of videos to an athlete's
  library.
- `custom_habits.sql` — athlete-invented habits beyond the preset list.
- `daily_reminders.sql` + `daily_reminders_cron.sql` — push-notification
  reminders + the pg_cron job that fires them.
- `feedback.sql` — legacy ticket table (superseded by app_feedback).
- `loss_recovery.sql` — post-loss reflection flow.
- `notification_prefs.sql` — per-channel opt-in toggles.
- `parent_gamification.sql` — parent XP ledger + level.
- `personal_records.sql` — athlete PRs (lifts, times, jumps).
- `push_subscriptions.sql` — web-push subscriptions per device.
- `team_announcements.sql` — one-way coach broadcasts to the team.
- `team_leaderboard.sql` — weekly leaderboard snapshots.
- `video_annotations.sql` — coach/parent notes pinned to a video
  timestamp.
- `videos_storage.sql` + `videos_storage_coach_parent.sql` — storage
  bucket + policies for videos.
- `weekly_digest_cron.sql` — weekly parent email roll-up cron.
- `weekly_focus.sql` + `weekly_focus_skill.sql` — the coach's weekly
  focus (free-text first, optional skill_id tag second).

### Incremental schema patches

These are small `alter table ... add column if not exists` migrations
that extend an existing table. Each is idempotent, order-independent,
and only needs to run once per database.

- **`fix_account_lookup.sql`** — grants/policies fix for account
  lookups.
- **`streak_freezes.sql`** — adds `athletes.used_freeze_dates text[]`
  so the coach roster can honor streak freezes. Required by the code
  that reads `select id, xp, used_freeze_dates from athletes` in
  `src/lib/teamStats.ts`.
- **`mental_sessions_scenarios_kind.sql`** — broadens the
  `mental_sessions.kind` CHECK constraint to include `'scenarios'`.
  Required for the Decision Drill game to sync — without it,
  Postgres rejects the whole upsert batch with a check-constraint
  violation and *every* mental-session row for that athlete fails.
- **`cached_streak.sql`** — adds `athletes.current_streak int` +
  `athletes.streak_updated_at timestamptz`. The athlete app writes
  what its own `computeStreak` returns and the coach roster reads
  that directly (falling back to the raw-rows recompute when the
  cached value is stale >24h). Eliminates the "one missing activity
  row silently breaks the coach's view of the streak" class of bug.
  Required by `src/lib/teamStats.ts` and `src/lib/athleteSync.ts`.

## When to write a new migration vs. edit `schema.sql`

- **New feature table** → new `<feature>.sql` file.
- **Altering an existing table from `schema.sql`** → write a small
  `<what>.sql` patch that uses `add column if not exists` or
  `drop constraint if exists` + re-create. **Also** update
  `schema.sql` itself so a fresh DB matches without needing every
  patch.
- **Never** rename or delete a shipped migration file. They're our
  record of what's been applied to production.
