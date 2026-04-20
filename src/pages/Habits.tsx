import { useCallback, useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import { habitsForSport } from "../lib/habits";
import { showReward } from "../components/RewardToast";
import { useRealtime } from "../lib/useRealtime";
import {
  createCustomHabit,
  deleteCustomHabit,
  fetchCustomHabits,
  rowToHabit,
  type CustomHabitRow,
} from "../lib/customHabitsSync";
import { Check, Plus, Sparkles, Trash2, X } from "lucide-react";
import type { HabitDefinition } from "../types";

const CATEGORY_LABELS: Record<HabitDefinition["category"], string> = {
  skill: "Skill Work",
  physical: "Physical",
  mental: "Mental",
  recovery: "Recovery",
};

const EMOJI_PICKS = [
  "⭐", "🔥", "💪", "🎯", "🧠", "💧", "🥗", "📓",
  "🏃", "🧘", "🥇", "💤", "📖", "🤝", "🎵", "🌅",
];

export default function HabitsPage() {
  const { state, toggleHabit, isHabitDoneToday } = useStore();
  const { account } = useAuth();
  const [customs, setCustoms] = useState<CustomHabitRow[]>([]);
  const [loadedCustoms, setLoadedCustoms] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const loadCustoms = useCallback(async () => {
    if (!account || account.role !== "athlete") {
      setLoadedCustoms(true);
      return;
    }
    const rows = await fetchCustomHabits(account.id);
    setCustoms(rows);
    setLoadedCustoms(true);
  }, [account]);

  useEffect(() => {
    loadCustoms();
  }, [loadCustoms]);

  useRealtime(
    {
      table: "custom_habits",
      filter: account ? `athlete_account_id=eq.${account.id}` : undefined,
      enabled: Boolean(account) && account?.role === "athlete",
    },
    loadCustoms
  );

  const allHabits = useMemo(() => {
    if (!state.profile) return [];
    const presets = habitsForSport(state.profile.sport);
    const customDefs = customs.map(rowToHabit);
    return [...presets, ...customDefs];
  }, [state.profile, customs]);

  if (!state.profile) return null;

  const byCategory: Record<HabitDefinition["category"], HabitDefinition[]> = {
    skill: [],
    physical: [],
    mental: [],
    recovery: [],
  };
  allHabits.forEach((h) => byCategory[h.category].push(h));

  const customIdSet = new Set(customs.map((c) => c.id));
  const doneCount = allHabits.filter((h) => isHabitDoneToday(h.id)).length;
  const total = allHabits.length;
  const allDone = total > 0 && doneCount === total;

  function onToggle(habitId: string) {
    const { awardedXp, newlyUnlocked } = toggleHabit(habitId);
    if (awardedXp !== 0 || newlyUnlocked.length > 0) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  async function onDeleteCustom(habit: HabitDefinition) {
    if (!window.confirm(`Delete "${habit.label}"? Past completions stay in your history but it won't show on the list anymore.`)) {
      return;
    }
    setCustoms((prev) => prev.filter((c) => c.id !== habit.id));
    const { error } = await deleteCustomHabit(habit.id);
    if (error) {
      // Resync if delete failed.
      loadCustoms();
    }
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <h1 className="page-title">Daily Habits</h1>
        <p className="page-subtitle">
          Tap to complete. Come back tomorrow for a new day.
        </p>
        <div className="mt-4 card !p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Today&apos;s Progress
            </span>
            <div className="flex items-center gap-1.5">
              {allDone && <Sparkles size={14} className="text-amber-500" />}
              <span
                className={`text-sm font-bold tabular-nums ${
                  allDone
                    ? "text-green-600 dark:text-green-400"
                    : "text-brand-600 dark:text-brand-400"
                }`}
              >
                {doneCount} / {total}
              </span>
            </div>
          </div>
          <div className="mt-2.5 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allDone
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-brand-600 to-brand-400"
              }`}
              style={{ width: total > 0 ? `${(doneCount / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </header>

      {(Object.keys(CATEGORY_LABELS) as Array<HabitDefinition["category"]>).map(
        (cat) => {
          const items = byCategory[cat];
          if (items.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="section-label mb-2 px-1">{CATEGORY_LABELS[cat]}</h2>
              <div className="space-y-2">
                {items.map((h) => {
                  const done = isHabitDoneToday(h.id);
                  const isCustom = customIdSet.has(h.id);
                  return (
                    <div key={h.id} className="relative">
                      <button
                        onClick={() => onToggle(h.id)}
                        className={`w-full flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 text-left ${
                          done
                            ? "bg-green-50/80 dark:bg-green-950/40 border-green-300 dark:border-green-800 shadow-glow-green"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-card-hover active:scale-[0.98]"
                        }`}
                      >
                        <div className="text-3xl">{h.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`font-bold ${
                                done
                                  ? "text-green-800 dark:text-green-200"
                                  : "text-slate-900 dark:text-slate-100"
                              }`}
                            >
                              {h.label}
                            </div>
                            {isCustom && (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/50 px-1.5 py-0.5 rounded-full">
                                Custom
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-xs truncate ${
                              done
                                ? "text-green-600 dark:text-green-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {h.description || "—"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`text-xs font-bold ${
                              done
                                ? "text-green-600"
                                : "text-brand-500 dark:text-brand-400"
                            }`}
                          >
                            +{h.xp} XP
                          </span>
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              done
                                ? "bg-green-500 border-green-500 text-white scale-110"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {done && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      </button>
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustom(h);
                          }}
                          aria-label={`Delete ${h.label}`}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
      )}

      {/* Add custom habit */}
      {account?.role === "athlete" && loadedCustoms && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 py-4 px-4 flex items-center justify-center gap-2 text-sm font-bold transition"
        >
          <Plus size={16} /> Add a habit
        </button>
      )}

      {showAdd && account && (
        <AddHabitModal
          athleteAccountId={account.id}
          onClose={() => setShowAdd(false)}
          onCreated={(row) => {
            setCustoms((prev) => [...prev, row]);
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function AddHabitModal({
  athleteAccountId,
  onClose,
  onCreated,
}: {
  athleteAccountId: string;
  onClose: () => void;
  onCreated: (row: CustomHabitRow) => void;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("⭐");
  const [xp, setXp] = useState(10);
  const [category, setCategory] = useState<HabitDefinition["category"]>("physical");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!label.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const { row, error } = await createCustomHabit({
      athleteAccountId,
      label,
      description: description || null,
      emoji,
      xp,
      category,
    });
    setSubmitting(false);
    if (error || !row) {
      setError(error ?? "Couldn't create the habit.");
      return;
    }
    onCreated(row);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-elevated flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-700 dark:text-brand-300">
              New habit
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Make it your own
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Name
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 60))}
              placeholder="e.g. 10 min film study"
              className="w-full text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 160))}
              placeholder="Watch one match clip and take notes"
              className="w-full text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Emoji
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJI_PICKS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-xl py-1.5 rounded-lg border-2 transition ${
                    emoji === e
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                      : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                  aria-label={`Pick ${e}`}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitDefinition["category"])}
                className="w-full text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
              >
                <option value="physical">Physical</option>
                <option value="mental">Mental</option>
                <option value="recovery">Recovery</option>
                <option value="skill">Skill Work</option>
              </select>
            </div>
            <div className="w-24">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
                XP
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={xp}
                onChange={(e) => setXp(parseInt(e.target.value) || 0)}
                className="w-full text-sm tabular-nums text-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!label.trim() || submitting}
            className="flex-[1.4] btn-primary !py-2.5 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add habit"}
          </button>
        </footer>
      </div>
    </div>
  );
}
