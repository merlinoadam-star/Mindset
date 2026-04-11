import type { LevelInfo } from "../lib/gamification";

interface Props {
  xp: number;
  info: LevelInfo;
}

export default function XPBar({ xp, info }: Props) {
  const xpIntoLevel = xp - info.xpForThisLevel;
  const xpNeeded = info.xpForNextLevel - info.xpForThisLevel;

  return (
    <div className="card bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-75">
            Level {info.level}
          </div>
          <div className="text-2xl font-bold mt-0.5">{info.title}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tabular-nums">{xp}</div>
          <div className="text-xs opacity-75">Total XP</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${info.progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs opacity-90">
          <span>
            {xpIntoLevel} / {xpNeeded} XP
          </span>
          <span>Next: Level {info.level + 1}</span>
        </div>
      </div>
    </div>
  );
}
