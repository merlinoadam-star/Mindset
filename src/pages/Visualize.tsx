import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { useSpeech } from "../lib/useSpeech";
import {
  visualizationsForSport,
  type VisualizationScript,
} from "../lib/visualizations";
import { showReward } from "../components/RewardToast";
import { ArrowLeft, Eye, Play, Check, Volume2, VolumeX } from "lucide-react";

export default function VisualizePage() {
  const { state } = useStore();
  const [active, setActive] = useState<VisualizationScript | null>(null);

  if (!state.profile) return null;

  const scripts = visualizationsForSport(state.profile.sport);

  const categories = {
    "pre-match": "Pre-Match",
    skill: "Skill Rehearsal",
    confidence: "Confidence",
    recovery: "Recovery",
  } as const;

  const byCategory: Record<string, VisualizationScript[]> = {
    "pre-match": [],
    skill: [],
    confidence: [],
    recovery: [],
  };
  scripts.forEach((s) => byCategory[s.category].push(s));

  const completedIds = new Set(
    state.mentalSessions
      .filter((s) => s.kind === "visualization")
      .map((s) => s.refId)
  );

  if (active) {
    return <VisualizationPlayer script={active} onClose={() => setActive(null)} />;
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
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Eye size={18} />
          </div>
          <h1 className="page-title">Visualize</h1>
        </div>
        <p className="page-subtitle">
          Guided mental imagery — the secret weapon of champions.
        </p>
      </header>

      {Object.entries(categories).map(([key, label]) =>
        byCategory[key].length === 0 ? null : (
          <section key={key}>
            <h2 className="section-label mb-2 px-1">{label}</h2>
            <div className="space-y-2">
              {byCategory[key].map((s) => {
                const done = completedIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    className="w-full card-interactive text-left flex items-center gap-3"
                  >
                    <div className="text-3xl">{s.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {s.title}
                        {done && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                            <Check size={10} strokeWidth={3} /> Done
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {s.subtitle}
                      </div>
                      <div className="text-[11px] font-bold text-purple-700 mt-1">
                        {s.durationMin} min · +{s.xp} XP
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                      <Play size={14} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Player — supports auto-narration ("close your eyes" mode)
// -----------------------------------------------------------------------------
function VisualizationPlayer({
  script,
  onClose,
}: {
  script: VisualizationScript;
  onClose: () => void;
}) {
  const { completeMentalSession } = useStore();
  const { supported: ttsSupported, speak, stop: stopSpeech } = useSpeech();

  // User chooses "Read to me" before starting. Defaults to on if supported.
  const [started, setStarted] = useState(false);
  const [narrate, setNarrate] = useState(ttsSupported);

  const [stepIdx, setStepIdx] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);

  const secondsPerStep = Math.max(
    12,
    Math.round((script.durationMin * 60) / script.steps.length)
  );
  const isLast = stepIdx === script.steps.length - 1;

  // Overall progress timer
  useEffect(() => {
    if (!started) return;
    timerRef.current = window.setInterval(() => {
      setStepElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [started]);

  // Reset elapsed on step change
  useEffect(() => {
    setStepElapsed(0);
  }, [stepIdx]);

  // Narration: when in narrate mode, speak the current step, and on finish
  // auto-advance after a short pause. If narration unsupported, auto-advance
  // on the per-step timer instead.
  useEffect(() => {
    if (!started) return;
    if (narrate && ttsSupported) {
      speak(script.steps[stepIdx], {
        rate: 0.85, // slow, calm pace
        onEnd: () => {
          // Short silent pause to let the athlete absorb, then advance.
          autoAdvanceRef.current = window.setTimeout(() => {
            advance();
          }, 2200);
        },
      });
      return () => {
        stopSpeech();
        if (autoAdvanceRef.current) {
          window.clearTimeout(autoAdvanceRef.current);
          autoAdvanceRef.current = null;
        }
      };
    } else {
      // No narration: auto-advance based on time budget per step
      autoAdvanceRef.current = window.setTimeout(() => {
        advance();
      }, secondsPerStep * 1000);
      return () => {
        if (autoAdvanceRef.current) {
          window.clearTimeout(autoAdvanceRef.current);
          autoAdvanceRef.current = null;
        }
      };
    }
    // Intentionally omitting advance/speak/stopSpeech deps — we only want to
    // re-run this when the step, narrate mode, or started flag changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, narrate, started]);

  function advance() {
    if (isLast) {
      finish();
    } else {
      setStepIdx((i) => i + 1);
    }
  }

  function finish() {
    stopSpeech();
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    const { awardedXp, newlyUnlocked } = completeMentalSession(
      "visualization",
      script.id,
      script.xp
    );
    showReward(awardedXp, newlyUnlocked);
    onClose();
  }

  function next() {
    stopSpeech();
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    if (isLast) {
      finish();
    } else {
      setStepIdx((i) => i + 1);
    }
  }

  function back() {
    stopSpeech();
    if (autoAdvanceRef.current) window.clearTimeout(autoAdvanceRef.current);
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  }

  const progress =
    ((stepIdx + stepElapsed / secondsPerStep) / script.steps.length) * 100;

  // Intro screen — choose narration mode
  if (!started) {
    return (
      <div className="fixed inset-0 z-[70] bg-gradient-to-br from-purple-900 via-purple-700 to-indigo-800 text-white flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            onClick={onClose}
            className="text-sm text-white/70 hover:text-white"
          >
            Exit
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-7xl mb-6">{script.emoji}</div>
          <h1 className="text-2xl font-extrabold">{script.title}</h1>
          <p className="text-white/70 mt-2 text-sm max-w-xs">
            {script.subtitle}
          </p>
          <p className="text-white/50 mt-2 text-xs">
            {script.durationMin} min · {script.steps.length} steps
          </p>

          {ttsSupported && (
            <div className="mt-8 w-full max-w-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60 font-bold mb-3">
                How do you want to experience this?
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNarrate(true)}
                  className={`rounded-2xl p-4 border-2 text-left transition ${
                    narrate
                      ? "border-white bg-white/10"
                      : "border-white/20"
                  }`}
                >
                  <Volume2 size={20} />
                  <div className="font-bold mt-2 text-sm">Read to me</div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Close your eyes — I&apos;ll narrate
                  </div>
                </button>
                <button
                  onClick={() => setNarrate(false)}
                  className={`rounded-2xl p-4 border-2 text-left transition ${
                    !narrate
                      ? "border-white bg-white/10"
                      : "border-white/20"
                  }`}
                >
                  <VolumeX size={20} />
                  <div className="font-bold mt-2 text-sm">Silent</div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    Read it yourself at your pace
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-5">
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3.5 rounded-2xl bg-white text-purple-900 font-bold"
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-gradient-to-br from-purple-900 via-purple-700 to-indigo-800 text-white flex flex-col">
      {/* Progress */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-white/70 transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-4">
        <button
          onClick={onClose}
          className="text-sm text-white/70 hover:text-white"
        >
          Exit
        </button>
        <div className="flex items-center gap-3">
          {ttsSupported && (
            <button
              onClick={() => {
                stopSpeech();
                if (autoAdvanceRef.current) {
                  window.clearTimeout(autoAdvanceRef.current);
                  autoAdvanceRef.current = null;
                }
                setNarrate((n) => !n);
              }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
              aria-label={narrate ? "Mute narration" : "Enable narration"}
            >
              {narrate ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          )}
          <div className="text-xs font-bold uppercase tracking-wider text-white/60">
            {stepIdx + 1} / {script.steps.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-6 animate-pulse-soft">{script.emoji}</div>
        <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-white/60 mb-2">
          {script.title}
        </h2>
        <p className="text-lg leading-relaxed font-medium max-w-md">
          {script.steps[stepIdx]}
        </p>
        {narrate && ttsSupported && (
          <div className="mt-6 text-xs text-white/50 italic">
            Close your eyes — I&apos;ll guide you through
          </div>
        )}
      </div>

      <div className="p-5 flex gap-3">
        <button
          onClick={back}
          disabled={stepIdx === 0}
          className="flex-1 py-3 rounded-2xl border border-white/20 text-white/80 font-semibold disabled:opacity-30"
        >
          Back
        </button>
        <button
          onClick={next}
          className="flex-1 py-3 rounded-2xl bg-white text-purple-900 font-bold"
        >
          {isLast ? `Complete +${script.xp} XP` : "Next"}
        </button>
      </div>
    </div>
  );
}
