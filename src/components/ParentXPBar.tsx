import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { useRealtime } from "../lib/useRealtime";
import {
  computeSupportLevel,
  fetchParentXpTotal,
} from "../lib/parentXpSync";

/**
 * Parent "Support Level" bar — totals XP earned across all supported
 * athletes. Rendered at the top of the parent's dashboard. Live-updates
 * via Realtime on parent_actions so the bar animates right after an
 * action earns XP without needing a page refresh.
 */
export default function ParentXPBar() {
  const { account } = useAuth();
  const [xp, setXp] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!account) return;
    const total = await fetchParentXpTotal(account.id);
    setXp(total);
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  // Any new row in parent_actions for this parent bumps the bar.
  useRealtime(
    {
      table: "parent_actions",
      filter: account ? `parent_account_id=eq.${account.id}` : undefined,
      enabled: Boolean(account),
    },
    load
  );

  // In-app fallback — fires synchronously after a parent action so the
  // bar updates immediately, regardless of realtime connection state.
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("parent-xp-changed", handler);
    return () => window.removeEventListener("parent-xp-changed", handler);
  }, [load]);

  if (!account || account.role !== "parent") return null;
  if (xp === null) return null;

  const info = computeSupportLevel(xp);
  const xpIntoLevel = xp - info.xpForThisLevel;
  const xpNeeded = info.xpForNextLevel - info.xpForThisLevel;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-amber-500 text-white p-5 shadow-elevated">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" aria-hidden="true" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5" aria-hidden="true" />

      <div className="relative flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart size={16} strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">
              Support Level {info.level}
            </span>
          </div>
          <div className="text-xl font-extrabold mt-1.5">{info.title}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-extrabold tabular-nums">{xp}</div>
          <div className="text-xs font-semibold text-white/60">Total XP</div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="h-3 bg-white/15 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white/90 to-white rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, info.progressPct)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs font-semibold text-white/70">
          <span className="tabular-nums">
            {xpIntoLevel} / {xpNeeded} XP
          </span>
          <span>Next: Level {info.level + 1}</span>
        </div>
      </div>
    </div>
  );
}
