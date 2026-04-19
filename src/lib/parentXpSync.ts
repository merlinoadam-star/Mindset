import { supabase } from "./supabase";

/**
 * Parent gamification sync layer.
 *
 * Parents earn XP for supporting actions (check-in, playbook, cheer).
 * When they act on a day their athlete also acted, both sides earn a
 * small combo bonus. Parent XP lives in the `parent_actions` ledger
 * (summed on read). Athlete combo XP is written via the
 * `grant_athlete_combo_xp` RPC which also logs a gift row so the
 * athlete sees a toast on next load.
 *
 * Hard rules enforced by RLS / the RPC — the client just computes
 * the right payload:
 *   - Parent must be a connected adult to the athlete.
 *   - Daily cap per (parent, athlete, action_type) via unique index.
 *   - Athlete XP gifts require an accepted connection.
 */

export type ParentActionType =
  | "check_in"
  | "playbook"
  | "cheer"
  | "daily_review";

const BASE_XP: Record<ParentActionType, number> = {
  check_in: 10,
  playbook: 10,
  cheer: 5,
  daily_review: 10,
};

export const PARENT_COMBO_BONUS = 5;
export const ATHLETE_COMBO_BONUS = 5;

export function parentXpFor(action: ParentActionType, combo: boolean): number {
  return BASE_XP[action] + (combo ? PARENT_COMBO_BONUS : 0);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Did the athlete log any visible activity today? Used to decide
 * whether a parent action qualifies for a combo. We check the two
 * strongest daily signals — mental_checkins and habit_completions —
 * in a single round trip each. Both have RLS allowing a connected
 * parent to read.
 */
export async function didAthleteActToday(
  athleteAccountId: string,
  date: string = todayISO()
): Promise<boolean> {
  if (!supabase) return false;
  const [{ data: mc }, { data: hc }] = await Promise.all([
    supabase
      .from("mental_checkins")
      .select("id", { head: false })
      .eq("athlete_id", athleteAccountId)
      .eq("date", date)
      .limit(1),
    supabase
      .from("habit_completions")
      .select("id", { head: false })
      .eq("athlete_id", athleteAccountId)
      .eq("date", date)
      .limit(1),
  ]);
  return (mc?.length ?? 0) > 0 || (hc?.length ?? 0) > 0;
}

export interface LogParentActionResult {
  awardedXp: number;
  combo: boolean;
  /** True when the DB rejected the insert as a duplicate (already logged today). */
  alreadyLogged: boolean;
  error?: string;
}

/**
 * Records a parent action, computes combo, awards XP to the parent,
 * and (if combo) to the athlete via the RPC.
 *
 * Idempotent by day: re-calling for the same (parent, athlete, action,
 * date) returns `alreadyLogged: true` with 0 XP so callers can safely
 * retry on flaky networks or duplicate clicks.
 */
export async function logParentAction(params: {
  parentAccountId: string;
  athleteAccountId: string;
  actionType: ParentActionType;
}): Promise<LogParentActionResult> {
  if (!supabase) return { awardedXp: 0, combo: false, alreadyLogged: false, error: "Sync not configured." };

  const date = todayISO();
  const combo = await didAthleteActToday(params.athleteAccountId, date);
  const baseXp = BASE_XP[params.actionType];
  const comboXp = combo ? PARENT_COMBO_BONUS : 0;

  const { error } = await supabase.from("parent_actions").insert({
    parent_account_id: params.parentAccountId,
    athlete_account_id: params.athleteAccountId,
    action_type: params.actionType,
    date,
    xp_earned: baseXp,
    combo,
    combo_xp: comboXp,
  });

  if (error) {
    // Unique violation → already logged today. Not an error from the
    // caller's perspective; they've already been credited.
    if (error.code === "23505") {
      return { awardedXp: 0, combo: false, alreadyLogged: true };
    }
    return { awardedXp: 0, combo: false, alreadyLogged: false, error: error.message };
  }

  // Combo bonus to the athlete — fire-and-forget; if the RPC fails the
  // parent is still credited. The RPC enforces connection + xp bounds.
  if (combo) {
    const reasonMap: Record<ParentActionType, string> = {
      check_in: "Your parent checked in on you",
      playbook: "Your parent took a supporting action",
      cheer: "Your parent cheered for you",
      daily_review: "Your parent reviewed your day",
    };
    supabase.rpc("grant_athlete_combo_xp", {
      p_athlete: params.athleteAccountId,
      p_xp: ATHLETE_COMBO_BONUS,
      p_reason: reasonMap[params.actionType],
    }).then(() => {}, () => {});
  }

  return {
    awardedXp: baseXp + comboXp,
    combo,
    alreadyLogged: false,
  };
}

/**
 * Total parent XP across all athletes the parent supports. Summed
 * server-side by the client fetching the ledger; for current tester
 * volumes (dozens of rows) this is fine. If it grows, swap to a
 * materialized view or a running total column on accounts.
 */
export async function fetchParentXpTotal(parentAccountId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("parent_actions")
    .select("xp_earned, combo_xp")
    .eq("parent_account_id", parentAccountId);
  if (error || !data) return 0;
  let total = 0;
  for (const row of data as Array<{ xp_earned: number; combo_xp: number }>) {
    total += (row.xp_earned ?? 0) + (row.combo_xp ?? 0);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Athlete side — combo XP gifts to show as toasts
// ---------------------------------------------------------------------------

export interface AthleteXpGift {
  id: string;
  xp: number;
  reason: string;
  from_role: "coach" | "parent";
  from_account_id: string;
  created_at: string;
}

export async function fetchUnseenAthleteXpGifts(
  athleteAccountId: string
): Promise<AthleteXpGift[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("athlete_xp_gifts")
    .select("id, xp, reason, from_role, from_account_id, created_at")
    .eq("athlete_account_id", athleteAccountId)
    .is("seen_at", null)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as AthleteXpGift[];
}

export async function markAthleteXpGiftSeen(giftId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("athlete_xp_gifts")
    .update({ seen_at: new Date().toISOString() })
    .eq("id", giftId);
}

// ---------------------------------------------------------------------------
// Support level — mirrors athlete level curve but tuned softer. Parents
// earn 5-15 XP per action and do fewer per day, so the curve needs to
// reward smaller totals meaningfully.
// ---------------------------------------------------------------------------

const SUPPORT_TITLES = [
  "New Supporter",
  "Reliable Cheerleader",
  "Game-Day Regular",
  "Trusted Voice",
  "Pillar of Support",
  "All-In Supporter",
  "Championship Parent",
  "Legend in the Stands",
];

export interface SupportLevelInfo {
  level: number;
  title: string;
  xpForThisLevel: number;
  xpForNextLevel: number;
  progressPct: number;
}

/** Cumulative XP required to reach a given support level. */
export function xpForSupportLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    // Level 2: 30, Level 3: 75, Level 4: 135, ...
    total += 20 + (i - 1) * 10;
  }
  return total;
}

export function computeSupportLevel(xp: number): SupportLevelInfo {
  let level = 1;
  while (xpForSupportLevel(level + 1) <= xp) level++;
  const xpForThisLevel = xpForSupportLevel(level);
  const xpForNextLevel = xpForSupportLevel(level + 1);
  const span = xpForNextLevel - xpForThisLevel;
  const progressPct =
    span > 0
      ? Math.round(((xp - xpForThisLevel) / span) * 100)
      : 100;
  const title =
    SUPPORT_TITLES[Math.min(level - 1, SUPPORT_TITLES.length - 1)];
  return { level, title, xpForThisLevel, xpForNextLevel, progressPct };
}
