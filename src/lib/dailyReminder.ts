import { supabase } from "./supabase";

/**
 * Phase 3C.4 — daily reminder config lives on accounts.
 */

export interface DailyReminderSettings {
  enabled: boolean;
  hour: number; // 0-23, athlete's local time
  timezone: string; // IANA
}

export const DEFAULT_REMINDER: DailyReminderSettings = {
  enabled: false,
  hour: 18,
  timezone: guessTimezone(),
};

export function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function fetchDailyReminder(
  accountId: string
): Promise<DailyReminderSettings> {
  if (!supabase) return DEFAULT_REMINDER;
  const { data, error } = await supabase
    .from("accounts")
    .select(
      "daily_reminder_enabled, daily_reminder_hour, daily_reminder_timezone"
    )
    .eq("id", accountId)
    .maybeSingle();
  if (error || !data) return DEFAULT_REMINDER;
  return {
    enabled: Boolean(data.daily_reminder_enabled),
    hour:
      typeof data.daily_reminder_hour === "number"
        ? data.daily_reminder_hour
        : 18,
    timezone: data.daily_reminder_timezone || guessTimezone(),
  };
}

export async function updateDailyReminder(
  accountId: string,
  updates: Partial<DailyReminderSettings>
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };
  const patch: Record<string, unknown> = {};
  if (updates.enabled !== undefined)
    patch.daily_reminder_enabled = updates.enabled;
  if (updates.hour !== undefined) patch.daily_reminder_hour = updates.hour;
  if (updates.timezone !== undefined)
    patch.daily_reminder_timezone = updates.timezone;

  const { error } = await supabase
    .from("accounts")
    .update(patch)
    .eq("id", accountId);
  if (error) return { error: error.message };
  return {};
}

/** Pretty-print a 0-23 hour as "7 AM" / "6 PM" etc. */
export function formatHour(hour: number): string {
  const h = hour % 24;
  const mer = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${mer}`;
}
