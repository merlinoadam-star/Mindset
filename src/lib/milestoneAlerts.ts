import { supabase } from "./supabase";

/**
 * Phase 3A.3 — when the athlete crosses a milestone, fire a push to
 * every coach / parent they're connected to. Fire-and-forget; failures
 * are logged but don't affect the athlete's state.
 *
 * The edge function already dedupes per-device subscriptions by tag,
 * so rapid double-fires (e.g. React StrictMode re-runs) won't spam.
 */

async function fetchConnectedAccountIds(
  athleteId: string
): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("connections")
    .select("other_account_id")
    .eq("athlete_account_id", athleteId)
    .eq("status", "accepted");
  if (error) {
    console.error("fetch connections failed", error);
    return [];
  }
  return (data ?? []).map((r) => r.other_account_id as string);
}

async function pushToMany(
  accountIds: string[],
  title: string,
  body: string,
  tag: string,
  url: string,
  prefKey = "milestones"
): Promise<void> {
  if (!supabase || accountIds.length === 0) return;
  await Promise.all(
    accountIds.map((id) =>
      supabase!.functions
        .invoke("send-push", {
          body: { toAccountId: id, title, body, url, tag, prefKey },
        })
        .catch((e) => console.warn("send-push invoke failed", e))
    )
  );
}

export async function notifyConnectionsOfLevelUp(
  athleteId: string,
  athleteName: string,
  newLevel: number,
  newTitle: string
): Promise<void> {
  const ids = await fetchConnectedAccountIds(athleteId);
  if (ids.length === 0) return;
  await pushToMany(
    ids,
    "🎉 Level up!",
    `${athleteName} just hit Level ${newLevel} — ${newTitle}!`,
    `levelup-${athleteId}-${newLevel}`,
    `/athlete/${athleteId}`
  );
}

export async function notifyConnectionsOfStreak(
  athleteId: string,
  athleteName: string,
  days: number
): Promise<void> {
  const ids = await fetchConnectedAccountIds(athleteId);
  if (ids.length === 0) return;
  const label =
    days >= 30
      ? "🏆"
      : days >= 14
      ? "⚡"
      : days >= 7
      ? "🔥"
      : "✨";
  await pushToMany(
    ids,
    `${label} ${days}-day streak!`,
    `${athleteName} has been active ${days} days in a row.`,
    `streak-${athleteId}-${days}`,
    `/athlete/${athleteId}`
  );
}
