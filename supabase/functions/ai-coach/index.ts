// Supabase Edge Function: ai-coach
// Deploy via Supabase Dashboard → Edge Functions → New function.
// Required secret: ANTHROPIC_API_KEY (get one at https://console.anthropic.com)
//
// Accepts POST { kind, athleteId, contextKey?, refresh? }
//   kind       — "weekly-wrap-up" (others planned)
//   athleteId  — target athlete's account id
//   contextKey — optional; defaults to this-week's Monday (YYYY-MM-DD)
//   refresh    — if true, bypass cache and re-generate
//
// Auth model: caller must be the athlete OR an accepted connection
// to that athlete. Verified server-side via the caller's JWT.

// @ts-expect-error
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-haiku-4-5-20251001";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function monday(d = new Date()): string {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

interface Payload {
  kind?: string;
  athleteId?: string;
  contextKey?: string;
  refresh?: boolean;
}

// @ts-expect-error — Deno global
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Missing authorization", {
      status: 401,
      headers: corsHeaders,
    });
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, "");

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verify JWT
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response("Invalid session", {
      status: 401,
      headers: corsHeaders,
    });
  }
  const callerId = userData.user.id;

  // Parse payload
  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const kind = payload.kind ?? "weekly-wrap-up";
  const athleteId = payload.athleteId;
  if (!athleteId) {
    return new Response("Missing athleteId", {
      status: 400,
      headers: corsHeaders,
    });
  }
  const contextKey = payload.contextKey ?? monday();
  const refresh = Boolean(payload.refresh);

  // Auth: must be the athlete or a connected coach/parent
  if (callerId !== athleteId) {
    const { count } = await admin
      .from("connections")
      .select("id", { head: true, count: "exact" })
      .eq("athlete_account_id", athleteId)
      .eq("other_account_id", callerId)
      .eq("status", "accepted");
    if (!count) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }
  }

  // Cache check
  if (!refresh) {
    const { data: cached } = await admin
      .from("ai_insights")
      .select("*")
      .eq("athlete_id", athleteId)
      .eq("kind", kind)
      .eq("context_key", contextKey)
      .maybeSingle();
    if (cached) {
      const expired =
        cached.expires_at && new Date(cached.expires_at) < new Date();
      if (!expired) {
        return jsonResponse({
          ok: true,
          cached: true,
          content: cached.content,
          generatedAt: cached.generated_at,
          model: cached.model,
        });
      }
    }
  }

  // --- Generate fresh insight
  if (kind !== "weekly-wrap-up") {
    return new Response(`Unsupported kind: ${kind}`, {
      status: 400,
      headers: corsHeaders,
    });
  }

  const content = await generateWeeklyWrapUp(admin, athleteId, contextKey);
  if (!content) {
    return new Response("Failed to generate content", {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { error: insertErr } = await admin
    .from("ai_insights")
    .upsert(
      {
        athlete_id: athleteId,
        kind,
        context_key: contextKey,
        content,
        model: MODEL,
      },
      { onConflict: "athlete_id,kind,context_key" }
    );
  if (insertErr) console.warn("ai_insights upsert warning", insertErr);

  return jsonResponse({
    ok: true,
    cached: false,
    content,
    generatedAt: new Date().toISOString(),
    model: MODEL,
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Weekly wrap-up generator
// ---------------------------------------------------------------------------

async function generateWeeklyWrapUp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string,
  weekStart: string
): Promise<string | null> {
  // Fetch profile
  const { data: profileRow } = await admin
    .from("athletes")
    .select("name, sport, age, xp")
    .eq("id", athleteId)
    .maybeSingle();

  if (!profileRow) return null;

  const weekEnd = new Date(weekStart + "T00:00:00");
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = weekEnd.toISOString().slice(0, 10);

  // Pull this week's activity
  const [
    habitsRes,
    practicesRes,
    checkinsRes,
    matchesRes,
    recoveryRes,
    nutritionRes,
  ] = await Promise.all([
    admin
      .from("habit_completions")
      .select("habit_id, date")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
    admin
      .from("practices")
      .select("date, duration_min, type, intensity, notes")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
    admin
      .from("mental_checkins")
      .select("date, mood, goal, goal_met, gratitude")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
    admin
      .from("matches")
      .select("date, opponent, result, performance_rating, went_well, next_focus")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
    admin
      .from("recovery_checkins")
      .select("date, sleep_hours, sleep_quality, soreness, energy")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
    admin
      .from("nutrition_logs")
      .select("date, water_glasses, had_protein, had_fruit_veg")
      .eq("athlete_id", athleteId)
      .gte("date", weekStart)
      .lte("date", weekEndIso),
  ]);

  const habits = habitsRes.data ?? [];
  const practices = practicesRes.data ?? [];
  const checkins = checkinsRes.data ?? [];
  const matches = matchesRes.data ?? [];
  const recovery = recoveryRes.data ?? [];
  const nutrition = nutritionRes.data ?? [];

  // Active-day count
  const activeDates = new Set<string>();
  habits.forEach((h: { date: string }) => activeDates.add(h.date));
  practices.forEach((p: { date: string }) => activeDates.add(p.date));
  checkins.forEach((c: { date: string }) => activeDates.add(c.date));
  matches.forEach((m: { date: string }) => m.date && activeDates.add(m.date));
  recovery.forEach((r: { date: string }) => activeDates.add(r.date));
  nutrition.forEach((n: { date: string }) => activeDates.add(n.date));

  const totalDays = daysBetween(weekStart, weekEndIso) + 1;

  const matchLines = matches
    .map(
      (m: {
        date: string;
        opponent: string | null;
        result: string | null;
        performance_rating: number | null;
        went_well: string | null;
        next_focus: string | null;
      }) =>
        `  - ${m.date} vs ${m.opponent ?? "unknown"}: ${
          m.result ?? "no result"
        }${
          m.performance_rating ? ` (rated ${m.performance_rating}/5)` : ""
        }${m.went_well ? ` — went well: "${m.went_well}"` : ""}${
          m.next_focus ? ` — next focus: "${m.next_focus}"` : ""
        }`
    )
    .join("\n");

  const goalLines = checkins
    .filter((c: { goal: string | null }) => c.goal)
    .map(
      (c: {
        date: string;
        goal: string | null;
        goal_met: boolean | null;
      }) =>
        `  - ${c.date}: "${c.goal}"${
          c.goal_met === true ? " ✓" : c.goal_met === false ? " ✗" : ""
        }`
    )
    .join("\n");

  const dataBlock = `
Athlete: ${profileRow.name}, ${profileRow.sport}, age ${profileRow.age}, level-based XP: ${profileRow.xp}
Week: ${weekStart} to ${weekEndIso}

Active days this week: ${activeDates.size} out of ${totalDays}
Habits completed: ${habits.length}
Practices logged: ${practices.length}${
    practices.length > 0
      ? ` (total ${practices.reduce(
          (s: number, p: { duration_min: number }) => s + (p.duration_min ?? 0),
          0
        )} min)`
      : ""
  }
Mental check-ins: ${checkins.length}
Matches this week: ${matches.length}${
    matches.length > 0
      ? ` (${matches.filter((m: { result: string | null }) => m.result === "win").length}W / ${matches.filter((m: { result: string | null }) => m.result === "loss").length}L)`
      : ""
  }
Recovery logs: ${recovery.length}
Nutrition logs: ${nutrition.length}

${matchLines ? `Matches:\n${matchLines}\n` : ""}${
    goalLines ? `Daily goals:\n${goalLines}\n` : ""
  }`.trim();

  const SYSTEM_PROMPT = `You are a warm, specific, age-appropriate mindset coach for a youth athlete (ages 8–14). You read their week of data and write a short, encouraging summary — like a thoughtful text from a coach who's been watching.

Rules:
- Keep it to 3–5 sentences, plain conversational language.
- Be SPECIFIC — name a number, a day, a match, a goal, or a behavior. Never generic platitudes.
- Open with something they did well. End with one concrete, small suggestion for next week.
- Tone: proud but honest. Never critical. Never preachy. Never use emoji.
- If the week was empty/quiet, say so gently and suggest one easy win.
- Do not invent data. If something isn't in the input, don't mention it.
- Address them by first name once.`;

  const USER_PROMPT = `Here's the athlete's week. Write the coaching note now.\n\n${dataBlock}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: USER_PROMPT }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Anthropic API error", resp.status, errText);
      return null;
    }

    const result = await resp.json();
    const text = result?.content?.[0]?.text;
    if (typeof text !== "string") return null;
    return text.trim();
  } catch (e) {
    console.error("Anthropic call failed", e);
    return null;
  }
}
