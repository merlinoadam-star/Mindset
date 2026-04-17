import { useState } from "react";
import { Heart, Target, Users, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { postFeedback } from "../lib/feedbackSync";
import { setWeeklyFocus } from "../lib/weeklyFocusSync";

/**
 * Phase G — bulk actions from the coach/parent dashboard. Cheer the
 * whole team or set one weekly focus for every connected athlete at
 * once.
 */

const CHEER_PRESETS = [
  "Proud of all of you!",
  "Great effort this week — keep going!",
  "Let's have a great practice today.",
  "You've got this.",
];

export default function TeamBulkActions({
  athleteIds,
}: {
  athleteIds: string[];
}) {
  const { account } = useAuth();
  const [mode, setMode] = useState<"idle" | "cheer" | "focus">("idle");
  const [customCheer, setCustomCheer] = useState("");
  const [focusText, setFocusText] = useState("");
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (
    !account ||
    (account.role !== "coach" && account.role !== "parent") ||
    athleteIds.length < 2
  ) {
    return null;
  }

  const sendCheerToAll = async (text: string) => {
    if (!text.trim() || working) return;
    setWorking(true);
    setErr(null);
    const results = await Promise.allSettled(
      athleteIds.map((id) =>
        postFeedback({
          athleteId: id,
          authorId: account.id,
          authorRole: account.role,
          targetType: "cheer",
          targetId: id,
          text: text.trim(),
        })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setWorking(false);
    if (failed > 0) {
      setErr(`${failed} of ${athleteIds.length} failed to send.`);
    } else {
      setDone(`Cheer sent to all ${athleteIds.length} athletes!`);
      setMode("idle");
      setCustomCheer("");
      window.setTimeout(() => setDone(null), 2500);
    }
  };

  const sendFocusToAll = async () => {
    const text = focusText.trim();
    if (!text || working) return;
    setWorking(true);
    setErr(null);
    const results = await Promise.allSettled(
      athleteIds.map((id) =>
        setWeeklyFocus({
          athleteId: id,
          authorId: account.id,
          authorRole: account.role,
          text,
        })
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setWorking(false);
    if (failed > 0) {
      setErr(`${failed} of ${athleteIds.length} failed.`);
    } else {
      setDone(`Focus set for all ${athleteIds.length} athletes!`);
      setMode("idle");
      setFocusText("");
      window.setTimeout(() => setDone(null), 2500);
    }
  };

  if (done) {
    return (
      <div className="card bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm font-semibold flex items-center gap-2">
        <Check size={16} strokeWidth={3} /> {done}
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-slate-500" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Team actions
          </div>
          <span className="text-[11px] text-slate-500">
            · sends to all {athleteIds.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("cheer")}
            className="rounded-xl border border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 hover:bg-pink-100 dark:hover:bg-pink-900"
          >
            <Heart size={13} /> Cheer everyone
          </button>
          <button
            onClick={() => setMode("focus")}
            className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <Target size={13} /> Focus for all
          </button>
        </div>
      </div>
    );
  }

  if (mode === "cheer") {
    return (
      <div className="card bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-pink-600 dark:text-pink-400" />
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Cheer {athleteIds.length} athletes
            </div>
          </div>
          <button
            onClick={() => setMode("idle")}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
          >
            Cancel
          </button>
        </div>
        <div className="space-y-1.5 mb-3">
          {CHEER_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => sendCheerToAll(p)}
              disabled={working}
              className="w-full text-left rounded-lg border border-pink-200 dark:border-pink-900 bg-white dark:bg-slate-900 hover:border-pink-300 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={customCheer}
          onChange={(e) => setCustomCheer(e.target.value)}
          placeholder="Or write your own..."
          rows={2}
          maxLength={200}
          className="w-full text-sm bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-900 rounded-xl px-3 py-2 resize-none"
        />
        <button
          onClick={() => sendCheerToAll(customCheer)}
          disabled={!customCheer.trim() || working}
          className="btn-primary w-full mt-2 !py-2 !text-xs disabled:opacity-50"
        >
          {working ? "Sending..." : `Send to all ${athleteIds.length}`}
        </button>
        {err && (
          <div className="text-xs text-red-600 mt-2 font-medium">{err}</div>
        )}
      </div>
    );
  }

  // focus mode
  return (
    <div className="card bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target size={14} className="text-amber-700 dark:text-amber-400" />
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Focus for all {athleteIds.length}
          </div>
        </div>
        <button
          onClick={() => setMode("idle")}
          className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
        >
          Cancel
        </button>
      </div>
      <textarea
        value={focusText}
        onChange={(e) => setFocusText(e.target.value)}
        placeholder="e.g. Work on pin combos this week"
        rows={2}
        maxLength={240}
        autoFocus
        className="w-full text-sm bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2 resize-none"
      />
      <button
        onClick={sendFocusToAll}
        disabled={!focusText.trim() || working}
        className="btn-primary w-full mt-2 !py-2 !text-xs disabled:opacity-50"
      >
        {working ? "Setting..." : `Set for all ${athleteIds.length}`}
      </button>
      {err && <div className="text-xs text-red-600 mt-2 font-medium">{err}</div>}
    </div>
  );
}
