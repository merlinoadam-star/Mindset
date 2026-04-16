import { useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";

/**
 * Phase 4E.1 — upcoming-matches strip on the Dashboard. Surfaces the
 * next 1-3 future-dated matches with a friendly countdown so the
 * athlete can see what's coming.
 */
export default function UpcomingMatchesCard() {
  const { state } = useStore();

  const upcoming = useMemo(() => {
    const today = todayISO();
    return state.matches
      .filter((m) => m.date && m.date >= today && !m.postMatchCompletedAt)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [state.matches]);

  if (upcoming.length === 0) return null;

  return (
    <div className="card bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center">
          <CalendarClock size={16} />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider font-bold text-sky-700">
            Coming up
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {upcoming.length} scheduled
          </div>
        </div>
        <Link
          to="/matches"
          className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-0.5"
        >
          All <ChevronRight size={11} />
        </Link>
      </div>
      <div className="space-y-2">
        {upcoming.map((m) => {
          const days = daysUntil(m.date);
          const when =
            days === 0
              ? "Today"
              : days === 1
              ? "Tomorrow"
              : `in ${days} days`;
          const isImminent = days <= 1;
          return (
            <Link
              key={m.id}
              to="/matches"
              className={`flex items-center gap-3 p-2.5 rounded-xl bg-white border ${
                isImminent
                  ? "border-sky-300 shadow-card"
                  : "border-slate-200"
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-extrabold leading-none ${
                  isImminent
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-80">
                  {monthShort(m.date)}
                </div>
                <div className="text-xl mt-0.5">{dayNum(m.date)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  vs. {m.opponent || "Opponent"}
                </div>
                {m.event && (
                  <div className="text-[11px] text-slate-500 truncate">
                    {m.event}
                  </div>
                )}
                <div
                  className={`text-[11px] font-semibold mt-0.5 ${
                    isImminent ? "text-sky-700" : "text-slate-500"
                  }`}
                >
                  {when}
                  {!m.preMatchCompletedAt && isImminent && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider">
                      Prep needed
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T12:00:00");
  const ms = target.getTime() - today.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function monthShort(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
  });
}

function dayNum(iso: string): string {
  return String(new Date(iso + "T12:00:00").getDate());
}
