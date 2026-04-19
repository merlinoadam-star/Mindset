import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { postFeedback } from "../lib/feedbackSync";
import { buildPlaybook, type PlaybookAction } from "../lib/parentPlaybook";
import {
  fetchPlaybookContext,
  type PlaybookContext,
} from "../lib/parentPlaybookContext";
import { useRealtime } from "../lib/useRealtime";
import { logParentAction } from "../lib/parentXpSync";
import { showReward } from "./RewardToast";

/**
 * Parent Playbook — today's parent-facing to-dos derived from an
 * athlete's recent activity. Renders 1-3 cards with one-tap actions:
 * "Send 🔥" fires a cheer through the existing postFeedback flow; "Got
 * it" acknowledges a non-sendable reminder (e.g. "check in tonight —
 * listen, don't fix"). Dismissed / completed actions disappear for the
 * day via localStorage state.
 */

interface Props {
  /** The parent's own account id (used for localStorage scoping). */
  parentAccountId: string;
  /** The connected athlete we're generating actions for. */
  athleteId: string;
}

const MAX_VISIBLE = 3;

interface DoneState {
  /** Last date (YYYY-MM-DD) we saw any activity — used to auto-clear day-scoped dismissals. */
  day: string;
  /** Action ids the parent has completed or dismissed today. */
  completedIds: string[];
}

function storageKey(parentId: string, athleteId: string): string {
  return `mindset-parent-playbook-${parentId}-${athleteId}`;
}

function loadDoneState(parentId: string, athleteId: string): DoneState {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(storageKey(parentId, athleteId));
    if (!raw) return { day: today, completedIds: [] };
    const parsed = JSON.parse(raw) as DoneState;
    if (parsed.day !== today) return { day: today, completedIds: [] };
    return parsed;
  } catch {
    return { day: today, completedIds: [] };
  }
}

function saveDoneState(
  parentId: string,
  athleteId: string,
  state: DoneState
): void {
  try {
    localStorage.setItem(
      storageKey(parentId, athleteId),
      JSON.stringify(state)
    );
  } catch {
    /* ignore quota errors */
  }
}

export default function ParentPlaybookCard({
  parentAccountId,
  athleteId,
}: Props) {
  const { account } = useAuth();
  const [context, setContext] = useState<PlaybookContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<DoneState>(() =>
    loadDoneState(parentAccountId, athleteId)
  );
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const ctx = await fetchPlaybookContext(athleteId);
    setContext(ctx);
    setLoading(false);
  }, [athleteId]);

  useEffect(() => {
    load();
  }, [load]);

  // Stay in sync — if the athlete logs something, refresh so new
  // actions can surface without a page reload.
  const athleteFilter = `athlete_id=eq.${athleteId}`;
  useRealtime(
    { table: "matches", filter: athleteFilter, enabled: true },
    load
  );
  useRealtime(
    { table: "habit_completions", filter: athleteFilter, enabled: true },
    load
  );
  useRealtime(
    { table: "personal_records", filter: athleteFilter, enabled: true },
    load
  );
  useRealtime(
    { table: "mental_checkins", filter: athleteFilter, enabled: true },
    load
  );
  useRealtime(
    { table: "unlocked_badges", filter: athleteFilter, enabled: true },
    load
  );

  const actions = useMemo(
    () => (context ? buildPlaybook(context) : []),
    [context]
  );
  const visible = actions
    .filter((a) => !done.completedIds.includes(a.id))
    .slice(0, MAX_VISIBLE);

  const markDone = useCallback(
    (id: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const next: DoneState = {
        day: today,
        completedIds:
          done.day === today
            ? [...new Set([...done.completedIds, id])]
            : [id],
      };
      setDone(next);
      saveDoneState(parentAccountId, athleteId, next);
      // Award parent XP for this playbook action. The DB caps it to one
      // `playbook` award per (parent, athlete, day) so subsequent items
      // today return alreadyLogged and award 0 — that's fine.
      if (account?.role === "parent") {
        logParentAction({
          parentAccountId,
          athleteAccountId: athleteId,
          actionType: "playbook",
        }).then((res) => {
          if (res.awardedXp > 0) {
            showReward(
              res.awardedXp,
              res.combo ? ["__combo__Combo with your athlete!"] : []
            );
          }
        });
      }
    },
    [done, parentAccountId, athleteId, account?.role]
  );

  const sendCheer = useCallback(
    async (action: PlaybookAction) => {
      if (!account || !action.cta.cheerText) return;
      setSendingId(action.id);
      const { error } = await postFeedback({
        athleteId: action.athleteId,
        authorId: account.id,
        authorRole: account.role,
        targetType: "cheer",
        targetId: action.athleteId,
        text: action.cta.cheerText,
      });
      setSendingId(null);
      if (error) {
        // Leave the action in place so the parent can retry; show in console.
        console.warn("Failed to send cheer", error);
        return;
      }
      markDone(action.id);
    },
    [account, markDone]
  );

  // Hide the card entirely when it would be empty or dead weight.
  if (loading) return null;
  if (!context) return null;
  if (actions.length === 0 || visible.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/20">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-amber-400 text-white flex items-center justify-center flex-shrink-0">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-rose-700 dark:text-rose-300">
            Today for {context.firstName}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
            {visible.length === 1
              ? "One small thing you can do right now."
              : `${visible.length} small things you can do today.`}
          </div>
        </div>
        <button
          onClick={load}
          aria-label="Refresh"
          className="w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          <RefreshCw size={14} />
        </button>
      </header>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((a) => (
          <ActionRow
            key={a.id}
            action={a}
            sending={sendingId === a.id}
            onCheer={() => sendCheer(a)}
            onAck={() => markDone(a.id)}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Action row
// ---------------------------------------------------------------------------
function ActionRow({
  action,
  sending,
  onCheer,
  onAck,
}: {
  action: PlaybookAction;
  sending: boolean;
  onCheer: () => void;
  onAck: () => void;
}) {
  const toneClasses =
    action.tone === "celebrate"
      ? "text-amber-600 dark:text-amber-400"
      : action.tone === "support"
      ? "text-indigo-600 dark:text-indigo-400"
      : "text-slate-600 dark:text-slate-300";

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className="text-2xl leading-none pt-0.5" aria-hidden="true">
        {action.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className={`text-[10px] uppercase tracking-wider font-bold ${toneClasses}`}
        >
          {action.tone === "celebrate"
            ? "Celebrate"
            : action.tone === "support"
            ? "Support"
            : "Check in"}
        </div>
        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug mt-0.5">
          {action.title}
        </div>
        {action.subtitle && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
            {action.subtitle}
          </div>
        )}
        <div className="mt-2.5 flex items-center gap-2">
          {action.cta.type === "cheer" ? (
            <button
              onClick={onCheer}
              disabled={sending}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-semibold rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {sending ? (
                "Sending…"
              ) : (
                <>
                  <Check size={12} strokeWidth={3} /> {action.cta.label}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onAck}
              className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none"
            >
              <Check size={12} strokeWidth={3} /> {action.cta.label}
            </button>
          )}
          {action.cta.type === "cheer" && (
            <button
              onClick={onAck}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
