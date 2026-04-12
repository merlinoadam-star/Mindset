import { Flame } from "lucide-react";

interface Props {
  streak: number;
  alive: boolean;
}

export default function StreakBadge({ streak, alive }: Props) {
  const active = alive && streak > 0;
  return (
    <div
      className={`card flex items-center gap-3 ${
        active ? "!bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-glow-amber" : ""
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
      <div>
        <div className="text-2xl font-extrabold tabular-nums leading-none text-slate-900">
          {streak}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-medium">
          Day Streak
        </div>
      </div>
    </div>
  );
}
