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

/** Days with at least one habit completion, practice, or check-in. */
export function activeDatesSet(state: AppState): Set<string> {
  const dates = new Set<string>();
  state.habitCompletions.forEach((c) => dates.add(c.date));
  state.practices.forEach((p) => dates.add(p.date));
  state.checkins.forEach((c) => dates.add(c.date));
  return dates;
}

export function computeStreak(state: AppState): number {
  const active = activeDatesSet(state);
  if (active.size === 0) return 0;

  let streak = 0;
  const d = new Date();
  // If today has no activity yet, start counting from yesterday so the streak
  // doesn't reset until midnight of a missed day.
  if (!active.has(isoDate(d))) {
    d.setDate(d.getDate() - 1);
  }
  while (active.has(isoDate(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function isStreakAlive(state: AppState): boolean {
  const active = activeDatesSet(state);
  return active.has(todayISO()) || active.has(yesterdayISO());
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
