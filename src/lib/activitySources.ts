import type { AppState } from "../types";

/**
 * Single source of truth for "what counts as an active day."
 *
 * The athlete-side streak (gamification.ts:activeDatesSet) and the
 * coach roster aggregator (teamStats.ts:fetchTeamStats) have drifted
 * apart twice before — once we forgot mindset/recovery/nutrition on
 * the coach side, once we forgot matches on the athlete side. Both
 * were user-visible bugs where the athlete's streak disagreed with
 * what their coach saw.
 *
 * The fix: both sides read from this list. Add a new source here and
 * both views pick it up. Pairs of (local-state key, cloud-table name)
 * so each side can introspect in its natural shape.
 */
export interface ActivitySource {
  /** Key in the athlete's local AppState (camelCase). */
  stateKey: keyof AppState;
  /** Supabase table name (snake_case). */
  table:
    | "habit_completions"
    | "practices"
    | "mental_checkins"
    | "matches"
    | "mental_sessions"
    | "recovery_checkins"
    | "nutrition_logs";
}

export const ACTIVITY_SOURCES: readonly ActivitySource[] = [
  { stateKey: "habitCompletions", table: "habit_completions" },
  { stateKey: "practices", table: "practices" },
  { stateKey: "checkins", table: "mental_checkins" },
  { stateKey: "matches", table: "matches" },
  { stateKey: "mentalSessions", table: "mental_sessions" },
  { stateKey: "recoveryCheckins", table: "recovery_checkins" },
  { stateKey: "nutritionLogs", table: "nutrition_logs" },
] as const;

/** Collect active dates from local state. Each registered source
 *  contributes any `date` it finds on its entries. */
export function activeDatesFromState(state: AppState): Set<string> {
  const dates = new Set<string>();
  for (const { stateKey } of ACTIVITY_SOURCES) {
    const list = state[stateKey] as unknown;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item && typeof item === "object" && "date" in item) {
        const date = (item as { date?: unknown }).date;
        if (typeof date === "string") dates.add(date);
      }
    }
  }
  return dates;
}
