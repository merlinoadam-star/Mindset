import { useMemo } from "react";
import { cumulativeXpSeries, type XpPoint } from "../../lib/progressAnalytics";
import type { AppState } from "../../types";

/**
 * Line chart of cumulative XP over time. Pure SVG — scales to the card
 * width via viewBox + preserveAspectRatio.
 */
export default function XpLineChart({
  state,
  days = 30,
}: {
  state: AppState;
  days?: number;
}) {
  const points: XpPoint[] = useMemo(
    () => cumulativeXpSeries(state, days),
    [state, days]
  );
  const minXp = Math.min(...points.map((p) => p.xp));
  const maxXp = Math.max(...points.map((p) => p.xp), minXp + 1);

  const W = 600;
  const H = 160;
  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 22;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (i: number) =>
    padL + (i / Math.max(points.length - 1, 1)) * plotW;
  const yFor = (xp: number) =>
    padT + plotH - ((xp - minXp) / Math.max(maxXp - minXp, 1)) * plotH;

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p.xp)}`)
    .join(" ");
  const areaD =
    `M${xFor(0)},${padT + plotH} L` +
    points.map((p, i) => `${xFor(i)},${yFor(p.xp)}`).join(" L") +
    ` L${xFor(points.length - 1)},${padT + plotH} Z`;

  const firstDate = points[0]?.date ?? "";
  const lastDate = points[points.length - 1]?.date ?? "";
  const totalEarned = maxXp - minXp;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-bold text-slate-900">XP over time</h3>
        <span className="text-xs text-slate-500">Last {days} days</span>
      </div>
      <div className="text-2xl font-extrabold text-brand-700 tabular-nums">
        +{totalEarned}
        <span className="text-xs text-slate-500 font-semibold ml-2">
          XP in window
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-40 mt-2"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="xp-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#xp-fill)" />
        <path
          d={lineD}
          fill="none"
          stroke="#4f46e5"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex justify-between text-[10px] text-slate-400 -mt-1 px-1">
        <span>{formatShort(firstDate)}</span>
        <span>{formatShort(lastDate)}</span>
      </div>
    </div>
  );
}

function formatShort(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
