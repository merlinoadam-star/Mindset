import type { AppState, BadgeDefinition, Sport } from "../types";

// -----------------------------------------------------------------------------
// Levels
// -----------------------------------------------------------------------------

export interface LevelInfo {
  level: number;
  title: string;
  xpForThisLevel: number;
  xpForNextLevel: number;
  progressPct: number; // 0–100 toward next level
}

const TITLES_WRESTLING = [
  "Rookie Mat Rat",
  "Scrappy Wrestler",
  "JV Grinder",
  "Varsity Starter",
  "Section Qualifier",
  "State Qualifier",
  "All-State",
  "Champion",
  "Legend",
  "G.O.A.T.",
];

const TITLES_VOLLEYBALL = [
  "Rookie Setter",
  "Scrappy Defender",
  "JV Starter",
  "Varsity Starter",
  "Club All-Star",
  "All-Conference",
  "All-State",
  "Champion",
  "Legend",
  "G.O.A.T.",
];

// XP required to reach each level (cumulative).
// Level 1 = 0, Level 2 = 100, Level 3 = 250, Level 4 = 450, ...
// Each level needs a bit more XP than the last.
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += 75 + (i - 1) * 25;
  }
  return total;
}

export function computeLevel(xp: number, sport: Sport): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;

  const xpForThisLevel = xpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1);
  const progressPct = Math.round(
    ((xp - xpForThisLevel) / (xpForNextLevel - xpForThisLevel)) * 100
  );

  const titles = sport === "wrestling" ? TITLES_WRESTLING : TITLES_VOLLEYBALL;
  const title = titles[Math.min(level - 1, titles.length - 1)];

  return { level, title, xpForThisLevel, xpForNextLevel, progressPct };
}

// -----------------------------------------------------------------------------
// Streak
// -----------------------------------------------------------------------------

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return isoDate(new Date());
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

/** Returns Monday of the current week as YYYY-MM-DD (locale-aware via local Date). */
export function currentWeekMondayISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

/** Days with at least one logged activity across any tracking surface. */
export function activeDatesSet(state: AppState): Set<string> {
  const dates = new Set<string>();
  state.habitCompletions.forEach((c) => dates.add(c.date));
  state.practices.forEach((p) => dates.add(p.date));
  state.checkins.forEach((c) => dates.add(c.date));
  if (state.recoveryCheckins) {
    state.recoveryCheckins.forEach((r) => dates.add(r.date));
  }
  if (state.mentalSessions) {
    state.mentalSessions.forEach((m) => dates.add(m.date));
  }
  if (state.nutritionLogs) {
    state.nutritionLogs.forEach((n) => dates.add(n.date));
  }
  return dates;
}

