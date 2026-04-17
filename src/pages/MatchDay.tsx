import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Flame,
  Swords,
  Target,
  Eye,
  Wind,
  Sparkles,
  Check,
} from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel, computeStreak, todayISO } from "../lib/gamification";
import { fireConfetti } from "../components/Confetti";
import { hapticSuccess, hapticLight } from "../lib/haptics";
import { useSpeech } from "../lib/useSpeech";
import type { Mood } from "../types";

/**
 * Pre-competition "Match Day" mode — a focused 5-step flow an athlete
 * runs through before a match.
 *
 * Query params:
 *   ?id=<matchId>   Bind to an existing match record; completing the flow
 *                   writes focusObjective + mentalStateBefore and marks
 *                   preMatchCompletedAt for XP.
 *   ?standalone=1   No match record, just run the flow for the vibe.
 *
 * The flow is full-screen — no normal Layout chrome — to feel like a
 * different mode. Tap-Next at your own pace, no auto-advance.
 */

type Step =
  | "intro"
  | "focus"
  | "visualize"
  | "breathe"
  | "phrase"
  | "confidence"
  | "lockIn";

const STEP_ORDER: Step[] = [
  "intro",
  "focus",
  "visualize",
  "breathe",
  "phrase",
  "confidence",
  "lockIn",
];

const VISUALIZATION_PROMPTS = [
  "Close your eyes. See yourself at the venue — the mat, the court, the lights. You belong here.",
  "Picture your first move. Crisp. Decisive. Exactly how you've trained it a thousand times.",
  "Now see yourself under pressure. You stay calm. You execute. You finish strong.",
];

const DEFAULT_PHRASES = [
  "I am built for this.",
  "Stay calm. Stay sharp.",
  "One point at a time.",
  "I trust my training.",
];

