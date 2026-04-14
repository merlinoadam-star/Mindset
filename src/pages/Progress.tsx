import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Flame, CheckSquare, Trophy } from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel, computeStreak } from "../lib/gamification";
import { summary } from "../lib/progressAnalytics";
import ActivityHeatmap from "../components/charts/ActivityHeatmap";
import XpLineChart from "../components/charts/XpLineChart";
import WeekdayChart from "../components/charts/WeekdayChart";
import MatchStatsCard from "../components/charts/MatchStatsCard";

/**
 * Phase 4D — the athlete's "See Your Progress" view. Pure read-only
 * rollup of whatever's already in local state. No network calls.
 */
export default function ProgressPage() {
  const { state } = useStore();
  const stats = useMemo(() => summary(state), [state]);

  if (!state.profile) return null;

  const level = computeLevel(state.xp, state.profile.sport);
  const streak = computeStreak(state);

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center">
            <TrendingUp size={18} />
          </div>
          <div>
            <h1 className="page-title">Your Progress</h1>
            <p className="text-xs text-slate-500">
              Everything you&apos;ve built so far.
            </p>
          </div>
        </div>
      </header>

      {/* Headline stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={<TrendingUp size={14} />}
          label="Level"
          value={level.level}
          sub={level.title}
          tint="brand"
        />
        <Stat
          icon={<Flame size={14} />}
          label="Current streak"
          value={streak}
          sub={
            stats.longestStreak > streak
              ? `Best: ${stats.longestStreak} days`
              : streak > 0
              ? "Keep it going!"
              : "Log today to start"
          }
          tint="amber"
        />
        <Stat
          icon={<CheckSquare size={14} />}
          label="Last 30 days"
          value={`${stats.activeDays30}/${stats.totalDays30}`}
          sub={`${stats.consistencyPct}% consistent`}
          tint="emerald"
        />
        <Stat
          icon={<Trophy size={14} />}
          label="Total XP"
          value={state.xp}
          sub={`${stats.totalHabits} habits · ${stats.totalPractices} practices`}
          tint="purple"
        />
      </div>

      <ActivityHeatmap state={state} weeks={13} />

      <XpLineChart state={state} days={30} />

      <WeekdayChart state={state} />

      <MatchStatsCard state={state} />

      <div className="text-center text-xs text-slate-400 pt-2 pb-6">
        All computed on-device from your logged data.
      </div>
    </div>
  );
}

const TINTS: Record<
  "brand" | "amber" | "emerald" | "purple",
  { bg: string; icon: string; num: string }
> = {
  brand: { bg: "from-brand-50", icon: "text-brand-600", num: "text-brand-700" },
  amber: { bg: "from-amber-50", icon: "text-amber-600", num: "text-amber-700" },
  emerald: {
    bg: "from-emerald-50",
    icon: "text-emerald-600",
    num: "text-emerald-700",
  },
  purple: {
    bg: "from-purple-50",
    icon: "text-purple-600",
    num: "text-purple-700",
  },
};

function Stat({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  return (
    <div className={`card bg-gradient-to-br ${t.bg} to-white`}>
      <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${t.icon}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-extrabold tabular-nums mt-1 ${t.num}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
          {sub}
        </div>
      )}
    </div>
  );
}
