import { useState } from "react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { showReward } from "../components/RewardToast";
import RecoveryCard from "../components/RecoveryCard";
import type { Mood } from "../types";
import { Brain } from "lucide-react";

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
                    <div className="mt-2 text-sm">
                      <span className="text-slate-500">🎯 </span>
                      {c.goal}
                    </div>
                  )}
                  {c.gratitude && (
                    <div className="text-sm text-slate-700">
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
