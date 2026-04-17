import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Swords, ArrowRight, Flame } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";

/**
 * Match Day card — the entry point to the pre-competition flow.
 *
 * Three states:
 *   1. Match scheduled today → big "MATCH DAY" hero card, pulsing
 *   2. Match scheduled tomorrow → compact "Get ready" card
 *   3. No imminent match → hidden
 *
 * The athlete can also launch the flow directly from the Matches page
 * or a future profile shortcut, so this card only handles the dashboard
 * discovery path.
 */
export default function MatchDayCard() {
  const { state } = useStore();

  const { today: todayMatch, tomorrow: tomorrowMatch } = useMemo(() => {
    const todayIso = todayISO();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowIso = tomorrowDate.toISOString().slice(0, 10);

    // Prefer matches that haven't been post-logged yet; within that,
    // pick the one without pre-match prep first.
    const matchesOn = (iso: string) =>
      state.matches
        .filter((m) => m.date === iso && !m.postMatchCompletedAt)
        .sort((a, b) => {
          const aPrepped = !!a.preMatchCompletedAt;
          const bPrepped = !!b.preMatchCompletedAt;
          if (aPrepped !== bPrepped) return aPrepped ? 1 : -1;
          return 0;
        });

    return {
      today: matchesOn(todayIso)[0],
      tomorrow: matchesOn(tomorrowIso)[0],
    };
  }, [state.matches]);

  if (!todayMatch && !tomorrowMatch) return null;

  // Today — hero card
  if (todayMatch) {
    const prepped = !!todayMatch.preMatchCompletedAt;
    return (
      <Link
        to={`/match-day?id=${todayMatch.id}`}
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-brand-900 to-purple-900 text-white p-5 shadow-elevated group"
      >
        {/* subtle pulse ring */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brand-500/30 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-purple-500/20 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-white/70 mb-2">
            <Flame size={11} className="text-orange-400" />
            <span>Today</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold tracking-tight leading-none">
                MATCH DAY
              </h2>
              <p className="text-sm text-white/80 mt-2 truncate">
                vs.{" "}
                <span className="font-bold text-white">
                  {todayMatch.opponent || "Opponent"}
                </span>
                {todayMatch.event && (
                  <span className="text-white/60"> · {todayMatch.event}</span>
                )}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-sm font-extrabold group-active:scale-95 transition">
                {prepped ? "Run it again" : "Lock in"}
                <ArrowRight size={14} />
              </div>
            </div>
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Swords size={24} className="text-white" />
            </div>
          </div>
          {prepped && (
            <div className="mt-3 text-[11px] text-emerald-300 font-semibold">
              ✓ Pre-match prep done
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Tomorrow — compact card
  return (
    <Link
      to={`/match-day?id=${tomorrowMatch!.id}`}
      className="card bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950 dark:to-indigo-950 border-sky-200 dark:border-sky-800 flex items-center gap-3 group"
    >
      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center flex-shrink-0">
        <Swords size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-sky-700 dark:text-sky-300">
          Match tomorrow
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
          vs. {tomorrowMatch!.opponent || "Opponent"}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Get your head right →
        </div>
      </div>
      <ArrowRight
        size={16}
        className="text-slate-400 group-active:translate-x-0.5 transition"
      />
    </Link>
  );
}
