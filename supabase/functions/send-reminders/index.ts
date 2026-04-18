// Supabase Edge Function: send-reminders
// Deploy via Supabase Dashboard → Edge Functions → New function.
// Expects to be hit every hour by a pg_cron job (see daily_reminders_cron.sql).
//
// Three kinds of pushes are dispatched from here:
//
//   1. DAILY REMINDER  (gated by daily_reminder_enabled + dailyReminder pref)
//      Fires at the athlete's chosen local hour if they have no activity
//      logged today. Message is SMART — varies based on their streak,
//      recent activity, and history (eg "Don't break your 5-day streak").
//
//   2. STREAK SAVER  (gated by smartNudges pref, default ON)
//      Fires at local 20:00 for athletes who had activity yesterday but
//      none today yet. Separate window from the main reminder so late
//      lockers-in still get a nudge even if their reminder fires at 4pm.
//
//   3. MATCH REMINDERS  (gated by matchReminders pref)
//      Evening before (6-8pm local) and morning of (7-9am local).

// @ts-expect-error
import webpush from "https://esm.sh/web-push@3.6.7";
// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT =
  Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Required: a shared secret that the pg_cron job sends in the
// `x-cron-secret` header. Without this, anyone who knows the function
// URL can trigger a reminder fan-out and spam every athlete.
const CRON_SECRET = Deno.env.get("CRON_SECRET") || null;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/** Return the current hour (0-23) in the given IANA timezone. */
function currentHourIn(tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const h = parts.find((p) => p.type === "hour")?.value ?? "0";
    return parseInt(h, 10) % 24;
  } catch {
    return new Date().getUTCHours();
  }
}

