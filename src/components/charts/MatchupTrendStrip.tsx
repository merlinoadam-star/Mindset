import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MatchEntry, OpponentEntry } from "../../types";
import { matchesWithOpponent } from "../../lib/opponentStats";

/**
 * Phase 4D.3 — visual history of every matchup against a given
 * opponent. Dots ordered oldest → newest, colored by result. Below
 * that, a computed "trend" read based on recent vs older results.
 */
export default function MatchupTrendStrip({
  matches,
  opponent,
}: {
  matches: MatchEntry[];
  opponent: OpponentEntry;
}) {
  const related = matchesWithOpponent(matches, opponent)
    .filter((m) => m.result)
    .reverse(); // oldest → newest

  if (related.length < 2) return null;

  // Trend heuristic: split into older half vs newer half and compare win %.
  const mid = Math.floor(related.length / 2);
  const older = related.slice(0, mid);
  const newer = related.slice(mid);
  const olderWinPct =
    older.length > 0
      ? older.filter((m) => m.result === "win").length / older.length
      : 0;
  const newerWinPct =
    newer.length > 0
      ? newer.filter((m) => m.result === "win").length / newer.length
      : 0;

  let trend: "up" | "down" | "flat";
  let trendText: string;
  if (newerWinPct > olderWinPct + 0.1) {
    trend = "up";
    trendText = "Improving — you're winning more lately.";
  } else if (newerWinPct < olderWinPct - 0.1) {
    trend = "down";
    trendText = "Recent matchups have been tougher.";
  } else {
    trend = "flat";
    trendText = "Steady — results are consistent over time.";
  }

  // Score differential trend (wrestling only)
  const diffs = related
    .map((m) =>
      typeof m.wrestling?.myScore === "number" &&
      typeof m.wrestling?.theirScore === "number"
        ? m.wrestling.myScore - m.wrestling.theirScore
        : null
    )
    .filter((n): n is number => n !== null);
  const avgDiff =
    diffs.length > 0 ? diffs.reduce((s, n) => s + n, 0) / diffs.length : null;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-bold text-slate-900">Matchup history</h3>
        <span className="text-xs text-slate-500">
          {related.length} match{related.length === 1 ? "" : "es"}
        </span>
      </div>

      {/* Dots timeline */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {related.map((m, i) => {
          const color =
            m.result === "win"
              ? "bg-emerald-500"
              : m.result === "loss"
              ? "bg-rose-500"
              : "bg-slate-400";
          const letter = m.result === "win" ? "W" : m.result === "loss" ? "L" : "T";
          return (
            <div
              key={m.id}
              title={`${m.date} · ${letter}${
                m.event ? ` · ${m.event}` : ""
              }`}
              className={`w-7 h-7 rounded-lg ${color} text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0`}
            >
              {letter}
              {i === related.length - 1 && (
                <span className="absolute -mt-9 text-[8px] text-slate-400 font-bold">
                  now
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend readout */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        {trend === "up" ? (
          <TrendingUp size={14} className="text-emerald-600" />
        ) : trend === "down" ? (
          <TrendingDown size={14} className="text-rose-600" />
        ) : (
          <Minus size={14} className="text-slate-500" />
        )}
        <span
          className={
            trend === "up"
              ? "text-emerald-800 font-semibold"
              : trend === "down"
              ? "text-rose-800 font-semibold"
              : "text-slate-600 font-semibold"
          }
        >
          {trendText}
        </span>
      </div>

      {avgDiff !== null && (
        <div className="mt-2 text-xs text-slate-500">
          Avg score diff:{" "}
          <span
            className={`font-bold tabular-nums ${
              avgDiff > 0
                ? "text-emerald-700"
                : avgDiff < 0
                ? "text-rose-700"
                : "text-slate-700"
            }`}
          >
            {avgDiff > 0 ? "+" : ""}
            {avgDiff.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
