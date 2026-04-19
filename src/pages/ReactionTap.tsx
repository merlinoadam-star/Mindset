import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { ArrowLeft, Zap, Play, Trophy } from "lucide-react";
import type { Sport } from "../types";

type Phase = "intro" | "playing" | "result";
type TargetKind = "go" | "no" | "wait";

interface Target {
  kind: TargetKind;
  x: number; // %
  y: number; // %
  appearedAt: number;
}

const ROUND_SECONDS = 30;

/**
 * Sport-specific labeling. Kinds are intentionally abstract ("go" /
 * "no" / "wait") so the mechanic is the same across sports — we just
 * overlay meaning: a takedown opening vs. a sprawl, a hittable set
 * vs. a shanked ball, etc.
 */
interface TargetLabels {
  go: { emoji: string; label: string; color: string };
  no: { emoji: string; label: string; color: string };
  wait: { emoji: string; label: string; color: string };
  /** Header tagline on the intro / during play */
  tagline: string;
  /** One-line instruction on the playing screen footer */
  footer: string;
}

const LABELS_WRESTLING: TargetLabels = {
  go: { emoji: "⚡", label: "SHOT", color: "bg-green-500" },
  no: { emoji: "🛡️", label: "SPRAWL", color: "bg-red-500" },
  wait: { emoji: "💤", label: "STALL", color: "bg-yellow-400" },
  tagline: "Spot the shot — pounce when it's open, sit tight when it's not.",
  footer: "SHOT → tap · SPRAWL → wait · STALL → ignore",
};

const LABELS_VOLLEYBALL: TargetLabels = {
  go: { emoji: "🏐", label: "SWING", color: "bg-green-500" },
  no: { emoji: "❌", label: "SHANK", color: "bg-red-500" },
  wait: { emoji: "🆓", label: "FREE", color: "bg-yellow-400" },
  tagline: "Read the pass — swing when it's in system, wait when it isn't.",
  footer: "SWING → tap · SHANK → wait · FREE → let it pass",
};

function labelsForSport(sport: Sport): TargetLabels {
  return sport === "wrestling" ? LABELS_WRESTLING : LABELS_VOLLEYBALL;
}

