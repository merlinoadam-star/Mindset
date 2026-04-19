import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { ArrowLeft, Grid3x3, Play, Trophy } from "lucide-react";
import type { Sport } from "../types";

type Phase = "intro" | "watch" | "recall" | "result";

interface Pad {
  id: number;
  label: string;
  emoji: string;
  color: string;
  glow: string;
}

const PADS_WRESTLING: Pad[] = [
  { id: 0, label: "Shot",   emoji: "⚡", color: "bg-emerald-500", glow: "bg-emerald-300" },
  { id: 1, label: "Sprawl", emoji: "🛡️", color: "bg-sky-500",     glow: "bg-sky-300" },
  { id: 2, label: "Turn",   emoji: "🔄", color: "bg-amber-500",   glow: "bg-amber-300" },
  { id: 3, label: "Pin",    emoji: "🥇", color: "bg-rose-500",    glow: "bg-rose-300" },
];

const PADS_VOLLEYBALL: Pad[] = [
  { id: 0, label: "Pass",  emoji: "🙌", color: "bg-emerald-500", glow: "bg-emerald-300" },
  { id: 1, label: "Set",   emoji: "🎯", color: "bg-sky-500",     glow: "bg-sky-300" },
  { id: 2, label: "Hit",   emoji: "🏐", color: "bg-amber-500",   glow: "bg-amber-300" },
  { id: 3, label: "Block", emoji: "🧱", color: "bg-rose-500",    glow: "bg-rose-300" },
];

function padsForSport(sport: Sport): Pad[] {
  return sport === "wrestling" ? PADS_WRESTLING : PADS_VOLLEYBALL;
}

const XP_PER_LEVEL = 5;
const START_LEN = 3;

