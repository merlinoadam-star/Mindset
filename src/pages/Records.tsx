import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { useStore } from "../lib/store";
import { showReward } from "../components/RewardToast";
import { todayISO } from "../lib/gamification";
import {
  ALL_UNITS,
  customCategoryKey,
  formatRecordValue,
  parseRecordValue,
  suggestedCategoriesForSport,
  summarizeRecords,
  type PersonalRecordCategory,
  type PersonalRecordSummary,
} from "../lib/personalRecords";
import type {
  PersonalRecordDirection,
  PersonalRecordUnit,
} from "../types";

/**
 * Personal records page. Lists the athlete's current bests per category
 * with a history of past attempts; suggestions the athlete hasn't started
 * tracking yet appear at the bottom along with a "Custom PR" option.
 */
export default function RecordsPage() {
  const { state, addPersonalRecord, deletePersonalRecord } = useStore();
  const [logTarget, setLogTarget] = useState<{
    categoryKey: string;
    categoryLabel: string;
    unit: PersonalRecordUnit;
    direction: PersonalRecordDirection;
  } | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  if (!state.profile) return null;
  const sport = state.profile.sport;

  const summaries = useMemo(
    () => summarizeRecords(state.personalRecords ?? [], sport),
    [state.personalRecords, sport]
  );

  const trackedKeys = new Set(summaries.map((s) => s.categoryKey));
  const unstarted = suggestedCategoriesForSport(sport).filter(
    (c) => !trackedKeys.has(c.key)
  );

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
        >
          <ArrowLeft size={16} /> Profile
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center">
            <Trophy size={18} />
          </div>
          <div>
            <h1 className="page-title">Personal Records</h1>
            <p className="page-subtitle">
              Heavy lifts, fast times, personal bests.
            </p>
          </div>
        </div>
      </header>

      {summaries.length === 0 && unstarted.length > 0 && (
        <div className="card text-center py-8">
          <Trophy size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="font-bold mt-3 text-slate-900 dark:text-slate-100">
            No records tracked yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            Pick a PR below to start tracking. Every attempt earns XP; beat
            your best and it&apos;s a new record.
          </p>
        </div>
      )}

      {summaries.length > 0 && (
        <div className="space-y-3">
          {summaries.map((s) => (
            <RecordCard
              key={s.categoryKey}
              summary={s}
              onLog={() =>
                setLogTarget({
                  categoryKey: s.categoryKey,
                  categoryLabel: s.label,
                  unit: s.unit,
                  direction: s.direction,
                })
              }
              onDeleteAttempt={deletePersonalRecord}
            />
          ))}
        </div>
      )}

      {unstarted.length > 0 && (
        <section className="card">
          <h2 className="section-label mb-3">Start tracking</h2>
          <div className="grid grid-cols-2 gap-2">
            {unstarted.map((c) => (
              <button
                key={c.key}
                onClick={() =>
                  setLogTarget({
                    categoryKey: c.key,
                    categoryLabel: c.label,
                    unit: c.unit,
                    direction: c.direction,
                  })
                }
                className="text-left px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-600 transition"
              >
                <div className="text-lg">{c.emoji}</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
                  {c.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {c.unit}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setCustomOpen(true)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-brand-100 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-2.5 hover:border-brand-400 dark:hover:border-brand-500 transition"
          >
            <Plus size={14} /> Custom PR
          </button>
        </section>
      )}

      {logTarget && (
        <LogAttemptModal
          target={logTarget}
          onClose={() => setLogTarget(null)}
          onSave={(value, achievedOn, notes) => {
            const { awardedXp, newlyUnlocked, isNewBest } = addPersonalRecord({
              categoryKey: logTarget.categoryKey,
              categoryLabel: logTarget.categoryLabel,
              unit: logTarget.unit,
              direction: logTarget.direction,
              value,
              achievedOn,
              notes,
            });
            if (awardedXp > 0 || newlyUnlocked.length) {
              showReward(awardedXp, newlyUnlocked);
            }
            if (isNewBest) {
              // Brief celebratory toast in addition to the XP toast.
              // fireConfetti + haptics already fire from the store action.
            }
            setLogTarget(null);
          }}
        />
      )}

      {customOpen && (
        <CustomPrModal
          onClose={() => setCustomOpen(false)}
          onCreate={(label, unit, direction) => {
            setCustomOpen(false);
            setLogTarget({
              categoryKey: customCategoryKey(),
              categoryLabel: label,
              unit,
              direction,
            });
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Record card — current best + expandable history
// ---------------------------------------------------------------------------
function RecordCard({
  summary,
  onLog,
  onDeleteAttempt,
}: {
  summary: PersonalRecordSummary;
  onLog: () => void;
  onDeleteAttempt: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="card">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{summary.emoji ?? "⭐"}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {summary.label}
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
            {formatRecordValue(summary.best.value, summary.unit)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Set {formatDate(summary.best.achievedOn)}
            {summary.totalAttempts > 1 &&
              ` · ${summary.totalAttempts} attempts`}
          </div>
          {summary.best.notes && (
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic leading-snug">
              &ldquo;{summary.best.notes}&rdquo;
            </div>
          )}
        </div>
        <button
          onClick={onLog}
          className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex-shrink-0 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
        >
          <Plus size={12} /> Log
        </button>
      </div>

      {summary.history.length > 0 && (
        <>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-3 uppercase tracking-wider"
          >
            {expanded
              ? "Hide history"
              : `Show ${summary.history.length} past attempt${
                  summary.history.length === 1 ? "" : "s"
                }`}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
              {summary.history.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                >
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200 min-w-[56px]">
                    {formatRecordValue(a.value, a.unit)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {formatDate(a.achievedOn)}
                  </span>
                  {a.notes && (
                    <span className="flex-1 italic truncate">
                      &ldquo;{a.notes}&rdquo;
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this attempt?")) onDeleteAttempt(a.id);
                    }}
                    aria-label="Delete attempt"
                    className="ml-auto text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none rounded"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Log-attempt modal
// ---------------------------------------------------------------------------
function LogAttemptModal({
  target,
  onClose,
  onSave,
}: {
  target: {
    categoryKey: string;
    categoryLabel: string;
    unit: PersonalRecordUnit;
    direction: PersonalRecordDirection;
  };
  onClose: () => void;
  onSave: (value: number, achievedOn: string, notes: string | undefined) => void;
}) {
  const titleId = useId();
  const valueId = useId();
  const dateId = useId();
  const notesId = useId();
  const [valueRaw, setValueRaw] = useState("");
  const [achievedOn, setAchievedOn] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const unitHelper =
    target.unit === "sec"
      ? "Enter seconds (e.g. 45) or m:ss (e.g. 5:45)."
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseRecordValue(valueRaw, target.unit);
    if (parsed === null) {
      setErr("Enter a valid number.");
      return;
    }
    if (!achievedOn) {
      setErr("Pick a date.");
      return;
    }
    onSave(parsed, achievedOn, notes.trim() || undefined);
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
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              id={titleId}
              className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Log a new attempt
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {target.categoryLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor={valueId}
              className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Value ({target.unit})
            </label>
            <input
              id={valueId}
              value={valueRaw}
              onChange={(e) => {
                setValueRaw(e.target.value);
                if (err) setErr(null);
              }}
              inputMode={target.unit === "sec" ? "text" : "decimal"}
              autoFocus
              placeholder={target.unit === "sec" ? "45 or 5:45" : "e.g. 185"}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none"
            />
            {unitHelper && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {unitHelper}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={dateId}
              className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Date
            </label>
            <input
              id={dateId}
              type="date"
              value={achievedOn}
              onChange={(e) => setAchievedOn(e.target.value)}
              max={todayISO()}
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={notesId}
              className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Anything worth remembering about this attempt"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none resize-none"
            />
          </div>

          {err && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-3 py-2 text-xs">
              {err}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Sparkles size={14} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom PR definition modal (then passes through to LogAttemptModal)
// ---------------------------------------------------------------------------
function CustomPrModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (
    label: string,
    unit: PersonalRecordUnit,
    direction: PersonalRecordDirection
  ) => void;
}) {
  const titleId = useId();
  const labelId = useId();
  const [label, setLabel] = useState("");
  const [unit, setUnit] = useState<PersonalRecordUnit>("reps");
  const [direction, setDirection] = useState<PersonalRecordDirection>("higher");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    onCreate(trimmed, unit, direction);
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
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-elevated p-5 animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <h2
            id={titleId}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Custom PR
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor={labelId}
              className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5"
            >
              What are you tracking?
            </label>
            <input
              id={labelId}
              value={label}
              onChange={(e) => setLabel(e.target.value.slice(0, 60))}
              autoFocus
              placeholder="e.g. Broad jump, 1-mile TT"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2.5 text-sm focus:border-brand-500 dark:focus:border-brand-400 outline-none"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Unit
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition ${
                    unit === u
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Better is…
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection("higher")}
                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition ${
                  direction === "higher"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                Higher ↑
              </button>
              <button
                type="button"
                onClick={() => setDirection("lower")}
                className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition ${
                  direction === "lower"
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                Lower ↓
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Lower-is-better for timed things like mile time; higher for
              weights, reps, distances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim()}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Next
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Re-export type to reduce import chatter in consumers.
export type { PersonalRecordCategory };
