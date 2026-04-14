import { useMemo } from "react";
import { matchSummary } from "../../lib/progressAnalytics";
import type { AppState } from "../../types";
import { Trophy } from "lucide-react";

/**
 * Win rate + recent matches at a glance. Only shown for athletes who
 * have logged at least one match with a result.
 */
export default function MatchStatsCard({ state }: { state: AppState }) {
  const stats = useMemo(() => matchSummary(state), [state]);

  if (stats.total === 0) return null;

  const circumference = 2 * Math.PI * 36;
  const winFrac = stats.wins / stats.total;
  const dashWins = winFrac * circumference;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900">Match record</h3>
        <Trophy size={14} className="text-amber-500" />
      </div>

      <div className="flex items-center gap-4">
        {/* Donut showing win share */}
        <div className="relative flex-shrink-0">
          <svg width={88} height={88} viewBox="0 0 88 88">
            <circle
              cx={44}
              cy={44}
              r={36}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={10}
            />
            <circle
              cx={44}
              cy={44}
              r={36}
              fill="none"
              stroke="#10b981"
              strokeWidth={10}
              strokeDasharray={`${dashWins} ${circumference - dashWins}`}
              strokeDashoffset={circumference / 4}
              transform="rotate(-90 44 44)"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-xl font-extrabold text-slate-900 leading-none">
              {stats.winPct}%
            </div>
            <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              wins
            </div>
          </div>
        </div>

        <div className="flex-1 text-sm space-y-1">
          <Row label="Wins" value={stats.wins} color="text-emerald-600" />
          <Row label="Losses" value={stats.losses} color="text-rose-600" />
          {stats.ties > 0 && (
            <Row label="Ties" value={stats.ties} color="text-slate-500" />
          )}
          {stats.avgPerformance !== null && (
            <Row
              label="Avg perf."
              value={`${stats.avgPerformance.toFixed(1)}/5`}
              color="text-slate-700"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
