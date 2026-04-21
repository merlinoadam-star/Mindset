import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Flame, Play, RotateCcw, Target, Trophy, Zap } from "lucide-react";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { computeLevel } from "../lib/gamification";
import { isUnlocked } from "../lib/unlocks";
import { hapticLight, hapticSuccess } from "../lib/haptics";
import {
  PLAY_CALL_BASE_XP,
  PLAY_CALL_PERFECT_BONUS,
  PLAY_CALL_ROUND_SIZE,
  PLAY_CALL_SECONDS,
  pickCallRound,
  streakMultiplier,
  type PlayCall,
} from "../lib/playCalls";

/**
 * Play Call — 10-call speed round.
 *
 * Each call gets a 7-second timer. Correct answers earn base XP + a
 * speed bonus (faster = more), scaled by a streak multiplier for
 * consecutive correct answers. Wrong answers and timeouts reset the
 * streak and earn nothing.
 *
 * Final score = sum of per-call XP (+ perfect-round bonus if all
 * correct). Best score is tracked via completeGameRound('playcall').
 */

type Phase = "intro" | "playing" | "review" | "result";

interface CallResult {
  call: PlayCall;
  chosenIndex: number | null; // null = timed out
  correct: boolean;
  secondsUsed: number; // wall-clock seconds
  xp: number;
  multiplierAtAward: number;
}

const GAME_ID = "playcall";

