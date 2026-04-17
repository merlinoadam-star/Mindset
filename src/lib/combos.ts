import type { AppState } from "../types";

/**
 * Phase G — daily combo bonus. The athlete earns escalating bonus XP
 * for mixing activity types across a single day. 6 possible types;
 * each new type they add today awards a combo tier.
 *
 * Tier bonuses:
 *   2nd type →  +5 XP (Combo starter)
 *   3rd type → +10 XP (Daily Combo)
 *   4th type → +15 XP (Big Combo)
 *   5th type → +20 XP (Epic Combo)
 *   6th type → +25 XP (MAX Combo)
 *
 * Total possible per day: 75 XP on top of the base activity XP.
 */

export const COMBO_TIER_XP = [0, 0, 5, 10, 15, 20, 25];
export const COMBO_TIER_LABELS = [
  "No combo",
  "Starting out",
  "Combo!",
  "Daily Combo!",
  "Big Combo!",
  "Epic Combo!",
  "MAX Combo!",
];
export const COMBO_TYPES = [
  "habits",
  "practice",
  "checkin",
  "recovery",
  "nutrition",
  "mental",
] as const;

export type ComboType = (typeof COMBO_TYPES)[number];

/** Which activity types the athlete has logged today (count = 0-6). */
export function activeTypesToday(state: AppState, today: string): Set<ComboType> {
  const types = new Set<ComboType>();
  if (state.habitCompletions.some((c) => c.date === today)) types.add("habits");
  if (state.practices.some((p) => p.date === today)) types.add("practice");
  if (state.checkins.some((c) => c.date === today)) types.add("checkin");
  if ((state.recoveryCheckins ?? []).some((r) => r.date === today))
    types.add("recovery");
  if ((state.nutritionLogs ?? []).some((n) => n.date === today))
    types.add("nutrition");
  if ((state.mentalSessions ?? []).some((s) => s.date === today))
    types.add("mental");
  return types;
}

/** Compute any unclaimed combo XP — i.e., new tiers earned since last award. */
export function unclaimedComboXp(
  state: AppState,
  today: string
): { amount: number; newTier: number } {
  const types = activeTypesToday(state, today);
  const currentTier = types.size;
  const claimed =
    state.lastComboDate === today ? state.comboTiersClaimed ?? 0 : 0;

  if (currentTier <= claimed) return { amount: 0, newTier: claimed };

  let amount = 0;
  for (let t = claimed + 1; t <= currentTier; t++) {
    amount += COMBO_TIER_XP[t] ?? 0;
  }
  return { amount, newTier: currentTier };
}

/** Friendly label for the given tier count (0-6). */
export function comboLabel(tier: number): string {
  return COMBO_TIER_LABELS[Math.min(tier, 6)] ?? "Combo!";
}
