import { useState } from "react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { showReward } from "../components/RewardToast";
import RecoveryCard from "../components/RecoveryCard";
import NutritionCard from "../components/NutritionCard";
import GoalReviewCard from "../components/GoalReviewCard";
import type { Mood } from "../types";
import { Brain, Check, X } from "lucide-react";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😩", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Great" },
];

export default function MindsetPage() {
  const { state, addCheckin, hasCheckinToday } = useStore();
  const today = todayISO();
  const todaysCheckin = state.checkins.find((c) => c.date === today);

  const [mood, setMood] = useState<Mood>(todaysCheckin?.mood ?? 3);
  const [gratitude, setGratitude] = useState(todaysCheckin?.gratitude ?? "");
  const [goal, setGoal] = useState(todaysCheckin?.goal ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const { awardedXp, newlyUnlocked } = addCheckin({
      date: today,
      mood,
      gratitude: gratitude.trim(),
      goal: goal.trim(),
    });
    showReward(awardedXp, newlyUnlocked);
  }

  const past = state.checkins
    .filter((c) => c.date !== today)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">Daily Check-Ins</h1>
        <p className="text-sm text-slate-600 mt-1">
          Strong mind, strong body. Take 60 seconds.
        </p>
      </header>

      <RecoveryCard />
      <NutritionCard />

      {todaysCheckin &&
        todaysCheckin.goal &&
        todaysCheckin.goalMet === undefined && (
          <GoalReviewCard checkin={todaysCheckin} />
        )}

      {todaysCheckin && todaysCheckin.goalMet !== undefined && (
        <div
          className={`card !p-4 flex items-center gap-3 ${
            todaysCheckin.goalMet
              ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-200"
              : "bg-gradient-to-br from-slate-50 to-white border-slate-200"
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
            <div className="text-xs text-slate-500 font-semibold">
              Today&apos;s goal — {todaysCheckin.goalMet ? "hit!" : "not quite"}
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {todaysCheckin.goal}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-3">
            How are you feeling right now?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => (
              <button
                type="button"
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`py-3 rounded-xl border-2 transition ${
                  mood === m.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-3xl">{m.emoji}</div>
                <div className="text-[10px] font-semibold mt-1 text-slate-600">
                  {m.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            One thing you&apos;re grateful for 🙏
          </label>
          <input
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="My coach, my team, a good night's sleep…"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 focus:border-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 block mb-2">
            Your #1 goal for today 🎯
          </label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Finish every drill strong, no half reps"
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 focus:border-brand-500 outline-none"
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
        >
          {hasCheckinToday ? "Update Check-In" : "Save Check-In (+15 XP)"}
        </button>
      </form>

      {past.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">
            Past Check-Ins
          </h2>
          <div className="space-y-2">
            {past.map((c) => {
              const mood = MOODS.find((m) => m.value === c.mood);
              return (
                <div key={c.id} className="card !p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mood?.emoji}</span>
                    <div className="text-sm font-semibold text-slate-700">
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
                              ? "text-slate-500 line-through"
                              : "text-slate-800"
                          }
                        >
                          {c.goal}
                        </div>
                        {c.goalMet === true && (
                          <div className="text-[11px] font-bold text-emerald-700 mt-0.5 inline-flex items-center gap-0.5">
                            <Check size={10} strokeWidth={3} /> Hit it
                          </div>
                        )}
                        {c.goalMet === false && (
                          <div className="text-[11px] font-bold text-slate-500 mt-0.5 inline-flex items-center gap-0.5">
                            <X size={10} strokeWidth={3} /> Not quite
                          </div>
                        )}
                        {c.goalReviewNote && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            {c.goalReviewNote}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {c.gratitude && (
                    <div className="text-sm text-slate-700 mt-1">
                      <span className="text-slate-500">🙏 </span>
                      {c.gratitude}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {state.checkins.length === 0 && (
        <div className="text-center text-sm text-slate-500 pt-2">
          <Brain className="mx-auto text-slate-300" size={32} />
          Your past check-ins will appear here.
        </div>
      )}
    </div>
  );
}
