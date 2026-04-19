import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Square, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useStore } from "../lib/store";
import { useRealtime } from "../lib/useRealtime";
import { showReward } from "./RewardToast";
import {
  completePlanItem,
  fetchTodaysPlanForAthlete,
  uncompletePlanItem,
  type PracticePlan,
  type PracticePlanCompletion,
  type PracticePlanItem,
} from "../lib/practicePlanSync";

/**
 * Athlete-side card showing today's practice plan, if a coach has
 * pushed one. Hidden entirely when there's no plan for today.
 *
 * Each item has a checkbox + XP reward. Ticking an item inserts a
 * completion row and bumps local XP through the same path as other
 * game rounds. Unticking deletes the completion (no XP refund —
 * XP that was awarded stays awarded, matching how habits work).
 */
export default function TodaysPlanCard() {
  const { account } = useAuth();
  const { awardXpFromPlan } = useStore();
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [completions, setCompletions] = useState<PracticePlanCompletion[]>([]);
  const [coachName, setCoachName] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account || account.role !== "athlete") return;
    const res = await fetchTodaysPlanForAthlete(account.id);
    setPlan(res.plan);
    setCompletions(res.completions);
    setCoachName(res.coachName);
    setLoaded(true);
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(
    {
      table: "coach_practice_plans",
      filter: account ? `athlete_account_id=eq.${account.id}` : undefined,
      enabled: Boolean(account),
    },
    load
  );
  useRealtime(
    {
      table: "coach_practice_plan_completions",
      filter: account ? `athlete_account_id=eq.${account.id}` : undefined,
      enabled: Boolean(account),
    },
    load
  );

  const completedIds = useMemo(
    () => new Set(completions.map((c) => c.item_id)),
    [completions]
  );

  const toggle = useCallback(
    async (item: PracticePlanItem) => {
      if (!account || !plan) return;
      if (busyItemId) return;
      setBusyItemId(item.id);
      const wasDone = completedIds.has(item.id);

      if (wasDone) {
        // Optimistic: remove locally, then persist.
        setCompletions((prev) => prev.filter((c) => c.item_id !== item.id));
        const { error } = await uncompletePlanItem({
          planId: plan.id,
          itemId: item.id,
          athleteAccountId: account.id,
        });
        if (error) await load(); // resync on failure
      } else {
        // Optimistic: mark locally, award XP, then persist.
        setCompletions((prev) => [
          ...prev,
          {
            plan_id: plan.id,
            item_id: item.id,
            athlete_account_id: account.id,
            xp_awarded: item.xp,
            completed_at: new Date().toISOString(),
          },
        ]);
        awardXpFromPlan(item.xp);
        if (item.xp > 0) showReward(item.xp);

        const { error, alreadyComplete } = await completePlanItem({
          planId: plan.id,
          itemId: item.id,
          athleteAccountId: account.id,
          xp: item.xp,
        });
        if (error && !alreadyComplete) await load();
      }
      setBusyItemId(null);
    },
    [account, plan, completedIds, awardXpFromPlan, busyItemId, load]
  );

  if (!account || account.role !== "athlete") return null;
  if (!loaded) return null;
  if (!plan) return null;

  const total = plan.items.length;
  const done = plan.items.filter((i) => completedIds.has(i.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  return (
    <section className="rounded-2xl border border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-950/40 dark:to-purple-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <ClipboardList size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-700 dark:text-brand-300">
            {coachName ? `From Coach ${coachName}` : "From your coach"}
          </div>
          <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
            {plan.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/60 dark:bg-slate-800/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-bold tabular-nums text-slate-600 dark:text-slate-300 flex-shrink-0">
              {done}/{total}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 dark:text-slate-500 flex-shrink-0" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <ul className="divide-y divide-brand-200/60 dark:divide-brand-800/60 bg-white/40 dark:bg-slate-900/40">
          {plan.items.map((item) => {
            const isDone = completedIds.has(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  disabled={busyItemId === item.id}
                  aria-pressed={isDone}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/60 dark:hover:bg-slate-800/40 disabled:opacity-60"
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 dark:border-slate-600 text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? <Check size={14} strokeWidth={3} /> : <Square size={0} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-bold leading-tight ${
                        isDone
                          ? "text-slate-500 dark:text-slate-400 line-through"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {item.label}
                    </div>
                    {item.description && (
                      <div
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isDone
                            ? "text-slate-400 dark:text-slate-500"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-extrabold tabular-nums flex-shrink-0 mt-0.5 ${
                      isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-brand-600 dark:text-brand-300"
                    }`}
                  >
                    {isDone ? "+" : ""}{item.xp} XP
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {allDone && expanded && (
        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 text-center">
          Plan complete — nice work.
        </div>
      )}
    </section>
  );
}
