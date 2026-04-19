import { useCallback, useEffect, useState } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/authContext";
import {
  fetchTeamWeeklyLeaderboard,
  type LeaderboardEntry,
} from "../lib/leaderboardSync";
import { mondayISO } from "../lib/weeklyChallenge";

/**
 * Team-wide leaderboard for the current ISO week. Ranks connected
 * athletes by game XP earned since Monday. Rendered on the coach/
 * parent dashboard. Entries with 0 XP are shown at the bottom so
 * the full roster is visible — useful for team motivation even
 * when only some kids have played this week.
 *
 * Refreshes on mount only. Auto-hides if the viewer has fewer than
 * 2 connected athletes (a leaderboard of 1 is just a score card).
 */

interface Props {
  athleteIds: string[];
  /** Name lookup for 0-XP athletes not present in the fetched rows. */
  nameById: Record<string, string>;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function TeamLeaderboard({ athleteIds, nameById }: Props) {
  const { account } = useAuth();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (athleteIds.length === 0) {
      setRows([]);
      setLoaded(true);
      return;
    }
    const data = await fetchTeamWeeklyLeaderboard(athleteIds);
    setRows(data);
    setLoaded(true);
  }, [athleteIds]);

  useEffect(() => {
    load();
  }, [load]);

  if (!account) return null;
  if (athleteIds.length < 2) return null;
  if (!loaded) return null;

  // Stitch together — fetched rows first (sorted desc), then
  // remaining connected athletes with 0 XP.
  const present = new Set(rows.map((r) => r.athleteAccountId));
  const zeroes: LeaderboardEntry[] = athleteIds
    .filter((id) => !present.has(id))
    .map((id) => ({
      athleteAccountId: id,
      displayName: nameById[id] ?? "Athlete",
      xp: 0,
    }));
  const all = [...rows, ...zeroes];
  if (all.length === 0) return null;

  const monday = mondayISO();
  const weekLabel = new Date(monday + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const maxXp = Math.max(1, all[0]?.xp ?? 0);

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
          <Trophy size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-amber-700 dark:text-amber-300">
            Weekly leaderboard
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Mini-game XP · week of {weekLabel}
          </div>
        </div>
      </div>

      <ol className="space-y-1.5">
        {all.map((entry, idx) => {
          const medal = idx < 3 && entry.xp > 0 ? MEDALS[idx] : null;
          const barPct = entry.xp > 0 ? (entry.xp / maxXp) * 100 : 0;
          return (
            <li key={entry.athleteAccountId}>
              <Link
                to={`/athlete/${entry.athleteAccountId}`}
                className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
              >
                {/* Bar behind text */}
                <div
                  className={`absolute inset-y-0.5 left-2 rounded-md transition-all ${
                    idx === 0 && entry.xp > 0
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "bg-slate-100 dark:bg-slate-800/40"
                  }`}
                  style={{ width: `calc(${barPct}% - 0.5rem)` }}
                  aria-hidden="true"
                />
                <div className="relative z-10 w-6 text-center text-xs font-extrabold text-slate-500 dark:text-slate-400 tabular-nums">
                  {medal ?? `${idx + 1}.`}
                </div>
                <div className="relative z-10 flex-1 min-w-0 text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {entry.displayName}
                </div>
                <div
                  className={`relative z-10 text-sm font-extrabold tabular-nums ${
                    entry.xp > 0
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {entry.xp} XP
                </div>
                <ChevronRight
                  size={14}
                  className="relative z-10 text-slate-300 dark:text-slate-600 flex-shrink-0"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 leading-snug">
        Mini-games reset every Monday. XP earned from Trivia, Decision
        Drill, Reaction Tap, Focus Flash, and Play Call.
      </p>
    </section>
  );
}
