import { supabase } from "./supabase";
import type { AccountRole } from "../types";

/**
 * Phase 2C — coach / parent feedback on matches, videos, etc.
 *
 * One generic `feedback` table keyed by (target_type, target_id). When
 * the athlete first views a feedback item, we stamp read_at so authors
 * can see whether it was seen.
 */

export type FeedbackTargetType = "match" | "video" | "practice" | "cheer";

export interface FeedbackRow {
  id: string;
  athlete_id: string;
  author_id: string;
  author_role: AccountRole;
  target_type: FeedbackTargetType;
  target_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Enriched in the client
  author_name?: string;
}

async function enrichWithAuthorNames(
  rows: FeedbackRow[]
): Promise<FeedbackRow[]> {
  if (!supabase || rows.length === 0) return rows;
  const ids = [...new Set(rows.map((r) => r.author_id))];
  const { data: accts } = await supabase
    .from("accounts")
    .select("id, display_name")
    .in("id", ids);
  const map = new Map<string, string>(
    (accts ?? []).map((a) => [a.id, a.display_name])
  );
  return rows.map((r) => ({ ...r, author_name: map.get(r.author_id) ?? "" }));
}

export async function postFeedback(params: {
  athleteId: string;
  authorId: string;
  authorRole: AccountRole;
  targetType: FeedbackTargetType;
  targetId: string;
  text: string;
}): Promise<{ row?: FeedbackRow; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const text = params.text.trim();
  if (!text) return { error: "Note is empty." };

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      athlete_id: params.athleteId,
      author_id: params.authorId,
      author_role: params.authorRole,
      target_type: params.targetType,
      target_id: params.targetId,
      text,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Fire a push notification to the athlete (fire-and-forget — the
  // feedback was saved whether or not the push goes through). The
  // edge function must be deployed; if it isn't, the call fails
  // silently.
  if (params.authorId !== params.athleteId) {
    const preview =
      text.length > 80 ? text.slice(0, 77) + "..." : text;
    const isCheer = params.targetType === "cheer";
    const roleLabel = params.authorRole === "coach" ? "coach" : "parent";
    const title = isCheer
      ? `Cheer from your ${roleLabel}!`
      : `New note from your ${roleLabel}`;
    try {
      supabase.functions
        .invoke("send-push", {
          body: {
            toAccountId: params.athleteId,
            title,
            body: preview,
            url: "/feedback",
            tag: `feedback-${params.targetType}-${params.targetId}`,
            prefKey: isCheer ? "cheers" : "notes",
          },
        })
        .then(
          () => {},
          () => {}
        );
    } catch {
      /* push is best-effort */
    }
  }

  return { row: data as FeedbackRow };
}

export async function fetchFeedbackForTarget(
  athleteId: string,
  targetType: FeedbackTargetType,
  targetId: string
): Promise<FeedbackRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchFeedbackForTarget error", error);
    return [];
  }
  return enrichWithAuthorNames((data ?? []) as FeedbackRow[]);
}

export async function fetchAllFeedbackForAthlete(
  athleteId: string
): Promise<FeedbackRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchAllFeedbackForAthlete error", error);
    return [];
  }
  return enrichWithAuthorNames((data ?? []) as FeedbackRow[]);
}

export async function fetchUnreadCount(athleteId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("athlete_id", athleteId)
    .is("read_at", null)
    .neq("author_id", athleteId); // don't count your own notes
  if (error) return 0;
  return count ?? 0;
}

export async function markFeedbackRead(
  ids: string[]
): Promise<void> {
  if (!supabase || ids.length === 0) return;
  await supabase
    .from("feedback")
    .update({ read_at: new Date().toISOString() })
    .in("id", ids)
    .is("read_at", null);
}

export async function deleteFeedback(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("feedback").delete().eq("id", id);
}
