import { useMemo } from "react";
import { Trophy, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { todaysChallenge } from "../lib/dailyChallenges";
import { showReward } from "./RewardToast";
import { fireConfetti } from "./Confetti";
import { hapticCelebrate } from "../lib/haptics";

/**
 * Phase G — daily challenge card on the dashboard. Shows today's
 * randomly-chosen challenge, live progress, and a claim button when
 * complete.
 */
export default function DailyChallengeCard() {
  const { state, hasClaimedChallengeToday, claimDailyChallenge } = useStore();

  const today = todayISO();
  const challenge = useMemo(() => todaysChallenge(today), [today]);
  const { done, progress } = useMemo(
    () => challenge.evaluate(state, today),
    [challenge, state, today]
  );

  if (!state.profile) return null;

  const claimed = hasClaimedChallengeToday;

  const handleClaim = () => {
    const { awardedXp, newlyUnlocked, alreadyClaimed, notDone } =
      claimDailyChallenge();
    if (alreadyClaimed || notDone) return;
    showReward(awardedXp, newlyUnlocked);
    fireConfetti(40);
    hapticCelebrate();
  };

  return (
    <div
      className={`card relative overflow-hidden ${
        claimed
          ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800"
          : done
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-white dark:from-amber-950 dark:via-orange-950 dark:to-slate-900 border-amber-300 dark:border-amber-700"
          : "bg-gradient-to-br from-brand-50 via-purple-50 to-white dark:from-brand-950 dark:via-purple-950 dark:to-slate-900 border-brand-200 dark:border-brand-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
            claimed
              ? "bg-emerald-500 text-white"
              : done
              ? "bg-amber-500 text-white animate-pulse"
              : "bg-gradient-to-br from-brand-500 to-purple-600 text-white"
          }`}
        >
          {claimed ? <Check size={22} strokeWidth={3} /> : challenge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[10px] uppercase tracking-wider font-bold text-brand-700 dark:text-brand-400">
              Today&apos;s Challenge
            </div>
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              +{challenge.xp} XP
            </div>
          </div>
          <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">
            {challenge.title}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
            {challenge.desc}
          </div>
        </div>
      </div>

      {/* Progress / claim button */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Progress
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
            {claimed ? "Claimed!" : progress}
          </div>
        </div>
        {claimed ? (
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
            <Trophy size={12} /> +{challenge.xp} XP
          </span>
        ) : done ? (
          <button
            onClick={handleClaim}
            className="btn-primary !py-2 !px-4 !text-xs inline-flex items-center gap-1.5"
          >
            <Trophy size={13} /> Claim {challenge.xp} XP
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 font-semibold">
            Keep going!
          </span>
        )}
      </div>
    </div>
  );
}
