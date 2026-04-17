import { useState } from "react";
import { Sun, Check, Pencil } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import { showReward } from "./RewardToast";
import { hapticSuccess } from "../lib/haptics";
import type { Mood } from "../types";

/**
 * Morning Check-In — the FIRST thing an athlete should do each day.
 * Captures mood, gratitude, and goal in one flow. Lives at the top
 * of the dashboard. After saving, collapses into a summary showing
 * mood emoji + goal with an edit option.
 */

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: "😩", label: "Rough" },
  { value: 2, emoji: "😕", label: "Meh" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "🔥", label: "Great" },
];

export default function MorningCheckInCard() {
  const { state, addCheckin } = useStore();
  const today = todayISO();
  const todaysCheckin = state.checkins.find((c) => c.date === today);
  const alreadyDone = Boolean(
    todaysCheckin && (todaysCheckin.gratitude || todaysCheckin.goal)
  );

  const [expanded, setExpanded] = useState(!alreadyDone);
  const [mood, setMood] = useState<Mood>(todaysCheckin?.mood ?? 3);
  const [gratitude, setGratitude] = useState(todaysCheckin?.gratitude ?? "");
  const [goal, setGoal] = useState(todaysCheckin?.goal ?? "");

  const save = () => {
    if (!gratitude.trim() && !goal.trim()) return;
    const { awardedXp, newlyUnlocked } = addCheckin({
      date: today,
      mood,
      gratitude: gratitude.trim(),
      goal: goal.trim(),
    });
    if (awardedXp > 0) showReward(awardedXp, newlyUnlocked);
    hapticSuccess();
    setExpanded(false);
  };

  // Summary state — morning check-in already done today
  if (alreadyDone && !expanded) {
    const moodInfo = MOODS.find((m) => m.value === todaysCheckin?.mood);
    return (
      <div className="card bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Check size={22} strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                Morning Check-In
              </div>
              <button
                onClick={() => setExpanded(true)}
                className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold inline-flex items-center gap-0.5"
              >
                <Pencil size={9} /> Edit
              </button>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl">{moodInfo?.emoji}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Feeling {moodInfo?.label.toLowerCase()}
              </span>
            </div>
            {todaysCheckin?.goal && (
              <div className="mt-2 flex items-start gap-1.5 text-sm text-slate-800 dark:text-slate-200">
                <span>🎯</span>
                <span className="font-semibold">{todaysCheckin.goal}</span>
              </div>
            )}
            {todaysCheckin?.gratitude && (
              <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span>🙏</span>
                <span>{todaysCheckin.gratitude}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Expanded / not-done state — show the form
  return (
    <div className="card bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
          <Sun size={18} />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
            Start your day
          </div>
          <div className="font-bold text-slate-900 dark:text-white text-sm">
            Morning check-in
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mood */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">
            How are you feeling?
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`py-2 rounded-xl border-2 transition ${
                  mood === m.value
                    ? "border-amber-500 bg-white dark:bg-slate-800 shadow-md"
                    : "border-transparent bg-white/60 dark:bg-slate-900/40"
                }`}
              >
                <div className="text-2xl">{m.emoji}</div>
                <div className="text-[9px] font-semibold text-slate-600 dark:text-slate-400">
                  {m.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Gratitude */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
            🙏 One thing you&apos;re grateful for
          </label>
          <input
            type="text"
            autoComplete="off"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="My coach, a good night's sleep, my team..."
            className="w-full text-sm rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
            🎯 Your #1 goal today
          </label>
          <input
            type="text"
            autoComplete="off"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Finish every drill strong, no half reps"
            className="w-full text-sm rounded-xl border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        <div className="flex gap-2 pt-1">
          {alreadyDone && (
            <button
              onClick={() => setExpanded(false)}
              className="btn-secondary !py-2 !text-xs"
            >
              Cancel
            </button>
          )}
          <button
            onClick={save}
            disabled={!gratitude.trim() && !goal.trim()}
            className="btn-primary flex-1 !py-2 !text-xs disabled:opacity-50"
          >
            {alreadyDone
              ? "Update"
              : `Start the day (+15 XP)`}
          </button>
        </div>
      </div>
    </div>
  );
}
