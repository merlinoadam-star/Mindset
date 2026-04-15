import { supabase } from "./supabase";

/**
 * Phase 4F — AI Coach client wrapper.
 *
 * The edge function does all the heavy lifting (data fetch, prompt
 * assembly, Claude call, cache). This wrapper just invokes it and
 * unwraps the response.
 */

export interface AiInsight {
  content: string;
  generatedAt: string;
  model?: string;
  cached?: boolean;
}

export async function fetchWeeklyWrapUp(params: {
  athleteId: string;
  weekStart?: string;
  refresh?: boolean;
}): Promise<{ insight?: AiInsight; error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: {
      kind: "weekly-wrap-up",
      athleteId: params.athleteId,
      contextKey: params.weekStart,
      refresh: params.refresh ?? false,
    },
  });

  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? "Failed to generate summary." };

  return {
    insight: {
      content: data.content,
      generatedAt: data.generatedAt,
      model: data.model,
      cached: data.cached,
    },
  };
}

/** Read any cached insight directly (no API call). */
export async function readCachedInsight(
  athleteId: string,
  kind: string,
  contextKey: string
): Promise<AiInsight | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ai_insights")
    .select("content, generated_at, model")
    .eq("athlete_id", athleteId)
    .eq("kind", kind)
    .eq("context_key", contextKey)
    .maybeSingle();
  if (error || !data) return null;
  return {
    content: data.content,
    generatedAt: data.generated_at,
    model: data.model ?? undefined,
    cached: true,
  };
}

/** Back-compat: the original weekly-wrap-up cache read. */
export function readCachedWeeklyWrapUp(
  athleteId: string,
  weekStart: string
): Promise<AiInsight | null> {
  return readCachedInsight(athleteId, "weekly-wrap-up", weekStart);
}

export async function fetchReflectionPrompts(params: {
  athleteId: string;
  matchId: string;
  refresh?: boolean;
}): Promise<{ insight?: AiInsight; error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: {
      kind: "reflection-prompts",
      athleteId: params.athleteId,
      contextKey: params.matchId,
      refresh: params.refresh ?? false,
    },
  });

  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? "Couldn't generate prompts." };

  return {
    insight: {
      content: data.content,
      generatedAt: data.generatedAt,
      model: data.model,
      cached: data.cached,
    },
  };
}

// ---------------------------------------------------------------------------
// Focus suggestions (F.4)
// ---------------------------------------------------------------------------

/** Parse the model's "- line\n- line\n- line" output into an array. */
export function parseFocusSuggestions(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- ") || line.startsWith("•") || /^\d+[.)]/.test(line))
    .map((line) => line.replace(/^[-•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function fetchFocusSuggestions(params: {
  athleteId: string;
  refresh?: boolean;
}): Promise<{ suggestions?: string[]; error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: {
      kind: "focus-suggestions",
      athleteId: params.athleteId,
      // No weekly caching — always generate fresh so coach sees current data.
      // Cache key is "latest" so repeated clicks within the cache window
      // reuse. Set refresh=true to force a new one.
      contextKey: "latest",
      refresh: params.refresh ?? false,
    },
  });

  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? "Couldn't generate suggestions." };

  return { suggestions: parseFocusSuggestions(data.content ?? "") };
}

// ---------------------------------------------------------------------------
// Q&A (F.3)
// ---------------------------------------------------------------------------

export interface Conversation {
  id: string;
  athlete_id: string;
  asker_id: string;
  asker_role: "athlete" | "coach" | "parent";
  question: string;
  answer: string | null;
  model: string | null;
  asked_at: string;
  answered_at: string | null;
  error: string | null;
  // Enriched client-side
  asker_name?: string;
}

export async function askAiCoach(params: {
  athleteId: string;
  question: string;
}): Promise<{ conversation?: Conversation; error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };
  const { data, error } = await supabase.functions.invoke("ai-coach", {
    body: {
      kind: "ask",
      athleteId: params.athleteId,
      question: params.question,
    },
  });
  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? "Couldn't generate answer." };
  return {
    conversation: {
      id: data.id,
      athlete_id: params.athleteId,
      asker_id: "", // server knows; not needed client-side after insert
      asker_role: "athlete",
      question: data.question,
      answer: data.answer,
      model: data.model,
      asked_at: data.asked_at,
      answered_at: new Date().toISOString(),
      error: null,
    },
  };
}

export async function fetchConversations(
  athleteId: string,
  limit = 50
): Promise<Conversation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("asked_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  // Enrich with asker names in one query
  const askerIds = [...new Set((data as Conversation[]).map((c) => c.asker_id))];
  if (askerIds.length > 0) {
    const { data: accts } = await supabase
      .from("accounts")
      .select("id, display_name")
      .in("id", askerIds);
    const map = new Map<string, string>(
      (accts ?? []).map((a) => [a.id, a.display_name])
    );
    return (data as Conversation[]).map((c) => ({
      ...c,
      asker_name: map.get(c.asker_id) ?? "",
    }));
  }
  return data as Conversation[];
}

export async function deleteConversation(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("ai_conversations").delete().eq("id", id);
}

export function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
