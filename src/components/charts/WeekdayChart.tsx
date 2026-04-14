import { useMemo } from "react";
import { activityByWeekday } from "../../lib/progressAnalytics";
import type { AppState } from "../../types";

/**
 * Bar chart: which days of the week are you most active on? Useful for
 * spotting "I never log anything on Saturday" patterns.
 */
export default function WeekdayChart({ state }: { state: AppState }) {
  const stats = useMemo(() => activityByWeekday(state), [state]);
  const maxTotal = Math.max(1, ...stats.map((s) => s.total));

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-slate-900">By day of week</h3>
        <span className="text-xs text-slate-500">All time</span>
      </div>
      <div className="space-y-1.5">
        {stats.map((s) => {
          const pct = Math.round((s.total / maxTotal) * 100);
          return (
            <div key={s.day} className="flex items-center gap-2">
              <span className="w-10 text-[11px] font-bold text-slate-500 uppercase">
                {s.label}
              </span>
              <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-md transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 font-semibold tabular-nums w-8 text-right">
                {s.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