export default function ReactionTapPage() {
  const { state, completeGameRound } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [target, setTarget] = useState<Target | null>(null);
  const [feedback, setFeedback] = useState<null | { kind: "good" | "bad" | "miss"; text: string }>(null);

  const targetTimeoutRef = useRef<number | null>(null);
  const missTimeoutRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const clockRef = useRef<number | null>(null);

  const best = state.gameBestScores?.["reaction"] ?? 0;
  const labels = state.profile ? labelsForSport(state.profile.sport) : LABELS_WRESTLING;

  const spawnNext = useCallback(() => {
    if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);
    // wait 400-1200ms between targets
    const delay = 400 + Math.random() * 800;
    targetTimeoutRef.current = window.setTimeout(() => {
      // 70% go, 20% no, 10% wait
      const r = Math.random();
      const kind: TargetKind = r < 0.7 ? "go" : r < 0.9 ? "no" : "wait";
      const pad = 15;
      setTarget({
        kind,
        x: pad + Math.random() * (100 - pad * 2),
        y: pad + Math.random() * (100 - pad * 2),
        appearedAt: performance.now(),
      });

      // Auto-disappear after 900ms — counts as miss if "go"
      missTimeoutRef.current = window.setTimeout(() => {
        setTarget((t) => {
          if (t?.kind === "go") {
            setMisses((m) => m + 1);
            setFeedback({ kind: "miss", text: "Missed!" });
            clearFeedbackAfter();
          }
          return null;
        });
        spawnNext();
      }, 900);
    }, delay);
  }, []);

  const clearFeedbackAfter = useCallback(() => {
    if (feedbackTimeoutRef.current)
      window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 500);
  }, []);

  function start() {
    setScore(0);
    setHits(0);
    setMisses(0);
    setWrongTaps(0);
    setReactionTimes([]);
    setTimeLeft(ROUND_SECONDS);
    setTarget(null);
    setFeedback(null);
    setPhase("playing");
  }

  // Main game clock + initial spawn
  useEffect(() => {
    if (phase !== "playing") return;
    spawnNext();
    clockRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (clockRef.current) window.clearInterval(clockRef.current);
      if (targetTimeoutRef.current)
        window.clearTimeout(targetTimeoutRef.current);
      if (missTimeoutRef.current)
        window.clearTimeout(missTimeoutRef.current);
      if (feedbackTimeoutRef.current)
        window.clearTimeout(feedbackTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function tapTarget() {
    if (!target) return;
    if (target.kind === "go") {
      const rt = Math.round(performance.now() - target.appearedAt);
      setReactionTimes((arr) => [...arr, rt]);
      setScore((s) => s + 1);
      setHits((h) => h + 1);
      setFeedback({ kind: "good", text: `${rt}ms` });
      clearFeedbackAfter();
    } else if (target.kind === "no") {
      setScore((s) => Math.max(0, s - 2));
      setWrongTaps((w) => w + 1);
      setFeedback({ kind: "bad", text: `${labels.no.label}!` });
      clearFeedbackAfter();
    } else if (target.kind === "wait") {
      setScore((s) => Math.max(0, s - 1));
      setWrongTaps((w) => w + 1);
      setFeedback({ kind: "bad", text: `${labels.wait.label} = wait` });
      clearFeedbackAfter();
    }
    // Clear current target & schedule next
    setTarget(null);
    if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);
    spawnNext();
  }

  function finish() {
    if (clockRef.current) window.clearInterval(clockRef.current);
    if (targetTimeoutRef.current) window.clearTimeout(targetTimeoutRef.current);
    if (missTimeoutRef.current) window.clearTimeout(missTimeoutRef.current);
    setTarget(null);
    setPhase("result");
  }

  // When phase changes to result, award XP once
  const hasAwarded = useRef(false);
  useEffect(() => {
    if (phase === "result" && !hasAwarded.current) {
      hasAwarded.current = true;
      const baseXp = score; // 1 XP per point
      const bonus = score >= 20 ? 10 : score >= 10 ? 5 : 0;
      const totalXp = Math.max(0, baseXp + bonus);
      const { awardedXp, newlyUnlocked } = completeGameRound(
        "reaction",
        score,
        totalXp
      );
      if (awardedXp > 0 || newlyUnlocked.length) {
        showReward(awardedXp, newlyUnlocked);
      }
    }
    if (phase !== "result") hasAwarded.current = false;
  }, [phase, score, completeGameRound]);

  // -----------------
  // Render
  // -----------------
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
              <Zap size={18} />
            </div>
            <h1 className="page-title">Reaction Tap</h1>
          </div>
          <p className="page-subtitle">{labels.tagline}</p>
        </header>

        <div className="card text-center py-7">
          <div className="text-6xl mb-3">{labels.go.emoji}</div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {ROUND_SECONDS}-Second Challenge
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xs mx-auto">
            Tap every <span className="font-bold text-green-600 dark:text-green-400">{labels.go.label}</span> as fast
            as you can.
          </p>
          {best > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold">
              <Trophy size={14} className="text-amber-500" />
              Best: {best}
            </div>
          )}
          <button onClick={start} className="btn-primary mt-5 mx-auto">
            <Play size={16} className="inline mr-1" /> Start
          </button>
        </div>

        <div className="card space-y-2 text-sm">
          <LegendRow {...labels.go} action="tap (+1 pt, faster = better)" />
          <LegendRow {...labels.no} action="don't tap (−2 pts if tapped)" />
          <LegendRow {...labels.wait} action="let it pass (−1 pt if tapped)" />
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const avgRt =
      reactionTimes.length > 0
        ? Math.round(
            reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
          )
        : 0;
    const fastest =
      reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
    const isBest = score > best;

    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <h1 className="page-title">Round Complete!</h1>
        </header>

        <div className="card text-center py-7">
          <div className="text-6xl mb-3">
            {score >= 25 ? "🏆" : score >= 15 ? "🎯" : "💪"}
          </div>
          <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
            {score}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">
            Score
          </div>
          {isBest && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              <Trophy size={12} /> New personal best!
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Hits" value={hits} accent="text-green-600" />
          <StatTile label="Wrong" value={wrongTaps + misses} accent="text-red-500" />
          <StatTile
            label="Avg Reaction"
            value={avgRt > 0 ? `${avgRt}ms` : "—"}
          />
          <StatTile
            label="Fastest"
            value={fastest > 0 ? `${fastest}ms` : "—"}
          />
        </div>

        <button onClick={start} className="btn-primary w-full">
          Play Again
        </button>
      </div>
    );
  }

  // Playing
  const labelForTarget = target
    ? target.kind === "go"
      ? labels.go
      : target.kind === "no"
      ? labels.no
      : labels.wait
    : null;

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-white">
          <div className="text-xs uppercase tracking-wider font-bold text-white/50">
            Score
          </div>
          <div className="text-2xl font-extrabold tabular-nums">{score}</div>
        </div>
        <div className="text-white text-right">
          <div className="text-xs uppercase tracking-wider font-bold text-white/50">
            Time
          </div>
          <div className="text-2xl font-extrabold tabular-nums">
            {timeLeft}s
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {target && labelForTarget && (
          <button
            key={`${target.appearedAt}`}
            data-target="yes"
            onClick={tapTarget}
            aria-label={labelForTarget.label}
            className={`absolute animate-pop-in rounded-full shadow-lg flex flex-col items-center justify-center text-white ${labelForTarget.color}`}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: "96px",
              height: "96px",
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-2xl leading-none" aria-hidden="true">
              {labelForTarget.emoji}
            </span>
            <span className="text-[10px] font-extrabold tracking-wider mt-0.5">
              {labelForTarget.label}
            </span>
          </button>
        )}

        {feedback && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-extrabold text-3xl pointer-events-none animate-pop-in ${
              feedback.kind === "good"
                ? "text-green-400"
                : feedback.kind === "bad"
                ? "text-red-400"
                : "text-orange-400"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      <div className="p-4 text-center text-white/40 text-xs uppercase tracking-wider font-bold">
        {labels.footer}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="card !p-4 text-center">
      <div
        className={`text-2xl font-extrabold tabular-nums ${
          accent ?? "text-slate-900 dark:text-slate-100"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

function LegendRow({
  emoji,
  label,
  color,
  action,
}: {
  emoji: string;
  label: string;
  color: string;
  action: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center text-sm`}
      >
        {emoji}
      </div>
      <span>
        <strong>{label}</strong> — {action}
      </span>
    </div>
  );
}
