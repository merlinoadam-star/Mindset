import { supabase } from "./supabase";

/**
 * Parent Playbook — pulls just the recent slice of an athlete's data
 * needed to generate "today's actions" for a parent. Keeps the
 * dashboard snappy by fetching only the last 30 days (or less) of
 * each signal, not the full history.
 *
 * Pure-read, fire-and-forget safe. Callers get back a normalized
 * snapshot that the rules engine in `parentPlaybook.ts` can inspect
 * without hitting the network again.
 */

export interface PlaybookContext {
  athleteId: string;
  athleteName: string;
  firstName: string;
  /** YYYY-MM-DD of every habit completion in the last 30 days. */
  habitDates: string[];
  /** Most recent 5 matches. */
  matches: Array<{
    id: string;
    date: string;
    result: "win" | "loss" | "tie" | null;
    opponent: string | null;
    loss_recovery_completed_at: string | null;
    created_at: string;
  }>;
  /** Last 14 days of mental check-ins. */
  recentMoods: Array<{ date: string; mood: number | null }>;
  /** Personal records set in the last 7 days. */
  recentPRs: Array<{
    id: string;
    achieved_on: string;
    category_label: string;
    value: number;
    unit: string;
  }>;
  /** Badges unlocked in the last 14 days. */
  recentBadges: Array<{ id: string; unlocked_at: string }>;
}

const HABIT_WINDOW_DAYS = 30;
const MOOD_WINDOW_DAYS = 14;
const PR_WINDOW_DAYS = 7;
const BADGE_WINDOW_DAYS = 14;

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function firstNameFrom(displayName: string | null): string {
  if (!displayName) return "your athlete";
  return displayName.split(/\s+/)[0] || "your athlete";
}

export async function fetchPlaybookContext(
  athleteId: string
): Promise<PlaybookContext | null> {
  if (!supabase) return null;

  const sinceHabits = isoDaysAgo(HABIT_WINDOW_DAYS);
  const sinceMood = isoDaysAgo(MOOD_WINDOW_DAYS);
  const sincePR = isoDaysAgo(PR_WINDOW_DAYS);
  const sinceBadges = new Date();
  sinceBadges.setDate(sinceBadges.getDate() - BADGE_WINDOW_DAYS);
  const sinceBadgesIso = sinceBadges.toISOString();

  const [
    acctRes,
    athRes,
    habitsRes,
    matchesRes,
    moodsRes,
    prsRes,
    badgesRes,
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("display_name")
      .eq("id", athleteId)
      .maybeSingle(),
    supabase
      .from("athletes")
      .select("name")
      .eq("id", athleteId)
      .maybeSingle(),
    supabase
      .from("habit_completions")
      .select("date")
      .eq("athlete_id", athleteId)
      .gte("date", sinceHabits),
    supabase
      .from("matches")
      .select(
        "id, date, result, opponent, loss_recovery_completed_at, created_at"
      )
      .eq("athlete_id", athleteId)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("mental_checkins")
      .select("date, mood")
      .eq("athlete_id", athleteId)
      .gte("date", sinceMood)
      .order("date", { ascending: false }),
    supabase
      .from("personal_records")
      .select("id, achieved_on, category_label, value, unit")
      .eq("athlete_id", athleteId)
      .gte("achieved_on", sincePR)
      .order("achieved_on", { ascending: false }),
    supabase
      .from("unlocked_badges")
      .select("id, unlocked_at")
      .eq("athlete_id", athleteId)
      .gte("unlocked_at", sinceBadgesIso)
      .order("unlocked_at", { ascending: false }),
  ]);

  // Any query failing silently gives us an empty set — the rules
  // engine gracefully handles missing signals, so a partial context
  // is better than no context.
  if (athRes.error || !athRes.data) return null;

  const displayName =
    acctRes.data?.display_name ?? athRes.data?.name ?? null;
  return {
    athleteId,
    athleteName: displayName ?? "your athlete",
    firstName: firstNameFrom(displayName),
    habitDates: ((habitsRes.data ?? []) as Array<{ date: string }>).map(
      (h) => h.date
    ),
    matches: (matchesRes.data ?? []) as PlaybookContext["matches"],
    recentMoods: (moodsRes.data ?? []) as PlaybookContext["recentMoods"],
    recentPRs: (prsRes.data ?? []) as PlaybookContext["recentPRs"],
    recentBadges: (badgesRes.data ?? []) as PlaybookContext["recentBadges"],
  };
}
