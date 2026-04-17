import { useMemo } from "react";
import { Flame, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { todayISO } from "../lib/gamification";
import {
  activeTypesToday,
  COMBO_TIER_XP,
  comboLabel,
  type ComboType,
} from "../lib/combos";

/**
 * Phase G — daily combo progress card. Shows which of the 6 activity
 * types the athlete has touched today and what the next bonus is.
 * Hidden until they've touched at least one type (nothing to show).
 */
export default function ComboCard() {
  const { state } = useStore();
  const today = todayISO();

  const types = useMemo(() => activeTypesToday(state, today), [state, today]);
  const tier = types.size;

  if (!state.profile || tier === 0) return null;

  const nextTier = tier < 6 ? tier + 1 : null;
  const nextBonus = nextTier ? COMBO_TIER_XP[nextTier] : 0;

  const ITEMS: Array<{ key: ComboType; label: string; emoji: string }> = [
    { key: "habits", label: "Habits", emoji: "✅" },
    { key: "checkin", label: "Check-in", emoji: "🧠" },
    { key: "practice", label: "Practice", emoji: "💪" },
    { key: "mental", label: "Mental", emoji: "✨" },
    { key: "recovery", label: "Recovery", emoji: "😴" },
    { key: "nutrition", label: "Nutrition", emoji: "🥗" },
  ];

  return (
    <div className="card bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950 border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-orange-500" />
        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
          {comboLabel(tier)}
        </div>
        <span className="ml-auto text-xs font-bold text-orange-700 dark:text-orange-400 tabular-nums">
          {tier}/6
        </span>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {ITEMS.map((item) => {
          const done = types.has(item.key);
          return (
            <div
              key={item.key}
              className={`flex flex-col items-center justify-center aspect-square rounded-lg text-center transition ${
                done
                  ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md"
                  : "bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 opacity-60"
              }`}
              title={item.label}
            >
              <div className="text-lg leading-none">
                {done ? <Check size={14} strokeWidth={3} /> : item.emoji}
              </div>
              <div className="text-[8px] uppercase font-bold tracking-wider mt-0.5 leading-none">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {nextTier && (
        <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-400 text-center">
          Add one more activity for <span className="font-bold text-orange-700 dark:text-orange-400">+{nextBonus} XP</span>
        </div>
      )}
      {!nextTier && (
        <div className="mt-3 text-[11px] text-orange-700 dark:text-orange-400 text-center font-bold">
          MAX COMBO — every activity today, +75 bonus XP earned.
        </div>
      )}
    </div>
  );
}
