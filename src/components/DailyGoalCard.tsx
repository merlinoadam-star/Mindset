import { useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "./RewardToast";
import { todayISO } from "../lib/gamification";
import { Target, Check, X, Pencil, Sparkles } from "lucide-react";

/**
 * Prominent daily goal card with three states:
 *
 * 1. No goal yet — input to enter it ("What's your #1 goal for today?")
 * 2. Goal set, not reviewed — "Mark complete" / "Not quite" buttons
 * 3. Goal reviewed — shows the result with a status badge and edit option
 */
export default function DailyGoalCard() {
  const { state, setDailyGoal, reviewGoal } = useStore();
  const today = todayISO();
  const todayCheckin = state.checkins.find((c) => c.date === today);
  const goal = todayCheckin?.goal?.trim() ?? "";
  const hasGoal = goal.length > 0;
  const reviewed = todayCheckin?.goalMet !== undefined;
  const goalMet = todayCheckin?.goalMet === true;

  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  function saveGoal() {
    const text = input.trim();
    if (!text) return;
    const { awardedXp, newlyUnlocked } = setDailyGoal(text);
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
    setInput("");
    setEditing(false);
  }

  function review(met: boolean) {
    if (!todayCheckin) return;
    const { awardedXp, newlyUnlocked } = reviewGoal(todayCheckin.id, met);
    if (awardedXp > 0 || newlyUnlocked.length) {
      showReward(awardedXp, newlyUnlocked);
    }
  }

  // --------------------------------------------------------------
  // State 1: No goal yet — input form
  // --------------------------------------------------------------
  if (!hasGoal || editing) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white p-5 shadow-elevated">
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Target size={16} />
            </div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/80">
              Today&apos;s Goal
            </span>
          </div>
          <label className="block text-lg font-extrabold mb-2">
            What&apos;s your #1 focus today?
          </label>
          <input
            autoFocus={editing}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveGoal()}
            placeholder={
              editing && hasGoal ? goal : "Finish every drill strong"
            }
            className="w-full rounded-xl bg-white/15 border border-white/20 px-3 py-2.5 text-white placeholder:text-white/50 focus:border-white/60 outline-none font-semibold"
          />
          <div className="mt-3 flex gap-2">
            {editing && (
              <button
                onClick={() => {
                  setEditing(false);
                  setInput("");
                }}
                className="flex-1 py-2.5 rounded-xl border border-white/25 text-white/80 font-bold text-sm"
              >
                Cancel
              </button>
            )}
            <button
              onClick={saveGoal}
              disabled={!input.trim()}
              className="flex-1 py-2.5 rounded-xl bg-white text-orange-600 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition"
            >
              {hasGoal ? "Update Goal" : "Set Today's Goal"}
              {!hasGoal && (
                <span className="ml-1 opacity-70 text-xs">+5 XP</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------
  // State 3: Goal reviewed — show result
  // --------------------------------------------------------------
  if (reviewed) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl p-5 shadow-card ${
          goalMet
            ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
            : "bg-gradient-to-br from-slate-800 to-slate-900 text-white"
        }`}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              goalMet ? "bg-white/20" : "bg-white/10"
            }`}
          >
            {goalMet ? (
              <Check size={20} strokeWidth={3} />
            ) : (
              <X size={20} strokeWidth={3} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/70">
                Today&apos;s Goal
              </span>
              {goalMet && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-100 bg-white/15 px-2 py-0.5 rounded-full">
                  Hit it
                </span>
              )}
            </div>
            <blockquote className="mt-1 text-base font-bold leading-snug">
              &ldquo;{goal}&rdquo;
            </blockquote>
            {todayCheckin?.goalReviewNote && (
              <p className="mt-2 text-xs text-white/70 italic leading-snug">
                {todayCheckin.goalReviewNote}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------
  // State 2: Goal set, not yet reviewed — show with complete buttons
  // --------------------------------------------------------------
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-5 shadow-elevated">
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-amber-300" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-200">
              Today&apos;s Goal
            </span>
          </div>
          <button
            onClick={() => {
              setInput(goal);
              setEditing(true);
            }}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
            aria-label="Edit goal"
          >
            <Pencil size={12} />
          </button>
        </div>

        <blockquote className="text-lg font-extrabold leading-snug">
          &ldquo;{goal}&rdquo;
        </blockquote>

        <div className="mt-4 text-xs text-white/70 font-semibold mb-2">
          Did you hit it?
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => review(true)}
            className="py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.97] shadow-md"
          >
            <Check size={16} strokeWidth={3} /> Mark Complete
          </button>
          <button
            onClick={() => review(false)}
            className="py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.97] hover:bg-white/15"
          >
            <X size={14} strokeWidth={3} /> Not quite
          </button>
        </div>
        <p className="text-[11px] text-white/50 mt-2 text-center">
          +10 XP for reviewing — every rep counts
        </p>
      </div>
    </div>
  );
}
