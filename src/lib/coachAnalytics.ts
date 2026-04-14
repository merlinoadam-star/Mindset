import {
  rowToAward,
  rowToHabitCompletion,
  rowToMentalCheckin,
  rowToMentalSession,
  rowToNutritionLog,
  rowToOpponent,
  rowToPowerPhrase,
  rowToPractice,
  rowToRecoveryCheckin,
  rowToTournament,
  rowToUnlockedBadge,
  rowToWeeklyReview,
} from "./dataSync";
import { rowToProfile, type DbAthleteRow } from "./athleteSync";
import {
  activityByDay,
  addDays,
  eachDay,
  isoDate,
  summary,
  type SummaryStats,
} from "./progressAnalytics";
import { computeLevel, computeStreak } from "./gamification";
import type { AppState, MatchEntry } from "../types";

/**
 * Phase 4D.2 — coach / parent side analytics.
 *
 * The coach's AthleteView loads raw DB rows via fetchAllAthleteData
 * and fetchMatchesForAthlete. This helper stitches those into a
 * fully-typed AppState shape so the existing progressAnalytics and
 * chart components can be reused directly.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawExtra = any;

export function buildAppStateFromCloud(
  profileRow: DbAthleteRow,
  matches: MatchEntry[],
  extra: RawExtra | null
): AppState {
  const profile = rowToProfile(profileRow);
  const e = extra ?? {};
  profile.tournaments = (e.tournaments ?? []).map(rowToTournament);
  profile.awards = (e.awards ?? []).map(rowToAward);

  return {
    profile,
    xp: profileRow.xp ?? 0,
    habitCompletions: (e.habits ?? []).map(rowToHabitCompletion),
    practices: (e.practices ?? []).map(rowToPractice),
    matches,
    opponents: (e.opponents ?? []).map(rowToOpponent),
    checkins: (e.mentalCheckins ?? []).map(rowToMentalCheckin),
    mentalSessions: (e.mentalSessions ?? []).map(rowToMentalSession),
    weeklyReviews: (e.weeklyReviews ?? []).map(rowToWeeklyReview),
    powerPhrases: (e.powerPhrases ?? []).map(rowToPowerPhrase),
    recoveryCheckins: (e.recovery ?? []).map(rowToRecoveryCheckin),
    nutritionLogs: (e.nutrition ?? []).map(rowToNutritionLog),
    videos: [],
    voicePersonaId: profileRow.voice_persona_id ?? "natural",
    unlockedBadges: (e.badges ?? []).map(rowToUnlockedBadge),
    lastActiveDate: null,
    lastQuoteClaimDate: null,
    streakFreezes: 0,
    usedFreezeDates: [],
    lastFreezeEarnedAt: null,
    triviaRoundsPlayed: 0,
    triviaXpEarned: 0,
    gameBestScores: {},
    gameXpEarned: {},
  };
}

// ---------------------------------------------------------------------------
// Insights — plain-English "what's notable about this athlete right now"
// ---------------------------------------------------------------------------

export type InsightTone = "positive" | "warning" | "neutral";

export interface Insight {
  tone: InsightTone;
  emoji: string;
  text: string;
}

export function insightsFor(state: AppState): Insight[] {
  const out: Insight[] = [];
  const today = new Date();
  const activity = activityByDay(state);
  const todayIso = isoDate(today);
  const last7 = eachDay(addDays(today, -6), today);
  const last14 = eachDay(addDays(today, -13), today);

  const active7 = last7.filter((d) => activity.get(d)?.total).length;
  const active14 = last14.filter((d) => activity.get(d)?.total).length;
  const activeThisWeek = active7;
  const activePriorWeek = active14 - active7;
  const streak = computeStreak(state);
  const activeToday = (activity.get(todayIso)?.total ?? 0) > 0;
  const s: SummaryStats = summary(state);

  // Perfect week
  if (active7 === 7) {
    out.push({
      tone: "positive",
      emoji: "🔥",
      text: "Logged something every day this week — a perfect 7/7.",
    });
  } else if (active7 >= 5) {
    out.push({
      tone: "positive",
      emoji: "✨",
      text: `Strong week — active ${active7} of the last 7 days.`,
    });
  }

  // Drop-off vs prior week
  if (active7 < activePriorWeek - 1 && activePriorWeek >= 3) {
    out.push({
      tone: "warning",
      emoji: "📉",
      text: `Activity dropped off — ${active7} days this week vs ${activePriorWeek} last week.`,
    });
  }

  // Streak risk: alive but nothing today (after 4pm local)
  if (!activeToday && streak > 0 && today.getHours() >= 16) {
    out.push({
      tone: "warning",
      emoji: "⏰",
      text: `${streak}-day streak at risk — nothing logged today yet.`,
    });
  }

  // No activity in past 3 days
  const activeIn3 = eachDay(addDays(today, -2), today).filter(
    (d) => activity.get(d)?.total
  ).length;
  if (activeIn3 === 0 && s.totalHabits + s.totalPractices > 0) {
    out.push({
      tone: "warning",
      emoji: "💤",
      text: "Nothing logged in the last 3 days.",
    });
  }

  // Match-specific
  const recentMatches = (state.matches ?? [])
    .filter((m) => m.result)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  if (recentMatches.length >= 3) {
    const lastThree = recentMatches.slice(0, 3);
    if (lastThree.every((m) => m.result === "win")) {
      out.push({
        tone: "positive",
        emoji: "🏆",
        text: "3 wins in a row — on a roll.",
      });
    }
  }

  // Level progress
  if (state.profile) {
    const level = computeLevel(state.xp, state.profile.sport).level;
    if (level >= 5 && state.unlockedBadges.some((b) => b.id === "level-5")) {
      // Only surface level-5 if it was unlocked recently (within 14 days)
      const badge = state.unlockedBadges.find((b) => b.id === "level-5");
      if (badge) {
        const since = Date.now() - new Date(badge.unlockedAt).getTime();
        if (since < 14 * 24 * 60 * 60 * 1000) {
          out.push({
            tone: "positive",
            emoji: "⭐",
            text: "Reached Level 5 recently — real momentum.",
          });
        }
      }
    }
  }

  // If we have nothing interesting yet, offer a calm neutral baseline.
  if (out.length === 0) {
    out.push({
      tone: "neutral",
      emoji: "📊",
      text: `${activeThisWeek}/${last7.length} days active this week. Steady.`,
    });
  }

  return out.slice(0, 3);
}
