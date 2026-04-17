import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Target, Plus, Check, Trash2, Trophy } from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel, computeStreak } from "../lib/gamification";

/**
 * Phase G — Season Goals page. Athletes set 2-5 measurable goals for
 * the season and track progress against them. Goals can be XP-based,
 * streak-based, match-based, practice-based, or level-based. Each has
 * a target number and an auto-computed current value.
 *
 * Goals live in profile.goals.seasonGoals (stored as JSON in the
 * athlete profile, so they sync via the existing profile sync path).
 */

interface SeasonGoal {
  id: string;
  label: string;
  metric: "xp" | "level" | "streak" | "matches" | "practices" | "habits" | "wins";
  target: number;
  createdAt: string;
}

const METRIC_OPTIONS: Array<{
  key: SeasonGoal["metric"];
  label: string;
  emoji: string;
  unit: string;
}> = [
  { key: "xp", label: "Total XP", emoji: "⚡", unit: "XP" },
  { key: "level", label: "Reach level", emoji: "📈", unit: "" },
  { key: "streak", label: "Day streak", emoji: "🔥", unit: "days" },
  { key: "matches", label: "Matches logged", emoji: "🤼", unit: "matches" },
  { key: "practices", label: "Practices logged", emoji: "💪", unit: "practices" },
  { key: "habits", label: "Habits completed", emoji: "✅", unit: "total" },
  { key: "wins", label: "Match wins", emoji: "🏆", unit: "wins" },
];

function currentValueFor(
  metric: SeasonGoal["metric"],
  state: ReturnType<typeof useStore>["state"]
): number {
  switch (metric) {
    case "xp":
      return state.xp;
    case "level":
      return state.profile
        ? computeLevel(state.xp, state.profile.sport).level
        : 1;
    case "streak":
      return computeStreak(state);
    case "matches":
      return state.matches.length;
    case "practices":
      return state.practices.length;
    case "habits":
      return state.habitCompletions.length;
    case "wins":
      return state.matches.filter((m) => m.result === "win").length;
    default:
      return 0;
  }
}

export default function SeasonGoalsPage() {
  const { state, updateProfile } = useStore();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newMetric, setNewMetric] = useState<SeasonGoal["metric"]>("xp");
  const [newTarget, setNewTarget] = useState("");

  if (!state.profile) return null;

  // Goals are stored in profile.goals.seasonGoals (JSON array)
  const goals: SeasonGoal[] =
    (state.profile.goals as Record<string, unknown>)?.seasonGoals as SeasonGoal[] ?? [];

  const saveGoals = (updated: SeasonGoal[]) => {
    updateProfile({
      goals: {
        ...(state.profile!.goals ?? {}),
        seasonGoals: updated,
      } as typeof state.profile.goals,
    });
  };

  const addGoal = () => {
    const target = parseInt(newTarget);
    if (!newLabel.trim() || !target || target <= 0) return;
    const goal: SeasonGoal = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      metric: newMetric,
      target,
      createdAt: new Date().toISOString(),
    };
    saveGoals([...goals, goal]);
    setNewLabel("");
    setNewTarget("");
    setAdding(false);
  };

  const removeGoal = (id: string) => {
    saveGoals(goals.filter((g) => g.id !== id));
  };

  const completed = goals.filter(
    (g) => currentValueFor(g.metric, state) >= g.target
  ).length;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center">
              <Target size={18} />
            </div>
            <div>
              <h1 className="page-title">Season Goals</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {goals.length === 0
                  ? "Set targets for your season"
                  : `${completed}/${goals.length} complete`}
              </p>
            </div>
          </div>
          {goals.length < 5 && (
            <button
              onClick={() => setAdding(true)}
              className="btn-primary !py-2 !px-3 !text-xs inline-flex items-center gap-1"
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>
      </header>

      {goals.length === 0 && !adding && (
        <div className="card text-center py-10">
          <Trophy size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold mt-3 text-slate-900 dark:text-white">
            No goals yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Set a few targets for the season — something to chase every day.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="btn-primary mt-5"
          >
            <Plus size={16} className="inline mr-1" /> Set your first goal
          </button>
        </div>
      )}

      {adding && (
        <div className="card space-y-3 animate-pop-in">
          <div className="font-bold text-slate-900 dark:text-white">
            New Season Goal
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              What&apos;s the goal?
            </label>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Hit Level 5 by end of season"
              maxLength={80}
              autoFocus
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              What are you tracking?
            </label>
            <div className="flex flex-wrap gap-1.5">
              {METRIC_OPTIONS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setNewMetric(m.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    newMetric === m.key
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Target number
            </label>
            <input
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder={
                newMetric === "xp"
                  ? "e.g. 500"
                  : newMetric === "level"
                  ? "e.g. 5"
                  : "e.g. 10"
              }
              min={1}
              className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setAdding(false)}
              className="btn-secondary !py-2 !text-xs"
            >
              Cancel
            </button>
            <button
              onClick={addGoal}
              disabled={!newLabel.trim() || !newTarget || parseInt(newTarget) <= 0}
              className="btn-primary flex-1 !py-2 !text-xs disabled:opacity-50"
            >
              Save goal
            </button>
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((g) => {
            const current = currentValueFor(g.metric, state);
            const pct = Math.min(100, Math.round((current / g.target) * 100));
            const done = current >= g.target;
            const metricInfo = METRIC_OPTIONS.find((m) => m.key === g.metric);
            return (
              <div
                key={g.id}
                className={`card ${
                  done
                    ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {done ? "🏆" : metricInfo?.emoji ?? "🎯"}
                      </span>
                      <div
                        className={`font-bold text-sm ${
                          done
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {g.label}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            done
                              ? "bg-emerald-500"
                              : pct >= 75
                              ? "bg-amber-500"
                              : "bg-brand-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-300 w-14 text-right">
                        {current}/{g.target}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>
                        {metricInfo?.label} · {pct}%
                      </span>
                      {done && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold inline-flex items-center gap-0.5">
                          <Check size={10} strokeWidth={3} /> Complete!
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGoal(g.id)}
                    className="text-slate-400 hover:text-red-500 mt-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
