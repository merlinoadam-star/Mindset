import { useEffect, useState } from "react";
import { getBadge } from "../lib/gamification";
import { hapticSuccess, hapticLight } from "../lib/haptics";
import { fireConfetti } from "./Confetti";

interface Reward {
  id: number;
  xp: number;
  badges: string[];
}

let nextId = 1;
let push: ((r: Omit<Reward, "id">) => void) | null = null;

export function showReward(xp: number, badges: string[] = []) {
  if (push) push({ xp, badges });
}

export default function RewardToast() {
  const [items, setItems] = useState<Reward[]>([]);

  useEffect(() => {
    push = (r) => {
      const id = nextId++;
      setItems((prev) => [...prev, { ...r, id }]);
      // Haptic based on what happened
      if (r.badges.length > 0) {
        hapticSuccess();
        fireConfetti(50); // badge unlock gets a small burst
      } else if (r.xp > 0) {
        hapticLight();
      }
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 2800);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
      {items.map((r) => (
        <div
          key={r.id}
          className="animate-pop-in bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-elevated px-5 py-3 text-sm font-bold flex items-center gap-2"
        >
          {r.xp > 0 && (
            <span className="text-emerald-400">+{r.xp} XP</span>
          )}
          {r.xp < 0 && (
            <span className="text-red-400">{r.xp} XP</span>
          )}
          {r.badges.length > 0 && (
            <span className="text-amber-300">
              {r.badges
                .map((id) => {
                  // Special prefix for non-badge messages (combos, etc.)
                  if (id.startsWith("__combo__")) {
                    return `🔥 ${id.slice(9)}`;
                  }
                  const b = getBadge(id);
                  return b ? `${b.emoji} ${b.name}` : "";
                })
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
