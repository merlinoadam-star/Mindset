# Mindset — Phase 2 Setup

Phase 2 adds **athlete ↔ coach ↔ parent sync** on top of the existing local
app. Follow these steps to turn it on.

## 1. Create a Supabase project (2 minutes, free)

1. Go to https://supabase.com and sign up (GitHub login works)
2. Click **New project**
3. Name it **Mindset**, generate a strong database password, pick a region
4. Wait for the project to finish provisioning (~1 min)

## 2. Run the schema

1. In your new Supabase project, open **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/schema.sql` from this repo
3. Click **Run** — you should see "Success. No rows returned."
4. This creates all the tables + Row Level Security policies for athlete,
   coach, and parent roles

## 3. Grab your API keys

1. In Supabase, open **Settings** → **API**
2. Copy two values:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (the long `eyJ...` token under **Project API keys**)

## 4. Add them to Vercel

1. In Vercel, open the Mindset project → **Settings** → **Environment Variables**
2. Add these two variables, selecting **Production**, **Preview**, and
   **Development**:
   - `VITE_SUPABASE_URL` — your project URL
   - `VITE_SUPABASE_ANON_KEY` — your anon key
3. **Redeploy**: go to **Deployments**, click the `...` on the latest one,
   choose **Redeploy** (required to pick up the new env vars)

## 5. Configure auth

1. In Supabase, open **Authentication** → **URL Configuration**
2. Set the **Site URL** to your Vercel domain (e.g. `https://mindset-sage.vercel.app`)
3. Under **Redirect URLs**, add:
   - `https://mindset-sage.vercel.app`
   - `https://mindset-sage.vercel.app/*`
4. Under **Authentication** → **Providers** → **Email**, make sure it's enabled

## 6. Test it

1. Visit your deployed site → Settings → **Sign in to sync**
2. Tap **Create one**, choose your role (athlete / coach / parent), fill in
   name / email / password
3. Confirm via the email link Supabase sends (check spam if it doesn't show
   up)
4. Sign in → you'll now see **Connections** in Settings

## 7. Connect a coach or parent

1. **Each person** creates their own account (athlete, coach, parent — each
   with the right role)
2. As the **athlete**: Settings → Connections → **Invite** → enter the coach's
   email → send
3. As the **coach**: Settings → Connections → accept the invite
4. Done! You're now synced and the coach can see the athlete's data (read-only
   for now in Phase 2A; Phase 2B unlocks coach-authored notes and videos).

## Troubleshooting

- **"No Mindset account found with that email"** — the invitee needs to
  sign up first (they must have an account row before you can invite them)
- **Email confirmation doesn't arrive** — check spam; in Supabase's Auth
  settings you can also disable email confirmation for testing
- **Sign in hangs** — double-check the `VITE_SUPABASE_*` env vars are set
  AND you redeployed; a fresh deploy is required after adding env vars

## Additional SQL migrations to run

As the project evolved, new migrations were added alongside the main
`schema.sql`. Run each of these once in the SQL Editor:

- `supabase/fix_account_lookup.sql` — lookup RPC for connection invites
- `supabase/videos_storage.sql` — videos bucket + RLS (Phase 2B.6)
- `supabase/feedback.sql` — coach/parent notes table (Phase 2C)
- `supabase/realtime.sql` — enable Realtime publications (Phase 2D)
- `supabase/push_subscriptions.sql` — push subscription table (Phase 2E)
- `supabase/weekly_focus.sql` — coach/parent weekly focus (Phase 3A.1)
- `supabase/cheers.sql` — allow "cheer" target_type in feedback (Phase 3A.2)
- `supabase/notification_prefs.sql` — per-user notification toggles (Phase 3B.5)
- `supabase/daily_reminders.sql` — daily reminder columns (Phase 3C.4)
- `supabase/ai_insights.sql` — AI insights cache table (Phase 4F.1)
- `supabase/ai_conversations.sql` — AI Coach Q&A history (Phase 4F.3)
- `supabase/loss_recovery.sql` — loss-recovery flow columns on matches
- `supabase/personal_records.sql` — personal records table + RLS
- `supabase/adult_chats.sql` — coach↔parent private chats table + RLS
- `supabase/parent_gamification.sql` — parent XP ledger, combo gifts, grant RPC
- `supabase/team_leaderboard.sql` — weekly team mini-game XP leaderboard
- `supabase/coach_practice_plans.sql` — coach-pushed daily practice plans + per-item completions

## Push notifications (optional, Phase 2E)

If you want real push notifications when the app is closed, here's the
additional setup:

### A. Generate VAPID keys

On your computer (Node 18+ required):

```
npx web-push generate-vapid-keys
```

Copy the two values it prints — the **Public Key** and the **Private Key**.

### B. Add the public key to Vercel

In Vercel → Project Settings → Environment Variables:

| Key | Value |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | the Public Key from step A |

Redeploy so the new env var takes effect.

### C. Deploy the Edge Function

1. In Supabase → **Edge Functions** → **Deploy new function**
2. Name it `send-push`
3. Paste the contents of `supabase/functions/send-push/index.ts` from this repo
4. Click **Deploy**

### D. Add function secrets

In Supabase → **Project Settings** → **Edge Functions** → **Secrets**:

| Key | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | same public key |
| `VAPID_PRIVATE_KEY` | the private key from step A |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |
| `APP_OWNER_ACCOUNT_ID` | _optional_ — your account UUID, so users can push the in-app feedback notifications to you |

Supabase auto-injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` so
you don't need to set those.

The function verifies the caller's JWT and only allows pushes to:
the caller themselves, an account they share a `connections` row with,
or `APP_OWNER_ACCOUNT_ID`. This prevents one signed-in user from
spamming notifications to arbitrary other users.

### E. Turn it on in the app

Each athlete signs in on their device, goes to **Settings** →
**Push Notifications** → **Enable notifications**. On iOS, the app
must be installed to the Home Screen first (Share sheet → Add to
Home Screen).

From that point, every coach/parent note fires a real push
notification to the athlete's subscribed devices.

## Account deletion (optional, Phase 3B.2)

This lets a signed-in user permanently delete their account + all
their data from Settings → Danger Zone. Requires one more Edge
Function:

1. Supabase → **Edge Functions** → **Deploy new function**
2. Name it `delete-account`
3. Paste the contents of `supabase/functions/delete-account/index.ts`
4. Click **Deploy**
5. On the function's **Details / Settings** page, turn **Verify JWT
   with legacy secret** OFF (same as you did for `send-push`)

No secrets to add — the function uses the auto-injected
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Cron-driven edge functions (`send-reminders`, `send-weekly-digest`)

Both scheduled functions require a shared secret so that only your
pg_cron job can trigger them — without it, anyone who knows the
function URL could spam notifications or weekly emails.

1. Generate a long random string. Example:
   ```
   openssl rand -hex 32
   ```
2. Supabase → **Project Settings** → **Edge Functions** → **Secrets**.
   Add the same value as `CRON_SECRET` for **both** `send-reminders`
   and `send-weekly-digest`.
3. In `supabase/daily_reminders_cron.sql` and `supabase/weekly_digest_cron.sql`,
   replace `<YOUR-CRON-SECRET>` with the same value before running them.

Calls without a matching `x-cron-secret` header return `403 Forbidden`.

## Password reset (Phase 3B.1)

Supabase's built-in password reset requires one quick settings tweak:

1. Supabase → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add `https://your-domain.vercel.app/reset-password`
3. Click **Save**

Without this, the reset email links will 404.
