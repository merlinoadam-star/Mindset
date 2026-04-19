import { useState } from "react";
import { X, Plus, Trash2, ClipboardList } from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  upsertPracticePlan,
  generateItemId,
  type PracticePlanItem,
} from "../lib/practicePlanSync";
import { showReward } from "./RewardToast";

/**
 * Coach-facing modal: build today's practice plan for a single
 * athlete and push it. Launched from the athlete's profile page.
 *
 * Plan shape: a title + 1-10 items, each with label (required),
 * optional description, and XP reward (default 10). Submitting
 * calls upsertPracticePlan which ON CONFLICT-overwrites any prior
 * plan the coach had for this athlete today.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  athleteAccountId: string;
  athleteName: string;
  /** Optionally seed the modal with an existing plan (for editing). */
  initial?: { title: string; items: PracticePlanItem[] } | null;
}

const MAX_ITEMS = 10;
const DEFAULT_XP = 10;

interface Draft {
  id: string;
  label: string;
  description: string;
  xp: number;
}

function toDraft(item: PracticePlanItem): Draft {
  return {
    id: item.id,
    label: item.label,
    description: item.description ?? "",
    xp: item.xp,
  };
}

function emptyDraft(): Draft {
  return { id: generateItemId(), label: "", description: "", xp: DEFAULT_XP };
}

export default function PushPlanModal({
  open,
  onClose,
  athleteAccountId,
  athleteName,
  initial,
}: Props) {
  const { account } = useAuth();
  const [title, setTitle] = useState(initial?.title ?? "Today's practice");
  const [items, setItems] = useState<Draft[]>(
    initial?.items && initial.items.length > 0
      ? initial.items.map(toDraft)
      : [emptyDraft()]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;
  if (!account || account.role !== "coach") return null;

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems((prev) => [...prev, emptyDraft()]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  };

  const updateItem = (id: string, patch: Partial<Draft>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const canSubmit =
    title.trim().length > 0 &&
    items.some((i) => i.label.trim().length > 0) &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const cleaned = items
      .filter((i) => i.label.trim().length > 0)
      .map<PracticePlanItem>((i) => ({
        id: i.id,
        label: i.label.trim(),
        description: i.description.trim() || undefined,
        xp: Number.isFinite(i.xp) && i.xp >= 0 ? Math.min(50, Math.round(i.xp)) : DEFAULT_XP,
      }));

    const { error } = await upsertPracticePlan({
      coachAccountId: account.id,
      athleteAccountId,
      title: title.trim(),
      items: cleaned,
    });

    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    showReward(0, [`__combo__Plan sent to ${athleteName}`]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-elevated flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center">
            <ClipboardList size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-700 dark:text-brand-300">
              Push today's plan
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              For {athleteName}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="Today's practice"
              className="w-full text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Drills / items ({items.length}/{MAX_ITEMS})
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={items.length >= MAX_ITEMS}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 disabled:opacity-40 inline-flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-1">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        value={item.label}
                        onChange={(e) =>
                          updateItem(item.id, { label: e.target.value.slice(0, 120) })
                        }
                        placeholder="Drill name (e.g. '3 rounds of live goes')"
                        className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
                      />
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, {
                            description: e.target.value.slice(0, 200),
                          })
                        }
                        placeholder="Notes (optional)"
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:border-brand-500 outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                          XP
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={item.xp}
                          onChange={(e) =>
                            updateItem(item.id, { xp: parseInt(e.target.value) || 0 })
                          }
                          className="w-16 text-xs tabular-nums text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-1 text-slate-900 dark:text-slate-100 focus:border-brand-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                          aria-label="Remove item"
                          className="ml-auto w-7 h-7 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300 font-medium">
              Couldn't push plan: {error}
            </div>
          )}

          {!canSubmit && !submitting && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {title.trim().length === 0
                ? "Give the plan a title."
                : "Fill in at least one drill name to enable Push."}
            </div>
          )}
        </div>

        <footer className="flex items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex-[1.4] btn-primary !py-2.5 disabled:opacity-50"
            aria-label={`Push plan to ${athleteName}`}
          >
            {submitting ? "Pushing..." : `Push to ${athleteName.split(" ")[0] || "athlete"}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
