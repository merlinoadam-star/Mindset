import type { AppState } from "../types";

/**
 * Weekly Cross-Game Challenge — one rotating goal per ISO week that
 * spans multiple mini-games. Encourages variety and replay.
 *
 * Data model:
 *   `AppState.weeklyChallenge` stores a snapshot of the relevant
 *   counters at the start of the current week. Progress for the
 *   active challenge is computed as (current counter − snapshot).
 *   When the ISO week changes, the caller should call
 *   `rollWeeklyChallenge` to rebase the snapshot.
 *
 * Challenge rotation is deterministic from the week's Monday ISO
 * string, so every user gets the same challenge in the same week —
 * useful if we later add peer comparison.
 */

export interface WeeklyChallengeState {
  /** YYYY-MM-DD of the Monday of the current challenge week. */
  weekIso: string;
  /** Counter values at the start of the week — used to compute delta. */
  snapshot: ChallengeSnapshot;
  /** Has this week's XP already been claimed? */
  claimed: boolean;
}

export interface ChallengeSnapshot {
  triviaRounds: number;
  scenarioSessions: number;
  reactionPlays: number;
  reactionBest: number;
  flashPlays: number;
  flashBest: number;
  playcallPlays: number;
  playcallBest: number;
  /** How many distinct games have been played at this snapshot (all-time). */
  distinctGamesPlayed: number;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  emoji: string;
  /** Returns 0..target; target is returned by `target()`. */
  progress: (state: AppState, snapshot: ChallengeSnapshot) => number;
  target: number;
}

// ---------------------------------------------------------------------------
// Week math
// ---------------------------------------------------------------------------

/** YYYY-MM-DD for the Monday of the week containing `d` (UTC-safe). */
export function mondayISO(d: Date = new Date()): string {
  const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = copy.getUTCDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  copy.setUTCDate(copy.getUTCDate() + diff);
  return copy.toISOString().slice(0, 10);
}

/** Whole weeks since 2024-01-01 (an arbitrary epoch) — used for rotation. */
function weekIndexFrom(iso: string): number {
  const epoch = Date.UTC(2024, 0, 1); // 2024-01-01
  const d = new Date(iso + "T00:00:00Z").getTime();
  return Math.floor((d - epoch) / (7 * 24 * 3600 * 1000));
}

// ---------------------------------------------------------------------------
// Snapshot helpers
// ---------------------------------------------------------------------------

function countScenarioSessions(state: AppState): number {
  return (state.mentalSessions ?? []).filter((s) => s.kind === "scenarios")
    .length;
}

function countDistinctGamesPlayed(state: AppState): number {
  const plays = state.gamePlaysCount ?? {};
  let n = 0;
  if ((state.triviaRoundsPlayed ?? 0) > 0) n++;
  if (countScenarioSessions(state) > 0) n++;
  if ((plays["reaction"] ?? 0) > 0) n++;
  if ((plays["flash"] ?? 0) > 0) n++;
  if ((plays["playcall"] ?? 0) > 0) n++;
  return n;
}

/** Captures the "all-time" counters we'll diff against. */
export function snapshotFromState(state: AppState): ChallengeSnapshot {
  const plays = state.gamePlaysCount ?? {};
  const best = state.gameBestScores ?? {};
  return {
    triviaRounds: state.triviaRoundsPlayed ?? 0,
    scenarioSessions: countScenarioSessions(state),
    reactionPlays: plays["reaction"] ?? 0,
    reactionBest: best["reaction"] ?? 0,
    flashPlays: plays["flash"] ?? 0,
    flashBest: best["flash"] ?? 0,
    playcallPlays: plays["playcall"] ?? 0,
    playcallBest: best["playcall"] ?? 0,
    distinctGamesPlayed: countDistinctGamesPlayed(state),
  };
}

// ---------------------------------------------------------------------------
// Challenge catalog — 6 challenges rotating by week index
// ---------------------------------------------------------------------------

