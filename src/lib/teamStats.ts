import { supabase } from "./supabase";
import { ACTIVITY_SOURCES } from "./activitySources";

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
  activeDays7: number;
  habitsDone7: number;
  avgMood7: number | null;
  moodTrend: "up" | "down" | "flat" | null;
  daysSinceActive: number;
  flags: AthleteFlag[];
}

export type AthleteFlag =
  | "inactive"    // 3+ days no activity
  | "mood-down"   // mood trending down week-over-week
  | "streak-broke" // had a streak ≥3 but now at 0
  | "low-activity" // ≤1 active day this week
  | "on-fire";     // 6+ active days AND streak ≥5

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

/** Mirrors gamification.ts:computeStreak. A day counts if the athlete
 *  has any activity OR spent a streak-freeze on it. Kept in sync with
 *  the athlete-side math so the two views agree. */
function streakFromDates(
  activeDates: Set<string>,
  frozenDates: Set<string>
): number {
  if (activeDates.size === 0 && frozenDates.size === 0) return 0;
  const counts = (d: string) => activeDates.has(d) || frozenDates.has(d);
  const today = isoDate(new Date());
  const yesterday = isoDate(addDays(new Date(), -1));
  // If today isn't logged, start from yesterday so streak doesn't reset
  // until the full day passes.
  let cursor = counts(today)
    ? new Date()
    : counts(yesterday)
    ? addDays(new Date(), -1)
    : null;
  if (!cursor) return 0;
  let streak = 0;
  while (counts(isoDate(cursor))) {
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

  const since = isoDate(addDays(new Date(), -60));
  const sevenAgo = isoDate(addDays(new Date(), -6));
  const fourteenAgo = isoDate(addDays(new Date(), -13));

  // Pull activity dates from every registered source in lockstep with
  // the athlete side — see src/lib/activitySources.ts. Adding a new
  // source there automatically wires it into the roster.
  const activityQueries = ACTIVITY_SOURCES.map(({ table }) =>
    supabase
      .from(table)
      .select("athlete_id, date")
      .in("athlete_id", athleteIds)
      .gte("date", since)
  );

  const [xpRes, moodRes, ...activityResults] = await Promise.all([
    supabase
      .from("athletes")
      .select("id, xp, used_freeze_dates")
      .in("id", athleteIds),
    supabase
      .from("mental_checkins")
      .select("athlete_id, date, mood")
      .in("athlete_id", athleteIds)
      .gte("date", fourteenAgo),
    ...activityQueries,
  ]);

  // `habit_completions` is the first source in ACTIVITY_SOURCES — pull
  // it out by index for the 7-day habits bucket below. Dedicated index
  // so a future reorder of the list doesn't silently break that count.
  const habitsIdx = ACTIVITY_SOURCES.findIndex(
    (s) => s.table === "habit_completions"
  );
  const habitsRes = activityResults[habitsIdx];

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
  for (const res of activityResults) bump(res.data);

  // Per-athlete set of streak-freeze dates. A kid who spent a freeze
  // yesterday has their streak saved on the athlete app; the coach
  // view has to honor that too or the streak will look broken.
  const frozenByAthlete = new Map<string, Set<string>>();
  for (const a of xpRes.data ?? []) {
    const freezes = (a as { used_freeze_dates?: string[] | null })
      .used_freeze_dates;
    if (freezes && freezes.length > 0) {
      frozenByAthlete.set(a.id, new Set(freezes));
    }
  }

  // Bucket habits in last 7 days per athlete
  const habits7 = new Map<string, number>();
  for (const r of habitsRes.data ?? []) {
    if (r.date && r.date >= sevenAgo) {
      habits7.set(r.athlete_id, (habits7.get(r.athlete_id) ?? 0) + 1);
    }
  }

  // Bucket moods per athlete for last 7 / previous 7
  const moods7 = new Map<string, number[]>();
  const moodsPrev7 = new Map<string, number[]>();
  for (const r of moodRes.data ?? []) {
    if (!r.mood || !r.date) continue;
    if (r.date >= sevenAgo) {
      if (!moods7.has(r.athlete_id)) moods7.set(r.athlete_id, []);
      moods7.get(r.athlete_id)!.push(r.mood);
    } else if (r.date >= fourteenAgo) {
      if (!moodsPrev7.has(r.athlete_id)) moodsPrev7.set(r.athlete_id, []);
      moodsPrev7.get(r.athlete_id)!.push(r.mood);
    }
  }

  for (const id of athleteIds) {
    const activeSet = dates.get(id) ?? new Set<string>();
    const frozenSet = frozenByAthlete.get(id) ?? new Set<string>();
    const sorted = [...activeSet].sort();
    const xp = (xpRes.data ?? []).find((a) => a.id === id)?.xp ?? 0;
    const streak = streakFromDates(activeSet, frozenSet);
    const lastActive = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const isActiveToday = activeSet.has(today);

    // Active days in last 7
    let activeDays7 = 0;
    for (let i = 0; i < 7; i++) {
      if (activeSet.has(isoDate(addDays(new Date(), -i)))) activeDays7++;
    }

    // Days since last activity
    let daysSinceActive = 999;
    if (lastActive) {
      const lastD = new Date(lastActive + "T12:00:00");
      const todayD = new Date(today + "T12:00:00");
      daysSinceActive = Math.round(
        (todayD.getTime() - lastD.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Mood average + trend
    const m7 = moods7.get(id) ?? [];
    const mp7 = moodsPrev7.get(id) ?? [];
    const avgMood7 =
      m7.length > 0 ? m7.reduce((a, b) => a + b, 0) / m7.length : null;
    const prevAvg =
      mp7.length > 0 ? mp7.reduce((a, b) => a + b, 0) / mp7.length : null;
    let moodTrend: "up" | "down" | "flat" | null = null;
    if (avgMood7 !== null && prevAvg !== null) {
      const diff = avgMood7 - prevAvg;
      if (diff > 0.3) moodTrend = "up";
      else if (diff < -0.3) moodTrend = "down";
      else moodTrend = "flat";
    }

    // Had a streak last week that's now gone? Freezes count as saved
    // days here too, matching the athlete's definition of streak.
    let hadPriorStreak = false;
    if (streak === 0) {
      const weekAgoSet = new Set<string>();
      for (let i = 3; i < 14; i++) {
        const d = isoDate(addDays(new Date(), -i));
        if (activeSet.has(d) || frozenSet.has(d)) weekAgoSet.add(d);
      }
      if (streakFromDatesRaw(weekAgoSet) >= 3) hadPriorStreak = true;
    }

    // Compute flags
    const flags: AthleteFlag[] = [];
    if (daysSinceActive >= 3) flags.push("inactive");
    if (moodTrend === "down") flags.push("mood-down");
    if (hadPriorStreak && streak === 0) flags.push("streak-broke");
    if (activeDays7 <= 1 && daysSinceActive < 3) flags.push("low-activity");
    if (activeDays7 >= 6 && streak >= 5) flags.push("on-fire");

    out.set(id, {
      athleteId: id,
      xp,
      level: levelFromXp(xp),
      lastActiveDate: lastActive,
      currentStreak: streak,
      activeToday: isActiveToday,
      activeDays7,
      habitsDone7: habits7.get(id) ?? 0,
      avgMood7,
      moodTrend,
      daysSinceActive,
      flags,
    });
  }

  return out;
}

function streakFromDatesRaw(dates: Set<string>): number {
  const sorted = [...dates].sort().reverse();
  if (sorted.length === 0) return 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diff = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
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
