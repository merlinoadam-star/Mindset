import { supabase } from "./supabase";
import type { AccountRole } from "../types";

/**
 * Phase 3A.1 — weekly focus set by the coach / parent.
 *
 * One row per (athlete, week). Coaches and parents set a short theme
 * ("work on top position this week"); the athlete sees it pinned at the
 * top of their dashboard. Unique constraint on (athlete_id,
 * week_start_date) means upserting replaces the current week's focus.
 */

export interface WeeklyFocusRow {
  id: string;
  athlete_id: string;
  author_id: string;
  author_role: AccountRole;
  week_start_date: string; // YYYY-MM-DD (Monday)
  text: string;
  created_at: string;
  updated_at: string | null;
  // Enriched client-side
  author_name?: string;
}

async function enrichWithAuthorName(
  row: WeeklyFocusRow | null
): Promise<WeeklyFocusRow | null> {
  if (!supabase || !row) return row;
  const { data } = await supabase
    .from("accounts")
    .select("display_name")
    .eq("id", row.author_id)
    .maybeSingle();
  return { ...row, author_name: data?.display_name ?? "" };
}

/** The Monday-anchored week string for a given date (defaults to today). */
export function mondayOf(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Fetch the focus for a specific week (or this week by default). */
export async function fetchWeeklyFocus(
  athleteId: string,
  weekStartDate: string = mondayOf()
): Promise<WeeklyFocusRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("weekly_focus")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  if (error) {
    console.error("fetchWeeklyFocus error", error);
    return null;
  }
  return enrichWithAuthorName(data as WeeklyFocusRow | null);
}

/** Fetch the most recent focus (any week), for athletes who want to see
 * the last thing their coach said even if a new focus hasn't been set. */
export async function fetchLatestWeeklyFocus(
  athleteId: string
): Promise<WeeklyFocusRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("weekly_focus")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("week_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("fetchLatestWeeklyFocus error", error);
    return null;
  }
  return enrichWithAuthorName(data as WeeklyFocusRow | null);
}

export async function setWeeklyFocus(params: {
  athleteId: string;
  authorId: string;
  authorRole: AccountRole;
  text: string;
  weekStartDate?: string; // defaults to this Monday
}): Promise<{ row?: WeeklyFocusRow; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const text = params.text.trim();
  if (!text) return { error: "Focus can't be empty." };

  const week = params.weekStartDate ?? mondayOf();

  const { data, error } = await supabase
    .from("weekly_focus")
    .upsert(
      {
        athlete_id: params.athleteId,
        author_id: params.authorId,
        author_role: params.authorRole,
        week_start_date: week,
        text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "athlete_id,week_start_date" }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  // Fire a push so the athlete hears about the new focus. Fire-and-forget —
  // the save already succeeded.
  if (params.authorId !== params.athleteId) {
    const preview = text.length > 80 ? text.slice(0, 77) + "..." : text;
    const title =
      params.authorRole === "coach"
        ? "New focus from your coach"
        : "New focus from your parent";
    try {
      supabase.functions
        .invoke("send-push", {
          body: {
            toAccountId: params.athleteId,
            title,
            body: preview,
            url: "/",
            tag: `weekly-focus-${week}`,
            prefKey: "weeklyFocus",
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

  return { row: data as WeeklyFocusRow };
}

export async function deleteWeeklyFocus(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("weekly_focus").delete().eq("id", id);
}
