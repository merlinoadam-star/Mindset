import { useState } from "react";
import { Check, MessageCircleHeart, RefreshCw } from "lucide-react";
import { currentWeekMondayISO } from "../lib/gamification";
import { promptForWeek, type ParentPrompt } from "../lib/parentPrompts";
import { logParentAction } from "../lib/parentXpSync";
import { showReward } from "./RewardToast";

/**
 * Weekly conversation prompt shown on the parent's dashboard. Gives
 * them a concrete thing to ASK their athlete when the usual "how was
 * practice?" gets a shrug. Deterministic per ISO week so the same
 * prompt shows all week, then rotates.
 *
 * The parent can mark the prompt as "asked" (card collapses for the
 * rest of the week) or cycle to a different prompt within the same
 * week if today's doesn't fit. Both pieces of UI state persist in
 * localStorage keyed by the parent's account id so they don't cross
 * between accounts on a shared device.
 *
 * When `primaryAthleteId` is supplied, marking the prompt as asked
 * also logs a `check_in` action against that athlete (awards XP, and
 * a combo bonus if the athlete logged activity today).
 */

interface Props {
  accountId: string;
  /** Athlete to attribute this check-in to for XP/combo purposes. */
  primaryAthleteId?: string;
}

/**
 * Persisted per-week state. If `week` doesn't match the current ISO
 * week on read we treat everything as fresh (no ack, offset 0) — the
 * stored values just stick around until the parent does something
 * that overwrites them.
 */
interface PersistedState {
  week: string;
  asked: boolean;
  offset: number;
}

function storageKey(accountId: string): string {
  return `mindset-parent-checkin-${accountId}`;
}

function loadState(accountId: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey(accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (
      typeof parsed.week !== "string" ||
      typeof parsed.asked !== "boolean" ||
      typeof parsed.offset !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(accountId: string, next: PersistedState): void {
  try {
    localStorage.setItem(storageKey(accountId), JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export default function ParentCheckInCard({
  accountId,
  primaryAthleteId,
}: Props) {
  const week = currentWeekMondayISO();
  const [persisted, setPersisted] = useState<PersistedState | null>(() =>
    loadState(accountId)
  );

  // Effective state for this render — if the stored state is from a
  // previous week, ignore it so the card starts fresh.
  const stateThisWeek: PersistedState =
    persisted && persisted.week === week
      ? persisted
      : { week, asked: false, offset: 0 };

  const prompt: ParentPrompt = promptForWeek(week, stateThisWeek.offset);

  function markAsked() {
    const next: PersistedState = { ...stateThisWeek, asked: true };
    setPersisted(next);
    saveState(accountId, next);
    // Award XP (best-effort). Skip if no athlete to attribute to —
    // the DB write needs an athlete id for RLS + combo scoping.
    if (primaryAthleteId) {
      logParentAction({
        parentAccountId: accountId,
        athleteAccountId: primaryAthleteId,
        actionType: "check_in",
      }).then((res) => {
        if (res.awardedXp > 0) {
          showReward(
            res.awardedXp,
            res.combo ? ["__combo__Nice combo with your athlete!"] : []
          );
        }
      });
    }
  }

  function nextPrompt() {
    const next: PersistedState = {
      ...stateThisWeek,
      offset: stateThisWeek.offset + 1,
    };
    setPersisted(next);
    saveState(accountId, next);
  }

  function undoAsked() {
    const next: PersistedState = { ...stateThisWeek, asked: false };
    setPersisted(next);
    saveState(accountId, next);
  }

  if (stateThisWeek.asked) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 flex items-start gap-2.5">
        <Check
          size={16}
          strokeWidth={3}
          className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
            Nice — you checked in this week.
          </div>
          <div className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80 mt-0.5 leading-snug">
            Next prompt unlocks on Monday. Keep the conversation going in your
            own words.
          </div>
        </div>
        <button
          onClick={undoAsked}
          className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageCircleHeart size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-rose-700 dark:text-rose-300">
            This week&apos;s check-in
          </div>
          <p className="mt-1 text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-snug">
            &ldquo;{prompt.question}&rdquo;
          </p>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-snug">
            {prompt.why}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={nextPrompt}
          aria-label="Try a different prompt"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 px-2.5 py-2 rounded-lg focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <RefreshCw size={12} /> Try a different one
        </button>
        <button
          onClick={markAsked}
          className="ml-auto inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Check size={14} strokeWidth={3} /> I asked them
        </button>
      </div>
    </div>
  );
}
