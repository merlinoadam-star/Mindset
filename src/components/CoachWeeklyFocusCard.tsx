import { useEffect, useState } from "react";
import { Target, Save, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  fetchWeeklyFocus,
  mondayOf,
  setWeeklyFocus,
  type WeeklyFocusRow,
} from "../lib/weeklyFocusSync";

/**
 * Coach / parent-side editor. Shows up on AthleteView for a connected
 * athlete; lets the author set (or replace) this week's focus.
 */
export default function CoachWeeklyFocusCard({
  athleteId,
}: {
  athleteId: string;
}) {
  const { account } = useAuth();
  const [existing, setExisting] = useState<WeeklyFocusRow | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isAuthor =
    account && (account.role === "coach" || account.role === "parent");

  const load = async () => {
    const r = await fetchWeeklyFocus(athleteId);
    setExisting(r);
    if (r) setText(r.text);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  if (!isAuthor || !account) return null;

  const dirty = text.trim() !== (existing?.text ?? "").trim();

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setErr("Focus can't be empty.");
      return;
    }
    setSaving(true);
    setErr(null);
    const { error } = await setWeeklyFocus({
      athleteId,
      authorId: account.id,
      authorRole: account.role,
      text: trimmed,
    });
    setSaving(false);
    if (error) {
      setErr(error);
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    load();
  };

  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
          <Target size={16} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
            Weekly Focus
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Week of {formatWeek(mondayOf())}
          </div>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What should they focus on this week? (e.g., Work on top position and pin combos)"
        rows={2}
        maxLength={240}
        className="w-full text-sm bg-white border border-amber-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-slate-500">
          {text.length}/240
          {existing && !dirty && (
            <span className="ml-2 text-slate-400">· Saved</span>
          )}
        </div>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className="btn-primary !py-1.5 !px-3 !text-xs inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? (
            <>
              <Check size={14} /> Sent!
            </>
          ) : (
            <>
              <Save size={14} /> {existing ? "Update" : "Send"}
            </>
          )}
        </button>
      </div>
      {err && (
        <div className="text-xs text-red-600 mt-2 font-medium">{err}</div>
      )}
    </div>
  );
}

function formatWeek(monday: string): string {
  try {
    const d = new Date(monday + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return monday;
  }
}
