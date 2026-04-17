import { useState, useEffect } from "react";
import { Pencil, Check, Sparkles, Lock } from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel } from "../lib/gamification";
import {
  currentStage,
  nextStage,
  stagesForSport,
  getMascotName,
  setMascotName,
} from "../lib/mascot";
import { hapticLight, hapticMedium } from "../lib/haptics";
import { fireConfetti } from "./Confetti";

/**
 * Dashboard mascot card. A sport-themed pet that evolves through 5
 * stages as the athlete levels up. First-time users get a prompt to
 * name it; once named, tapping the mascot plays a little bounce and
 * haptic.
 */
export default function MascotCard() {
  const { state } = useStore();
  const [name, setName] = useState(() => getMascotName());
  const [naming, setNaming] = useState(!name);
  const [input, setInput] = useState("");
  const [bouncing, setBouncing] = useState(false);
  const [showAllStages, setShowAllStages] = useState(false);

  // Detect evolution (when stage changes) and celebrate
  const [prevStageIdx, setPrevStageIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!state.profile) return;
    const level = computeLevel(state.xp, state.profile.sport).level;
    const stage = currentStage(state.profile.sport, level);
    if (prevStageIdx === null) {
      setPrevStageIdx(stage.index);
      return;
    }
    if (stage.index > prevStageIdx) {
      fireConfetti(60);
      hapticMedium();
    }
    setPrevStageIdx(stage.index);
  }, [state.xp, state.profile, prevStageIdx]);

  if (!state.profile) return null;

  const level = computeLevel(state.xp, state.profile.sport).level;
  const stage = currentStage(state.profile.sport, level);
  const next = nextStage(state.profile.sport, level);
  const allStages = stagesForSport(state.profile.sport);

  const tapMascot = () => {
    hapticLight();
    setBouncing(true);
    window.setTimeout(() => setBouncing(false), 400);
  };

  const saveName = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMascotName(trimmed);
    setName(trimmed);
    setNaming(false);
  };

  // Progress to next stage
  const progressPct = next
    ? Math.min(
        100,
        Math.round(((level - stage.minLevel) / (next.minLevel - stage.minLevel)) * 100)
      )
    : 100;

  return (
    <div className="card bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-sky-950 dark:via-indigo-950 dark:to-purple-950 border-sky-200 dark:border-sky-800">
      {/* Header strip */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={12} className="text-indigo-500" />
        <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-400">
          Your Mascot
        </div>
        <span className="text-[10px] text-slate-500 ml-auto">
          Stage {stage.index + 1} of {allStages.length}
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Emoji */}
        <button
          onClick={tapMascot}
          className={`text-6xl transition-transform select-none ${
            bouncing ? "animate-bounce" : ""
          }`}
          aria-label="Pet the mascot"
        >
          {stage.emoji}
        </button>

        {/* Name + stage info */}
        <div className="flex-1 min-w-0">
          {naming ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                Name your {stage.name}!
              </label>
              <input
                type="text"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Beary, Ace, Thunder..."
                maxLength={24}
                autoFocus
                className="w-full text-sm rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                onClick={saveName}
                disabled={!input.trim()}
                className="btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Check size={12} /> Name it
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {name}
                </div>
                <button
                  onClick={() => {
                    setInput(name);
                    setNaming(true);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Rename"
                >
                  <Pencil size={11} />
                </button>
              </div>
              <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                {stage.name}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                {stage.description}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress to next stage */}
      {!naming && next && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              Evolving to {next.emoji} {next.name}
            </span>
            <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
              Lvl {level}/{next.minLevel}
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {!naming && !next && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-center text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
          🏆 Max evolution — you&apos;ve reached the top!
        </div>
      )}

      {/* Collapsed evolution preview */}
      {!naming && (
        <button
          onClick={() => setShowAllStages((x) => !x)}
          className="mt-2 w-full text-[10px] text-slate-500 hover:text-slate-700 font-semibold"
        >
          {showAllStages ? "Hide evolution" : "See all stages →"}
        </button>
      )}

      {showAllStages && (
        <div className="mt-2 grid grid-cols-5 gap-1 animate-slide-up">
          {allStages.map((s) => {
            const unlocked = level >= s.minLevel;
            return (
              <div
                key={s.index}
                className={`text-center rounded-xl p-1.5 transition ${
                  s.index === stage.index
                    ? "bg-indigo-200 dark:bg-indigo-900 ring-2 ring-indigo-500"
                    : unlocked
                    ? "bg-white/60 dark:bg-slate-900/40"
                    : "bg-slate-100 dark:bg-slate-800 opacity-60"
                }`}
              >
                <div className="text-2xl">
                  {unlocked ? s.emoji : <Lock size={18} className="mx-auto text-slate-400" />}
                </div>
                <div className="text-[8px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  {s.name}
                </div>
                <div className="text-[8px] text-slate-400">
                  Lvl {s.minLevel}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
