import { useStore } from "../lib/store";
import { habitsForSport } from "../lib/habits";
import { showReward } from "../components/RewardToast";
import { Check } from "lucide-react";

export default function HabitsPage() {
  const { state, toggleHabit, isHabitDoneToday } = useStore();
  if (!state.profile) return null;

  const habits = habitsForSport(state.profile.sport);
  const byCategory: Record<string, typeof habits> = {
    skill: [],
    physical: [],
    mental: [],
    recovery: [],
  };
  habits.forEach((h) => byCategory[h.category].push(h));

  const categoryLabels: Record<string, string> = {
    skill: "Skill Work",
    physical: "Physical",
    mental: "Mental",
    recovery: "Recovery",
  };

  const doneCount = habits.filter((h) => isHabitDoneToday(h.id)).length;

  function onToggle(habitId: string) {
    const { awardedXp, newlyUnlocked } = toggleHabit(habitId);
    if (awardedXp !== 0 || newlyUnlocked.length > 0) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">Daily Habits</h1>
        <p className="text-sm text-slate-600 mt-1">
          Tap to complete. Come back tomorrow for a new day.
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-700">Today&apos;s Progress</span>
            <span className="text-brand-700 tabular-nums">
              {doneCount} / {habits.length}
            </span>
          </div>
          <div className="mt-1.5 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-500"
              style={{ width: `${(doneCount / habits.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {Object.entries(byCategory).map(([cat, items]) =>
        items.length === 0 ? null : (
          <section key={cat}>
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">
              {categoryLabels[cat]}
            </h2>
            <div className="space-y-2">
              {items.map((h) => {
                const done = isHabitDoneToday(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => onToggle(h.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl p-4 border-2 transition text-left ${
                      done
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-slate-200 hover:border-brand-300 active:scale-[0.98]"
                    }`}
                  >
                    <div className="text-3xl">{h.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{h.label}</div>
                      <div className="text-xs text-slate-600 truncate">
                        {h.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-bold ${
                          done ? "text-green-700" : "text-brand-600"
                        }`}
                      >
                        +{h.xp} XP
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                          done
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {done && <Check size={16} strokeWidth={3} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
