import { useState } from "react";
import { Heart, Check } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { postFeedback } from "../lib/feedbackSync";
import { logParentAction } from "../lib/parentXpSync";
import { showReward } from "./RewardToast";

/**
 * Phase 3A.2 — one-tap encouragement. Coach / parent picks a preset
 * phrase (or writes their own); a push fires and the cheer lands in the
 * athlete's feedback inbox.
 */

const PRESETS: Array<{ emoji: string; text: string }> = [
  { emoji: "💪", text: "So proud of you today!" },
  { emoji: "🔥", text: "Great effort — keep going!" },
  { emoji: "⚡", text: "You've got this!" },
  { emoji: "🏆", text: "Champion mindset!" },
  { emoji: "❤️", text: "Love watching you grow." },
  { emoji: "🎯", text: "Stay focused — you're on track." },
];

export default function CheerButtons({ athleteId }: { athleteId: string }) {
  const { account } = useAuth();
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!account || (account.role !== "coach" && account.role !== "parent")) {
    return null;
  }

  const send = async (text: string) => {
    setSending(text);
    setErr(null);
    const { error } = await postFeedback({
      athleteId,
      authorId: account.id,
      authorRole: account.role,
      targetType: "cheer",
      targetId: athleteId, // stable sentinel so the not-null constraint is satisfied
      text,
    });
    setSending(null);
    if (error) {
      setErr(error);
      return;
    }
    setSent(text);
    window.setTimeout(() => setSent(null), 2000);
    // Award XP to parents for sending a cheer. Coaches are out of
    // scope for this pass. The DB caps at one cheer award per
    // (parent, athlete, day).
    if (account.role === "parent") {
      logParentAction({
        parentAccountId: account.id,
        athleteAccountId: athleteId,
        actionType: "cheer",
      }).then((res) => {
        if (res.awardedXp > 0) {
          showReward(
            res.awardedXp,
            res.combo ? ["__combo__Combo with your athlete!"] : []
          );
        }
      });
    }
  };

  const handleCustomSubmit = async () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    await send(trimmed);
    setCustom("");
    setShowCustom(false);
  };

  return (
    <div className="card bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/40 dark:to-rose-950/40 border-pink-200 dark:border-pink-900">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center">
          <Heart size={16} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-pink-700 dark:text-pink-300">
            Send a Cheer
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            One tap, instant encouragement
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => {
          const isSending = sending === p.text;
          const justSent = sent === p.text;
          return (
            <button
              key={p.text}
              onClick={() => send(p.text)}
              disabled={Boolean(sending)}
              className={`text-left p-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                justSent
                  ? "bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-200"
                  : "bg-white dark:bg-slate-800 border-pink-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50"
              }`}
            >
              <div className="text-xl mb-0.5">{p.emoji}</div>
              <div className="leading-snug">
                {justSent ? (
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Check size={12} /> Sent!
                  </span>
                ) : isSending ? (
                  "Sending..."
                ) : (
                  p.text
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showCustom ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Write your own cheer..."
            rows={2}
            maxLength={200}
            className="w-full text-sm bg-white border border-pink-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowCustom(false);
                setCustom("");
              }}
              className="text-xs text-slate-500 font-medium px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!custom.trim() || Boolean(sending)}
              onClick={handleCustomSubmit}
              className="btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="mt-2 w-full text-xs font-medium text-pink-700 hover:text-pink-900 py-1.5"
        >
          + Write my own
        </button>
      )}

      {err && (
        <div className="text-xs text-red-600 mt-2 font-medium">{err}</div>
      )}
    </div>
  );
}
