import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { ArrowLeft, Wind, Play, Check, Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "../lib/useSpeech";
import {
  startAmbient,
  stopAmbient,
  nextAmbientMode,
  AMBIENT_EMOJI,
  AMBIENT_LABELS,
  type AmbientMode,
} from "../lib/ambientAudio";

interface BreathingExercise {
  id: string;
  name: string;
  subtitle: string;
  emoji: string;
  pattern: { label: "Inhale" | "Hold" | "Exhale" | "Hold out"; seconds: number }[];
  /** How many full cycles to perform */
  cycles: number;
  xp: number;
  description: string;
}

const EXERCISES: BreathingExercise[] = [
  {
    id: "box",
    name: "Box Breathing",
    subtitle: "4-4-4-4 · Steady focus",
    emoji: "📦",
    pattern: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Exhale", seconds: 4 },
      { label: "Hold out", seconds: 4 },
    ],
    cycles: 5,
    xp: 15,
    description:
      "Used by Navy SEALs and Olympic athletes before high-pressure moments. Calms your nervous system and sharpens focus.",
  },
  {
    id: "478",
    name: "4-7-8 Calming",
    subtitle: "Drop the heart rate",
    emoji: "🌙",
    pattern: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 7 },
      { label: "Exhale", seconds: 8 },
    ],
    cycles: 4,
    xp: 15,
    description:
      "Long exhale tells your body it's safe to relax. Great before sleep or to reset after a tough moment.",
  },
  {
    id: "tactical",
    name: "Tactical Breathing",
    subtitle: "4-4-4 · Combat-ready",
    emoji: "🎯",
    pattern: [
      { label: "Inhale", seconds: 4 },
      { label: "Hold", seconds: 4 },
      { label: "Exhale", seconds: 4 },
    ],
    cycles: 6,
    xp: 15,
    description:
      "Military-grade focus technique. Use between points or rounds to reset your state quickly.",
  },
  {
    id: "energize",
    name: "Energize Breath",
    subtitle: "Quick wake-up",
    emoji: "⚡",
    pattern: [
      { label: "Inhale", seconds: 2 },
      { label: "Exhale", seconds: 2 },
    ],
    cycles: 10,
    xp: 10,
    description:
      "Fast rhythmic breathing to wake up your body. Use during warm-up, not before sleep.",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    subtitle: "5-5 · Heart + mind sync",
    emoji: "💙",
    pattern: [
      { label: "Inhale", seconds: 5 },
      { label: "Exhale", seconds: 5 },
    ],
    cycles: 6,
    xp: 15,
    description:
      "Research-backed rhythm that syncs your heart rate and breathing. Deeply calming.",
  },
];

