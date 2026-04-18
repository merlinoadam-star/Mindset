import { useCallback, useState } from "react";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import {
  pickTriviaRound,
  TRIVIA_ROUND_SIZE,
  type TriviaQuestion,
} from "../lib/trivia";
import { Trophy, ArrowRight, RotateCcw, Check, X } from "lucide-react";

type Phase = "intro" | "playing" | "result";

export default function TriviaPage() {
  const { state, completeTriviaRound } = useStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  if (!state.profile) return null;

  const startRound = useCallback(() => {
    const qs = pickTriviaRound(
      state.profile!.sport,
      state.triviaRoundsPlayed
    );
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setLocked(false);
    setCorrectCount(0);
    setPhase("playing");
  }, [state.profile, state.triviaRoundsPlayed]);

  function handleSelect(idx: number) {
    if (locked) return;
    setSelected(idx);
    setLocked(true);
    if (idx === questions[current].answer) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setLocked(false);
    } else {
      // Round complete
      const finalCorrect =
        selected === questions[current].answer
          ? correctCount
          : correctCount; // correctCount already updated in handleSelect
      const { awardedXp, newlyUnlocked } = completeTriviaRound(
        finalCorrect,
        TRIVIA_ROUND_SIZE
      );
      showReward(awardedXp, newlyUnlocked);
      setPhase("result");
    }
  }

  // Intro screen
  if (phase === "intro") {
    const sportName =
      state.profile.sport === "wrestling" ? "Wrestling" : "Volleyball";
    return (
      <div className="space-y-4">
        <header className="pt-4">
          <h1 className="text-2xl font-extrabold">Trivia Challenge</h1>
          <p className="text-sm text-slate-600 mt-1">
            Test your {sportName.toLowerCase()} knowledge and earn XP!
          </p>
        </header>

        <div className="card text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {sportName} Trivia
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xs mx-auto">
            {TRIVIA_ROUND_SIZE} questions per round. Earn{" "}
            <span className="font-bold text-brand-700">+10 XP</span> per
            correct answer, plus a{" "}
            <span className="font-bold text-amber-600">+15 XP bonus</span> for
            a perfect round!
          </p>
          <button onClick={startRound} className="btn-primary mt-6 mx-auto">
            Start Round
          </button>
        </div>

        <div className="card">
          <h2 className="font-bold text-slate-900 mb-2">Your Stats</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Rounds played</dt>
              <dd className="font-semibold tabular-nums">
                {state.triviaRoundsPlayed}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Trivia XP earned</dt>
              <dd className="font-semibold tabular-nums text-brand-700">
                {state.triviaXpEarned} XP
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  // Result screen
  if (phase === "result") {
    const perfect = correctCount === TRIVIA_ROUND_SIZE;
    const xpEarned = correctCount * 10 + (perfect ? 15 : 0);
    return (
      <div className="space-y-4">
        <header className="pt-4">
          <h1 className="text-2xl font-extrabold">Round Complete!</h1>
        </header>

        <div className="card text-center py-8">
          <div className="text-6xl mb-4">{perfect ? "🏆" : correctCount >= 3 ? "🎯" : "💪"}</div>
          <div className="text-4xl font-extrabold text-slate-900 tabular-nums">
            {correctCount} / {TRIVIA_ROUND_SIZE}
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {perfect
              ? "PERFECT ROUND! You really know your stuff!"
              : correctCount >= 4
              ? "So close to perfect! Great knowledge."
              : correctCount >= 3
              ? "Nice work! You know the sport."
              : "Keep studying — you'll get there!"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="chip bg-brand-50 text-brand-700 !text-base !px-4 !py-2 font-bold">
              +{xpEarned} XP earned
            </span>
            {perfect && (
              <span className="chip bg-amber-50 text-amber-700 !text-base !px-4 !py-2 font-bold">
                +15 bonus!
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={startRound}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> Play Again
          </button>
        </div>

        {/* Review answers */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-1">
            Review
          </h2>
          {questions.map((q, i) => (
            <div key={i} className="card !p-4">
              <div className="text-sm font-bold text-slate-900">
                {q.question}
              </div>
              <div className="mt-1 text-sm text-green-700 font-semibold">
                {q.choices[q.answer]}
              </div>
              {q.fact && (
                <div className="mt-1 text-xs text-slate-500 italic">
                  {q.fact}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Playing screen
  const q = questions[current];
  const isCorrect = selected === q.answer;

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold">
            Question {current + 1} of {TRIVIA_ROUND_SIZE}
          </h1>
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-sm font-bold tabular-nums text-slate-700">
              {correctCount}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{
              width: `${((current + (locked ? 1 : 0)) / TRIVIA_ROUND_SIZE) * 100}%`,
            }}
          />
        </div>
      </header>

      <div className="card">
        <h2 className="text-lg font-bold text-slate-900 leading-snug">
          {q.question}
        </h2>

        <div className="mt-4 space-y-2">
          {q.choices.map((choice, idx) => {
            let style =
              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-brand-300 dark:hover:border-brand-500";
            if (locked) {
              if (idx === q.answer) {
                style = "bg-green-50 dark:bg-green-950/40 border-green-400 dark:border-green-700 text-green-900 dark:text-green-200";
              } else if (idx === selected && !isCorrect) {
                style = "bg-red-50 dark:bg-red-950/40 border-red-400 dark:border-red-700 text-red-900 dark:text-red-200";
              } else {
                style = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500";
              }
            } else if (idx === selected) {
              style = "bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-800 dark:text-brand-200";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={locked}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition flex items-center gap-3 ${style}`}
              >
                <span className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold border-current">
                  {locked && idx === q.answer ? (
                    <Check size={14} strokeWidth={3} />
                  ) : locked && idx === selected && !isCorrect ? (
                    <X size={14} strokeWidth={3} />
                  ) : (
                    String.fromCharCode(65 + idx) // A, B, C, D
                  )}
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Feedback after answering */}
        {locked && (
          <div className="mt-4 animate-pop-in">
            <div
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                isCorrect
                  ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200"
              }`}
            >
              {isCorrect ? "Correct! +10 XP" : `Incorrect — the answer is: ${q.choices[q.answer]}`}
            </div>
            {q.fact && locked && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic px-1">
                {q.fact}
              </p>
            )}
          </div>
        )}
      </div>

      {locked && (
        <button
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {current < questions.length - 1 ? (
            <>
              Next Question <ArrowRight size={18} />
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
