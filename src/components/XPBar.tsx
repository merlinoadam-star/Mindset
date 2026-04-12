import type { LevelInfo } from "../lib/gamification";
import { Zap } from "lucide-react";

interface Props {
  xp: number;
  info: LevelInfo;
}

export default function XPBar({ xp, info }: Props) {
  const xpIntoLevel = xp - info.xpForThisLevel;
  const xpNeeded = info.xpForNextLevel - info.xpForThisLevel;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-5 shadow-elevated">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">
              Level {info.level}
            </span>
          </div>
          <div className="text-xl font-extrabold mt-1.5">{info.title}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tabular-nums">{xp}</div>
          <div className="text-xs font-semibold text-white/60">Total XP</div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="h-3 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, info.progressPct)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-white/70">
          <span className="tabular-nums">
            {xpIntoLevel} / {xpNeeded} XP
          </span>
          <span>Next: Level {info.level + 1}</span>
        </div>
      </div>
    </div>
  );
}