export default function PlayCallPage() {
  const { state, completeGameRound } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState<PlayCall[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<CallResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [millisLeft, setMillisLeft] = useState(PLAY_CALL_SECONDS * 1000);
  const [lockedChoice, setLockedChoice] = useState<number | null>(null);

  const tickRef = useRef<number | null>(null);
  const callStartRef = useRef<number>(0);

  const roundsPlayed = state.gamePlaysCount?.[GAME_ID] ?? 0;
  const best = state.gameBestScores?.[GAME_ID] ?? 0;

  const sport = state.profile?.sport;

  // ---------- Round flow ----------
  const startRound = useCallback(() => {
    if (!sport) return;
    setRound(pickCallRound(sport, roundsPlayed));
    setIdx(0);
    setResults([]);
    setStreak(0);
    setLockedChoice(null);
    setMillisLeft(PLAY_CALL_SECONDS * 1000);
    setPhase("playing");
    callStartRef.current = performance.now();
  }, [sport, roundsPlayed]);

  // Start the per-call timer whenever we enter the playing phase
  // or advance to the next call.
  useEffect(() => {
    if (phase !== "playing") return;
    callStartRef.current = performance.now();
    setMillisLeft(PLAY_CALL_SECONDS * 1000);
    setLockedChoice(null);

    tickRef.current = window.setInterval(() => {
      const elapsed = performance.now() - callStartRef.current;
      const remaining = Math.max(0, PLAY_CALL_SECONDS * 1000 - elapsed);
      setMillisLeft(remaining);
      if (remaining <= 0) {
        if (tickRef.current) {
          window.clearInterval(tickRef.current);
          tickRef.current = null;
        }
        // Timeout — count as wrong, break streak.
        recordAnswer(null);
      }
    }, 50);

    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  const current = round[idx];

  const recordAnswer = useCallback(
    (chosenIndex: number | null) => {
      if (!current) return;
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      const secondsUsed = Math.min(
        PLAY_CALL_SECONDS,
        (performance.now() - callStartRef.current) / 1000
      );
      const correct = chosenIndex !== null && chosenIndex === current.bestIndex;
      const nextStreak = correct ? streak + 1 : 0;
      const multiplier = streakMultiplier(correct ? nextStreak : 0);

      let xp = 0;
      if (correct) {
        const secondsRemaining = Math.max(0, PLAY_CALL_SECONDS - secondsUsed);
        const speedBonus = Math.round(secondsRemaining); // 1 XP per second left
        xp = Math.round((PLAY_CALL_BASE_XP + speedBonus) * multiplier);
        hapticSuccess();
      } else {
        hapticLight();
      }

      setLockedChoice(chosenIndex);
      setStreak(nextStreak);
      setResults((prev) => [
        ...prev,
        {
          call: current,
          chosenIndex,
          correct,
          secondsUsed,
          xp,
          multiplierAtAward: multiplier,
        },
      ]);
      setPhase("review");
    },
    [current, streak]
  );

  // Advance from review → next call or results
  const advance = useCallback(() => {
    if (idx + 1 >= round.length) {
      setPhase("result");
      return;
    }
    setIdx((i) => i + 1);
    setPhase("playing");
  }, [idx, round.length]);

  // On entering result phase: award total XP + record best score.
  useEffect(() => {
    if (phase !== "result") return;
    const totalXp = results.reduce((sum, r) => sum + r.xp, 0);
    const correctCount = results.filter((r) => r.correct).length;
    const perfect = correctCount === PLAY_CALL_ROUND_SIZE;
    const xpWithBonus = totalXp + (perfect ? PLAY_CALL_PERFECT_BONUS : 0);

    // Score for this game = total XP earned this round (used as the
    // high-score metric). Simpler than a separate points field.
    completeGameRound(GAME_ID, xpWithBonus, xpWithBonus);

    const labels: string[] = [];
    if (perfect) labels.push("__combo__Perfect round!");
    if (xpWithBonus > 0) showReward(xpWithBonus, labels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!state.profile || !sport) return null;

  // Level gate — deep-link guard. The Games hub already renders this
  // as a locked card at levels below 5.
  if (!isUnlocked("game.playcall", computeLevel(state.xp, sport).level)) {
    return <Navigate to="/games" replace />;
  }

  // ---------- Render ----------
  if (phase === "intro") {
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link to="/games" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2">
            <ArrowLeft size={16} /> Games
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-sm">
              <Target size={18} />
            </div>
            <h1 className="page-title">Play Call</h1>
          </div>
          <p className="page-subtitle">7 seconds per call. Think fast. Call it right.</p>
        </header>

        <div className="card">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
            How it works
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <li>• {PLAY_CALL_ROUND_SIZE} calls per round</li>
            <li>• {PLAY_CALL_SECONDS} seconds to answer each one</li>
            <li>• +{PLAY_CALL_BASE_XP} XP per correct call, plus 1 XP per second saved</li>
            <li>• Streak multipliers: 3-in-a-row 1.5×, 5-in-a-row 2×, 7+ 2.5×</li>
            <li>• Perfect round: +{PLAY_CALL_PERFECT_BONUS} XP bonus</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Rounds" value={roundsPlayed} />
          <StatTile label="Best score" value={best} />
        </div>

        <button
          onClick={startRound}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          <Play size={16} /> Start round
        </button>
      </div>
    );
  }

  if (phase === "result") {
    const totalXp = results.reduce((sum, r) => sum + r.xp, 0);
    const correctCount = results.filter((r) => r.correct).length;
    const perfect = correctCount === PLAY_CALL_ROUND_SIZE;
    const xpWithBonus = totalXp + (perfect ? PLAY_CALL_PERFECT_BONUS : 0);
    const newBest = xpWithBonus > best;

    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <Link to="/games" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2">
            <ArrowLeft size={16} /> Games
          </Link>
          <h1 className="page-title">Round summary</h1>
        </header>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-500 text-white p-5 shadow-elevated text-center">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">Total</div>
          <div className="text-5xl font-extrabold tabular-nums mt-1">{xpWithBonus}</div>
          <div className="text-sm font-semibold mt-1">XP</div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">
              {correctCount}/{PLAY_CALL_ROUND_SIZE} correct
            </span>
            {perfect && (
              <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Trophy size={12} /> Perfect! +{PLAY_CALL_PERFECT_BONUS}
              </span>
            )}
            {newBest && (
              <span className="text-xs font-bold bg-white text-rose-700 px-2.5 py-1 rounded-full">
                New best!
              </span>
            )}
          </div>
        </div>

        {/* Per-call recap */}
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={r.call.id}
              className={`card !p-3 border-l-4 ${
                r.correct
                  ? "border-emerald-500"
                  : "border-rose-500"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    Call {i + 1} · {r.correct ? "Correct" : r.chosenIndex === null ? "Timed out" : "Wrong"}
                    {r.correct && r.multiplierAtAward > 1 && ` · ${r.multiplierAtAward}× streak`}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                    {r.call.situation}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    You:{" "}
                    <span className="font-semibold">
                      {r.chosenIndex === null ? "— (no answer)" : r.call.options[r.chosenIndex]}
                    </span>
                    {!r.correct && (
                      <>
                        {" "}
                        · Best:{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {r.call.options[r.call.bestIndex]}
                        </span>
                      </>
                    )}
                  </div>
                  {r.call.why && !r.correct && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic leading-snug">
                      {r.call.why}
                    </div>
                  )}
                </div>
                <div className={`text-sm font-bold tabular-nums ${r.correct ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {r.correct ? `+${r.xp}` : "—"}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={startRound}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Play again
          </button>
          <Link
            to="/games"
            className="flex-1 text-center rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Games
          </Link>
        </div>
      </div>
    );
  }

  // phase === "playing" or "review"
  if (!current) return null;
  const lastResult = results[results.length - 1];
  const reviewing = phase === "review";
  const secondsLeft = Math.ceil(millisLeft / 1000);
  const timerPct = (millisLeft / (PLAY_CALL_SECONDS * 1000)) * 100;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link to="/games" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2">
          <ArrowLeft size={16} /> Games
        </Link>
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-slate-400">
            Call {idx + 1} of {PLAY_CALL_ROUND_SIZE}
          </div>
          <div className="flex items-center gap-2">
            {streak >= 3 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                <Flame size={12} /> {streak} · {streakMultiplier(streak)}×
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Timer bar */}
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            reviewing
              ? lastResult?.correct
                ? "bg-emerald-500"
                : "bg-rose-500"
              : "bg-gradient-to-r from-amber-400 to-rose-500"
          }`}
          style={{
            width: reviewing ? "100%" : `${timerPct}%`,
            transitionDuration: reviewing ? "200ms" : "50ms",
          }}
        />
      </div>

      {/* Situation */}
      <div className="card">
        <div className="text-[11px] uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 mb-1.5">
          Call it
        </div>
        <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
          {current.situation}
        </div>
        {!reviewing && (
          <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            <Zap size={14} className="text-amber-500" />
            {secondsLeft}s
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid gap-2">
        {current.options.map((opt, i) => {
          const isChosen = lockedChoice === i;
          const isBest = current.bestIndex === i;
          let classes =
            "card text-left w-full font-semibold text-slate-900 dark:text-slate-100 border-2 border-transparent transition";
          if (reviewing) {
            if (isBest) {
              classes +=
                " !bg-emerald-50 dark:!bg-emerald-950/40 !border-emerald-400 dark:!border-emerald-700 text-emerald-900 dark:text-emerald-100";
            } else if (isChosen) {
              classes +=
                " !bg-rose-50 dark:!bg-rose-950/40 !border-rose-400 dark:!border-rose-700 text-rose-900 dark:text-rose-100";
            } else {
              classes += " opacity-50";
            }
          } else {
            classes += " hover:border-rose-300 dark:hover:border-rose-700 active:scale-[0.99]";
          }
          return (
            <button
              key={i}
              disabled={reviewing}
              onClick={() => recordAnswer(i)}
              className={classes}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center flex-shrink-0 ${
                    reviewing && isBest
                      ? "bg-emerald-500 text-white"
                      : reviewing && isChosen
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="flex-1">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {reviewing && (
        <div className="space-y-3">
          {lastResult?.call.why && (
            <div className="card text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
              {lastResult.call.why}
            </div>
          )}
          <button onClick={advance} className="btn-primary w-full">
            {idx + 1 >= PLAY_CALL_ROUND_SIZE ? "See results" : "Next call"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card !p-3 text-center">
      <div className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

// Shut TS up if imports end up unused in some branch.
void useMemo;
