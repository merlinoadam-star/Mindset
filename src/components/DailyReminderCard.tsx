import { useEffect, useState } from "react";
import { AlarmClock, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  DEFAULT_REMINDER,
  fetchDailyReminder,
  formatHour,
  guessTimezone,
  updateDailyReminder,
  type DailyReminderSettings,
} from "../lib/dailyReminder";

/**
 * Settings card for the server-scheduled daily reminder push.
 * Athletes only — coaches/parents don't need a daily nudge.
 */
export default function DailyReminderCard() {
  const { user, account, configured } = useAuth();
  const [settings, setSettings] = useState<DailyReminderSettings>(
    DEFAULT_REMINDER
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const s = await fetchDailyReminder(user.id);
      setSettings(s);
      setLoading(false);
    })();
  }, [user]);

  if (!configured || !user || !account || account.role !== "athlete")
    return null;

  const save = async (partial: Partial<DailyReminderSettings>) => {
    if (!user) return;
    const next = { ...settings, ...partial };
    setSettings(next);
    setSaving(true);
    setErr(null);
    // When enabling for the first time, also lock in current timezone.
    const payload = { ...partial };
    if (partial.enabled && !settings.timezone) {
      payload.timezone = guessTimezone();
      next.timezone = payload.timezone;
      setSettings(next);
    }
    const { error } = await updateDailyReminder(user.id, payload);
    setSaving(false);
    if (error) {
      setErr(error);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0">
          <AlarmClock size={18} />
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900">Daily Reminder</div>
          <div className="text-xs text-slate-500 mt-0.5 leading-snug">
            A gentle push when you haven&apos;t logged anything yet for the day.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading...</div>
      ) : (
        <>
          <label className="flex items-start gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                Turn on daily reminder
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Only fires if you haven&apos;t logged anything that day.
              </div>
            </div>
            <Toggle
              checked={settings.enabled}
              onChange={() => save({ enabled: !settings.enabled })}
              disabled={saving}
            />
          </label>

          {settings.enabled && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Remind me at
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 12, 17, 20].map((h) => (
                    <button
                      key={h}
                      onClick={() => save({ hour: h })}
                      disabled={saving}
                      className={`py-2 rounded-xl border-2 text-xs font-bold transition ${
                        settings.hour === h
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      {formatHour(h)}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                    Or pick your own:
                    <select
                      value={settings.hour}
                      onChange={(e) => save({ hour: Number(e.target.value) })}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 text-xs px-2 py-1 font-semibold text-slate-700"
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-snug">
                Time zone:{" "}
                <span className="font-mono text-slate-700">
                  {settings.timezone}
                </span>
                <button
                  type="button"
                  onClick={() => save({ timezone: guessTimezone() })}
                  className="ml-2 text-brand-600 hover:text-brand-800 font-semibold"
                >
                  Use this device&apos;s zone
                </button>
              </div>
            </div>
          )}

          {saved && (
            <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <Check size={12} strokeWidth={3} /> Saved
            </div>
          )}
          {err && (
            <div className="mt-2 text-xs text-red-600 font-medium">{err}</div>
          )}
        </>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        checked ? "bg-brand-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
