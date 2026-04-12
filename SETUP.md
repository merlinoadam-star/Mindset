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

## What's next (Stage 2B)

Once sync is working, we'll hook up the actual data tables so everything
(habits, matches, notes, videos, etc.) syncs automatically between the
athlete and their coach / parent.
