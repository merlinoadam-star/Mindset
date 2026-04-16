import { supabase } from "./supabase";
import { readCachedInsight } from "./aiCoach";

/**
 * AI Video Review — sends extracted frames to the edge function,
 * gets technique analysis back.
 */

export async function requestVideoReview(params: {
  athleteId: string;
  videoId: string;
  frames: string[];
  sport: "wrestling" | "volleyball";
  context?: string;
}): Promise<{ analysis?: string; error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const { data, error } = await supabase.functions.invoke(
    "ai-video-review",
    {
      body: {
        athleteId: params.athleteId,
        videoId: params.videoId,
        frames: params.frames,
        sport: params.sport,
        context: params.context,
      },
    }
  );

  if (error) return { error: error.message };
  if (!data?.ok) return { error: data?.error ?? "Review failed." };
  return { analysis: data.analysis };
}

export async function getCachedVideoReview(
  athleteId: string,
  videoId: string
): Promise<string | null> {
  const cached = await readCachedInsight(athleteId, "video-review", videoId);
  return cached?.content ?? null;
}
