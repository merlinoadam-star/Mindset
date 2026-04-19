import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Check,
  CheckSquare,
  CalendarDays,
  Heart,
  Square,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import { supabase } from "../lib/supabase";
import { useRealtime } from "../lib/useRealtime";
import { logParentAction } from "../lib/parentXpSync";
import { showReward } from "./RewardToast";

/**
 * Parent "Daily Review" checklist — mirrors the athlete's habit
 * checklist but for parents: four things to check on each day per
 * athlete (practice log, mental check-in, habits, upcoming match).
 *
 * Checking a row is local (localStorage, scoped per parent+athlete+
 * day). When all four are checked, we fire `logParentAction` with
 * action_type='daily_review' — that awards 10 XP (+5 combo if the
 * athlete has activity today). The DB's unique (parent, athlete,
 * action_type, date) constraint caps it at one award per day per
 * athlete so rechecking is idempotent.
 */

interface Props {
  athleteAccountId: string;
  athleteName: string;
}

const ITEMS = [
  { id: "practice", label: "Practice Log", icon: Activity, anchor: "practice-log" },
  { id: "checkin", label: "Mental Check-In", icon: Heart, anchor: "mental-checkin" },
  { id: "habits", label: "Habits", icon: CheckSquare, anchor: "habits" },
  { id: "match", label: "Match Log", icon: CalendarDays, anchor: "match-log" },
] as const;
type ItemId = (typeof ITEMS)[number]["id"];

interface PersistedState {
  day: string; // YYYY-MM-DD
  checkedIds: ItemId[];
  awarded: boolean;
}

interface Previews {
  practice: { practicesThisWeek: number };
  checkin: { mood: number | null };
  habits: { done: number; total: number };
  match: {
    totalLogged: number;
    nextMatchDate: string | null;
    nextMatchOpponent: string | null;
    lastMatchDate: string | null;
    lastMatchOpponent: string | null;
  };
}

