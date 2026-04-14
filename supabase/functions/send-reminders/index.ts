// Supabase Edge Function: send-reminders
// Deploy via Supabase Dashboard → Edge Functions → New function.
// Expects to be hit every hour by a pg_cron job (see daily_reminders_cron.sql).
//
// For each athlete that:
//   - has daily_reminder_enabled = true
//   - whose current local hour matches daily_reminder_hour
//   - has NOT logged any activity (habits / practices / check-ins)
//     for today in their local timezone
// we fire a push reminder. Uses the notification_prefs gate via
// prefKey="dailyReminder" so the recipient can still suppress it.

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

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const notificationPayload = JSON.stringify({
      title: "Time to check in with Mindset",
      body: "Keep your streak alive — take 2 minutes to log today.",
      url: "/",
      tag: `daily-reminder-${today}`,
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

  return new Response(
    JSON.stringify({ checked: accounts.length, sent, details }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
});