/** Return today's YYYY-MM-DD in the given IANA timezone. */
function todayIsoIn(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Offset a YYYY-MM-DD date by N days. Day-boundary safe via UTC noon. */
function offsetDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Format a 0-23 hour as a friendly "8pm" / "8am" string. */
function hourLabel(h: number): string {
  const mod = ((h % 12) + 12) % 12;
  const display = mod === 0 ? 12 : mod;
  return `${display}${h < 12 ? "am" : "pm"}`;
}

interface ActivityContext {
  streakLength: number; // consecutive active days ending yesterday (or today)
  streakAlive: boolean; // active streak that survives to today
  daysSinceLastActivity: number; // 0 = today, 1 = yesterday, etc.
  usualCheckinHour: number | null; // learned from last 14 days of checkins
  firstName: string;
}

/**
 * Build a personalized nudge message based on what the athlete has (and
 * hasn't) been doing. Returns title + body + tag.
 */
function pickSmartMessage(
  ctx: ActivityContext,
  todayIso: string
): { title: string; body: string; tag: string } {
  const { streakLength, daysSinceLastActivity, usualCheckinHour, firstName } =
    ctx;

  // 1. Streak in danger — highest priority
  if (streakLength >= 3 && daysSinceLastActivity === 1) {
    return {
      title: `Save your ${streakLength}-day streak 🔥`,
      body: `One habit, one check-in, one breath — anything counts. Don't let it slip.`,
      tag: `smart-streak-${todayIso}`,
    };
  }

  // 2. Been away a while — welcome back
  if (daysSinceLastActivity >= 3) {
    return {
      title: `We miss you${firstName ? `, ${firstName}` : ""} 💫`,
      body: `Jump back in — even 30 seconds keeps your momentum alive.`,
      tag: `smart-return-${todayIso}`,
    };
  }

  // 3. Usual hour nudge — "you usually check in by 8pm"
  if (usualCheckinHour !== null) {
    return {
      title: `Your usual time 🎯`,
      body: `You normally check in by ${hourLabel(usualCheckinHour)} — ready to lock it in?`,
      tag: `smart-habit-${todayIso}`,
    };
  }

  // 4. Rotating default pool
  const pool = [
    {
      title: "Two minutes. That's it.",
      body: "Log one habit, take one breath, close the day strong.",
    },
    {
      title: "Your future self says thanks 🙏",
      body: "Future-you remembers the days you showed up. Be that kid today.",
    },
    {
      title: "Champions check in ✅",
      body: "Keep the system running — even when you don't feel like it.",
    },
    {
      title: "Quick one.",
      body: "Habits, mood, or a power phrase. Pick one. Two minutes.",
    },
  ];
  const idx =
    Math.abs(
      (todayIso + (firstName ?? "")).split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % pool.length;
  return {
    title: pool[idx].title,
    body: pool[idx].body,
    tag: `smart-default-${todayIso}`,
  };
}

/**
 * Build the activity context for an athlete by scanning the last 14 days
 * of activity across the six "alive" tables. Also infers their usual
 * check-in hour from mental_checkins.created_at.
 */
async function buildActivityContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string,
  displayName: string | null,
  tz: string,
  todayIso: string
): Promise<ActivityContext> {
  const start = offsetDate(todayIso, -14);

  // Pull date columns from each activity source in parallel.
  const [habits, practices, checkins, matches, recovery, mental] =
    await Promise.all([
      admin
        .from("habit_completions")
        .select("date")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
      admin
        .from("practices")
        .select("date")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
      admin
        .from("mental_checkins")
        .select("date, created_at")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
      admin
        .from("matches")
        .select("date")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
      admin
        .from("recovery_checkins")
        .select("date")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
      admin
        .from("mental_sessions")
        .select("date")
        .eq("athlete_id", athleteId)
        .gte("date", start)
        .lte("date", todayIso),
    ]);

  const activeDays = new Set<string>();
  for (const row of habits.data ?? []) activeDays.add(row.date);
  for (const row of practices.data ?? []) activeDays.add(row.date);
  for (const row of checkins.data ?? []) activeDays.add(row.date);
  for (const row of matches.data ?? []) activeDays.add(row.date);
  for (const row of recovery.data ?? []) activeDays.add(row.date);
  for (const row of mental.data ?? []) activeDays.add(row.date);

  // Count consecutive active days backward from the most recent active day.
  let streakLength = 0;
  let daysSinceLastActivity = 15; // "never" sentinel
  for (let offset = 0; offset <= 14; offset++) {
    const d = offsetDate(todayIso, -offset);
    if (activeDays.has(d)) {
      if (daysSinceLastActivity === 15) daysSinceLastActivity = offset;
      streakLength++;
    } else if (daysSinceLastActivity !== 15) {
      break;
    }
  }
  const streakAlive =
    daysSinceLastActivity === 0 || daysSinceLastActivity === 1;

  // Infer usual check-in hour from mental_checkins.created_at (last 14 days).
  // We want the athlete's LOCAL hour, not UTC.
  const hourCounts: Record<number, number> = {};
  for (const row of checkins.data ?? []) {
    if (!row.created_at) continue;
    try {
      const h = parseInt(
        new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          hour12: false,
        })
          .formatToParts(new Date(row.created_at))
          .find((p) => p.type === "hour")?.value ?? "0",
        10
      );
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    } catch {
      /* skip malformed */
    }
  }
  let usualCheckinHour: number | null = null;
  const totalCheckins = Object.values(hourCounts).reduce((a, b) => a + b, 0);
  if (totalCheckins >= 4) {
    // Need a bit of history before trusting the pattern.
    let mostCommon = -1;
    let peak = 0;
    for (const [h, c] of Object.entries(hourCounts)) {
      if (c > peak) {
        peak = c;
        mostCommon = parseInt(h, 10);
      }
    }
    usualCheckinHour = mostCommon >= 0 ? mostCommon : null;
  }

  const firstName = (displayName ?? "").trim().split(/\s+/)[0] ?? "";

  return {
    streakLength,
    streakAlive,
    daysSinceLastActivity,
    usualCheckinHour,
    firstName,
  };
}