export default function MatchDayPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state, updateMatch } = useStore();

  const matchId = params.get("id");
  const match = matchId
    ? state.matches.find((m) => m.id === matchId)
    : undefined;

  const [stepIdx, setStepIdx] = useState(0);
  const step = STEP_ORDER[stepIdx];

  // Flow state
  const [focusObjective, setFocusObjective] = useState(
    match?.focusObjective ?? ""
  );
  const [selectedPhrase, setSelectedPhrase] = useState<string>("");
  const [confidence, setConfidence] = useState<Mood | null>(
    match?.mentalStateBefore ?? null
  );

  const level = state.profile
    ? computeLevel(state.xp, state.profile.sport)
    : null;
  const streak = useMemo(() => computeStreak(state), [state]);

  const recentMatches = useMemo(() => {
    return state.matches
      .filter((m) => m.result && m.date < todayISO())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [state.matches]);

  const wins = recentMatches.filter((m) => m.result === "win").length;

  const phrases = useMemo(() => {
    const custom = state.powerPhrases.map((p) => p.text);
    return custom.length ? custom : DEFAULT_PHRASES;
  }, [state.powerPhrases]);

  const next = () => {
    hapticLight();
    setStepIdx((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  };
  const back = () => {
    hapticLight();
    setStepIdx((i) => Math.max(i - 1, 0));
  };

  const handleFinish = () => {
    if (match && matchId) {
      updateMatch(matchId, {
        focusObjective: focusObjective.trim() || match.focusObjective,
        mentalStateBefore: confidence ?? match.mentalStateBefore,
        preMatchCompletedAt: new Date().toISOString(),
      });
    }
    fireConfetti(140);
    hapticSuccess();
  };

  // Fire confetti when landing on lock-in
  useEffect(() => {
    if (step === "lockIn") {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const exit = () => navigate("/");

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 text-white overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-950/95 to-transparent backdrop-blur px-4 pt-4 pb-3 flex items-center justify-between">
        <button
          onClick={exit}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-1.5">
          {STEP_ORDER.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx
                  ? "w-6 bg-white"
                  : i < stepIdx
                  ? "w-1.5 bg-white/70"
                  : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
        <div className="w-9" />
      </div>

      <div className="px-5 pb-28 max-w-md mx-auto">
        {step === "intro" && (
          <IntroStep
            opponent={match?.opponent}
            event={match?.event}
            date={match?.date}
            streak={streak}
            level={level?.level ?? 1}
            levelTitle={level?.title ?? ""}
            recent={recentMatches.length}
            wins={wins}
          />
        )}
        {step === "focus" && (
          <FocusStep value={focusObjective} onChange={setFocusObjective} />
        )}
        {step === "visualize" && <VisualizeStep />}
        {step === "breathe" && <BreatheStep />}
        {step === "phrase" && (
          <PhraseStep
            phrases={phrases}
            selected={selectedPhrase}
            onSelect={setSelectedPhrase}
          />
        )}
        {step === "confidence" && (
          <ConfidenceStep value={confidence} onChange={setConfidence} />
        )}
        {step === "lockIn" && (
          <LockInStep
            phrase={selectedPhrase || phrases[0]}
            objective={focusObjective}
            confidence={confidence}
            onExit={exit}
          />
        )}
      </div>

      {/* Bottom nav — hidden on lock-in (has its own CTA) */}
      {step !== "lockIn" && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-6 pb-5 px-5">
          <div className="max-w-md mx-auto flex items-center gap-2">
            {stepIdx > 0 && (
              <button
                onClick={back}
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <button
              onClick={next}
              disabled={step === "focus" && !focusObjective.trim()}
              className="flex-1 h-11 rounded-xl bg-white text-slate-900 font-extrabold tracking-tight inline-flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98] transition"
            >
              {step === "confidence" ? "Lock it in" : "Next"}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Steps ----------

function IntroStep({
  opponent,
  event,
  date,
  streak,
  level,
  levelTitle,
  recent,
  wins,
}: {
  opponent?: string;
  event?: string;
  date?: string;
  streak: number;
  level: number;
  levelTitle: string;
  recent: number;
  wins: number;
}) {
  return (
    <div className="pt-8 animate-slide-up">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70 mb-4">
        <Swords size={11} /> Match Day
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight leading-[1.05]">
        You've trained
        <br />
        for this.
      </h1>
      {opponent && (
        <p className="text-white/70 mt-4 text-base">
          <span className="text-white/50">vs.</span>{" "}
          <span className="font-bold text-white">{opponent}</span>
          {event && <span className="text-white/60"> · {event}</span>}
          {date && (
            <span className="text-white/60">
              {" · "}
              {formatDateShort(date)}
            </span>
          )}
        </p>
      )}

      <div className="mt-8 grid grid-cols-3 gap-2">
        <StatTile
          icon={<Flame size={16} />}
          label="Streak"
          value={streak}
          tint="from-orange-500/20 to-amber-500/10"
        />
        <StatTile
          icon={<Sparkles size={16} />}
          label="Level"
          value={level}
          sub={levelTitle}
          tint="from-brand-500/20 to-purple-500/10"
        />
        {recent > 0 && (
          <StatTile
            icon={<Swords size={16} />}
            label={`Last ${recent}`}
            value={`${wins}W`}
            sub={`${recent - wins}L`}
            tint="from-emerald-500/20 to-sky-500/10"
          />
        )}
      </div>

      <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-4">
        <p className="text-white/80 leading-relaxed text-sm">
          Take a few minutes. Lock your focus. Run the script.{" "}
          <span className="text-white font-semibold">You've got this.</span>
        </p>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tint: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tint} p-3`}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white/60">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-extrabold mt-1 tabular-nums leading-none">
        {value}
      </div>
      {sub && <div className="text-[10px] text-white/50 mt-0.5">{sub}</div>}
    </div>
  );
}

function FocusStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="pt-8 animate-slide-up">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70 mb-4">
        <Target size={11} /> Step 1
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
        One thing.
      </h2>
      <p className="text-white/70 text-sm leading-relaxed">
        What's the ONE thing you'll execute today? Keep it simple. Keep it
        yours.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 120))}
        placeholder="Shoot first. Stay low. Finish strong."
        rows={3}
        className="mt-6 w-full rounded-2xl bg-white/10 border border-white/20 p-4 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-white/40 resize-none"
        autoFocus
      />
      <div className="text-right text-[11px] text-white/40 mt-1">
        {value.length}/120
      </div>

      <div className="mt-6 text-xs text-white/50 leading-relaxed">
        Tip: pros pick ONE focus, not five. Clarity beats effort.
      </div>
    </div>
  );
}

function VisualizeStep() {
  const [idx, setIdx] = useState(0);
  const [narrate, setNarrate] = useState(true);
  const { speak, stop, supported } = useSpeech();

  // Speak each prompt when it changes.
  useEffect(() => {
    if (!narrate || !supported) return;
    speak(VISUALIZATION_PROMPTS[idx], {
      plain: true,
      rate: 0.82,
      volume: 0.95,
    });
  }, [idx, narrate, supported, speak]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return (
    <div className="pt-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70">
          <Eye size={11} /> Step 2
        </div>
        {supported && (
          <button
            onClick={() => {
              if (narrate) stop();
              setNarrate((v) => !v);
            }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1"
          >
            {narrate ? "🔊 Voice" : "🔇 Silent"}
          </button>
        )}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
        See it first.
      </h2>
      <p className="text-white/70 text-sm leading-relaxed">
        Your brain can't tell the difference between seeing and doing. Feed
        it the right picture.
      </p>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-purple-600/30 to-brand-700/30 border border-white/15 p-6 min-h-[180px] flex flex-col justify-center">
        <p className="text-white text-lg font-semibold leading-relaxed">
          {VISUALIZATION_PROMPTS[idx]}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-[11px] text-white/50 font-semibold tabular-nums">
          {idx + 1} of {VISUALIZATION_PROMPTS.length}
        </div>
        {idx < VISUALIZATION_PROMPTS.length - 1 ? (
          <button
            onClick={() => {
              hapticLight();
              setIdx((i) => i + 1);
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold inline-flex items-center gap-1"
          >
            Next prompt <ArrowRight size={13} />
          </button>
        ) : (
          <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
            <Check size={12} /> Ready
          </div>
        )}
      </div>
    </div>
  );
}

function BreatheStep() {
  const BOX_SECONDS = 4;
  const CYCLES = 4;
  const PHASES = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;

  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [tick, setTick] = useState(BOX_SECONDS);
  const [done, setDone] = useState(false);
  const [narrate, setNarrate] = useState(true);
  const { speak, stop, supported } = useSpeech();
  const spokenRef = useRef("");

  // Speak phase label when phase changes (once per phase).
  useEffect(() => {
    if (!narrate || !supported || !running || done) return;
    const key = `${cycle}-${phaseIdx}`;
    if (spokenRef.current === key) return;
    if (tick === BOX_SECONDS) {
      spokenRef.current = key;
      speak(PHASES[phaseIdx], { plain: true, rate: 0.85, volume: 0.9 });
    }
  }, [cycle, phaseIdx, tick, narrate, supported, running, done, speak]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      setTick((prev) => {
        if (prev > 1) return prev - 1;
        setPhaseIdx((p) => {
          const nextP = (p + 1) % PHASES.length;
          if (nextP === 0) {
            setCycle((c) => {
              const nc = c + 1;
              if (nc >= CYCLES) {
                setRunning(false);
                setDone(true);
                hapticSuccess();
              }
              return nc;
            });
          }
          return nextP;
        });
        return BOX_SECONDS;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const phase = PHASES[phaseIdx];
  const scale =
    phase === "Breathe in"
      ? 1.4
      : phase === "Breathe out"
      ? 0.7
      : phaseIdx === 1
      ? 1.4
      : 0.7;

  return (
    <div className="pt-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70">
          <Wind size={11} /> Step 3
        </div>
        {supported && (
          <button
            onClick={() => {
              if (narrate) stop();
              setNarrate((v) => !v);
            }}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1"
          >
            {narrate ? "🔊 Voice" : "🔇 Silent"}
          </button>
        )}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
        Settle.
      </h2>
      <p className="text-white/70 text-sm leading-relaxed">
        Four rounds of box breathing. Slows your heart. Sharpens your mind.
      </p>

      <div className="mt-10 flex flex-col items-center">
        <div className="relative h-52 w-52 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400/40 to-brand-500/40 transition-transform duration-1000 ease-in-out"
            style={{ transform: `scale(${running ? scale : 1})` }}
          />
          <div className="relative text-center">
            <div className="text-sm uppercase tracking-widest font-bold text-white/70">
              {done ? "Done" : running ? phase : "Ready?"}
            </div>
            <div className="text-5xl font-extrabold tabular-nums mt-1">
              {done ? "✓" : running ? tick : "4"}
            </div>
            <div className="text-[11px] text-white/50 mt-2 tabular-nums">
              {done
                ? `${CYCLES}/${CYCLES} rounds`
                : running
                ? `Round ${Math.min(cycle + 1, CYCLES)} of ${CYCLES}`
                : "tap start"}
            </div>
          </div>
        </div>

        {!running && !done && (
          <button
            onClick={() => {
              hapticLight();
              setRunning(true);
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-white text-slate-900 font-bold"
          >
            Start
          </button>
        )}
        {done && (
          <div className="mt-6 text-sm text-emerald-400 font-bold inline-flex items-center gap-1">
            <Check size={14} /> Centered
          </div>
        )}
        {running && (
          <button
            onClick={() => {
              setRunning(false);
              setDone(true);
            }}
            className="mt-6 text-xs text-white/50 hover:text-white/80 underline"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

function PhraseStep({
  phrases,
  selected,
  onSelect,
}: {
  phrases: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="pt-8 animate-slide-up">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70 mb-4">
        <Sparkles size={11} /> Step 4
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
        Your mantra.
      </h2>
      <p className="text-white/70 text-sm leading-relaxed">
        Pick one. Say it to yourself before the whistle.
      </p>

      <div className="mt-6 space-y-2">
        {phrases.slice(0, 8).map((p) => {
          const active = selected === p;
          return (
            <button
              key={p}
              onClick={() => {
                hapticLight();
                onSelect(p);
              }}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                active
                  ? "bg-white text-slate-900 border-white font-bold"
                  : "bg-white/5 border-white/15 text-white hover:bg-white/10"
              }`}
            >
              <div className="text-base font-semibold leading-snug">
                {p}
              </div>
            </button>
          );
        })}
      </div>

      <Link
        to="/phrases"
        className="block text-center text-xs text-white/50 hover:text-white/80 mt-5 underline"
      >
        Manage your phrases →
      </Link>
    </div>
  );
}

function ConfidenceStep({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (v: Mood) => void;
}) {
  const labels: Record<Mood, string> = {
    1: "Shaky",
    2: "Nervous",
    3: "Focused",
    4: "Dialed in",
    5: "Unstoppable",
  };

  return (
    <div className="pt-8 animate-slide-up">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.15em] font-bold text-white/70 mb-4">
        <Flame size={11} /> Step 5
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-2">
        How are you feeling?
      </h2>
      <p className="text-white/70 text-sm leading-relaxed">
        Honest answer. No wrong one.
      </p>

      <div className="mt-8 grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as Mood[]).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              onClick={() => {
                hapticLight();
                onChange(n);
              }}
              className={`aspect-square rounded-2xl border transition flex flex-col items-center justify-center ${
                active
                  ? "bg-white text-slate-900 border-white"
                  : "bg-white/5 border-white/15 text-white hover:bg-white/10"
              }`}
            >
              <div className="text-2xl font-extrabold">{n}</div>
            </button>
          );
        })}
      </div>

      {value && (
        <div className="text-center mt-5 text-lg font-bold text-white animate-pop-in">
          {labels[value]}
        </div>
      )}
    </div>
  );
}

