// Supabase Edge Function: ai-video-review
// Deploy via Dashboard → Edge Functions → New function.
// Uses ANTHROPIC_API_KEY (already set from ai-coach).
//
// Accepts POST { athleteId, videoId, frames: string[], sport, context? }
//   frames — array of JPEG data URLs (extracted client-side)
//   sport  — "wrestling" or "volleyball"
//   context — optional free-text context ("this is a double leg takedown drill")
//
// Returns { ok, analysis } where analysis is plain text.

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

interface Payload {
  athleteId: string;
  videoId: string;
  frames: string[]; // data:image/jpeg;base64,... URLs
  sport: "wrestling" | "volleyball";
  context?: string;
}

// @ts-expect-error
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

  // Verify caller
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Missing authorization", {
      status: 401,
      headers: corsHeaders,
    });
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response("Invalid session", {
      status: 401,
      headers: corsHeaders,
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const { athleteId, videoId, frames, sport, context } = payload;
  if (!athleteId || !videoId || !frames?.length || !sport) {
    return new Response("Missing required fields", {
      status: 400,
      headers: corsHeaders,
    });
  }
  if (frames.length > 10) {
    return new Response("Too many frames (max 10)", {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Auth check: must be athlete or connected
  const callerId = userData.user.id;
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

  // Fetch athlete profile for context
  const { data: profile } = await admin
    .from("athletes")
    .select("name, sport, age, weight_class, primary_position")
    .eq("id", athleteId)
    .maybeSingle();

  const sportContext =
    sport === "wrestling"
      ? `Sport: wrestling${
          profile?.weight_class ? `, weight class ${profile.weight_class}` : ""
        }`
      : `Sport: volleyball${
          profile?.primary_position
            ? `, position: ${profile.primary_position}`
            : ""
        }`;

  const SYSTEM_PROMPT = `You are a youth sports technique analyst for ${sport}. You're reviewing ${frames.length} frames extracted from a training video of a young athlete (ages 8-14).

Your job: look at the frames and provide helpful, specific technique feedback.

Rules:
- Structure your response as:
  WHAT I SEE: (1-2 sentences describing what the athlete is doing)
  DOING WELL: (1-2 specific positives you can see in the frames)
  TO WORK ON: (1-2 specific, actionable improvements)
  DRILL IDEA: (1 concrete drill or exercise to address the improvement area)
- Be SPECIFIC to what you see in the images. Reference body position, stance, hand placement, etc.
- Age-appropriate language. Encouraging tone — you're helping them improve, not criticizing.
- If the frames are too blurry or unclear to analyze, say so honestly and suggest recording tips.
- Don't invent things you can't see. If only a few frames are useful, work with those.
- No medical advice. If you see something that looks like it could cause injury, say "check with your coach about X" rather than diagnosing.
- No emoji.
- Keep total response under 200 words.`;

  const userContent: Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> = [];

  // Add each frame as an image
  for (const frame of frames) {
    const base64 = frame.replace(/^data:image\/\w+;base64,/, "");
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64,
      },
    });
  }

  // Add text context
  userContent.push({
    type: "text",
    text: `${sportContext}\nAthlete: ${profile?.name ?? "Unknown"}, age ${
      profile?.age ?? "unknown"
    }${context ? `\nContext from uploader: "${context}"` : ""}\n\nAnalyze these ${frames.length} frames and provide technique feedback.`,
  });

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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Anthropic API error", resp.status, errText);
      return new Response(
        JSON.stringify({ ok: false, error: `API error: ${resp.status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    const result = await resp.json();
    const analysis = result?.content?.[0]?.text;
    if (typeof analysis !== "string") {
      return new Response(
        JSON.stringify({ ok: false, error: "Empty response from model" }),
        {
          status: 500,
          headers: { ...corsHeaders, "content-type": "application/json" },
        }
      );
    }

    // Cache in ai_insights table
    await admin
      .from("ai_insights")
      .upsert(
        {
          athlete_id: athleteId,
          kind: "video-review",
          context_key: videoId,
          content: analysis.trim(),
          model: MODEL,
        },
        { onConflict: "athlete_id,kind,context_key" }
      )
      .then(() => {}, () => {});

    return new Response(
      JSON.stringify({ ok: true, analysis: analysis.trim(), model: MODEL }),
      {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  } catch (e) {
    console.error("AI video review failed", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
      }
    );
  }
});
