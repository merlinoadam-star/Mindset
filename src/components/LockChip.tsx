import { Lock } from "lucide-react";

/**
 * Small "🔒 Lvl N" chip used when an item is level-gated. Two layouts:
 *
 *   <LockChip level={3} />             — inline chip (for lists)
 *   <LockOverlay level={3} /> + parent with `relative` — full-card
 *                                         dimming overlay with a
 *                                         centered chip
 *
 * Colors intentionally use slate rather than flame — a locked CTA
 * shouldn't look hotter than an unlocked one.
 */

interface LockChipProps {
  level: number;
  className?: string;
}

export function LockChip({ level, className = "" }: LockChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-900/80 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      <Lock size={10} strokeWidth={3} />
      Lvl {level}
    </span>
  );
}

/** Full-card dimming layer. Parent must be `relative`. */
export function LockOverlay({ level }: { level: number }) {
  return (
    <div className="absolute inset-0 rounded-3xl bg-slate-950/55 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
      <LockChip level={level} className="shadow-elevated" />
    </div>
  );
}
