import { useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";
import {
  DEFAULT_PREFS,
  fetchNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
  type PrefKey,
} from "../lib/notificationPrefs";
import { SlidersHorizontal } from "lucide-react";

/**
 * Phase 3B.5 — Notification preferences toggle card.
 *
 * Sits alongside the push-subscription card. Lets the user pick which
 * kinds of pushes they actually want — handy once they've got cheers,
 * notes, weekly focus, and milestone alerts all firing.
 */

// Different labels per role since different notifications apply.
const LABELS_ATHLETE: Array<{
  key: PrefKey;
  title: string;
  desc: string;
}> = [
  {
    key: "notes",
    title: "Coach & parent notes",
    desc: "When someone writes a note on your match, video, or practice.",
  },
  {
    key: "cheers",
    title: "Cheers from coach & parent",
    desc: "One-tap encouragement like \"Proud of you today!\"",
  },
  {
    key: "weeklyFocus",
    title: "Weekly focus updates",
    desc: "When your coach or parent sets a new weekly focus.",
  },
  {
    key: "matchReminders",
    title: "Match-day reminders",
    desc: "Get a push the evening before and the morning of a scheduled match.",
  },
];

const LABELS_COACH_PARENT: Array<{
  key: PrefKey;
  title: string;
  desc: string;
}> = [
  {
    key: "milestones",
    title: "Athlete milestones",
    desc: "Level-ups and streak milestones from athletes you're connected to.",
  },
];

export default function NotificationPrefsCard() {
  const { user, account, configured } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PrefKey | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const p = await fetchNotificationPrefs(user.id);
      setPrefs(p);
      setLoading(false);
    })();
  }, [user]);

  if (!configured || !user || !account) return null;

  const items =
    account.role === "athlete" ? LABELS_ATHLETE : LABELS_COACH_PARENT;

  const toggle = async (key: PrefKey) => {
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSaving(key);
    const { error } = await updateNotificationPrefs(user.id, { [key]: next });
    setSaving(null);
    if (error) {
      // Roll back on failure
      setPrefs((p) => ({ ...p, [key]: !next }));
      console.warn("Failed to update pref", key, error);
    }
  };

  return (
    <div className="card">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center flex-shrink-0">
          <SlidersHorizontal size={18} />
        </div>
        <div>
          <div className="font-bold text-slate-900">Notification Types</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Pick which pushes you want to receive.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  {item.desc}
                </div>
              </div>
              <Toggle
                checked={prefs[item.key]}
                onChange={() => toggle(item.key)}
                disabled={saving === item.key}
              />
            </label>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-3 leading-snug">
        Applies to all your devices. Turning something off here stops the push
        before it gets sent — you can still see the update in the app.
      </p>
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