export default function FocusFlashPage() {
  const { state, completeGameRound } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIdx, setInputIdx] = useState(0);
  const [flashingPad, setFlashingPad] = useState<number | null>(null);
  const [level, setLevel] = useState(0); // sequence length reached
  const flashTimerRef = useRef<number | null>(null);

  const best = state.gameBestScores?.["flash"] ?? 0;
  const pads = useMemo(
    () => (state.profile ? padsForSport(state.profile.sport) : PADS_WRESTLING),
    [state.profile]
  );
  const combo =
    state.profile?.sport === "wrestling"
      ? "Think of it as a combo: shot → sprawl counter → turn → pin."
      : "Think of it as a rally: pass → set → hit → block.";

  const startNextLevel = useCallback(
    (length: number) => {
      const seq = Array.from({ length }, () =>
        Math.floor(Math.random() * pads.length)
      );
      setSequence(seq);
      setInputIdx(0);
      setPhase("watch");
    },
    [pads.length]
  );

  // Play the sequence during "watch" phase
  useEffect(() => {
    if (phase !== "watch") return;
    let i = 0;
    const playStep = () => {
      if (i >= sequence.length) {
        setFlashingPad(null);
        setPhase("recall");
        return;
      }
      setFlashingPad(sequence[i]);
      flashTimerRef.current = window.setTimeout(() => {
        setFlashingPad(null);
        flashTimerRef.current = window.setTimeout(() => {
          i++;
          playStep();
        }, 250);
      }, 600);
    };
    // Small delay before starting
    const initial = window.setTimeout(playStep, 500);
    return () => {
      window.clearTimeout(initial);
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, [phase, sequence]);

  function start() {
    setLevel(0);
    startNextLevel(START_LEN);
  }

  function tapPad(id: number) {
    if (phase !== "recall") return;
    const expected = sequence[inputIdx];
    if (id !== expected) {
      // Wrong — game over. Quick flash feedback.
      setFlashingPad(id);
      window.setTimeout(() => setFlashingPad(null), 300);
      setPhase("result");
      return;
    }
    // Right — visual feedback
    setFlashingPad(id);
    window.setTimeout(() => setFlashingPad(null), 180);

    if (inputIdx + 1 === sequence.length) {
      // Level complete! Advance
      setLevel(sequence.length);
      window.setTimeout(() => {
        startNextLevel(sequence.length + 1);
      }, 550);
    } else {
      setInputIdx(inputIdx + 1);
    }
  }

  // Award XP on result once
  const hasAwarded = useRef(false);
  useEffect(() => {
    if (phase === "result" && !hasAwarded.current) {
      hasAwarded.current = true;
      const earned = Math.max(0, level) * XP_PER_LEVEL;
      const bonus = level >= 8 ? 15 : level >= 6 ? 10 : 0;
      const total = earned + bonus;
      const { awardedXp, newlyUnlocked } = completeGameRound(
        "flash",
        level,
        total
      );
      if (awardedXp > 0 || newlyUnlocked.length) {
        showReward(awardedXp, newlyUnlocked);
      }
    }
    if (phase !== "result") hasAwarded.current = false;
  }, [phase, level, completeGameRound]);

  // ----- Render -----
  if (phase === "intro") {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link
            to="/games"
            className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
          >
            <ArrowLeft size={16} /> Mini-Games
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center">
              <Grid3x3 size={18} />
            </div>
            <h1 className="page-title">Focus Flash</h1>
          </div>
          <p className="page-subtitle">
            Memorize the combo — train your working memory.
          </p>
        </header>

        <div className="card text-center py-7">
          <div className="text-6xl mb-3">🧩</div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Memorize the Combo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xs mx-auto">
            Watch the moves light up in order. Then tap them in the same
            sequence. Each level adds one more move. {combo}
          </p>
          {best > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold">
              <Trophy size={14} className="text-amber-500" />
              Best level: {best}
            </div>
          )}
          <button onClick={start} className="btn-primary mt-5 mx-auto">
            <Play size={16} className="inline mr-1" /> Start
          </button>
        </div>

        <div className="card text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {pads.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <span aria-hidden="true">{p.emoji}</span> {p.label}
              </span>
            ))}
          </div>
          <div>
            Starting length: <strong>{START_LEN} moves</strong>
          </div>
          <div>+{XP_PER_LEVEL} XP per level reached</div>
          <div>Bonus +10 XP at level 6 · +15 XP at level 8+</div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const isBest = level > best;
    const xp =
      level * XP_PER_LEVEL + (level >= 8 ? 15 : level >= 6 ? 10 : 0);
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <h1 className="page-title">Round Complete</h1>
        </header>

        <div className="card text-center py-7">
          <div className="text-6xl mb-3">
            {level >= 8 ? "🏆" : level >= 6 ? "🎯" : level >= 4 ? "💪" : "🌱"}
          </div>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
            Level {level}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">
            Reached
          </div>
          {isBest && level > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              <Trophy size={12} /> New personal best!
            </div>
          )}
          <div className="mt-4 inline-flex items-center gap-2 chip bg-brand-50 !text-brand-700 !text-base !px-4 !py-2 font-bold">
            +{xp} XP
          </div>
        </div>

        <button onClick={start} className="btn-primary w-full">
          Play Again
        </button>
      </div>
    );
  }

  // Watch / Recall: shared board
  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 text-white">
        <button
          onClick={() => setPhase("result")}
          className="text-sm text-white/60 hover:text-white"
        >
          Exit
        </button>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider font-bold text-white/50">
            Level
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            {sequence.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.3em] font-bold text-white/50">
            {phase === "watch" ? "Watch" : "Your Turn"}
          </div>
          {phase === "recall" && (
            <div className="text-sm text-white/70 mt-1 tabular-nums">
              {inputIdx} / {sequence.length}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-72 h-72">
          {pads.map((p) => {
            const isFlashing = flashingPad === p.id;
            return (
              <button
                key={p.id}
                onClick={() => tapPad(p.id)}
                disabled={phase === "watch"}
                aria-label={p.label}
                className={`rounded-3xl transition-all duration-150 flex flex-col items-center justify-center text-white select-none ${
                  isFlashing ? `${p.glow} scale-95 shadow-2xl` : p.color
                } ${
                  phase === "watch"
                    ? "cursor-default"
                    : "cursor-pointer hover:scale-[1.02] active:scale-95"
                }`}
              >
                <span className="text-3xl leading-none" aria-hidden="true">
                  {p.emoji}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider mt-1">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 text-center text-white/40 text-xs uppercase tracking-wider font-bold">
        {phase === "watch"
          ? "Memorize the combo..."
          : "Tap the moves in order"}
      </div>
    </div>
  );
}
