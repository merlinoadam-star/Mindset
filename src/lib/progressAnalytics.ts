import type {
  AppState,
  HabitCompletion,
  MatchEntry,
  MentalCheckin,
  MentalSession,
  NutritionLog,
  PracticeEntry,
  RecoveryCheckin,
} from "../types";

/**
 * Phase 4D — data-crunching helpers for the Progress page. Pure
 * functions over AppState; UI components stay thin.
 *
 * Everything is computed client-side from local state (which is itself
 * hydrated from Supabase on sign-in). No network calls.
 */

/** YYYY-MM-DD in local timezone. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Every YYYY-MM-DD string from `start` to `end`, inclusive. */
export function eachDay(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    out.push(isoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Activity intensity per day
// ---------------------------------------------------------------------------

export interface DayActivity {
  date: string;
  habits: number;
  practices: number;
  checkins: number;
  matches: number;
  recovery: number;
  nutrition: number;
  mentalSessions: number;
  /** Convenience sum — weighted count of "things done today". */
  total: number;
}

export function activityByDay(state: AppState): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();
  const add = (date: string, key: keyof DayActivity, n = 1) => {
    const cur =
      map.get(date) ??
      ({
        date,
        habits: 0,
        practices: 0,
        checkins: 0,
        matches: 0,
        recovery: 0,
        nutrition: 0,
        mentalSessions: 0,
        total: 0,
      } satisfies DayActivity);
    (cur[key] as number) += n;
    cur.total += n;
    map.set(date, cur);
  };

  (state.habitCompletions ?? []).forEach((c: HabitCompletion) =>
    add(c.date, "habits")
  );
  (state.practices ?? []).forEach((p: PracticeEntry) => add(p.date, "practices"));
  (state.checkins ?? []).forEach((c: MentalCheckin) => add(c.date, "checkins"));
  (state.matches ?? []).forEach((m: MatchEntry) => {
    if (m.date) add(m.date, "matches");
  });
  (state.recoveryCheckins ?? []).forEach((r: RecoveryCheckin) =>
    add(r.date, "recovery")
  );
  (state.nutritionLogs ?? []).forEach((n: NutritionLog) =>
    add(n.date, "nutrition")
  );
  (state.mentalSessions ?? []).forEach((s: MentalSession) =>
    add(s.date, "mentalSessions")
  );

  return map;
}

// ---------------------------------------------------------------------------
// XP cumulative over time
// ---------------------------------------------------------------------------

/**
 * Return an array of {date, xp} points showing cumulative XP on each
 * day an activity was logged. Only "stamped" XP-earning events get
 * counted — bonuses from level-ups etc. are not in localStorage.
 *
 * This won't perfectly match state.xp on day N because some XP (e.g.
 * the quote-of-the-day claim, trivia games) isn't per-record stamped.
 * It's good enough for a progress chart, though.
 */
export interface XpPoint {
  date: string;
  xp: number;
  delta: number;
}

export function cumulativeXpSeries(
  state: AppState,
  daysBack = 90
): XpPoint[] {
  const end = new Date();
  const start = addDays(end, -daysBack + 1);

  const deltaByDate = new Map<string, number>();
  const bump = (date: string, n: number) => {
    if (!n) return;
    deltaByDate.set(date, (deltaByDate.get(date) ?? 0) + n);
  };

  (state.practices ?? []).forEach((p) => bump(p.date, p.xpEarned ?? 0));
  (state.checkins ?? []).forEach((c) => bump(c.date, c.xpEarned ?? 0));
  (state.recoveryCheckins ?? []).forEach((r) =>
    bump(r.date, r.xpEarned ?? 0)
  );
  (state.nutritionLogs ?? []).forEach((n) => bump(n.date, n.xpEarned ?? 0));
  (state.mentalSessions ?? []).forEach((s) => bump(s.date, s.xpEarned ?? 0));
  (state.weeklyReviews ?? []).forEach((w) =>
    bump(w.weekStartDate, w.xpEarned ?? 0)
  );
  (state.matches ?? []).forEach((m) => {
    if (m.date) bump(m.date, m.xpEarned ?? 0);
  });
  // Habits don't have per-record XP in the schema — rough credit per completion.
  (state.habitCompletions ?? []).forEach((h) => bump(h.date, 5));

  // Build a full date range so gaps (days with no XP) still show on the chart.
  const dates = eachDay(start, end);
  let running = 0;
  const seriesBefore = Array.from(deltaByDate.keys()).filter(
    (d) => d < dates[0]
  );
  seriesBefore.forEach((d) => {
    running += deltaByDate.get(d) ?? 0;
  });

  const points: XpPoint[] = dates.map((date) => {
    const delta = deltaByDate.get(date) ?? 0;
    running += delta;
    return { date, xp: running, delta };
  });
  return points;
}

// ---------------------------------------------------------------------------
// Day-of-week distribution
// ---------------------------------------------------------------------------

export interface WeekdayStat {
  /** 0 = Sunday, 6 = Saturday */
  day: number;
  label: string;
  total: number;
  avg: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function activityByWeekday(state: AppState): WeekdayStat[] {
  const map = activityByDay(state);
  const buckets = new Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
  map.forEach((a) => {
    const d = new Date(a.date + "T12:00:00");
    const day = d.getDay();
    buckets[day].total += a.total;
    buckets[day].count += 1;
  });
  return buckets.map((b, i) => ({
    day: i,
    label: DAY_LABELS[i],
    total: b.total,
    avg: b.count > 0 ? b.total / b.count : 0,
  }));
}

// ---------------------------------------------------------------------------
// Match stats
// ---------------------------------------------------------------------------

export interface MatchStats {
  total: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgPerformance: number | null;
  recent: MatchEntry[];
}

export function matchSummary(state: AppState, limit = 5): MatchStats {
  const matches = (state.matches ?? []).filter((m) => m.result);
  const wins = matches.filter((m) => m.result === "win").length;
  const losses = matches.filter((m) => m.result === "loss").length;
  const ties = matches.filter((m) => m.result === "tie").length;
  const total = matches.length;
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
  const perf: number[] = [];
  for (const m of matches) {
    if (typeof m.performanceRating === "number") perf.push(m.performanceRating);
  }
  const avgPerformance =
    perf.length > 0
      ? perf.reduce((sum, n) => sum + n, 0) / perf.length
      : null;
  const recent = [...(state.matches ?? [])]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, limit);
  return { total, wins, losses, ties, winPct, avgPerformance, recent };
}

// ---------------------------------------------------------------------------
// Top-level summary strip
// ---------------------------------------------------------------------------

export interface SummaryStats {
  activeDays30: number;
  totalDays30: number;
  consistencyPct: number;
  totalHabits: number;
  totalPractices: number;
  totalMatches: number;
  totalCheckins: number;
  longestStreak: number;
}

export function summary(state: AppState): SummaryStats {
  const activity = activityByDay(state);
  const today = new Date();
  const last30 = eachDay(addDays(today, -29), today);
  const activeDays30 = last30.filter((d) => activity.get(d)?.total).length;
  const consistencyPct = Math.round((activeDays30 / last30.length) * 100);

  // Longest-ever streak = longest consecutive run of days present in activity map
  const sortedDates = Array.from(activity.keys()).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sortedDates) {
    const cur = new Date(d + "T12:00:00");
    if (!prev || (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24) === 1) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = cur;
  }

  return {
    activeDays30,
    totalDays30: last30.length,
    consistencyPct,
    totalHabits: state.habitCompletions?.length ?? 0,
    totalPractices: state.practices?.length ?? 0,
    totalMatches: state.matches?.length ?? 0,
    totalCheckins: state.checkins?.length ?? 0,
    longestStreak: longest,
  };
}