function LockInStep({
  phrase,
  objective,
  confidence,
  onExit,
}: {
  phrase: string;
  objective: string;
  confidence: Mood | null;
  onExit: () => void;
}) {
  return (
    <div className="pt-12 animate-slide-up text-center">
      <div className="text-6xl mb-4">🔥</div>
      <div className="text-xs uppercase tracking-[0.25em] font-bold text-white/50 mb-2">
        Locked In
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight leading-[1.05] mb-2">
        GO GET IT.
      </h1>

      <div className="mt-8 rounded-3xl bg-gradient-to-br from-brand-500/30 to-purple-600/30 border border-white/20 p-6 text-left">
        <div className="text-[10px] uppercase tracking-widest text-white/60 font-bold">
          Today's mantra
        </div>
        <div className="text-2xl font-extrabold mt-1 leading-tight">
          {phrase}
        </div>
      </div>

      {objective && (
        <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-4 text-left">
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">
            The one thing
          </div>
          <div className="text-base font-semibold mt-1 text-white leading-snug">
            {objective}
          </div>
        </div>
      )}

      {confidence && (
        <div className="mt-3 text-sm text-white/60">
          Starting confidence:{" "}
          <span className="text-white font-bold">{confidence}/5</span>
        </div>
      )}

      <button
        onClick={onExit}
        className="mt-10 w-full h-12 rounded-xl bg-white text-slate-900 font-extrabold text-lg active:scale-[0.98] transition"
      >
        Let's go
      </button>
      <p className="text-[11px] text-white/40 mt-4">
        Come back after the match to log how it went.
      </p>
    </div>
  );
}

function formatDateShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
