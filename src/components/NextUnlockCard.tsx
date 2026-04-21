import { Lock } from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel, xpForLevel } from "../lib/gamification";
import { nextUnlocks } from "../lib/unlocks";

/**
 * Small teaser card showing the athlete's next non-hidden unlock
 * plus XP-to-go. Silently renders nothing when:
 *   - no profile (pre-onboarding)
 *   - the athlete has already earned every registered unlock
 *
 * Hidden-until-earned cosmetics are filtered out so they stay a
 * surprise.
 */
export default function NextUnlockCard() {
  const { state } = useStore();
  if (!state.profile) return null;

  const { level } = computeLevel(state.xp, state.profile.sport);

  // Pull more than one so we can skip hidden items and still have
  // something to show.
  const candidates = nextUnlocks(level, 5).filter(
    (u) => !u.hiddenWhenLocked
  );
  const next = candidates[0];
  if (!next) return null;

  const xpNeeded = Math.max(0, xpForLevel(next.levelRequired) - state.xp);

  return (
    <div className="card !p-3 flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
        {next.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-300 flex items-center gap-1">
          <Lock size={10} strokeWidth={3} /> Up next
        </div>
        <div className="font-bold truncate">{next.label}</div>
        <div className="text-[11px] text-slate-400 truncate">
          {next.teaser}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
          Lvl {next.levelRequired}
        </div>
        <div className="text-sm font-extrabold text-brand-300 tabular-nums">
          {xpNeeded} XP
        </div>
      </div>
    </div>
  );
}
