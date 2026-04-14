import { supabase } from "./supabase";

/**
 * Phase 3B.5 — per-user notification preferences.
 *
 * Lives as a JSONB column on accounts.notification_prefs. Keys default
 * to ON when absent, so clients can assume a new pref is enabled until
 * the user explicitly turns it off.
 */

export type PrefKey =
  | "notes"
  | "cheers"
  | "weeklyFocus"
  | "milestones"
  | "dailyReminder";

export type NotificationPrefs = Record<PrefKey, boolean>;

export const DEFAULT_PREFS: NotificationPrefs = {
  notes: true,
  cheers: true,
  weeklyFocus: true,
  milestones: true,
  dailyReminder: true,
};

export async function fetchNotificationPrefs(
  accountId: string
): Promise<NotificationPrefs> {
  if (!supabase) return DEFAULT_PREFS;
  const { data, error } = await supabase
    .from("accounts")
    .select("notification_prefs")
    .eq("id", accountId)
    .maybeSingle();
  if (error || !data) return DEFAULT_PREFS;
  const stored = (data.notification_prefs ?? {}) as Partial<NotificationPrefs>;
  return { ...DEFAULT_PREFS, ...stored };
}

export async function updateNotificationPrefs(
  accountId: string,
  updates: Partial<NotificationPrefs>
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };
  // Read → merge → write. Small enough that the race risk is fine.
  const current = await fetchNotificationPrefs(accountId);
  const merged: NotificationPrefs = { ...current, ...updates };
  const { error } = await supabase
    .from("accounts")
    .update({ notification_prefs: merged })
    .eq("id", accountId);
  if (error) return { error: error.message };
  return {};
}
