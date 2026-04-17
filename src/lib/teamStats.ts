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

  const since = isoDate(addDays(new Date(), -60));
  const sevenAgo = isoDate(addDays(new Date(), -6));
  const fourteenAgo = isoDate(addDays(new Date(), -13));

  const [xpRes, habitsRes, practicesRes, checkinsRes, matchesRes, moodRes] =
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
      supabase
        .from("mental_checkins")
        .select("athlete_id, date, mood")
        .in("athlete_id", athleteIds)
        .gte("date", fourteenAgo),
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
    const sorted = [...activeSet].sort();
    const xp = (xpRes.data ?? []).find((a) => a.id === id)?.xp ?? 0;
    const streak = streakFromDates(activeSet);
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

    // Had a streak last week that's now gone?
    let hadPriorStreak = false;
    if (streak === 0) {
      const weekAgoSet = new Set<string>();
      for (let i = 3; i < 14; i++) {
        if (activeSet.has(isoDate(addDays(new Date(), -i))))
          weekAgoSet.add(isoDate(addDays(new Date(), -i)));
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
