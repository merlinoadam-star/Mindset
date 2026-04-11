import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { computeLevel, computeStreak, isStreakAlive, getBadge, todayISO } from "../lib/gamification";
import { habitsForSport } from "../lib/habits";
import XPBar from "../components/XPBar";
import StreakBadge from "../components/StreakBadge";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import { ArrowRight, CheckSquare, Dumbbell, Brain } from "lucide-react";

export default function Dashboard() {
  const { state, hasCheckinToday } = useStore();
  if (!state.profile) return null;

  const info = computeLevel(state.xp, state.profile.sport);
  const streak = computeStreak(state);
  const alive = isStreakAlive(state);
  const today = todayISO();

  const todayHabits = state.habitCompletions.filter((c) => c.date === today);
  const totalHabitsToday = habitsForSport(state.profile.sport).length;
  const doneToday = new Set(todayHabits.map((h) => h.habitId)).size;

  const recentBadges = [...state.unlockedBadges]
    .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt))
    .slice(0, 3);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-4">
      <header className="pt-4 pb-1">
        <div className="text-sm text-slate-500">
          {greeting},
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {state.profile.name} 👋
        </h1>
      </header>

      <XPBar xp={state.xp} info={info} />

      <QuoteOfTheDay />

      <div className="grid grid-cols-2 gap-3">
        <StreakBadge streak={streak} alive={alive} />
        <div className="card">
          <div className="text-2xl font-extrabold tabular-nums leading-none">
            {doneToday}
            <span className="text-slate-400">/{totalHabitsToday}</span>
          </div>
          <div className="text-xs text-slate-600 mt-2">Habits Today</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Today&apos;s Focus</h2>
          {!alive && streak === 0 && (
            <span className="chip bg-orange-100 text-orange-700">
              Start a streak!
            </span>
          )}
        </div>
        <div className="space-y-2">
          <QuickAction
            to="/habits"
            icon={<CheckSquare size={20} />}
            label="Check off your daily habits"
            done={doneToday === totalHabitsToday && totalHabitsToday > 0}
            progress={`${doneToday}/${totalHabitsToday}`}
          />
          <QuickAction
            to="/mindset"
            icon={<Brain size={20} />}
            label="Daily mental check-in"
            done={hasCheckinToday}
          />
          <QuickAction
            to="/practice"
            icon={<Dumbbell size={20} />}
            label="Log a practice"
          />
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Recent Badges</h2>
          <Link
            to="/badges"
            className="text-brand-600 text-sm font-semibold hover:underline"
          >
            See all
          </Link>
        </div>
        {recentBadges.length === 0 ? (
          <p className="text-sm text-slate-500">
            No badges yet. Complete a habit to earn your first!
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {recentBadges.map((ub) => {
              const b = getBadge(ub.id);
              if (!b) return null;
              return (
                <div
                  key={ub.id}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center"
                >
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="text-xs font-semibold mt-1 leading-tight">
                    {b.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <Link
          to="/settings"
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
  done,
  progress,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  done?: boolean;
  progress?: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-xl border transition ${
        done
          ? "bg-green-50 border-green-200"
          : "bg-slate-50 border-slate-200 hover:border-brand-300"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          done ? "bg-green-500 text-white" : "bg-white text-brand-600 border border-slate-200"
        }`}
      >
        {done ? "✓" : icon}
      </div>
      <div className="flex-1 font-medium text-slate-800 text-sm">{label}</div>
      {progress && (
        <span className="text-xs font-semibold text-slate-500 tabular-nums">
          {progress}
        </span>
      )}
      <ArrowRight size={18} className="text-slate-400" />
    </Link>
  );
}
