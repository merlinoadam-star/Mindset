import { useEffect, useState } from "react";
import { getBadge } from "../lib/gamification";

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
                  const b = getBadge(id);
                  return b ? `${b.emoji} ${b.name}` : "";
                })
                .join(" · ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
