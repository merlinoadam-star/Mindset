import { useStore } from "../lib/store";
import { BADGES } from "../lib/gamification";

export default function BadgesPage() {
  const { state } = useStore();
  const unlockedIds = new Set(state.unlockedBadges.map((b) => b.id));
  const unlockedCount = unlockedIds.size;

  return (
    <div className="space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-extrabold">Badges</h1>
        <p className="text-sm text-slate-600 mt-1">
          {unlockedCount} of {BADGES.length} unlocked
        </p>
        <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all"
            style={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((b) => {
          const unlocked = unlockedIds.has(b.id);
          return (
            <div
              key={b.id}
              className={`rounded-2xl p-4 border text-center transition ${
                unlocked
                  ? "bg-white border-brand-200 shadow-sm"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className={`text-5xl ${unlocked ? "" : "grayscale opacity-30"}`}
              >
                {b.emoji}
              </div>
              <div
                className={`font-bold mt-2 text-sm ${
                  unlocked ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {b.name}
              </div>
              <div
                className={`text-xs mt-1 leading-tight ${
                  unlocked ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {unlocked ? b.description : b.requirement}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
