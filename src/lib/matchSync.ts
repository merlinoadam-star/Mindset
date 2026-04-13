import { supabase } from "./supabase";
import { isUuid } from "./store";
import type { MatchEntry } from "../types";

/**
 * Phase 2B.4 — match log sync.
 *
 * Every time the athlete's match list changes, we upsert the full set
 * to Supabase and delete any cloud rows that no longer exist locally.
 * This is idempotent (by id) so debouncing + retries are safe.
 *
 * Records created before we switched to UUIDs are skipped (non-UUID ids
 * can't be inserted into the uuid column). They stay local-only.
 */

function matchToRow(athleteId: string, m: MatchEntry) {
  return {
    id: m.id,
    athlete_id: athleteId,
    date: m.date,
    opponent: m.opponent ?? null,
    opponent_id: m.opponentId && isUuid(m.opponentId) ? m.opponentId : null,
    event: m.event ?? null,
    location: m.location ?? null,
    focus_objective: m.focusObjective ?? null,
    execute_this: m.executeThis ?? null,
    mental_state_before: m.mentalStateBefore ?? null,
    visualization_note: m.visualizationNote ?? null,
    pre_match_completed_at: m.preMatchCompletedAt ?? null,
    result: m.result ?? null,
    wrestling: m.wrestling ?? null,
    volleyball: m.volleyball ?? null,
    performance_rating: m.performanceRating ?? null,
    went_well: m.wentWell ?? null,
    could_be_better: m.couldBeBetter ?? null,
    next_focus: m.nextFocus ?? null,
    gratitude: m.gratitude ?? null,
    lesson_learned: m.lessonLearned ?? null,
    post_match_completed_at: m.postMatchCompletedAt ?? null,
    xp_earned: m.xpEarned,
    created_at: m.createdAt,
  };
}

/** Sync the athlete's local match list to Supabase. Fire-and-forget. */
export async function syncAllMatches(
  athleteId: string,
  localMatches: MatchEntry[]
): Promise<void> {
  if (!supabase) return;
  try {
    // Only UUID-keyed records can be synced
    const syncable = localMatches.filter((m) => isUuid(m.id));

    // 1. Upsert all syncable local matches
    if (syncable.length > 0) {
      const rows = syncable.map((m) => matchToRow(athleteId, m));
      const { error: upErr } = await supabase
        .from("matches")
        .upsert(rows, { onConflict: "id" });
      if (upErr) {
        console.error("Match upsert failed", upErr);
        return;
      }
    }

    // 2. Query cloud for match ids belonging to this athlete
    const { data: cloudIds, error: qErr } = await supabase
      .from("matches")
      .select("id")
      .eq("athlete_id", athleteId);
    if (qErr) {
      console.error("Match cloud-id fetch failed", qErr);
      return;
    }

    const localIdSet = new Set(syncable.map((m) => m.id));
    const toDelete = (cloudIds ?? [])
      .map((r) => r.id as string)
      .filter((id) => !localIdSet.has(id));

    if (toDelete.length > 0) {
      const { error: dErr } = await supabase
        .from("matches")
        .delete()
        .in("id", toDelete);
      if (dErr) console.error("Match cloud delete failed", dErr);
    }
  } catch (e) {
    console.error("syncAllMatches error", e);
  }
}

// -----------------------------------------------------------------------------
// Reads for the coach / parent side
// -----------------------------------------------------------------------------

export interface DbMatchRow {
  id: string;
  athlete_id: string;
  date: string;
  opponent: string | null;
  opponent_id: string | null;
  event: string | null;
  location: string | null;
  focus_objective: string | null;
  execute_this: string | null;
  mental_state_before: number | null;
  visualization_note: string | null;
  pre_match_completed_at: string | null;
  result: "win" | "loss" | "tie" | null;
  wrestling: Record<string, unknown> | null;
  volleyball: Record<string, unknown> | null;
  performance_rating: number | null;
  went_well: string | null;
  could_be_better: string | null;
  next_focus: string | null;
  gratitude: string | null;
  lesson_learned: string | null;
  post_match_completed_at: string | null;
  xp_earned: number;
  created_at: string;
}

export async function fetchMatchesForAthlete(
  athleteId: string
): Promise<DbMatchRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("date", { ascending: false });
  if (error) {
    console.error("fetchMatchesForAthlete error", error);
    return [];
  }
  return (data ?? []) as DbMatchRow[];
}

/** Convert a database row into the client-side MatchEntry shape. */
export function rowToMatch(row: DbMatchRow): MatchEntry {
  return {
    id: row.id,
    date: row.date,
    opponent: row.opponent ?? undefined,
    opponentId: row.opponent_id ?? undefined,
    event: row.event ?? undefined,
    location: row.location ?? undefined,
    focusObjective: row.focus_objective ?? undefined,
    executeThis: row.execute_this ?? undefined,
    mentalStateBefore: (row.mental_state_before ??
      undefined) as MatchEntry["mentalStateBefore"],
    visualizationNote: row.visualization_note ?? undefined,
    preMatchCompletedAt: row.pre_match_completed_at ?? undefined,
    result: (row.result ?? undefined) as MatchEntry["result"],
    wrestling: (row.wrestling ?? undefined) as MatchEntry["wrestling"],
    volleyball: (row.volleyball ?? undefined) as MatchEntry["volleyball"],
    performanceRating: (row.performance_rating ??
      undefined) as MatchEntry["performanceRating"],
    wentWell: row.went_well ?? undefined,
    couldBeBetter: row.could_be_better ?? undefined,
    nextFocus: row.next_focus ?? undefined,
    gratitude: row.gratitude ?? undefined,
    lessonLearned: row.lesson_learned ?? undefined,
    postMatchCompletedAt: row.post_match_completed_at ?? undefined,
    xpEarned: row.xp_earned,
    createdAt: row.created_at,
  };
}
