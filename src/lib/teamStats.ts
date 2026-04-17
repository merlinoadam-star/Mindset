import { supabase } from "./supabase";

/**
 * Phase G — team-level stats for the coach/parent dashboard.
 *
 * Fetches lightweight activity info for a batch of athletes in one round
 * trip. Used to show streak + last-active + level on each roster card
 * and compute team aggregates (total active today, avg streak, etc.).
 */

export interface AthleteStat {
  athleteId: string;
  xp: number;
  level: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  currentStreak: number;
  activeToday: boolean;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function levelFromXp(xp: number): number {
  // Mirror of computeLevel's math — kept here so we don't have to pass the
  // Sport enum around. Level N requires sum(75 + (i-1)*25) for i=2..N.
  let level = 1;
  let total = 0;
  while (total + (75 + level * 25) <= xp) {
    total += 75 + level * 25;
    level++;
  }
  return level;
}

function streakFromDates(activeDates: Set<string>): number {
  if (activeDates.size === 0) return 0;
  const today = isoDate(new Date());
  const yesterday = isoDate(addDays(new Date(), -1));
  // If today isn't logged, start from yesterday so streak doesn't reset
  // until the full day passes.
  let cursor = activeDates.has(today)
    ? new Date()
    : activeDates.has(yesterday)
    ? addDays(new Date(), -1)
    : null;
  if (!cursor) return 0;
  let streak = 0;
  while (activeDates.has(isoDate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export async function fetchTeamStats(
  athleteIds: string[]
): Promise<Map<string, AthleteStat>> {
  const out = new Map<string, AthleteStat>();
  if (!supabase || athleteIds.length === 0) return out;

  // Pull recent activity — last 60 days is enough for streak math.
  const since = isoDate(addDays(new Date(), -60));

  const [xpRes, habitsRes, practicesRes, checkinsRes, matchesRes] =
    await Promise.all([
      supabase.from("athletes").select("id, xp").in("id", athleteIds),
      supabase
        .from("habit_completions")
        .select("athlete_id, date")
        .in("athlete_id", athleteIds)
        .gte("date", since),
      supabase
        .from("practices")
        .select("athlete_id, date")
        .in("athlete_id", athleteIds)
        .gte("date", since),
      supabase
        .from("mental_checkins")
        .select("athlete_id, date")
        .in("athlete_id", athleteIds)
        .gte("date", since),
      supabase
        .from("matches")
        .select("athlete_id, date")
        .in("athlete_id", athleteIds)
        .gte("date", since),
    ]);

  const today = isoDate(new Date());

  // Bucket dates per athlete
  const dates = new Map<string, Set<string>>();
  const bump = (rows: Array<{ athlete_id: string; date: string | null }> | null | undefined) => {
    (rows ?? []).forEach((r) => {
      if (!r.date) return;
      if (!dates.has(r.athlete_id)) dates.set(r.athlete_id, new Set());
      dates.get(r.athlete_id)!.add(r.date);
    });
  };
  bump(habitsRes.data);
  bump(practicesRes.data);
  bump(checkinsRes.data);
  bump(matchesRes.data);

  for (const id of athleteIds) {
    const activeSet = dates.get(id) ?? new Set<string>();
    const sorted = [...activeSet].sort();
    const xp = (xpRes.data ?? []).find((a) => a.id === id)?.xp ?? 0;
    out.set(id, {
      athleteId: id,
      xp,
      level: levelFromXp(xp),
      lastActiveDate: sorted.length > 0 ? sorted[sorted.length - 1] : null,
      currentStreak: streakFromDates(activeSet),
      activeToday: activeSet.has(today),
    });
  }

  return out;
}

/** Format a YYYY-MM-DD as "today" / "yesterday" / "3d ago" / "Apr 14". */
export function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const today = isoDate(new Date());
  if (iso === today) return "Today";
  const yesterday = isoDate(addDays(new Date(), -1));
  if (iso === yesterday) return "Yesterday";
  const then = new Date(iso + "T12:00:00");
  const diffDays = Math.round(
    (new Date(today + "T12:00:00").getTime() - then.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
