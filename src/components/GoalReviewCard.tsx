import { useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "./RewardToast";
import type { MentalCheckin } from "../types";
import { Target, Check, X } from "lucide-react";

interface Props {
  checkin: MentalCheckin;
}

/**
 * End-of-day prompt asking the athlete whether they hit the goal they
 * set earlier in their mental check-in. Shown when a check-in has a goal
 * but `goalMet` hasn't been filled in yet.
 */
export default function GoalReviewCard({ checkin }: Props) {
  const { reviewGoal } = useStore();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState<"met" | "not-met" | null>(
    null
  );

  function submit(met: boolean) {
    setSubmitting(met ? "met" : "not-met");
    const { awardedXp, newlyUnlocked } = reviewGoal(
      checkin.id,
      met,
      note.trim() || undefined
    );
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-5 shadow-elevated animate-slide-up">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <Target size={16} />
          </div>
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-200">
            End-of-Day Review
          </div>
        </div>

        <div className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
          Today&apos;s goal was
        </div>
        <blockquote className="text-base font-bold leading-snug">
          &ldquo;{checkin.goal}&rdquo;
        </blockquote>

        <div className="mt-4">
          <div className="text-xs text-white/80 font-semibold mb-2">
            Did you hit it?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => submit(true)}
              disabled={submitting !== null}
              className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.97] disabled:opacity-50"
            >
              <Check size={16} strokeWidth={3} /> Yes, hit it
            </button>
            <button
              onClick={() => submit(false)}
              disabled={submitting !== null}
              className="py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.97] hover:bg-white/15 disabled:opacity-50"
            >
              <X size={16} strokeWidth={3} /> Not quite
            </button>
          </div>

          <div className="mt-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional: one note about how it went"
              className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 outline-none"
            />
          </div>

          <p className="text-[11px] text-white/50 mt-2">
            +10 XP for reviewing — process over perfection.
          </p>
        </div>
      </div>
    </div>
  );
}
