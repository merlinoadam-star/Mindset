import { Flame, Snowflake, Zap } from "lucide-react";
import { getStreakMultiplier } from "../lib/gamification";
import { useTapEasterEgg } from "./EasterEggs";

interface Props {
  streak: number;
  alive: boolean;
  freezes?: number;
}

export default function StreakBadge({ streak, alive, freezes = 0 }: Props) {
  const active = alive && streak > 0;
  const mult = getStreakMultiplier(streak);
  const showMultiplier = mult.multiplier > 1;
  const { onTap } = useTapEasterEgg(5, 2000);

  return (
    <div
      onClick={onTap}
      className={`card flex items-center gap-3 cursor-pointer select-none ${
        active
          ? "!bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800 shadow-glow-amber"
          : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          active
            ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md"
            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
        }`}
      >
        <Flame size={24} strokeWidth={2.25} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-extrabold tabular-nums leading-none text-slate-900 dark:text-white">
          {streak}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          Day Streak
        </div>
        {showMultiplier && (
          <div
            className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
              mult.tier === "blazing"
                ? "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                : mult.tier === "hot"
                ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                : "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
            }`}
          >
            <Zap size={9} />
            {mult.label} XP
            {mult.nextAt && (
              <span className="font-normal opacity-70 ml-0.5">
                · {mult.nextAt}d for next
              </span>
            )}
          </div>
        )}
      </div>
      {freezes > 0 && (
        <div
          className="flex flex-col items-center gap-0.5 pl-1"
          title="Streak Freezes — protect your streak on missed days"
        >
          <div className="flex items-center gap-0.5">
            <Snowflake size={14} className="text-sky-500" />
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 tabular-nums">
              {freezes}
            </span>
          </div>
          <div className="text-[9px] text-sky-500 font-semibold uppercase tracking-wider">
            Freeze{freezes === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}
