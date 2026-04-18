import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import SpeakButton from "../components/SpeakButton";
import {
  pickScenarioRound,
  SCENARIO_ROUND_SIZE,
  XP_PER_CORRECT_SCENARIO,
  PERFECT_SCENARIO_ROUND_BONUS,
  type ScenarioCard,
} from "../lib/scenarios";
import {
  ArrowLeft,
  Brain,
  Target,
  RotateCcw,
  Check,
  X,
  ArrowRight,
  Trophy,
} from "lucide-react";

type Phase = "intro" | "playing" | "result";

export default function ScenariosPage() {
  const { state, completeMentalSession } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [cards, setCards] = useState<ScenarioCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!state.profile) return null;

  // Count prior scenario sessions — seeds deterministic shuffle so
  // rounds don't repeat immediately.
  const scenariosPlayed = state.mentalSessions.filter(
    (s) => s.kind === "scenarios"
  ).length;

  const start = useCallback(() => {
    const round = pickScenarioRound(state.profile!.sport, scenariosPlayed);
    setCards(round);
    setCurrent(0);
    setSelected(null);
    setLocked(false);
    setCorrectCount(0);
    setPhase("playing");
  }, [state.profile, scenariosPlayed]);

  function pick(idx: number) {
    if (locked) return;
    setSelected(idx);
    setLocked(true);
    if (idx === cards[current].bestIndex) {
      setCorrectCount((c) => c + 1);
    }
  }

  function next() {
    if (current < cards.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setLocked(false);
    } else {
      const perfect = correctCount === SCENARIO_ROUND_SIZE;
      const xp =
        correctCount * XP_PER_CORRECT_SCENARIO +
        (perfect ? PERFECT_SCENARIO_ROUND_BONUS : 0);
      // Log as a "scenarios" mental session — separate counter from trivia.
      const refId = `scenarios-round-${scenariosPlayed + 1}`;
      const { awardedXp, newlyUnlocked } = completeMentalSession(
        "scenarios",
        refId,
        xp
      );
      showReward(awardedXp || xp, newlyUnlocked);
      setPhase("result");
    }
  }

  // Intro screen
  if (phase === "intro") {
    const sportName =
      state.profile.sport === "wrestling" ? "Wrestling" : "Volleyball";
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
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Brain size={18} />
            </div>
            <h1 className="page-title">Decision Drill</h1>
          </div>
          <p className="page-subtitle">
            Train your mind to make the right call under pressure.
          </p>
        </header>

        <div className="card text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {sportName} Scenarios
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
            Real game situations. What would a champion do?{" "}
            <span className="font-bold text-indigo-700">
              +{XP_PER_CORRECT_SCENARIO} XP
            </span>{" "}
            per best answer,{" "}
            <span className="font-bold text-amber-600">
              +{PERFECT_SCENARIO_ROUND_BONUS} XP
            </span>{" "}
            perfect-round bonus.
          </p>
          <button onClick={start} className="btn-primary mt-6 mx-auto">
            Start Round
          </button>
        </div>

        <div className="card">
          <h2 className="font-bold text-slate-900 mb-2">How it works</h2>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            <li>3 scenarios per round</li>
            <li>Read the situation carefully</li>
            <li>Pick the best response</li>
            <li>Learn WHY each answer is the right call</li>
          </ul>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === "result") {
    const perfect = correctCount === SCENARIO_ROUND_SIZE;
    const xp =
      correctCount * XP_PER_CORRECT_SCENARIO +
      (perfect ? PERFECT_SCENARIO_ROUND_BONUS : 0);
    return (
      <div className="space-y-4 animate-slide-up">
        <header className="pt-4">
          <h1 className="page-title">Round Complete!</h1>
        </header>

        <div className="card text-center py-8">
          <div className="text-6xl mb-4">
            {perfect ? "🏆" : correctCount >= 2 ? "🎯" : "💪"}
          </div>
          <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
            {correctCount} / {SCENARIO_ROUND_SIZE}
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {perfect
              ? "Championship-level decision making!"
              : correctCount >= 2
              ? "Great judgment — you read the game well."
              : "Tough round. Learn from each scenario — you'll get it next time."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="chip bg-indigo-50 text-indigo-700 !text-base !px-4 !py-2 font-bold">
              +{xp} XP
            </span>
            {perfect && (
              <span className="chip bg-amber-50 text-amber-700 !text-base !px-4 !py-2 font-bold">
                +{PERFECT_SCENARIO_ROUND_BONUS} bonus
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={start}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Play Again
          </button>
        </div>

        {/* Review */}
        <div className="space-y-2">
          <h2 className="section-label px-1">Review</h2>
          {cards.map((c, i) => (
            <div key={i} className="card !p-4">
              <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                Scenario {i + 1}
              </div>
              <div className="text-sm font-bold text-slate-900">
                {c.situation}
              </div>
              <div className="mt-2 text-sm text-green-700 font-semibold">
                Best: {c.options[c.bestIndex]}
              </div>
              <div className="mt-1.5 text-xs text-slate-600 italic leading-relaxed border-l-2 border-indigo-200 pl-2">
                {c.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Playing screen
  const c = cards[current];
  const isCorrect = selected === c.bestIndex;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">
            Scenario {current + 1} of {SCENARIO_ROUND_SIZE}
          </h1>
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-sm font-bold tabular-nums text-slate-700">
              {correctCount}
            </span>
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{
              width: `${
                ((current + (locked ? 1 : 0)) / SCENARIO_ROUND_SIZE) * 100
              }%`,
            }}
          />
        </div>
      </header>

      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-xs uppercase tracking-wider font-bold text-indigo-600">
            The Situation
          </div>
          <SpeakButton text={c.situation} size="sm" rate={0.95} />
        </div>
        <p className="text-base text-slate-900 dark:text-slate-100 font-semibold leading-snug">
          {c.situation}
        </p>

        <div className="mt-4 space-y-2">
          {c.options.map((opt, idx) => {
            let style =
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-indigo-300 dark:hover:border-indigo-500";
            if (locked) {
              if (idx === c.bestIndex) {
                style = "bg-green-50 dark:bg-green-950/40 border-green-400 dark:border-green-700 text-green-900 dark:text-green-200";
              } else if (idx === selected && !isCorrect) {
                style = "bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-700 text-red-900 dark:text-red-200";
              } else {
                style = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500";
              }
            } else if (idx === selected) {
              style = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-800 dark:text-indigo-200";
            }
            return (
              <button
                key={idx}
                onClick={() => pick(idx)}
                disabled={locked}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition flex items-start gap-3 ${style}`}
              >
                <span className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold border-current">
                  {locked && idx === c.bestIndex ? (
                    <Check size={12} strokeWidth={3} />
                  ) : locked && idx === selected && !isCorrect ? (
                    <X size={12} strokeWidth={3} />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span className="leading-snug">{opt}</span>
              </button>
            );
          })}
        </div>

        {locked && (
          <div className="mt-4 animate-pop-in space-y-2">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200"
              }`}
            >
              <Target size={16} />
              {isCorrect
                ? `Champion's call! +${XP_PER_CORRECT_SCENARIO} XP`
                : "Different approach. Here's why:"}
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-300 mb-1">
                The Reasoning
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {c.explanation}
              </p>
              <div className="mt-2 flex justify-end">
                <SpeakButton
                  text={c.explanation}
                  size="sm"
                  rate={0.95}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {locked && (
        <button
          onClick={next}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {current < cards.length - 1 ? (
            <>
              Next Scenario <ArrowRight size={18} />
            </>
          ) : (
            <>
              See Results <Trophy size={18} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
