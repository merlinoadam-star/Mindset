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

export function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