function storageKey(parentId: string, athleteId: string): string {
  return `mindset-parent-daily-review-${parentId}-${athleteId}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function mondayISOLocal(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function loadState(parentId: string, athleteId: string): PersistedState {
  const today = todayISO();
  try {
    const raw = localStorage.getItem(storageKey(parentId, athleteId));
    if (!raw) return { day: today, checkedIds: [], awarded: false };
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.day !== today) return { day: today, checkedIds: [], awarded: false };
    return parsed;
  } catch {
    return { day: today, checkedIds: [], awarded: false };
  }
}

function saveState(
  parentId: string,
  athleteId: string,
  state: PersistedState
): void {
  try {
    localStorage.setItem(storageKey(parentId, athleteId), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export default function ParentDailyReviewCard({
  athleteAccountId,
  athleteName,
}: Props) {
  const { account } = useAuth();
  const parentAccountId = account?.id ?? "";
  const [persisted, setPersisted] = useState<PersistedState>(() =>
    loadState(parentAccountId, athleteAccountId)
  );
  const [previews, setPreviews] = useState<Previews | null>(null);

  // Pull quick preview data for each row. All four queries run in
  // parallel. RLS permits a connected parent to read each of these.
  const loadPreviews = useCallback(async () => {
    if (!supabase || !athleteAccountId) return;
    const today = todayISO();
    const monday = mondayISOLocal();

    const [practiceRes, checkinRes, habitRes, upcomingRes, lastRes, countRes] =
      await Promise.all([
        supabase
          .from("practices")
          .select("id", { head: true, count: "exact" })
          .eq("athlete_id", athleteAccountId)
          .gte("date", monday),
        supabase
          .from("mental_checkins")
          .select("mood")
          .eq("athlete_id", athleteAccountId)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("habit_completions")
          .select("habit_id")
          .eq("athlete_id", athleteAccountId)
          .eq("date", today),
        // Next upcoming match (if any)
        supabase
          .from("matches")
          .select("date, opponent")
          .eq("athlete_id", athleteAccountId)
          .gte("date", today)
          .order("date", { ascending: true })
          .limit(1)
          .maybeSingle(),
        // Most recent past match (fallback when nothing is upcoming)
        supabase
          .from("matches")
          .select("date, opponent")
          .eq("athlete_id", athleteAccountId)
          .lt("date", today)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Total count for the row label
        supabase
          .from("matches")
          .select("id", { head: true, count: "exact" })
          .eq("athlete_id", athleteAccountId),
      ]);

    setPreviews({
      practice: { practicesThisWeek: practiceRes.count ?? 0 },
      checkin: { mood: (checkinRes.data as { mood?: number } | null)?.mood ?? null },
      habits: {
        done: habitRes.data?.length ?? 0,
        total: 5, // Approximate — real athletes see their own sport's count; this is for parent preview only.
      },
      match: {
        totalLogged: countRes.count ?? 0,
        nextMatchDate: (upcomingRes.data as { date?: string } | null)?.date ?? null,
        nextMatchOpponent:
          (upcomingRes.data as { opponent?: string } | null)?.opponent ?? null,
        lastMatchDate: (lastRes.data as { date?: string } | null)?.date ?? null,
        lastMatchOpponent:
          (lastRes.data as { opponent?: string } | null)?.opponent ?? null,
      },
    });
  }, [athleteAccountId]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  // Refresh previews when the athlete logs something live.
  const athleteFilter = `athlete_id=eq.${athleteAccountId}`;
  useRealtime(
    { table: "practices", filter: athleteFilter, enabled: true },
    loadPreviews
  );
  useRealtime(
    { table: "mental_checkins", filter: athleteFilter, enabled: true },
    loadPreviews
  );
  useRealtime(
    { table: "habit_completions", filter: athleteFilter, enabled: true },
    loadPreviews
  );
  useRealtime(
    { table: "matches", filter: athleteFilter, enabled: true },
    loadPreviews
  );

  // Handle day rollover — if localStorage has yesterday's state, reset.
  useEffect(() => {
    if (persisted.day !== todayISO()) {
      const fresh: PersistedState = {
        day: todayISO(),
        checkedIds: [],
        awarded: false,
      };
      setPersisted(fresh);
      saveState(parentAccountId, athleteAccountId, fresh);
    }
  }, [persisted.day, parentAccountId, athleteAccountId]);

  const previewText = useMemo((): Record<ItemId, string> => {
    if (!previews) {
      return { practice: "—", checkin: "—", habits: "—", match: "—" };
    }
    return {
      practice:
        previews.practice.practicesThisWeek > 0
          ? `${previews.practice.practicesThisWeek} this week`
          : "No practices logged yet this week",
      checkin:
        previews.checkin.mood != null
          ? `Today's mood: ${moodEmoji(previews.checkin.mood)}`
          : "No check-in logged today",
      habits:
        previews.habits.done > 0
          ? `${previews.habits.done} habit${previews.habits.done === 1 ? "" : "s"} done today`
          : "No habits checked today",
      match: (() => {
        const m = previews.match;
        if (m.nextMatchDate) {
          return `Upcoming: ${formatDate(m.nextMatchDate)}${
            m.nextMatchOpponent ? ` · vs ${m.nextMatchOpponent}` : ""
          }`;
        }
        if (m.lastMatchDate) {
          return `Last: ${formatDate(m.lastMatchDate)}${
            m.lastMatchOpponent ? ` · vs ${m.lastMatchOpponent}` : ""
          } · ${m.totalLogged} logged`;
        }
        if (m.totalLogged > 0) return `${m.totalLogged} matches logged`;
        return "No matches logged yet";
      })(),
    };
  }, [previews]);

  const toggle = useCallback(
    (id: ItemId) => {
      const checked = persisted.checkedIds.includes(id);
      const next: PersistedState = {
        ...persisted,
        checkedIds: checked
          ? persisted.checkedIds.filter((c) => c !== id)
          : [...persisted.checkedIds, id],
      };
      setPersisted(next);
      saveState(parentAccountId, athleteAccountId, next);

      // If we just completed the full list AND haven't awarded yet, fire.
      if (!next.awarded && next.checkedIds.length === ITEMS.length) {
        const final: PersistedState = { ...next, awarded: true };
        setPersisted(final);
        saveState(parentAccountId, athleteAccountId, final);
        logParentAction({
          parentAccountId,
          athleteAccountId,
          actionType: "daily_review",
        }).then((res) => {
          if (res.awardedXp > 0) {
            showReward(
              res.awardedXp,
              res.combo
                ? [`__combo__Daily review of ${athleteName} — combo!`]
                : [`__combo__Daily review of ${athleteName}`]
            );
          }
        });
      }
    },
    [persisted, parentAccountId, athleteAccountId, athleteName]
  );

  if (!account || account.role !== "parent") return null;

  const allDone = persisted.checkedIds.length === ITEMS.length;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/20">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
          <BarChart3 size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-rose-700 dark:text-rose-300">
            Daily review · {athleteName}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            {allDone
              ? "Nice — you stayed in the loop today."
              : `Check in on what ${athleteName} did today. ${persisted.checkedIds.length}/${ITEMS.length} done.`}
          </div>
        </div>
      </header>

      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const checked = persisted.checkedIds.includes(item.id);
          return (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800/50 focus-visible:outline-none"
                aria-pressed={checked}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                    checked
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-300 dark:border-slate-600 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  {checked ? <Check size={14} strokeWidth={3} /> : <Square size={0} />}
                </div>
                <Icon
                  size={16}
                  className={`flex-shrink-0 ${
                    checked
                      ? "text-slate-400 dark:text-slate-500"
                      : "text-rose-500 dark:text-rose-400"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-semibold leading-tight ${
                      checked
                        ? "text-slate-400 dark:text-slate-500 line-through"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {previewText[item.id]}
                  </div>
                </div>
                <Link
                  to={`/athlete/${athleteAccountId}#${item.anchor}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 focus-visible:outline-none"
                >
                  View
                </Link>
              </button>
            </li>
          );
        })}
      </ul>

      {allDone && !persisted.awarded && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 text-center">
          +10 XP · thanks for showing up
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
function moodEmoji(mood: number): string {
  switch (mood) {
    case 1:
      return "😩";
    case 2:
      return "😕";
    case 3:
      return "😐";
    case 4:
      return "🙂";
    case 5:
      return "🔥";
    default:
      return "—";
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
