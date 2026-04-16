import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MatchEntry } from "../types";

/**
 * Phase 4E.2 — month-grid calendar of matches. Each cell is a day;
 * matches show as colored dots (W=green, L=red, T=grey, upcoming=amber).
 * Tap a day with matches to open the first one.
 */
export default function MatchCalendar({
  matches,
  onMatchClick,
}: {
  matches: MatchEntry[];
  onMatchClick: (id: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  // Bucket matches by YYYY-MM-DD
  const byDate = useMemo(() => {
    const map = new Map<string, MatchEntry[]>();
    matches.forEach((m) => {
      if (!m.date) return;
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
    });
    return map;
  }, [matches]);

  // Build a 6-row grid starting on Sunday of the week containing day 1
  const cells = useMemo(() => {
    const first = new Date(viewMonth);
    const startDow = first.getDay();
    const start = new Date(first);
    start.setDate(1 - startDow);
    const out: Array<{
      iso: string;
      day: number;
      inMonth: boolean;
      isToday: boolean;
      matches: MatchEntry[];
    }> = [];
    const todayIso = isoDate(today);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = isoDate(d);
      out.push({
        iso,
        day: d.getDate(),
        inMonth: d.getMonth() === viewMonth.getMonth(),
        isToday: iso === todayIso,
        matches: byDate.get(iso) ?? [],
      });
    }
    return out;
  }, [viewMonth, byDate, today]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const prev = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() - 1);
    setViewMonth(d);
  };
  const next = () => {
    const d = new Date(viewMonth);
    d.setMonth(d.getMonth() + 1);
    setViewMonth(d);
  };
  const jumpToday = () => {
    const d = new Date(today);
    d.setDate(1);
    setViewMonth(d);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prev}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-sm font-bold text-slate-900">{monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={jumpToday}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((c) => {
          const hasAny = c.matches.length > 0;
          const onClick = hasAny
            ? () => onMatchClick(c.matches[0].id)
            : undefined;
          return (
            <button
              key={c.iso}
              onClick={onClick}
              disabled={!hasAny}
              className={`aspect-square rounded-md p-1 text-left text-[11px] flex flex-col items-stretch ${
                c.inMonth ? "bg-slate-50" : "bg-transparent"
              } ${
                c.isToday
                  ? "ring-2 ring-brand-500 bg-brand-50"
                  : hasAny
                  ? "hover:bg-slate-100 cursor-pointer"
                  : "cursor-default"
              } ${!c.inMonth ? "text-slate-300" : "text-slate-600"}`}
            >
              <div className={`tabular-nums font-semibold leading-none`}>
                {c.day}
              </div>
              {c.matches.length > 0 && (
                <div className="flex gap-[2px] mt-auto flex-wrap">
                  {c.matches.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className={`w-1.5 h-1.5 rounded-full ${dotClass(m)}`}
                      title={`${m.opponent ?? "Match"}${
                        m.result ? " (" + m.result.toUpperCase() + ")" : ""
                      }`}
                    />
                  ))}
                  {c.matches.length > 3 && (
                    <div className="text-[8px] font-bold text-slate-500">
                      +{c.matches.length - 3}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-500">
        <LegendDot color="bg-emerald-500" label="Win" />
        <LegendDot color="bg-rose-500" label="Loss" />
        <LegendDot color="bg-slate-400" label="Tie" />
        <LegendDot color="bg-amber-500" label="Upcoming" />
      </div>
    </div>
  );
}

function dotClass(m: MatchEntry): string {
  if (m.result === "win") return "bg-emerald-500";
  if (m.result === "loss") return "bg-rose-500";
  if (m.result === "tie") return "bg-slate-400";
  return "bg-amber-500";
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
