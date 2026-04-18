// Supabase Edge Function: send-weekly-digest
//
// Builds and emails a weekly summary to each coach and parent about the
// athletes they're connected to. Runs hourly — each recipient gets the
// email at their local Sunday ~19:00, dedup'd via `last_weekly_digest_at`
// on accounts so we never double-send within the same week.
//
// Email provider: Resend (https://resend.com) — set RESEND_API_KEY as a
// Supabase Edge Function secret. From-address is configurable via
// DIGEST_FROM (defaults to onboarding@resend.dev which only works for
// the account owner; add a verified domain for real sends).
//
// Deploy: Supabase Dashboard → Edge Functions → New function → paste
// this file. Then turn OFF "Verify JWT" (cron hits via service key, not
// a user JWT). Schedule via weekly_digest_cron.sql.

// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const DIGEST_FROM =
  Deno.env.get("DIGEST_FROM") || "Mindset <onboarding@resend.dev>";
// Required: shared secret sent in `x-cron-secret` by the pg_cron job.
// Without this, the function URL is publicly invokable and an attacker
// could spam coach/parent inboxes with weekly summaries.
const CRON_SECRET = Deno.env.get("CRON_SECRET") || null;

// Target local hour for the weekly send. 19 = 7pm — after dinner, before
// bed for most adults. Athletes' timezones are used if the coach/parent
// doesn't have one set.
const TARGET_HOUR = 19;
const TARGET_WEEKDAY = 0; // Sunday (0 = Sunday in JS conventions)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function currentHourIn(tz: string): number {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(new Date())
      .find((p) => p.type === "hour")?.value;
    return h ? parseInt(h, 10) % 24 : 0;
  } catch {
    return new Date().getUTCHours();
  }
}

function currentWeekdayIn(tz: string): number {
  try {
    const w = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    }).format(new Date());
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
  } catch {
    return new Date().getUTCDay();
  }
}

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

