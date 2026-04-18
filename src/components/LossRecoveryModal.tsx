import { useEffect, useId, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import type {
  LossRecoveryCarryType,
  LossRecoveryFeeling,
  MatchEntry,
} from "../types";

/**
 * Loss recovery flow — a 3-step micro-ritual offered after a match
 * is logged as a loss. The point isn't to fix the loss; it's to give
 * the athlete a structured path through the feeling so they don't sit
 * in it. Feel it → Name it → Carry one thing forward.
 *
 * Tone notes:
 *   - Don't pretend it's not painful. ("Tough one." is the opener.)
 *   - Don't moralize. No "losses are how you grow!".
 *   - Future-oriented at the end, never grim.
 *   - Skippable. Forced feelings work is gross.
 */

interface FeelingOption {
  value: LossRecoveryFeeling;
  emoji: string;
  label: string;
}

const FEELINGS: FeelingOption[] = [
  { value: "frustrated", emoji: "😤", label: "Frustrated" },
  { value: "disappointed", emoji: "😞", label: "Disappointed" },
  { value: "angry", emoji: "😠", label: "Angry" },
  { value: "sad", emoji: "😔", label: "Sad" },
  { value: "numb", emoji: "😶", label: "Numb" },
  { value: "embarrassed", emoji: "🫣", label: "Embarrassed" },
  { value: "proud-anyway", emoji: "💪", label: "Proud anyway" },
  { value: "other", emoji: "💭", label: "Something else" },
];

interface CarryOption {
  value: LossRecoveryCarryType;
  label: string;
  hint: string;
  placeholder: string;
}

const CARRY_OPTIONS: CarryOption[] = [
  {
    value: "did-well",
    label: "Something I did well",
    hint: "Win or loss, what's one thing you can be proud of?",
    placeholder: "e.g. I didn't give up after the first round",
  },
  {
    value: "do-different",
    label: "Something I'll do differently",
    hint: "One concrete change for next time.",
    placeholder: "e.g. Stay in my stance on the edge",
  },
  {
    value: "phrase",
    label: "A phrase to keep in my head",
    hint: "Short. Yours. Something to grab next time it gets hard.",
    placeholder: "e.g. \"Next rep, next breath.\"",
  },
];

const LESSON_MAX = 200;
const CARRY_MAX = 200;

export interface LossRecoveryAnswers {
  feeling: LossRecoveryFeeling;
  lesson?: string;
  carryType: LossRecoveryCarryType;
  carry: string;
}

interface Props {
  match: MatchEntry;
  onClose: () => void;
  onComplete: (answers: LossRecoveryAnswers) => void;
}

type Step = 1 | 2 | 3;

export default function LossRecoveryModal({ match, onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [feeling, setFeeling] = useState<LossRecoveryFeeling | null>(
    match.lossRecoveryFeeling ?? null
  );
  const [lesson, setLesson] = useState(match.lossRecoveryLesson ?? "");
  const [carryType, setCarryType] = useState<LossRecoveryCarryType | null>(
    match.lossRecoveryCarryType ?? null
  );
  const [carry, setCarry] = useState(match.lossRecoveryCarry ?? "");
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const canFinish = feeling !== null && carryType !== null && carry.trim().length > 0;

  function finish() {
    if (!canFinish) return;
    onComplete({
      feeling: feeling!,
      lesson: lesson.trim() || undefined,
      carryType: carryType!,
      carry: carry.trim(),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-elevated p-5 animate-slide-up">
        {/* Step indicator + close */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 w-8 rounded-full transition ${
                  n <= step
                    ? "bg-indigo-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <Step1
            titleId={titleId}
            feeling={feeling}
            onPick={setFeeling}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            titleId={titleId}
            lesson={lesson}
            onChange={setLesson}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            titleId={titleId}
            carryType={carryType}
            carry={carry}
            onCarryType={(t) => {
              setCarryType(t);
              // Reset the text when the type changes so the user
              // doesn't accidentally submit a phrase as a "did well".
              if (t !== carryType) setCarry("");
            }}
            onCarryChange={setCarry}
            onBack={() => setStep(2)}
            onFinish={finish}
            canFinish={canFinish}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Feel it
// ---------------------------------------------------------------------------
function Step1({
  titleId,
  feeling,
  onPick,
  onNext,
}: {
  titleId: string;
  feeling: LossRecoveryFeeling | null;
  onPick: (f: LossRecoveryFeeling) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2
        id={titleId}
        className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
      >
        Tough one.
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
        What&apos;s the strongest feeling right now? Naming it helps.
      </p>

      <div className="grid grid-cols-2 gap-2 mt-5">
        {FEELINGS.map((f) => {
          const active = feeling === f.value;
          return (
            <button
              key={f.value}
              onClick={() => onPick(f.value)}
              className={`text-left px-3 py-3 rounded-xl border-2 text-sm font-semibold transition flex items-center gap-2 ${
                active
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <span className="text-lg">{f.emoji}</span>
              <span className="leading-tight">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
          You can take a slow breath here. No rush.
        </p>
        <button
          onClick={onNext}
          disabled={feeling === null}
          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Next <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Name it
// ---------------------------------------------------------------------------
function Step2({
  titleId,
  lesson,
  onChange,
  onBack,
  onNext,
}: {
  titleId: string;
  lesson: string;
  onChange: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2
        id={titleId}
        className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
      >
        What did this match show you?
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
        One sentence. About your prep, your head, your technique — anything you
        noticed.
      </p>

      <textarea
        value={lesson}
        onChange={(e) => onChange(e.target.value.slice(0, LESSON_MAX))}
        rows={3}
        autoFocus
        placeholder="When the match went long I stopped trusting my conditioning…"
        className="mt-5 w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 outline-none resize-none"
      />
      <div className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
        {lesson.length} / {LESSON_MAX}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="ml-auto text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 font-semibold"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Next <ArrowRight size={14} />
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Carry it forward
// ---------------------------------------------------------------------------
function Step3({
  titleId,
  carryType,
  carry,
  onCarryType,
  onCarryChange,
  onBack,
  onFinish,
  canFinish,
}: {
  titleId: string;
  carryType: LossRecoveryCarryType | null;
  carry: string;
  onCarryType: (t: LossRecoveryCarryType) => void;
  onCarryChange: (s: string) => void;
  onBack: () => void;
  onFinish: () => void;
  canFinish: boolean;
}) {
  const active = CARRY_OPTIONS.find((o) => o.value === carryType) ?? null;
  return (
    <>
      <h2
        id={titleId}
        className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
      >
        Pick one thing to take with you.
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
        Not the loss — what came from it.
      </p>

      <div className="space-y-2 mt-5">
        {CARRY_OPTIONS.map((opt) => {
          const isActive = carryType === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onCarryType(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
                isActive
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div
                className={`font-bold text-sm ${
                  isActive
                    ? "text-indigo-900 dark:text-indigo-100"
                    : "text-slate-800 dark:text-slate-100"
                }`}
              >
                {opt.label}
              </div>
              <div
                className={`text-xs mt-0.5 leading-snug ${
                  isActive
                    ? "text-indigo-800/80 dark:text-indigo-200/80"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {opt.hint}
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 animate-slide-up">
          <textarea
            value={carry}
            onChange={(e) => onCarryChange(e.target.value.slice(0, CARRY_MAX))}
            rows={2}
            autoFocus
            placeholder={active.placeholder}
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 outline-none resize-none"
          />
          <div className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
            {carry.length} / {CARRY_MAX}
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-2 font-semibold"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={!canFinish}
          className="ml-auto inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Check size={14} strokeWidth={3} /> Done
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Read-only summary card — renders inside MatchDetail (and on the coach
// view) once recovery is complete.
// ---------------------------------------------------------------------------
export function LossRecoverySummary({ match }: { match: MatchEntry }) {
  if (!match.lossRecoveryCompletedAt) return null;
  const feeling = FEELINGS.find((f) => f.value === match.lossRecoveryFeeling);
  const carryOpt = CARRY_OPTIONS.find(
    (o) => o.value === match.lossRecoveryCarryType
  );
  return (
    <section className="card border-indigo-100 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
          ✓
        </div>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Worked through this one
        </h2>
      </div>
      {feeling && (
        <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">
          Felt: <span className="font-semibold">{feeling.emoji} {feeling.label}</span>
        </div>
      )}
      {match.lossRecoveryLesson && (
        <SummaryField label="Lesson" value={match.lossRecoveryLesson} />
      )}
      {carryOpt && match.lossRecoveryCarry && (
        <SummaryField
          label={carryOpt.label}
          value={match.lossRecoveryCarry}
        />
      )}
    </section>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-700 dark:text-indigo-300">
        {label}
      </div>
      <p className="text-sm text-slate-800 dark:text-slate-100 leading-snug whitespace-pre-wrap">
        {value}
      </p>
    </div>
  );
}
