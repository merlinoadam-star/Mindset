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
  question?: string;
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

  // --- "Ask" — different flow: not cached, stored as a Q/A conversation.
  if (kind === "ask") {
    return await handleAsk(admin, callerId, athleteId, payload.question ?? "");
  }

  // --- Generate fresh cached insight
  let content: string | null = null;
  if (kind === "weekly-wrap-up") {
    content = await generateWeeklyWrapUp(admin, athleteId, contextKey);
  } else if (kind === "reflection-prompts") {
    content = await generateReflectionPrompts(admin, athleteId, contextKey);
  } else if (kind === "focus-suggestions") {
    content = await generateFocusSuggestions(admin, athleteId);
  } else {
    return new Response(`Unsupported kind: ${kind}`, {
      status: 400,
      headers: corsHeaders,
    });
  }

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

// ---------------------------------------------------------------------------
// Q&A handler — kind="ask"
// ---------------------------------------------------------------------------

const DAILY_ASK_LIMIT = 20;

async function handleAsk(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  callerId: string,
  athleteId: string,
  rawQuestion: string
): Promise<Response> {
  const question = rawQuestion.trim();
  if (!question || question.length < 3) {
    return new Response(
      JSON.stringify({ ok: false, error: "Please enter a question." }),
      {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }
  if (question.length > 500) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Question is too long. Keep it under 500 characters.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  // Rate limit — count asks by this athlete in the last 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("ai_conversations")
    .select("id", { head: true, count: "exact" })
    .eq("athlete_id", athleteId)
    .gte("asked_at", cutoff);
  if ((count ?? 0) >= DAILY_ASK_LIMIT) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Daily limit reached (${DAILY_ASK_LIMIT} questions/24h). Try again tomorrow.`,
      }),
      {
        status: 429,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  // Determine asker role for the stored row
  const { data: askerAccount } = await admin
    .from("accounts")
    .select("role")
    .eq("id", callerId)
    .maybeSingle();
  const askerRole = (askerAccount?.role ?? "athlete") as
    | "athlete"
    | "coach"
    | "parent";

  // Insert the question row first so the UI can show "thinking..."
  const { data: inserted, error: insertErr } = await admin
    .from("ai_conversations")
    .insert({
      athlete_id: athleteId,
      asker_id: callerId,
      asker_role: askerRole,
      question,
    })
    .select()
    .single();
  if (insertErr || !inserted) {
    return new Response(
      JSON.stringify({ ok: false, error: "Couldn't save question." }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  // Build the athlete-context summary (short — just enough to ground
  // the model without blowing token budget).
  const context = await buildAthleteContextSummary(admin, athleteId);

  const SYSTEM_PROMPT = `You are a warm, honest mindset coach for a youth athlete (ages 8-14). You help them think about training, mental game, practice habits, and reflection. You can pull from the athlete-context data block below to be specific.

Absolute safety rules (non-negotiable):
- Do NOT give medical advice, diagnose injuries, or recommend supplements. If asked, say "That's a question for a parent, coach, or doctor" and stop.
- Do NOT give weight-cutting, dieting, or body-composition advice. Redirect to a trusted adult and registered dietitian.
- If the question hints at mental-health distress, self-harm, or being hurt by someone — respond with one kind sentence and direct them to tell a trusted adult right now. Do not continue with normal coaching.
- No political, religious, or romantic content. If asked, politely decline and redirect to training topics.

Style rules:
- Keep answers short: 2-5 sentences.
- Reference their actual data when relevant. NEVER invent stats, matches, or habits they don't have.
- If you don't have enough context to answer well, say so and name one thing they could track to help answer later.
- Speak to them directly, using their first name at most once.
- No emoji. No bullet lists unless they ask for one. No preachy "remember to..." wrap-ups.
- It's fine to say "I don't know" or "I'm not the right helper for that."`;

  const USER_PROMPT = `Athlete context (for grounding):
${context}

The question:
"${question}"

Answer now.`;

  let answer: string | null = null;
  let errorMsg: string | null = null;
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
      errorMsg = `Anthropic API ${resp.status}`;
    } else {
      const result = await resp.json();
      const text = result?.content?.[0]?.text;
      if (typeof text === "string") {
        answer = text.trim();
      } else {
        errorMsg = "Empty response from model.";
      }
    }
  } catch (e) {
    errorMsg = String(e);
  }

  await admin
    .from("ai_conversations")
    .update({
      answer,
      model: MODEL,
      answered_at: new Date().toISOString(),
      error: errorMsg,
    })
    .eq("id", inserted.id);

  if (errorMsg && !answer) {
    return new Response(
      JSON.stringify({ ok: false, error: errorMsg, id: inserted.id }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      id: inserted.id,
      question,
      answer,
      model: MODEL,
      asked_at: inserted.asked_at,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    }
  );
}

/** Compact athlete-context summary used as grounding for Q&A. */
async function buildAthleteContextSummary(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string
): Promise<string> {
  const { data: profile } = await admin
    .from("athletes")
    .select("name, sport, age, xp, team_name, weight_class, primary_position")
    .eq("id", athleteId)
    .maybeSingle();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const [
    habitsRes,
    practicesRes,
    checkinsRes,
    matchesRes,
    recoveryRes,
  ] = await Promise.all([
    admin
      .from("habit_completions")
      .select("id", { head: true, count: "exact" })
      .eq("athlete_id", athleteId)
      .gte("date", sinceIso),
    admin
      .from("practices")
      .select("id", { head: true, count: "exact" })
      .eq("athlete_id", athleteId)
      .gte("date", sinceIso),
    admin
      .from("mental_checkins")
      .select("id", { head: true, count: "exact" })
      .eq("athlete_id", athleteId)
      .gte("date", sinceIso),
    admin
      .from("matches")
      .select("date, opponent, result, performance_rating")
      .eq("athlete_id", athleteId)
      .gte("date", sinceIso)
      .order("date", { ascending: false })
      .limit(5),
    admin
      .from("recovery_checkins")
      .select("id", { head: true, count: "exact" })
      .eq("athlete_id", athleteId)
      .gte("date", sinceIso),
  ]);

  const matchLines = (matchesRes.data ?? [])
    .map(
      (m: {
        date: string;
        opponent: string | null;
        result: string | null;
        performance_rating: number | null;
      }) =>
        `  - ${m.date} vs ${m.opponent ?? "?"}: ${m.result ?? "n/a"}${
          m.performance_rating ? ` (${m.performance_rating}/5)` : ""
        }`
    )
    .join("\n");

  return `
Athlete: ${profile?.name ?? "?"} (${profile?.sport ?? "?"}, age ${
    profile?.age ?? "?"
  })${profile?.team_name ? `, team "${profile.team_name}"` : ""}${
    profile?.weight_class ? `, weight class ${profile.weight_class}` : ""
  }${profile?.primary_position ? `, plays ${profile.primary_position}` : ""}
Total XP: ${profile?.xp ?? 0}

Last 30 days:
- Habits completed: ${habitsRes.count ?? 0}
- Practices logged: ${practicesRes.count ?? 0}
- Mental check-ins: ${checkinsRes.count ?? 0}
- Recovery logs: ${recoveryRes.count ?? 0}
- Matches: ${(matchesRes.data ?? []).length}${
    matchLines ? `\n${matchLines}` : ""
  }
  `.trim();
}

// ---------------------------------------------------------------------------
// Post-match reflection prompts generator
// contextKey = match id (UUID)
// ---------------------------------------------------------------------------

async function generateReflectionPrompts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string,
  matchId: string
): Promise<string | null> {
  // Fetch the match + athlete profile
  const [{ data: match }, { data: profile }] = await Promise.all([
    admin.from("matches").select("*").eq("id", matchId).maybeSingle(),
    admin
      .from("athletes")
      .select("name, sport, age")
      .eq("id", athleteId)
      .maybeSingle(),
  ]);

  if (!match || !profile) return null;

  // If there's a linked opponent, pull head-to-head history
  let history: Array<{ date: string; result: string | null }> = [];
  if (match.opponent_id) {
    const { data: hist } = await admin
      .from("matches")
      .select("date, result")
      .eq("athlete_id", athleteId)
      .eq("opponent_id", match.opponent_id)
      .neq("id", matchId)
      .order("date", { ascending: false })
      .limit(5);
    history = hist ?? [];
  }

  const scoreLine =
    match.wrestling?.myScore != null && match.wrestling?.theirScore != null
      ? `${match.wrestling.myScore}-${match.wrestling.theirScore}`
      : null;

  const historyLine =
    history.length > 0
      ? `Previous ${history.length} matches vs this opponent: ${history
          .map(
            (h: { date: string; result: string | null }) =>
              `${h.date}=${h.result ?? "n/a"}`
          )
          .join(", ")}`
      : "No prior matches against this opponent on record.";

  const dataBlock = `
Athlete: ${profile.name}, ${profile.sport}, age ${profile.age}

Match: ${match.date} vs ${match.opponent ?? "unknown"}${
    match.event ? ` (${match.event})` : ""
  }
Result: ${match.result ?? "not set"}${scoreLine ? ` · score ${scoreLine}` : ""}
Performance rating: ${
    match.performance_rating ? `${match.performance_rating}/5` : "not rated"
  }

Pre-match focus: ${match.focus_objective ?? "none"}
Pre-match technique: ${match.execute_this ?? "none"}
Mental state before (1-5): ${match.mental_state_before ?? "not rated"}

Post-match reflections they already wrote:
- Went well: ${match.went_well ?? "(empty)"}
- Could be better: ${match.could_be_better ?? "(empty)"}
- Next focus: ${match.next_focus ?? "(empty)"}
- Lesson learned: ${match.lesson_learned ?? "(empty)"}
- Gratitude: ${match.gratitude ?? "(empty)"}

${historyLine}
`.trim();

  const SYSTEM_PROMPT = `You generate 3-4 open-ended reflection questions for a youth athlete (ages 8-14) who just finished a match and filled out their post-match reflection. Your questions should help them go a little deeper without feeling like a test.

Rules:
- Output ONLY a numbered list of 3-4 questions. Nothing else — no intro, no outro, no preamble.
- Each question references a SPECIFIC detail they wrote or a specific fact from the match data.
- Don't repeat what they already said. Build on it.
- No yes/no questions. No leading questions.
- Age-appropriate language (simple, friendly).
- Avoid "how did it make you feel" — that's overused. Prefer "what", "which", "when", concrete things.
- Don't moralize. Don't fake empathy. Don't use emoji.
- If a field is empty, you can invite them gently — "One thing you left blank was X. What's one sentence you could add?"`;

  const USER_PROMPT = `Here's the match. Generate 3-4 reflection questions.\n\n${dataBlock}`;

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

// ---------------------------------------------------------------------------
// Weekly focus suggestions for coach / parent (F.4)
// ---------------------------------------------------------------------------

async function generateFocusSuggestions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  athleteId: string
): Promise<string | null> {
  const { data: profile } = await admin
    .from("athletes")
    .select("name, sport, age")
    .eq("id", athleteId)
    .maybeSingle();
  if (!profile) return null;

  const since = new Date();
  since.setDate(since.getDate() - 21);
  const sinceIso = since.toISOString().slice(0, 10);

  const [habitsRes, practicesRes, checkinsRes, matchesRes] =
    await Promise.all([
      admin
        .from("habit_completions")
        .select("habit_id, date")
        .eq("athlete_id", athleteId)
        .gte("date", sinceIso),
      admin
        .from("practices")
        .select("date, type, intensity")
        .eq("athlete_id", athleteId)
        .gte("date", sinceIso),
      admin
        .from("mental_checkins")
        .select("date, mood, goal, goal_met")
        .eq("athlete_id", athleteId)
        .gte("date", sinceIso),
      admin
        .from("matches")
        .select(
          "date, opponent, result, performance_rating, went_well, could_be_better, next_focus"
        )
        .eq("athlete_id", athleteId)
        .gte("date", sinceIso)
        .order("date", { ascending: false })
        .limit(8),
    ]);

  const habits = habitsRes.data ?? [];
  const practices = practicesRes.data ?? [];
  const checkins = checkinsRes.data ?? [];
  const matches = matchesRes.data ?? [];

  const habitCounts: Record<string, number> = {};
  for (const h of habits as Array<{ habit_id: string }>) {
    habitCounts[h.habit_id] = (habitCounts[h.habit_id] ?? 0) + 1;
  }
  const habitLines = Object.entries(habitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([h, c]) => `  - ${h}: ${c}x`)
    .join("\n");

  const matchLines = (
    matches as Array<{
      date: string;
      opponent: string | null;
      result: string | null;
      performance_rating: number | null;
      went_well: string | null;
      could_be_better: string | null;
      next_focus: string | null;
    }>
  )
    .map(
      (m) =>
        `  - ${m.date} vs ${m.opponent ?? "?"}: ${m.result ?? "n/a"}${
          m.performance_rating ? ` (${m.performance_rating}/5)` : ""
        }${m.went_well ? ` · well: "${m.went_well}"` : ""}${
          m.could_be_better ? ` · better: "${m.could_be_better}"` : ""
        }${m.next_focus ? ` · next: "${m.next_focus}"` : ""}`
    )
    .join("\n");

  const goalLines = (
    checkins as Array<{
      date: string;
      goal: string | null;
      goal_met: boolean | null;
    }>
  )
    .filter((c) => c.goal)
    .slice(0, 10)
    .map(
      (c) =>
        `  - ${c.date}: "${c.goal}"${
          c.goal_met === true ? " ✓" : c.goal_met === false ? " ✗" : ""
        }`
    )
    .join("\n");

  const dataBlock = `
Athlete: ${profile.name}, ${profile.sport}, age ${profile.age}

Last 3 weeks of activity:
- Habit completions: ${habits.length} total
- Practices logged: ${practices.length}
- Mental check-ins: ${checkins.length}
- Matches: ${matches.length}

${habitLines ? `Most-done habits:\n${habitLines}\n` : ""}${
    goalLines ? `Recent daily goals:\n${goalLines}\n` : ""
  }${matchLines ? `Recent matches:\n${matchLines}\n` : ""}
`.trim();

  const SYSTEM_PROMPT = `You generate 3 short weekly-focus suggestions for a youth athlete's coach or parent to choose from. Each suggestion is a concrete thing the athlete can work on for ONE week.

Rules:
- Output format: exactly 3 lines, each starting with "- " (hyphen + space). No numbering, no preamble, no commentary before or after.
- Each suggestion is 1 short sentence, max ~15 words.
- Each suggestion must be grounded in something specific from the data — name a habit they skip, a match theme, a goal pattern. Be concrete.
- Avoid vague platitudes ("focus on effort", "stay consistent").
- Avoid medical, diet, or weight-cut suggestions.
- Age-appropriate (8-14yo). Plain language. No emoji.
- The three suggestions must be distinct ideas.
- If the data is thin, suggest foundational habits plainly.`;

  const USER_PROMPT = `Generate 3 weekly-focus suggestions now.\n\n${dataBlock}`;

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
        max_tokens: 250,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: USER_PROMPT }],
      }),
    });
    if (!resp.ok) {
      console.error(
        "Anthropic API error",
        resp.status,
        await resp.text()
      );
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
