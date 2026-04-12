import { useStore } from "../lib/store";
import { BADGES } from "../lib/gamification";

export default function BadgesPage() {
  const { state } = useStore();
  const unlockedIds = new Set(state.unlockedBadges.map((b) => b.id));
  const unlockedCount = unlockedIds.size;

  return (
    <div className="space-y-4 animate-slide-up">
      <header className="pt-4">
        <h1 className="page-title">Badges</h1>
        <p className="page-subtitle">
          {unlockedCount} of {BADGES.length} unlocked
        </p>
        <div className="mt-3 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all"
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
              className={`rounded-3xl p-5 border text-center transition-all duration-200 ${
                unlocked
                  ? "bg-gradient-to-b from-white to-slate-50 border-brand-200 shadow-card"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <div
                className={`text-5xl transition-all duration-300 ${
                  unlocked ? "drop-shadow-md" : "grayscale opacity-25"
                }`}
              >
                {b.emoji}
              </div>
              <div
                className={`font-bold mt-3 text-sm ${
                  unlocked ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {b.name}
              </div>
              <div
                className={`text-xs mt-1 leading-tight ${
                  unlocked ? "text-slate-500" : "text-slate-400"
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