// @ts-expect-error — Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Cron hits with POST (or GET — accept both)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Require the cron shared secret. Configure CRON_SECRET in the
  // function secrets and include it in the pg_cron Authorization
  // header (see daily_reminders_cron.sql).
  if (!CRON_SECRET) {
    return new Response("CRON_SECRET not configured", {
      status: 500,
      headers: corsHeaders,
    });
  }
  const provided = req.headers.get("x-cron-secret");
  if (provided !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Pull every account that's opted into daily reminders. This is
  // small; no pagination needed for reasonable user counts.
  const { data: accounts, error: acctErr } = await admin
    .from("accounts")
    .select(
      "id, display_name, role, daily_reminder_enabled, daily_reminder_hour, daily_reminder_timezone, notification_prefs"
    )
    .eq("daily_reminder_enabled", true)
    .eq("role", "athlete");

  if (acctErr) {
    return new Response(`DB error: ${acctErr.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
  if (!accounts || accounts.length === 0) {
    return new Response(
      JSON.stringify({ checked: 0, sent: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  let sent = 0;
  const details: Array<{ id: string; action: string }> = [];

  for (const a of accounts) {
    const tz = a.daily_reminder_timezone || "UTC";
    const targetHour = a.daily_reminder_hour ?? 18;
    const nowHour = currentHourIn(tz);

    if (nowHour !== targetHour) {
      details.push({ id: a.id, action: "skip-hour" });
      continue;
    }

    // Respect the notification pref gate
    const prefs = (a.notification_prefs ?? {}) as Record<string, unknown>;
    if (prefs["dailyReminder"] === false) {
      details.push({ id: a.id, action: "skip-pref" });
      continue;
    }

    // Check for activity today in their local timezone
    const today = todayIsoIn(tz);
    const [
      habitsRes,
      practicesRes,
      checkinsRes,
      matchesRes,
      recoveryRes,
      mentalRes,
    ] = await Promise.all([
      admin
        .from("habit_completions")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
      admin
        .from("practices")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
      admin
        .from("mental_checkins")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
      admin
        .from("matches")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
      admin
        .from("recovery_checkins")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
      admin
        .from("mental_sessions")
        .select("id", { head: true, count: "exact" })
        .eq("athlete_id", a.id)
        .eq("date", today),
    ]);

    const anyActivity =
      (habitsRes.count ?? 0) > 0 ||
      (practicesRes.count ?? 0) > 0 ||
      (checkinsRes.count ?? 0) > 0 ||
      (matchesRes.count ?? 0) > 0 ||
      (recoveryRes.count ?? 0) > 0 ||
      (mentalRes.count ?? 0) > 0;

    if (anyActivity) {
      details.push({ id: a.id, action: "skip-active" });
      continue;
    }

    // Send the push. We go direct via webpush here rather than
    // invoking send-push so we don't double-check prefs.
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("account_id", a.id);

    if (!subs || subs.length === 0) {
      details.push({ id: a.id, action: "skip-nosubs" });
      continue;
    }

    // Build context to pick the smartest possible message for them.
    const ctx = await buildActivityContext(
      admin,
      a.id,
      a.display_name,
      tz,
      today
    );
    const msg = pickSmartMessage(ctx, today);

    const notificationPayload = JSON.stringify({
      title: msg.title,
      body: msg.body,
      url: "/",
      tag: msg.tag,
    });

    let anySent = false;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          notificationPayload
        );
        anySent = true;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("id", s.id);
        }
      }
    }

    if (anySent) sent++;
    details.push({ id: a.id, action: anySent ? "sent" : "push-failed" });
  }

  // =========================================================================
  // Streak-saver window — local 20:00.
  // For ALL athletes with push subs (even if daily_reminder_enabled is off),
  // if their streak was alive yesterday and they have no activity today,
  // fire a "don't break your streak" push. De-duped via tag; won't double
  // fire with the regular reminder because that uses a different tag.
  // =========================================================================

  {
    const { data: allSubsForStreak } = await admin
      .from("push_subscriptions")
      .select("account_id");
    const streakCandidateIds = [
      ...new Set(
        (allSubsForStreak ?? []).map(
          (s: { account_id: string }) => s.account_id
        )
      ),
    ];

    if (streakCandidateIds.length > 0) {
      const { data: streakAccts } = await admin
        .from("accounts")
        .select(
          "id, display_name, role, daily_reminder_timezone, notification_prefs"
        )
        .in("id", streakCandidateIds)
        .eq("role", "athlete");

      for (const acct of streakAccts ?? []) {
        const prefs = (acct.notification_prefs ?? {}) as Record<
          string,
          unknown
        >;
        // smartNudges defaults to true — only skip if explicitly false.
        if (prefs["smartNudges"] === false) continue;

        const tz = acct.daily_reminder_timezone || "UTC";
        if (currentHourIn(tz) !== 20) continue;

        const today = todayIsoIn(tz);
        const ctx = await buildActivityContext(
          admin,
          acct.id,
          acct.display_name,
          tz,
          today
        );

        // Only fire if: (a) they had ≥3 day streak through yesterday, and
        // (b) they haven't logged anything today yet.
        if (ctx.daysSinceLastActivity !== 1) continue;
        if (ctx.streakLength < 3) continue;

        const msg = {
          title: `4 hours to save your ${ctx.streakLength}-day streak 🔥`,
          body: `Open Mindset and log anything — one habit is enough.`,
          tag: `streak-saver-${today}`,
        };
        const pushResult = await pushToAthlete(
          admin,
          acct.id,
          msg.title,
          msg.body,
          "/",
          msg.tag
        );
        if (pushResult) sent++;
        details.push({
          id: acct.id,
          action: pushResult ? "streak-saver-sent" : "streak-saver-skip",
        });
      }
    }
  }

  // =========================================================================
  // Match-day reminders — for ALL athletes with push subscriptions.
  // Evening before (6-8pm local) → "Match tomorrow — time to prep"
  // Morning of (7-9am local) → "Match day — you've got this!"
  // Tag-based dedup so at most one per match per window.
  // =========================================================================

  const { data: allSubs } = await admin
    .from("push_subscriptions")
    .select("account_id");
  const subAthleteIds = [
    ...new Set((allSubs ?? []).map((s: { account_id: string }) => s.account_id)),
  ];

  if (subAthleteIds.length > 0) {
    // Fetch just the columns we need for all potential athletes in one go
    const { data: matchAccounts } = await admin
      .from("accounts")
      .select(
        "id, role, daily_reminder_timezone, notification_prefs"
      )
      .in("id", subAthleteIds)
      .eq("role", "athlete");

    for (const acct of matchAccounts ?? []) {
      const prefs = (acct.notification_prefs ?? {}) as Record<
        string,
        unknown
      >;
      if (prefs["matchReminders"] === false) continue;

      const tz = acct.daily_reminder_timezone || "UTC";
      const localHour = currentHourIn(tz);
      const localToday = todayIsoIn(tz);

      // Compute tomorrow in the athlete's timezone
      const tmrw = new Date(localToday + "T12:00:00");
      tmrw.setDate(tmrw.getDate() + 1);
      const tomorrowIso = tmrw.toISOString().slice(0, 10);

      // Evening window (6-8pm) → "match tomorrow" reminders
      if (localHour >= 18 && localHour <= 20) {
        const { data: tmrwMatches } = await admin
          .from("matches")
          .select("id, opponent, pre_match_completed_at")
          .eq("athlete_id", acct.id)
          .eq("date", tomorrowIso);

        for (const m of tmrwMatches ?? []) {
          const prepped = Boolean(m.pre_match_completed_at);
          const pushResult = await pushToAthlete(
            admin,
            acct.id,
            prepped
              ? "Match day tomorrow!"
              : "Match tomorrow — time to prep",
            `vs ${m.opponent ?? "your opponent"} tomorrow. ${
              prepped
                ? "You're prepared!"
                : "Open Mindset and get your head right."
            }`,
            "/matches",
            `match-tomorrow-${m.id}`
          );
          if (pushResult) sent++;
          details.push({
            id: acct.id,
            action: pushResult
              ? "match-tomorrow-sent"
              : "match-tomorrow-skip",
          });
        }
      }

      // Morning window (7-9am) → "match today" reminders
      if (localHour >= 7 && localHour <= 9) {
        const { data: todayMatches } = await admin
          .from("matches")
          .select("id, opponent")
          .eq("athlete_id", acct.id)
          .eq("date", localToday);

        for (const m of todayMatches ?? []) {
          const pushResult = await pushToAthlete(
            admin,
            acct.id,
            "Match day!",
            `vs ${m.opponent ?? "your opponent"} today. You've got this.`,
            "/matches",
            `match-today-${m.id}`
          );
          if (pushResult) sent++;
          details.push({
            id: acct.id,
            action: pushResult ? "match-today-sent" : "match-today-skip",
          });
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ checked: (accounts?.length ?? 0) + subAthleteIds.length, sent, details }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
});

// ---------------------------------------------------------------------------
// Helper: send a webpush to all of an athlete's subscribed devices
// ---------------------------------------------------------------------------

async function pushToAthlete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string,
  title: string,
  body: string,
  url: string,
  tag: string
): Promise<boolean> {
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("account_id", athleteId);
  if (!subs || subs.length === 0) return false;

  const payload = JSON.stringify({ title, body, url, tag });
  let anySent = false;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      anySent = true;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
      }
    }
  }
  return anySent;
}