export default function BreathePage() {
  const { state } = useStore();
  const [active, setActive] = useState<BreathingExercise | null>(null);

  if (!state.profile) return null;

  const completedIds = new Set(
    state.mentalSessions.filter((s) => s.kind === "breathing").map((s) => s.refId)
  );

  if (active) {
    return <BreathingPlayer exercise={active} onClose={() => setActive(null)} />;
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
            <Wind size={18} />
          </div>
          <h1 className="page-title">Breathe</h1>
        </div>
        <p className="page-subtitle">
          Your nervous system's reset button — available anytime.
        </p>
      </header>

      <div className="space-y-2">
        {EXERCISES.map((e) => {
          const done = completedIds.has(e.id);
          return (
            <button
              key={e.id}
              onClick={() => setActive(e)}
              className="w-full card-interactive text-left flex items-center gap-3"
            >
              <div className="text-3xl">{e.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  {e.name}
                  {done && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                      <Check size={10} strokeWidth={3} /> Done
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {e.subtitle}
                </div>
                <div className="text-[11px] font-bold text-sky-700 mt-1">
                  {e.cycles} cycles · +{e.xp} XP
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                <Play size={14} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Player
// -----------------------------------------------------------------------------
function BreathingPlayer({
  exercise,
  onClose,
}: {
  exercise: BreathingExercise;
  onClose: () => void;
}) {
  const { state, completeMentalSession } = useStore();
  const [cycleIdx, setCycleIdx] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecond, setPhaseSecond] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [narrate, setNarrate] = useState(true);
  const [ambient, setAmbient] = useState<AmbientMode>("off");
  const spokeForPhaseRef = useRef<string>("");

  const phase = exercise.pattern[phaseIdx];
  const { speak, stop: stopSpeech, supported: speechSupported } = useSpeech(
    state.voicePersonaId ?? "natural"
  );

  // Speak the phase label at the start of each new phase.
  useEffect(() => {
    if (!narrate || !speechSupported || done || !running) return;
    const key = `${cycleIdx}-${phaseIdx}`;
    if (spokeForPhaseRef.current === key) return;
    spokeForPhaseRef.current = key;
    if (phaseSecond === 0) {
      speak(phase.label, { plain: true, rate: 0.85, volume: 0.9 });
    }
  }, [
    cycleIdx,
    phaseIdx,
    phaseSecond,
    phase.label,
    narrate,
    speechSupported,
    done,
    running,
    speak,
  ]);

  // Cleanup speech + ambient on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
      stopAmbient();
    };
  }, [stopSpeech]);

  const toggleAmbient = () => {
    const next = nextAmbientMode(ambient);
    setAmbient(next);
    startAmbient(next);
  };

  useEffect(() => {
    if (!running || done) return;
    const id = window.setInterval(() => {
      setPhaseSecond((s) => {
        if (s + 1 >= phase.seconds) {
          setPhaseIdx((pi) => {
            if (pi + 1 >= exercise.pattern.length) {
              setCycleIdx((c) => {
                if (c + 1 >= exercise.cycles) {
                  setDone(true);
                  return c;
                }
                return c + 1;
              });
              return 0;
            }
            return pi + 1;
          });
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, done, phase.seconds, exercise.pattern.length, exercise.cycles]);

  function finish() {
    const { awardedXp, newlyUnlocked } = completeMentalSession(
      "breathing",
      exercise.id,
      exercise.xp
    );
    showReward(awardedXp, newlyUnlocked);
    onClose();
  }

  // Visual sizing: expand on inhale, contract on exhale, hold steady on holds
  const baseSize = 160;
  const maxSize = 260;
  let size = baseSize;
  if (phase.label === "Inhale") {
    size = baseSize + ((maxSize - baseSize) * phaseSecond) / phase.seconds;
  } else if (phase.label === "Exhale") {
    size =
      maxSize - ((maxSize - baseSize) * phaseSecond) / phase.seconds;
  } else if (phase.label === "Hold") {
    size = maxSize;
  } else {
    size = baseSize;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-br from-sky-800 via-sky-600 to-cyan-500 text-white flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="text-sm text-white/70 hover:text-white">
          Exit
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAmbient}
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1"
            title={`Ambient: ${AMBIENT_LABELS[ambient]}`}
          >
            <span>{AMBIENT_EMOJI[ambient]}</span>
            <span className="hidden sm:inline">{AMBIENT_LABELS[ambient]}</span>
          </button>
          {speechSupported && (
            <button
              onClick={() => {
                setNarrate((v) => !v);
                if (narrate) stopSpeech();
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/80 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1"
              title={narrate ? "Narration on" : "Narration off"}
            >
              {narrate ? <Volume2 size={12} /> : <VolumeX size={12} />}
              <span className="hidden sm:inline">
                {narrate ? "Voice" : "Silent"}
              </span>
            </button>
          )}
          <div className="text-xs font-bold uppercase tracking-wider text-white/70">
            {Math.min(cycleIdx + 1, exercise.cycles)}/{exercise.cycles}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {done ? (
          <>
            <div className="text-7xl mb-6 animate-pop-in">✨</div>
            <h2 className="text-3xl font-extrabold">Nicely done</h2>
            <p className="text-white/70 mt-2 text-center max-w-xs">
              You just reset your nervous system. Carry that calm into what comes next.
            </p>
            <button
              onClick={finish}
              className="mt-8 py-3 px-8 rounded-2xl bg-white text-sky-800 font-bold"
            >
              Claim +{exercise.xp} XP
            </button>
          </>
        ) : (
          <>
            <div
              className="rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center transition-all duration-1000 ease-in-out"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <div className="text-center">
                <div className="text-2xl font-extrabold">{phase.label}</div>
                <div className="text-5xl font-extrabold tabular-nums mt-1">
                  {phase.seconds - phaseSecond}
                </div>
              </div>
            </div>
            <div className="mt-10 text-xs uppercase tracking-[0.3em] text-white/60 font-bold">
              {exercise.name}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setRunning(!running)}
                className="px-5 py-2 rounded-full border border-white/30 text-white/80 text-xs font-semibold"
              >
                {running ? "Pause" : "Resume"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
