import { useStore } from "../lib/store";
import { habitsForSport } from "../lib/habits";
import { showReward } from "../components/RewardToast";
import { Check, Sparkles } from "lucide-react";

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
  const allDone = doneCount === habits.length;

  function onToggle(habitId: string) {
    const { awardedXp, newlyUnlocked } = toggleHabit(habitId);
    if (awardedXp !== 0 || newlyUnlocked.length > 0) {
      showReward(awardedXp, newlyUnlocked);
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
            <span className="text-sm font-bold text-slate-700">Today&apos;s Progress</span>
            <div className="flex items-center gap-1.5">
              {allDone && <Sparkles size={14} className="text-amber-500" />}
              <span className={`text-sm font-bold tabular-nums ${allDone ? "text-green-600" : "text-brand-600"}`}>
                {doneCount} / {habits.length}
              </span>
            </div>
          </div>
          <div className="mt-2.5 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allDone
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-brand-600 to-brand-400"
              }`}
              style={{ width: `${(doneCount / habits.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {Object.entries(byCategory).map(([cat, items]) =>
        items.length === 0 ? null : (
          <section key={cat}>
            <h2 className="section-label mb-2 px-1">
              {categoryLabels[cat]}
            </h2>
            <div className="space-y-2">
              {items.map((h) => {
                const done = isHabitDoneToday(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => onToggle(h.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl p-4 border-2 transition-all duration-200 text-left ${
                      done
                        ? "bg-green-50/80 border-green-300 shadow-glow-green"
                        : "bg-white border-slate-100 hover:border-brand-200 hover:shadow-card-hover active:scale-[0.98]"
                    }`}
                  >
                    <div className="text-3xl">{h.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold ${done ? "text-green-800" : "text-slate-900"}`}>
                        {h.label}
                      </div>
                      <div className={`text-xs truncate ${done ? "text-green-600" : "text-slate-500"}`}>
                        {h.description}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          done ? "text-green-600" : "text-brand-500"
                        }`}
                      >
                        +{h.xp} XP
                      </span>
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          done
                            ? "bg-green-500 border-green-500 text-white scale-110"
                            : "border-slate-300"
                        }`}
                      >
                        {done && <Check size={14} strokeWidth={3} />}
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
