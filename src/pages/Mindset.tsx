import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import RecoveryCard from "../components/RecoveryCard";
import NutritionCard from "../components/NutritionCard";
import GoalReviewCard from "../components/GoalReviewCard";
import MorningCheckInCard from "../components/MorningCheckInCard";
import { Brain, Check, X, Sun, Moon } from "lucide-react";

const MOODS = [
  { value: 1, emoji: "😩", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Great" },
];

export default function MindsetPage() {
  const { state } = useStore();
  const today = todayISO();
  const todaysCheckin = state.checkins.find((c) => c.date === today);

  const past = state.checkins.filter((c) => c.date !== today).slice(0, 10);

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold dark:text-white">
          Daily Check-Ins
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Strong mind, strong body 💪 Take 60 seconds.
        </p>
      </header>

      {/* MORNING — start-of-day intention setting */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pt-2">
          <Sun size={14} className="text-amber-500" />
          <h2 className="section-label">Morning</h2>
        </div>
        <MorningCheckInCard />
      </section>

      {/* END OF DAY — reflection, recovery, nutrition */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 pt-2">
          <Moon size={14} className="text-indigo-500" />
          <h2 className="section-label">End of Day</h2>
        </div>

        {/* Goal review prompt — shows only if goal set but not yet reviewed */}
        {todaysCheckin &&
          todaysCheckin.goal &&
          todaysCheckin.goalMet === undefined && (
            <GoalReviewCard checkin={todaysCheckin} />
          )}

        {/* Goal review result — once reviewed */}
        {todaysCheckin && todaysCheckin.goalMet !== undefined && (
          <div
            className={`card !p-4 flex items-center gap-3 ${
              todaysCheckin.goalMet
                ? "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950 dark:to-slate-900 border-emerald-200 dark:border-emerald-800"
                : "bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                todaysCheckin.goalMet
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-300 text-white"
              }`}
            >
              {todaysCheckin.goalMet ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <X size={18} strokeWidth={3} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Today&apos;s goal — {todaysCheckin.goalMet ? "hit!" : "not quite"}
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {todaysCheckin.goal}
              </div>
            </div>
          </div>
        )}

        <RecoveryCard />
        <NutritionCard />
      </section>

      {/* Past check-ins */}
      {past.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 pt-2">
            <h2 className="section-label">Past check-ins</h2>
          </div>
          {past.map((c) => {
            const mood = MOODS.find((m) => m.value === c.mood);
            return (
              <div key={c.id} className="card !p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mood?.emoji}</span>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(c.date).toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                {c.goal && (
                  <div className="mt-2 text-sm flex items-start gap-2">
                    <span className="text-slate-500">🎯</span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={
                          c.goalMet === false
                            ? "text-slate-500 dark:text-slate-400 line-through"
                            : "text-slate-800 dark:text-slate-200"
                        }
                      >
                        {c.goal}
                      </div>
                      {c.goalMet === true && (
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 inline-flex items-center gap-0.5">
                          <Check size={10} strokeWidth={3} /> Hit it
                        </div>
                      )}
                      {c.goalMet === false && (
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 inline-flex items-center gap-0.5">
                          <X size={10} strokeWidth={3} /> Not quite
                        </div>
                      )}
                      {c.goalReviewNote && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5">
                          {c.goalReviewNote}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {c.gratitude && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    <span className="text-slate-500">🙏 </span>
                    {c.gratitude}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {state.checkins.length === 0 && (
        <div className="text-center text-sm text-slate-500 pt-2">
          <Brain className="mx-auto text-slate-300 dark:text-slate-600" size={32} />
          Your past check-ins will appear here.
        </div>
      )}
    </div>
  );
}
