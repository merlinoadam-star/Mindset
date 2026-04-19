import { useEffect, useMemo } from "react";
import { Sparkles, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { showReward } from "./RewardToast";
import {
  challengeForWeek,
  mondayISO,
  progressFor,
  rollWeeklyChallenge,
} from "../lib/weeklyChallenge";

/**
 * Dashboard card for the weekly cross-game challenge. Reads the
 * challenge for the current week, computes live progress, and lets
 * the athlete claim XP once the target is reached. The card auto-
 * hides after claim; reappears on the next ISO-week Monday.
 *
 * First render of a new week: the component calls claim (which is a
 * no-op if not complete) as a cheap way to trigger a re-snapshot of
 * the week's starting counters. The store-side `rollWeeklyChallenge`
 * handles that atomically.
 */
export default function WeeklyChallengeCard() {
  const { state, claimWeeklyChallenge } = useStore();

  // Ensure the snapshot is up to date on mount / week roll. Calling
  // claim when nothing is claimable is a no-op, but the setState
  // inside does roll the snapshot. We only want this to run once.
  useEffect(() => {
    if (!state.weeklyChallenge || state.weeklyChallenge.weekIso !== mondayISO()) {
      claimWeeklyChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wc = state.weeklyChallenge;

  const { challenge, progress, complete, claimed } = useMemo(() => {
    const effective = wc && wc.weekIso === mondayISO()
      ? wc
      : rollWeeklyChallenge(state, wc);
    const ch = challengeForWeek(effective.weekIso);
    const p = progressFor(ch, state, effective.snapshot);
    return {
      challenge: ch,
      progress: p,
      complete: p >= ch.target,
      claimed: effective.claimed,
    };
  }, [state, wc]);

  // Don't show the card once claimed — re-appears next Monday.
  if (claimed) return null;

  const handleClaim = () => {
    const { awardedXp } = claimWeeklyChallenge();
    if (awardedXp > 0) {
      showReward(awardedXp, [`__combo__Weekly Challenge: ${challenge.title}`]);
    }
  };

  const pct = Math.min(100, Math.round((progress / challenge.target) * 100));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-brand-200 dark:border-brand-900 bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-950/40 dark:to-amber-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-700 dark:text-brand-300 flex items-center gap-1">
            <span>{challenge.emoji}</span> Weekly Challenge
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
            {challenge.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug mt-1">
            {challenge.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 bg-white/60 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  complete
                    ? "bg-gradient-to-r from-emerald-500 to-green-500"
                    : "bg-gradient-to-r from-brand-500 to-amber-500"
                }`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300">
                {progress} / {challenge.target}
              </span>
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                +{challenge.xpReward} XP
              </span>
            </div>
          </div>

          {complete && (
            <button
              onClick={handleClaim}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Check size={14} strokeWidth={3} /> Claim +{challenge.xpReward} XP
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
