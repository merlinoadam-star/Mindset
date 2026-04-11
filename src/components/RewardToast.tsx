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
          className="animate-pop-in bg-slate-900 text-white rounded-xl shadow-lg px-4 py-2 text-sm font-semibold"
        >
          {r.xp > 0 && <span className="mr-1">+{r.xp} XP</span>}
          {r.xp < 0 && <span className="mr-1">{r.xp} XP</span>}
          {r.badges.length > 0 && (
            <span className="ml-1">
              {r.badges.map((id) => {
                const b = getBadge(id);
                return b ? `${b.emoji} ${b.name}` : "";
              }).join(" · ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
