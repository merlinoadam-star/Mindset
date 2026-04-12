import { Flame, Snowflake } from "lucide-react";

interface Props {
  streak: number;
  alive: boolean;
  freezes?: number;
}

export default function StreakBadge({ streak, alive, freezes = 0 }: Props) {
  const active = alive && streak > 0;
  return (
    <div
      className={`card flex items-center gap-3 ${
        active
          ? "!bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-glow-amber"
          : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
          active
            ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        <Flame size={24} strokeWidth={2.25} />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-extrabold tabular-nums leading-none text-slate-900">
          {streak}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          Day Streak
        </div>
      </div>
      {freezes > 0 && (
        <div
          className="flex flex-col items-center gap-0.5 pl-1"
          title="Streak Freezes — protect your streak on missed days"
        >
          <div className="flex items-center gap-0.5">
            <Snowflake size={14} className="text-sky-500" />
            <span className="text-xs font-bold text-sky-700 tabular-nums">
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
