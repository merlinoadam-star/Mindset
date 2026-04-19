import { supabase } from "./supabase";
import { mondayISO } from "./weeklyChallenge";

/**
 * Team weekly leaderboard sync layer.
 *
 * Athletes bump their own row on every game-XP earn via
 * `add_weekly_game_xp` RPC. Coaches/parents fetch the current
 * week's rows for their connected athletes.
 *
 * The week key is computed client-side (Monday of the local week)
 * so athletes whose Sunday-evening session crosses midnight don't
 * leak XP into the next week via server timezone mismatch.
 */

export interface LeaderboardEntry {
  athleteAccountId: string;
  displayName: string;
  xp: number;
}

/**
 * Fire-and-forget increment of this athlete's weekly game XP.
 * Called after any mini-game round awards XP. Swallows all errors
 * — the leaderboard is a nice-to-have, not a critical path.
 */
export function recordWeeklyGameXp(xp: number): void {
  if (!supabase || xp <= 0) return;
  const week = mondayISO();
  supabase
    .rpc("add_weekly_game_xp", { p_week: week, p_xp: xp })
    .then(() => {}, () => {});
}

/**
 * Fetch this week's leaderboard entries for the given athlete ids.
 * Returns only athletes with a row (xp > 0); callers can add zeroes
 * for connected athletes missing from the result if they want a
 * complete roster.
 */
export async function fetchTeamWeeklyLeaderboard(
  athleteAccountIds: string[]
): Promise<LeaderboardEntry[]> {
  if (!supabase || athleteAccountIds.length === 0) return [];
  const week = mondayISO();

  const { data: rows, error } = await supabase
    .from("athlete_weekly_game_xp")
    .select("athlete_account_id, xp")
    .in("athlete_account_id", athleteAccountIds)
    .eq("week_iso", week);
  if (error || !rows) return [];

  // Fetch display names in one round trip. The accounts RLS already
  // permits reading co-connected athletes (added in adult_chats.sql).
  const { data: accts } = await supabase
    .from("accounts")
    .select("id, display_name")
    .in("id", athleteAccountIds);
  const nameMap = new Map<string, string>(
    (accts ?? []).map((a) => [a.id, a.display_name ?? ""])
  );

  return (rows as Array<{ athlete_account_id: string; xp: number }>)
    .map((r) => ({
      athleteAccountId: r.athlete_account_id,
      displayName: nameMap.get(r.athlete_account_id) ?? "Athlete",
      xp: r.xp ?? 0,
    }))
    .sort((a, b) => b.xp - a.xp);
}
