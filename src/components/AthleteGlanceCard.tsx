import { useMemo } from "react";
import { Activity } from "lucide-react";
import type { DbAthleteRow } from "../lib/athleteSync";
import type { MatchEntry } from "../types";
import {
  buildAppStateFromCloud,
  insightsFor,
  type Insight,
} from "../lib/coachAnalytics";
import { summary } from "../lib/progressAnalytics";
import { computeStreak } from "../lib/gamification";
import ActivityHeatmap from "./charts/ActivityHeatmap";
import MatchStatsCard from "./charts/MatchStatsCard";

/**
 * Phase 4D.2 — the coach / parent's at-a-glance card on AthleteView.
 * Reuses the same chart components the athlete sees, but headlined
 * by plain-English insights.
 */
export default function AthleteGlanceCard({
  profileRow,
  matches,
  extra,
}: {
  profileRow: DbAthleteRow;
  matches: MatchEntry[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra: any | null;
}) {
  const state = useMemo(
    () => buildAppStateFromCloud(profileRow, matches, extra),
    [profileRow, matches, extra]
  );
  const insights = useMemo(() => insightsFor(state), [state]);
  const stats = useMemo(() => summary(state), [state]);
  const streak = useMemo(() => computeStreak(state), [state]);

  return (
    <div className="space-y-3">
      {/* Quick stat strip */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-purple-600 text-white flex items-center justify-center">
            <Activity size={14} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              At a glance
            </div>
            <div className="text-xs text-slate-500">
              Last 30 days &middot; auto-updated
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatTile
            label="Days active"
            value={`${stats.activeDays30}/${stats.totalDays30}`}
            sub={`${stats.consistencyPct}%`}
          />
          <StatTile
            label="Current streak"
            value={streak}
            sub={
              stats.longestStreak > streak
                ? `Best ${stats.longestStreak}`
                : streak > 0
                ? "Days"
                : "—"
            }
          />
          <StatTile
            label="Total logs"
            value={stats.totalHabits + stats.totalPractices + stats.totalCheckins}
            sub="All time"
          />
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            {insights.map((i, idx) => (
              <InsightRow key={idx} insight={i} />
            ))}
          </div>
        )}
      </div>

      <ActivityHeatmap state={state} weeks={13} />

      <MatchStatsCard state={state} />
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5">
      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100 leading-none mt-1">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const bg =
    insight.tone === "positive"
      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
      : insight.tone === "warning"
      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200";
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-snug ${bg}`}
    >
      <span className="text-base leading-none pt-0.5">{insight.emoji}</span>
      <span className="flex-1 font-medium">{insight.text}</span>
    </div>
  );
}
