import type { AppState } from "../types";
import { habitsForSport } from "./habits";

/**
 * Phase G — daily challenges. A pool of pre-defined challenges; the app
 * deterministically picks one per day based on the date, and awards
 * bonus XP when completed.
 *
 * Criteria are evaluated client-side against local state, so the "done"
 * status updates in real time as the athlete logs stuff during the day.
 */

export interface DailyChallenge {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  xp: number;
  /** Returns { done, progress } — progress is a short string like "2/3". */
  evaluate: (
    state: AppState,
    today: string
  ) => { done: boolean; progress: string };
}

export const CHALLENGES: DailyChallenge[] = [
  {
    id: "three-habits",
    title: "Triple Threat",
    desc: "Check off 3 different habits today",
    emoji: "🎯",
    xp: 15,
    evaluate: (state, today) => {
      const count = new Set(
        state.habitCompletions
          .filter((c) => c.date === today)
          .map((c) => c.habitId)
      ).size;
      return { done: count >= 3, progress: `${count}/3` };
    },
  },
  {
    id: "mental-marathon",
    title: "Mental Marathon",
    desc: "Do a check-in AND a mental training session today",
    emoji: "🧠",
    xp: 20,
    evaluate: (state, today) => {
      const hasCheckin = state.checkins.some((c) => c.date === today);
      const hasSession = (state.mentalSessions ?? []).some(
        (s) => s.date === today
      );
      const done = hasCheckin && hasSession;
      return {
        done,
        progress: `${(hasCheckin ? 1 : 0) + (hasSession ? 1 : 0)}/2`,
      };
    },
  },
  {
    id: "log-practice",
    title: "Put In Work",
    desc: "Log a practice session today",
    emoji: "💪",
    xp: 15,
    evaluate: (state, today) => {
      const done = state.practices.some((p) => p.date === today);
      return { done, progress: done ? "Done!" : "0/1" };
    },
  },
  {
    id: "goal-and-review",
    title: "Close the Loop",
    desc: "Set a goal today AND review yesterday's goal",
    emoji: "🔁",
    xp: 20,
    evaluate: (state, today) => {
      const yesterday = (() => {
        const d = new Date(today + "T12:00:00");
        d.setDate(d.getDate() - 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })();
      const todayCheckin = state.checkins.find((c) => c.date === today);
      const yCheckin = state.checkins.find((c) => c.date === yesterday);
      const hasGoalToday = Boolean(todayCheckin?.goal);
      const reviewedYesterday = Boolean(yCheckin?.goalReviewedAt);
      const done = hasGoalToday && reviewedYesterday;
      return {
        done,
        progress: `${(hasGoalToday ? 1 : 0) + (reviewedYesterday ? 1 : 0)}/2`,
      };
    },
  },
  {
    id: "power-hour",
    title: "Power Hour",
    desc: "Log a practice of 45+ minutes today",
    emoji: "⚡",
    xp: 25,
    evaluate: (state, today) => {
      const best = Math.max(
        0,
        ...state.practices
          .filter((p) => p.date === today)
          .map((p) => p.durationMin ?? 0)
      );
      return {
        done: best >= 45,
        progress: best > 0 ? `${best}/45 min` : "0/45 min",
      };
    },
  },
  {
    id: "full-house",
    title: "Full House",
    desc: "Complete every daily habit today",
    emoji: "🏠",
    xp: 30,
    evaluate: (state, today) => {
      if (!state.profile) return { done: false, progress: "0/0" };
      const total = habitsForSport(state.profile.sport).length;
      const done = new Set(
        state.habitCompletions
          .filter((c) => c.date === today)
          .map((c) => c.habitId)
      ).size;
      return {
        done: total > 0 && done >= total,
        progress: `${done}/${total}`,
      };
    },
  },
  {
    id: "recovery-first",
    title: "Recovery Rookie",
    desc: "Log a recovery check-in today",
    emoji: "😴",
    xp: 15,
    evaluate: (state, today) => {
      const done = (state.recoveryCheckins ?? []).some(
        (r) => r.date === today
      );
      return { done, progress: done ? "Done!" : "0/1" };
    },
  },
  {
    id: "fuel-up",
    title: "Fuel Up",
    desc: "Log your nutrition today",
    emoji: "🥗",
    xp: 15,
    evaluate: (state, today) => {
      const done = (state.nutritionLogs ?? []).some((n) => n.date === today);
      return { done, progress: done ? "Done!" : "0/1" };
    },
  },
  {
    id: "breathe-easy",
    title: "Breathe Easy",
    desc: "Do a breathing exercise today",
    emoji: "🌬️",
    xp: 10,
    evaluate: (state, today) => {
      const done = (state.mentalSessions ?? []).some(
        (s) => s.date === today && s.kind === "breathing"
      );
      return { done, progress: done ? "Done!" : "0/1" };
    },
  },
  {
    id: "visualize-win",
    title: "See It First",
    desc: "Do a visualization today",
    emoji: "✨",
    xp: 15,
    evaluate: (state, today) => {
      const done = (state.mentalSessions ?? []).some(
        (s) => s.date === today && s.kind === "visualization"
      );
      return { done, progress: done ? "Done!" : "0/1" };
    },
  },
  {
    id: "early-bird",
    title: "Early Bird",
    desc: "Check off a habit before noon",
    emoji: "🌅",
    xp: 10,
    evaluate: (state, today) => {
      const found = state.habitCompletions.find((c) => {
        if (c.date !== today || !c.completedAt) return false;
        const t = new Date(c.completedAt);
        return t.getHours() < 12;
      });
      return { done: Boolean(found), progress: found ? "Done!" : "0/1" };
    },
  },
  {
    id: "full-stack",
    title: "Full Stack",
    desc: "Log activity in 3 different areas today",
    emoji: "🔥",
    xp: 25,
    evaluate: (state, today) => {
      const areas = new Set<string>();
      if (state.habitCompletions.some((c) => c.date === today))
        areas.add("habits");
      if (state.practices.some((p) => p.date === today)) areas.add("practice");
      if (state.checkins.some((c) => c.date === today)) areas.add("checkin");
      if ((state.recoveryCheckins ?? []).some((r) => r.date === today))
        areas.add("recovery");
      if ((state.nutritionLogs ?? []).some((n) => n.date === today))
        areas.add("nutrition");
      if ((state.mentalSessions ?? []).some((s) => s.date === today))
        areas.add("mental");
      return { done: areas.size >= 3, progress: `${areas.size}/3` };
    },
  },
];

/** Deterministic pick: same challenge for everyone on the same date. */
export function todaysChallenge(dateIso: string): DailyChallenge {
  let hash = 0;
  for (let i = 0; i < dateIso.length; i++) {
    hash = (hash * 31 + dateIso.charCodeAt(i)) >>> 0;
  }
  return CHALLENGES[hash % CHALLENGES.length];
}
