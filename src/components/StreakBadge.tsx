import { Flame } from "lucide-react";

interface Props {
  streak: number;
  alive: boolean;
}

export default function StreakBadge({ streak, alive }: Props) {
  return (
    <div
      className={`card flex items-center gap-3 ${
        alive && streak > 0
          ? "border-orange-200 bg-orange-50"
          : ""
      }`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${
          alive && streak > 0
            ? "bg-orange-500 text-white"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        <Flame size={26} strokeWidth={2.25} />
      </div>
      <div>
        <div className="text-2xl font-extrabold tabular-nums leading-none">
          {streak}
        </div>
        <div className="text-xs text-slate-600 mt-1">
          {streak === 1 ? "Day Streak" : "Day Streak"}
        </div>
      </div>
    </div>
  );
}