export function computeStreak(state: AppState): number {
  const active = activeDatesSet(state);
  if (active.size === 0) return 0;
  const frozen = new Set(state.usedFreezeDates ?? []);

  let streak = 0;
  const d = new Date();
  // If today has no activity yet, start counting from yesterday so the streak
  // doesn't reset until midnight of a missed day.
  if (!active.has(isoDate(d)) && !frozen.has(isoDate(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (active.has(isoDate(d)) || frozen.has(isoDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function isStreakAlive(state: AppState): boolean {
  const active = activeDatesSet(state);
  const frozen = new Set(state.usedFreezeDates ?? []);
  const today = todayISO();
  const yesterday = yesterdayISO();
  return (
    active.has(today) ||
    active.has(yesterday) ||
    frozen.has(today) ||
    frozen.has(yesterday)
  );
}

/**
 * Auto-applies streak freezes on any missed day that would otherwise break
 * the streak. Returns updated freeze count and freshly-frozen dates. Should
 * be run on app load (after state is loaded) to keep streaks alive.
 *
 * Policy: up to 2 freezes can be in the bank at any time. We apply freezes
 * conservatively — only if the streak would actually break.
 */
export function applyAutoFreezes(state: AppState): {
  streakFreezes: number;
  usedFreezeDates: string[];
  frozenToday?: string;
} {
  const active = activeDatesSet(state);
  let freezes = state.streakFreezes ?? 0;
  let used = [...(state.usedFreezeDates ?? [])];
  if (active.size === 0) return { streakFreezes: freezes, usedFreezeDates: used };

  const usedSet = new Set(used);
  // Walk back from yesterday looking for single-day gaps inside an otherwise
  // active streak. We only freeze a day if both the day before and the day
  // after are active (a true "missed day") and we have freezes available.
  const today = new Date();
  let frozenToday: string | undefined;
  for (let i = 1; i <= 14; i++) {
    if (freezes <= 0) break;
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dIso = isoDate(d);
    if (active.has(dIso) || usedSet.has(dIso)) continue;

    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const prev = new Date(d);
    prev.setDate(d.getDate() - 1);
    const nextActive = active.has(isoDate(next)) || usedSet.has(isoDate(next));
    const prevActive = active.has(isoDate(prev)) || usedSet.has(isoDate(prev));
    if (nextActive && prevActive) {
      freezes -= 1;
      used.push(dIso);
      usedSet.add(dIso);
      frozenToday = dIso;
    }
  }

  return { streakFreezes: freezes, usedFreezeDates: used, frozenToday };
}

/** Returns how many total freezes have been earned over the athlete's journey. */
export function shouldEarnNewFreeze(state: AppState): boolean {
  // Earn one freeze every 7 consecutive active days, capped at 2 in bank.
  const streak = computeStreak(state);
  if (streak === 0) return false;
  if ((state.streakFreezes ?? 0) >= 2) return false;
  // Earn at multiples of 7 and only if we haven't earned one today already.
  const today = todayISO();
  const lastAt = state.lastFreezeEarnedAt ?? "";
  if (lastAt.startsWith(today)) return false;
  return streak > 0 && streak % 7 === 0;
}

// -----------------------------------------------------------------------------
// Badges
// -----------------------------------------------------------------------------

export const BADGES: BadgeDefinition[] = [
  {
    id: "first-step",
    name: "First Step",
    description: "Completed your first habit",
    emoji: "👣",
    requirement: "Complete any 1 habit",
  },
  {
    id: "first-practice",
    name: "First Practice",
    description: "Logged your first practice",
    emoji: "🎯",
    requirement: "Log 1 practice",
  },
  {
    id: "streak-3",
    name: "On a Roll",
    description: "3-day streak",
    emoji: "🔥",
    requirement: "Be active 3 days in a row",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "7-day streak",
    emoji: "🔥",
    requirement: "Be active 7 days in a row",
  },
  {
    id: "streak-14",
    name: "Relentless",
    description: "14-day streak",
    emoji: "⚡",
    requirement: "Be active 14 days in a row",
  },
  {
    id: "streak-30",
    name: "Iron Will",
    description: "30-day streak",
    emoji: "🏆",
    requirement: "Be active 30 days in a row",
  },
  {
    id: "iron-mind",
    name: "Iron Mind",
    description: "Mental training 5 days in a row",
    emoji: "🧠",
    requirement: "Do a mental check-in 5 days in a row",
  },
  {
    id: "century-club",
    name: "Century Club",
    description: "100 total habits completed",
    emoji: "💯",
    requirement: "Complete 100 habits total",
  },
  {
    id: "practice-5",
    name: "In the Gym",
    description: "5 practices logged",
    emoji: "💪",
    requirement: "Log 5 practices",
  },
  {
    id: "practice-25",
    name: "Grinder",
    description: "25 practices logged",
    emoji: "🥇",
    requirement: "Log 25 practices",
  },
  {
    id: "level-5",
    name: "Rising Star",
    description: "Reached level 5",
    emoji: "⭐",
    requirement: "Reach level 5",
  },
  {
    id: "level-10",
    name: "Elite",
    description: "Reached level 10",
    emoji: "🌟",
    requirement: "Reach level 10",
  },
  {
    id: "perfect-day",
    name: "Perfect Day",
    description: "Completed every daily habit in one day",
    emoji: "✨",
    requirement: "Complete all your sport's habits in a single day",
  },
  {
    id: "first-match",
    name: "In the Arena",
    description: "Logged your first match",
    emoji: "🥊",
    requirement: "Log 1 match",
  },
  {
    id: "match-10",
    name: "Seasoned Competitor",
    description: "10 matches logged",
    emoji: "🏟️",
    requirement: "Log 10 matches",
  },
  {
    id: "pre-match-5",
    name: "Prepared Mind",
    description: "Completed 5 pre-match mental prep sessions",
    emoji: "🧘",
    requirement: "Complete pre-match prep on 5 matches",
  },
  {
    id: "reflective-warrior",
    name: "Reflective Warrior",
    description: "Completed 5 post-match reflections",
    emoji: "📖",
    requirement: "Complete post-match reflection on 5 matches",
  },
  {
    id: "full-framework-10",
    name: "The Full Package",
    description: "Pre + post match reflection on 10 matches",
    emoji: "🎯",
    requirement: "Complete both pre and post on 10 matches",
  },
  {
    id: "week-reviewer",
    name: "Week Reviewer",
    description: "Completed your first weekly review",
    emoji: "📅",
    requirement: "Complete 1 weekly review",
  },
  {
    id: "review-streak-4",
    name: "Month of Growth",
    description: "4 weekly reviews in a row",
    emoji: "🌿",
    requirement: "Complete 4 consecutive weekly reviews",
  },
  {
    id: "phrase-collector",
    name: "Phrase Collector",
    description: "Built a library of 5 power phrases",
    emoji: "⚔️",
    requirement: "Create 5 power phrases",
  },
  {
    id: "rest-champion",
    name: "Rest Champion",
    description: "Logged recovery 7 days in a row",
    emoji: "💤",
    requirement: "Log recovery 7 consecutive days",
  },
  {
    id: "ice-in-bank",
    name: "Ice in the Bank",
    description: "Earned your first streak freeze",
    emoji: "❄️",
    requirement: "Maintain a 7-day streak",
  },
  {
    id: "fueled-up",
    name: "Fueled Up",
    description: "Logged a balanced nutrition day",
    emoji: "🥗",
    requirement: "Log a nutrition day with 3+ food quality items",
  },
  {
    id: "kitchen-consistent",
    name: "Kitchen Consistent",
    description: "7 consecutive days of nutrition logging",
    emoji: "🍽️",
    requirement: "Log nutrition 7 days in a row",
  },
  {
    id: "hydration-hero",
    name: "Hydration Hero",
    description: "8+ glasses of water on 10 days",
    emoji: "💧",
    requirement: "Hit 8+ glasses of water on 10 different days",
  },
];

export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

function hasBadge(state: AppState, id: string): boolean {
  return state.unlockedBadges.some((b) => b.id === id);
}

/**
 * Evaluates all badge conditions and returns the list of newly-earned badge ids
 * (not already unlocked).
 */
export function evaluateBadges(
  state: AppState,
  habitsForUserSport: number
): string[] {
  const newly: string[] = [];
  const unlock = (id: string) => {
    if (!hasBadge(state, id) && !newly.includes(id)) newly.push(id);
  };

  const totalHabits = state.habitCompletions.length;
  const totalPractices = state.practices.length;
  const totalMatches = state.matches.length;
  const preMatchCount = state.matches.filter((m) => m.preMatchCompletedAt).length;
  const postMatchCount = state.matches.filter((m) => m.postMatchCompletedAt).length;
  const fullFrameworkCount = state.matches.filter(
    (m) => m.preMatchCompletedAt && m.postMatchCompletedAt
  ).length;
  const streak = computeStreak(state);

  if (totalHabits >= 1) unlock("first-step");
  if (totalPractices >= 1) unlock("first-practice");
  if (streak >= 3) unlock("streak-3");
  if (streak >= 7) unlock("streak-7");
  if (streak >= 14) unlock("streak-14");
  if (streak >= 30) unlock("streak-30");
  if (totalHabits >= 100) unlock("century-club");
  if (totalPractices >= 5) unlock("practice-5");
  if (totalPractices >= 25) unlock("practice-25");

  if (totalMatches >= 1) unlock("first-match");
  if (totalMatches >= 10) unlock("match-10");
  if (preMatchCount >= 5) unlock("pre-match-5");
  if (postMatchCount >= 5) unlock("reflective-warrior");
  if (fullFrameworkCount >= 10) unlock("full-framework-10");

  // Weekly reviews
  if (state.weeklyReviews.length >= 1) unlock("week-reviewer");
  if (state.weeklyReviews.length >= 4) {
    // Check for 4 consecutive weeks
    const sorted = [...state.weeklyReviews]
      .map((r) => r.weekStartDate)
      .sort();
    let best = 1;
    let run = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + "T00:00:00");
      const curr = new Date(sorted[i] + "T00:00:00");
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 7) {
        run++;
        best = Math.max(best, run);
      } else if (diff > 7) {
        run = 1;
      }
    }
    if (best >= 4) unlock("review-streak-4");
  }

  // Power phrases
  if (state.powerPhrases.length >= 5) unlock("phrase-collector");

  // Streak freezes
  if (
    (state.streakFreezes ?? 0) >= 1 ||
    (state.usedFreezeDates ?? []).length >= 1
  ) {
    unlock("ice-in-bank");
  }

  // Nutrition
  const nLogs = state.nutritionLogs ?? [];
  if (
    nLogs.some((n) => {
      const q = [n.hadProtein, n.hadFruitVeg, n.hadWholeGrains, n.hadHealthyFats].filter(
        Boolean
      ).length;
      return q >= 3;
    })
  ) {
    unlock("fueled-up");
  }

  if (nLogs.filter((n) => (n.waterGlasses ?? 0) >= 8).length >= 10) {
    unlock("hydration-hero");
  }

  if (nLogs.length >= 7) {
    const sortedN = nLogs.map((n) => n.date).sort();
    let best = 1;
    let run = 1;
    for (let i = 1; i < sortedN.length; i++) {
      const prev = new Date(sortedN[i - 1] + "T00:00:00");
      const curr = new Date(sortedN[i] + "T00:00:00");
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        run++;
        best = Math.max(best, run);
      } else if (diff > 1) {
        run = 1;
      }
    }
    if (best >= 7) unlock("kitchen-consistent");
  }

  // Recovery check-ins — 7 consecutive days
  if (state.recoveryCheckins.length >= 7) {
    const sortedR = [...state.recoveryCheckins]
      .map((r) => r.date)
      .sort();
    let best = 1;
    let run = 1;
    for (let i = 1; i < sortedR.length; i++) {
      const prev = new Date(sortedR[i - 1] + "T00:00:00");
      const curr = new Date(sortedR[i] + "T00:00:00");
      const diff = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff === 1) {
        run++;
        best = Math.max(best, run);
      } else if (diff > 1) {
        run = 1;
      }
    }
    if (best >= 7) unlock("rest-champion");
  }

  if (state.profile) {
    const level = computeLevel(state.xp, state.profile.sport).level;
    if (level >= 5) unlock("level-5");
    if (level >= 10) unlock("level-10");
  }

  // Iron Mind: check-ins on 5 consecutive days
  if (state.checkins.length >= 5) {
    const dates = state.checkins.map((c) => c.date).sort();
    let best = 1;
    let cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        cur++;
        best = Math.max(best, cur);
      } else if (diff > 1) {
        cur = 1;
      }
    }
    if (best >= 5) unlock("iron-mind");
  }

  // Perfect Day: all sport habits in a single day
  if (habitsForUserSport > 0) {
    const byDate: Record<string, Set<string>> = {};
    for (const c of state.habitCompletions) {
      if (!byDate[c.date]) byDate[c.date] = new Set();
      byDate[c.date].add(c.habitId);
    }
    if (Object.values(byDate).some((s) => s.size >= habitsForUserSport)) {
      unlock("perfect-day");
    }
  }

  return newly;
}