export const CHALLENGES: WeeklyChallenge[] = [
  {
    id: "variety-pack",
    title: "Variety Pack",
    description: "Play 3 different mini-games this week.",
    xpReward: 40,
    emoji: "🎯",
    target: 3,
    progress: (state, snap) => {
      const now = countDistinctGamesPlayed(state);
      return Math.max(0, now - snap.distinctGamesPlayed);
    },
  },
  {
    id: "sharp-reflexes",
    title: "Sharp Reflexes",
    description: "Score 20+ in a single Reaction Tap round this week.",
    xpReward: 35,
    emoji: "⚡",
    target: 20,
    progress: (state, snap) => {
      // Only count bests that improved THIS week, but cap at the target.
      const best = state.gameBestScores?.["reaction"] ?? 0;
      if (best > snap.reactionBest) return Math.min(best, 20);
      return 0;
    },
  },
  {
    id: "memory-master",
    title: "Memory Master",
    description: "Reach level 6 in Focus Flash this week.",
    xpReward: 35,
    emoji: "🧠",
    target: 6,
    progress: (state, snap) => {
      const best = state.gameBestScores?.["flash"] ?? 0;
      if (best > snap.flashBest) return Math.min(best, 6);
      return 0;
    },
  },
  {
    id: "champions-mind",
    title: "Champion's Mind",
    description: "Complete 3 Decision Drill rounds this week.",
    xpReward: 40,
    emoji: "🧩",
    target: 3,
    progress: () => 0, // overridden in progressFor() — needs full state
  },
  {
    id: "knowledge-seeker",
    title: "Knowledge Seeker",
    description: "Play 3 Trivia rounds this week.",
    xpReward: 35,
    emoji: "📚",
    target: 3,
    progress: (state, snap) => {
      const delta = (state.triviaRoundsPlayed ?? 0) - snap.triviaRounds;
      return Math.max(0, Math.min(delta, 3));
    },
  },
  {
    id: "speed-demon",
    title: "Speed Demon",
    description: "Score 30+ in a single Play Call round this week.",
    xpReward: 40,
    emoji: "🔥",
    target: 30,
    progress: (state, snap) => {
      const best = state.gameBestScores?.["playcall"] ?? 0;
      if (best > snap.playcallBest) return Math.min(best, 30);
      return 0;
    },
  },
];

/** Picks the challenge for a given week's Monday ISO. Deterministic. */
export function challengeForWeek(weekIso: string): WeeklyChallenge {
  const idx = weekIndexFrom(weekIso);
  return CHALLENGES[((idx % CHALLENGES.length) + CHALLENGES.length) %
    CHALLENGES.length];
}

/**
 * Compute progress, handling the `champions-mind` case that needs
 * the full state (not just the snapshot) to count scenario sessions.
 */
export function progressFor(
  challenge: WeeklyChallenge,
  state: AppState,
  snapshot: ChallengeSnapshot
): number {
  if (challenge.id === "champions-mind") {
    const delta = countScenarioSessions(state) - snapshot.scenarioSessions;
    return Math.max(0, Math.min(delta, challenge.target));
  }
  return Math.max(0, Math.min(challenge.progress(state, snapshot), challenge.target));
}

// ---------------------------------------------------------------------------
// State roll helpers — used by the store
// ---------------------------------------------------------------------------

/**
 * If `existing` is undefined or for a different week, produce a fresh
 * challenge state snapshotting the current counters. Otherwise return
 * `existing` unchanged.
 */
export function rollWeeklyChallenge(
  state: AppState,
  existing: WeeklyChallengeState | undefined
): WeeklyChallengeState {
  const currentWeek = mondayISO();
  if (existing && existing.weekIso === currentWeek) return existing;
  return {
    weekIso: currentWeek,
    snapshot: snapshotFromState(state),
    claimed: false,
  };
}

export function isChallengeComplete(
  challenge: WeeklyChallenge,
  state: AppState,
  snapshot: ChallengeSnapshot
): boolean {
  return progressFor(challenge, state, snapshot) >= challenge.target;
}
