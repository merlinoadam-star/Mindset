import { useMemo } from "react";
import { activityByDay, addDays, isoDate } from "../../lib/progressAnalytics";
import type { AppState } from "../../types";

/**
 * GitHub-style contribution grid. Shows activity intensity per day for
 * the last `weeks` weeks. Columns = weeks, rows = days of week.
 */
export default function ActivityHeatmap({
  state,
  weeks = 13,
}: {
  state: AppState;
  weeks?: number;
}) {
  const cells = useMemo(() => {
    const map = activityByDay(state);
    const totalDays = weeks * 7;
    const end = new Date();
    // Align to Saturday so the last column ends on Saturday (full week).
    end.setDate(end.getDate() + (6 - end.getDay()));
    const start = addDays(end, -(totalDays - 1));
    const out: Array<{ date: string; total: number; future: boolean }> = [];
    const today = isoDate(new Date());
    const cur = new Date(start);
    for (let i = 0; i < totalDays; i++) {
      const date = isoDate(cur);
      const a = map.get(date);
      out.push({
        date,
        total: a?.total ?? 0,
        future: date > today,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [state, weeks]);

  // Scale: 0, 1, 2, 3, 4+ → color intensity
  const colorFor = (total: number, future: boolean) => {
    if (future) return "bg-slate-50";
    if (total === 0) return "bg-slate-100";
    if (total <= 2) return "bg-brand-200";
    if (total <= 4) return "bg-brand-400";
    if (total <= 6) return "bg-brand-600";
    return "bg-brand-800";
  };

  // Render as a CSS grid: columns = weeks, rows = days. The cells array
  // is day-ordered (Sun row → Sat row, first week → last week).
  const columns: (typeof cells)[] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, (w + 1) * 7));
  }

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-slate-900">Activity heatmap</h3>
        <span className="text-xs text-slate-500">Last {weeks} weeks</span>
      </div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {columns.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.total} activit${
                  cell.total === 1 ? "y" : "ies"
                }`}
                className={`w-3 h-3 rounded-sm ${colorFor(cell.total, cell.future)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded-sm bg-slate-100" />
        <div className="w-2.5 h-2.5 rounded-sm bg-brand-200" />
        <div className="w-2.5 h-2.5 rounded-sm bg-brand-400" />
        <div className="w-2.5 h-2.5 rounded-sm bg-brand-600" />
        <div className="w-2.5 h-2.5 rounded-sm bg-brand-800" />
        <span>More</span>
      </div>
    </div>
  );
}