function offsetDate(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface WeeklySummary {
  athleteId: string;
  athleteName: string;
  avatarEmoji: string | null;
  xpGained: number;
  activeDays: number;
  streakLength: number;
  streakAlive: boolean;
  habitsDone: number;
  matchesPlayed: number;
  matchWins: number;
  matchLosses: number;
  avgMood: number | null;
  moodTrend: "up" | "down" | "flat" | null;
  topWin: string | null;
  weeklyFocus: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildAthleteSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string,
  athleteName: string,
  avatarEmoji: string | null,
  weekStart: string,
  weekEnd: string
): Promise<WeeklySummary> {
  const prevWeekStart = offsetDate(weekStart, -7);
  const prevWeekEnd = offsetDate(weekStart, -1);

  const [
    habits,
    practices,
    checkins,
    matches,
    mentalSessions,
    recovery,
    weeklyReview,
    prevCheckins,
  ] = await Promise.all([
    admin
      .from("habit_completions")
      .select("date, xp_earned")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("practices")
      .select("date, xp_earned")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("mental_checkins")
      .select("date, mood, xp_earned")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("matches")
      .select("date, result, xp_earned, opponent")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("mental_sessions")
      .select("date, xp_earned")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("recovery_checkins")
      .select("date, xp_earned")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
    admin
      .from("weekly_reviews")
      .select("wins, challenge, weekly_focus")
      .eq("athlete_id", athleteId)
      .gte("week_start_date", weekStart)
      .lte("week_start_date", weekEnd)
      .maybeSingle(),
    admin
      .from("mental_checkins")
      .select("mood")
      .eq("athlete_id", athleteId)
      .gte("date", prevWeekStart)
      .lte("date", prevWeekEnd),
  ]);

  const all = [
    ...(habits.data ?? []),
    ...(practices.data ?? []),
    ...(checkins.data ?? []),
    ...(matches.data ?? []),
    ...(mentalSessions.data ?? []),
    ...(recovery.data ?? []),
  ];

  const xpGained = all.reduce(
    (sum, r) => sum + (r.xp_earned ?? 0),
    0
  );

  const activeDateSet = new Set<string>();
  for (const r of all) if (r.date) activeDateSet.add(r.date);

  // Streak length ending on weekEnd (count consecutive active days back).
  let streakLength = 0;
  for (let offset = 0; offset <= 60; offset++) {
    const d = offsetDate(weekEnd, -offset);
    if (activeDateSet.has(d)) {
      streakLength++;
    } else {
      // Look back beyond current week if needed — but we don't have older
      // data here. Stop at first gap.
      break;
    }
  }
  const streakAlive = activeDateSet.has(weekEnd);

  const habitsDone = (habits.data ?? []).length;
  const matchEntries = matches.data ?? [];
  const matchesPlayed = matchEntries.filter(
    (m: { result: string | null }) => m.result
  ).length;
  const matchWins = matchEntries.filter(
    (m: { result: string | null }) => m.result === "win"
  ).length;
  const matchLosses = matchEntries.filter(
    (m: { result: string | null }) => m.result === "loss"
  ).length;

  const moods = (checkins.data ?? [])
    .map((c: { mood: number | null }) => c.mood)
    .filter((m: number | null): m is number => typeof m === "number");
  const avgMood =
    moods.length > 0
      ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length
      : null;

  const prevMoods = (prevCheckins.data ?? [])
    .map((c: { mood: number | null }) => c.mood)
    .filter((m: number | null): m is number => typeof m === "number");
  const prevAvgMood =
    prevMoods.length > 0
      ? prevMoods.reduce((a: number, b: number) => a + b, 0) / prevMoods.length
      : null;

  let moodTrend: "up" | "down" | "flat" | null = null;
  if (avgMood !== null && prevAvgMood !== null) {
    const diff = avgMood - prevAvgMood;
    if (diff > 0.3) moodTrend = "up";
    else if (diff < -0.3) moodTrend = "down";
    else moodTrend = "flat";
  }

  // Pick a "top win" — prefer match win, fallback to weekly review wins
  let topWin: string | null = null;
  const winMatch = matchEntries.find(
    (m: { result: string | null; opponent: string | null }) =>
      m.result === "win"
  );
  if (winMatch) {
    topWin = `Beat ${winMatch.opponent ?? "opponent"}`;
  } else if (weeklyReview.data?.wins) {
    const firstLine = String(weeklyReview.data.wins).split("\n")[0].trim();
    if (firstLine) topWin = firstLine.slice(0, 120);
  }

  const weeklyFocus = weeklyReview.data?.weekly_focus ?? null;

  return {
    athleteId,
    athleteName,
    avatarEmoji,
    xpGained,
    activeDays: activeDateSet.size,
    streakLength,
    streakAlive,
    habitsDone,
    matchesPlayed,
    matchWins,
    matchLosses,
    avgMood,
    moodTrend,
    topWin,
    weeklyFocus,
  };
}

function renderEmailHtml(
  recipientName: string,
  recipientRole: "coach" | "parent",
  summaries: WeeklySummary[],
  weekStart: string,
  weekEnd: string
): string {
  const title =
    recipientRole === "coach"
      ? "Your athletes, this week"
      : "Their week in review";

  const weekLabel = `${formatFriendlyDate(weekStart)} – ${formatFriendlyDate(
    weekEnd
  )}`;

  const cards = summaries
    .map((s) => renderAthleteCard(s))
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
  <div style="text-align:center;margin-bottom:20px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#a855f7);color:white;font-weight:800;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;padding:8px 16px;border-radius:999px;">Mindset Weekly</div>
  </div>
  <h1 style="font-size:28px;font-weight:800;line-height:1.15;margin:0 0 6px 0;">${escapeHtml(title)}</h1>
  <p style="color:#64748b;font-size:14px;margin:0 0 24px 0;">${escapeHtml(weekLabel)}${recipientName ? ` · Hi ${escapeHtml(recipientName)} 👋` : ""}</p>

  ${cards}

  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.5;">
    <p style="margin:0 0 6px 0;">You're getting this because you're connected to ${summaries.length === 1 ? "this athlete" : "these athletes"} on Mindset.</p>
    <p style="margin:0;">You can turn weekly digests off in your Mindset Settings → Notifications.</p>
  </div>
</div>
</body>
</html>`;
}

function renderAthleteCard(s: WeeklySummary): string {
  const emoji = s.avatarEmoji || "🏅";
  const moodBit = s.avgMood
    ? `${s.avgMood.toFixed(1)}/5 ${moodTrendArrow(s.moodTrend)}`
    : "—";
  const streakBit = s.streakAlive
    ? `${s.streakLength} days 🔥`
    : s.streakLength > 0
    ? `ended at ${s.streakLength}`
    : "—";
  const matchBit =
    s.matchesPlayed > 0
      ? `${s.matchWins}W-${s.matchLosses}L${s.matchesPlayed > s.matchWins + s.matchLosses ? `-${s.matchesPlayed - s.matchWins - s.matchLosses}T` : ""}`
      : "none";

  const cells = [
    statCell("XP", `+${s.xpGained}`, "#7c3aed"),
    statCell("Active days", `${s.activeDays}/7`, "#059669"),
    statCell("Streak", streakBit, "#f97316"),
    statCell("Habits", String(s.habitsDone), "#0284c7"),
    statCell("Matches", matchBit, "#dc2626"),
    statCell("Avg mood", moodBit, "#8b5cf6"),
  ].join("");

  const highlight = s.topWin
    ? `<div style="margin-top:14px;padding:12px;background:#f0fdf4;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;font-size:13px;"><strong style="color:#15803d;">Win of the week:</strong> ${escapeHtml(s.topWin)}</div>`
    : "";

  const focus = s.weeklyFocus
    ? `<div style="margin-top:10px;padding:12px;background:#eef2ff;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;font-size:13px;"><strong style="color:#4338ca;">Weekly focus:</strong> ${escapeHtml(s.weeklyFocus)}</div>`
    : "";

  const trendBanner = renderTrendBanner(s);

  return `<div style="background:white;border-radius:16px;padding:20px;margin-bottom:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
    <div style="width:48px;height:48px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:24px;">${escapeHtml(emoji)}</div>
    <div>
      <div style="font-size:18px;font-weight:800;line-height:1.1;">${escapeHtml(s.athleteName)}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:2px;">7-day recap</div>
    </div>
  </div>

  ${trendBanner}

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>${cells}</tr>
  </table>

  ${highlight}
  ${focus}
</div>`;
}

function statCell(label: string, value: string, color: string): string {
  return `<td style="width:33.33%;padding:8px;text-align:left;vertical-align:top;">
  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;font-weight:700;">${escapeHtml(label)}</div>
  <div style="font-size:16px;font-weight:800;color:${color};margin-top:4px;line-height:1.2;">${escapeHtml(value)}</div>
</td>`;
}

function moodTrendArrow(t: "up" | "down" | "flat" | null): string {
  if (t === "up") return "↑";
  if (t === "down") return "↓";
  if (t === "flat") return "→";
  return "";
}

function renderTrendBanner(s: WeeklySummary): string {
  // Flag slippage — two or more concerning signals = a soft yellow banner.
  const flags: string[] = [];
  if (s.activeDays <= 2) flags.push("low activity");
  if (s.moodTrend === "down") flags.push("mood dipped");
  if (!s.streakAlive && s.streakLength > 0) flags.push("streak broke");

  if (flags.length >= 2) {
    return `<div style="margin-bottom:14px;padding:10px 12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;">
      ⚠️ ${escapeHtml(flags.join(" · "))} — might be worth a check-in.
    </div>`;
  }

  if (s.activeDays >= 6 && s.xpGained >= 100) {
    return `<div style="margin-bottom:14px;padding:10px 12px;background:#dcfce7;border-radius:8px;font-size:13px;color:#166534;">
      🎉 Huge week — worth a shout-out.
    </div>`;
  }

  return "";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatFriendlyDate(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: DIGEST_FROM,
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// @ts-expect-error — Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Require the cron shared secret. The pg_cron job sends it in the
  // x-cron-secret header (see weekly_digest_cron.sql).
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

  // Optional override query params for manual testing:
  //   ?force=1          → ignore weekday/hour gates
  //   ?recipient=<id>   → only process this one account
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const recipientFilter = url.searchParams.get("recipient");

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Pull all coach/parent accounts with an email on file.
  let q = admin
    .from("accounts")
    .select(
      "id, email, display_name, role, daily_reminder_timezone, notification_prefs, last_weekly_digest_at"
    )
    .in("role", ["coach", "parent"])
    .not("email", "is", null);
  if (recipientFilter) q = q.eq("id", recipientFilter);

  const { data: recipients, error: recErr } = await q;
  if (recErr) {
    return new Response(`DB error: ${recErr.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }

  let sent = 0;
  const details: Array<{ id: string; action: string; error?: string }> = [];

  for (const r of recipients ?? []) {
    const tz = r.daily_reminder_timezone || "America/Chicago";
    const prefs = (r.notification_prefs ?? {}) as Record<string, unknown>;

    if (prefs["weeklyDigest"] === false) {
      details.push({ id: r.id, action: "skip-pref" });
      continue;
    }
    if (!r.email) {
      details.push({ id: r.id, action: "skip-no-email" });
      continue;
    }

    if (!force) {
      if (currentWeekdayIn(tz) !== TARGET_WEEKDAY) {
        details.push({ id: r.id, action: "skip-weekday" });
        continue;
      }
      if (currentHourIn(tz) !== TARGET_HOUR) {
        details.push({ id: r.id, action: "skip-hour" });
        continue;
      }
      // Dedup — don't resend within 6 days
      if (r.last_weekly_digest_at) {
        const last = new Date(r.last_weekly_digest_at).getTime();
        const sixDaysMs = 6 * 24 * 60 * 60 * 1000;
        if (Date.now() - last < sixDaysMs) {
          details.push({ id: r.id, action: "skip-dedup" });
          continue;
        }
      }
    }

    // Find accepted athlete connections
    const { data: conns } = await admin
      .from("connections")
      .select("athlete_account_id")
      .eq("other_account_id", r.id)
      .eq("status", "accepted");

    const athleteIds = (conns ?? []).map(
      (c: { athlete_account_id: string }) => c.athlete_account_id
    );

    if (athleteIds.length === 0) {
      details.push({ id: r.id, action: "skip-no-athletes" });
      continue;
    }

    const { data: athletes } = await admin
      .from("accounts")
      .select("id, display_name, avatar_emoji")
      .in("id", athleteIds);

    const todayIso = todayIsoIn(tz);
    const weekEnd = todayIso;
    const weekStart = offsetDate(weekEnd, -6);

    const summaries: WeeklySummary[] = [];
    for (const a of athletes ?? []) {
      const s = await buildAthleteSummary(
        admin,
        a.id,
        a.display_name ?? "Your athlete",
        a.avatar_emoji ?? null,
        weekStart,
        weekEnd
      );
      // Skip athletes with literally zero activity AND no recorded prior
      // weekly review — likely inactive accounts.
      if (
        s.xpGained === 0 &&
        s.activeDays === 0 &&
        s.matchesPlayed === 0 &&
        !s.weeklyFocus
      ) {
        continue;
      }
      summaries.push(s);
    }

    if (summaries.length === 0) {
      details.push({ id: r.id, action: "skip-no-activity" });
      continue;
    }

    const html = renderEmailHtml(
      (r.display_name ?? "").trim().split(/\s+/)[0] ?? "",
      r.role,
      summaries,
      weekStart,
      weekEnd
    );

    const subject =
      summaries.length === 1
        ? `${summaries[0].athleteName}'s week on Mindset`
        : `Weekly Mindset recap — ${summaries.length} athletes`;

    const result = await sendEmail(r.email, subject, html);

    if (result.ok) {
      sent++;
      await admin
        .from("accounts")
        .update({ last_weekly_digest_at: new Date().toISOString() })
        .eq("id", r.id);
      details.push({ id: r.id, action: "sent" });
    } else {
      details.push({ id: r.id, action: "send-failed", error: result.error });
    }
  }

  return new Response(
    JSON.stringify({ checked: recipients?.length ?? 0, sent, details }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
});
