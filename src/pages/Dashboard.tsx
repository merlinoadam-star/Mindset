import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { computeLevel, computeStreak, isStreakAlive, getBadge, todayISO } from "../lib/gamification";
import { habitsForSport } from "../lib/habits";
import XPBar from "../components/XPBar";
import StreakBadge from "../components/StreakBadge";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import DailyGoalCard from "../components/DailyGoalCard";
import UnreadFeedbackBanner from "../components/UnreadFeedbackBanner";
import WeeklyFocusCard from "../components/WeeklyFocusCard";
import ReminderBanner from "../components/ReminderBanner";
import WeeklyWrapUpCard from "../components/WeeklyWrapUpCard";
import DailyChallengeCard from "../components/DailyChallengeCard";
import ComboCard from "../components/ComboCard";
import UpcomingMatchesCard from "../components/UpcomingMatchesCard";
import { InstallBanner } from "../components/InstallAppCard";
import GuidedTutorial from "../components/GuidedTutorial";
import { useAuth } from "../lib/authContext";
import { ArrowRight, CheckSquare, Dumbbell, Brain, Gamepad2, Settings, User, Swords, Wind, BookOpen, Eye, Sword, Calendar, Sparkles, Video as VideoIcon, Users } from "lucide-react";
import { currentWeekMondayISO } from "../lib/gamification";

export default function Dashboard() {
  const { state, hasCheckinToday } = useStore();
  const { account } = useAuth();
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

  const thisWeek = currentWeekMondayISO();
  const hasWeeklyReview = state.weeklyReviews.some(
    (r) => r.weekStartDate === thisWeek
  );
  const pinnedPhrase = state.powerPhrases.find((p) => p.isPinned);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";


  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <header className="pt-4 pb-1 flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-extrabold shadow-card group-hover:shadow-card-hover transition">
            {state.profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {greeting},
            </div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate max-w-[180px]">
              {state.profile.name}
            </div>
          </div>
        </Link>
        <Link
          to="/settings"
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-card flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
        >
          <Settings size={18} />
        </Link>
      </header>

      <GuidedTutorial />

      <Link to="/progress" className="block group">
        <XPBar xp={state.xp} info={info} />
      </Link>

      <UnreadFeedbackBanner />

      <ReminderBanner />

      <UpcomingMatchesCard />

      <WeeklyFocusCard />

      <DailyChallengeCard />

      <ComboCard />

      {account && account.role === "athlete" && (
        <WeeklyWrapUpCard athleteId={account.id} />
      )}

      <DailyGoalCard />

      <QuoteOfTheDay />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StreakBadge streak={streak} alive={alive} freezes={state.streakFreezes ?? 0} />
        <div className="card">
          <div className="text-2xl font-extrabold tabular-nums leading-none text-slate-900">
            {doneToday}
            <span className="text-slate-300">/{totalHabitsToday}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Habits Today
          </div>
          {doneToday === totalHabitsToday && totalHabitsToday > 0 && (
            <div className="mt-2 text-xs font-bold text-green-600">
              All done!
            </div>
          )}
        </div>
      </div>

      {/* Today's Focus */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Today&apos;s Focus</h2>
          {!alive && streak === 0 && (
            <span className="chip bg-orange-100 text-orange-700 !text-xs">
              Start a streak!
            </span>
          )}
        </div>
        <div className="space-y-2">
          <QuickAction
            to="/habits"
            icon={<CheckSquare size={18} />}
            label="Check off what you did today!"
            done={doneToday === totalHabitsToday && totalHabitsToday > 0}
            progress={`${doneToday}/${totalHabitsToday}`}
            color="brand"
          />
          <QuickAction
            to="/mindset"
            icon={<Brain size={18} />}
            label="Daily mental check-in"
            done={hasCheckinToday}
            color="purple"
          />
          <QuickAction
            to="/practice"
            icon={<Dumbbell size={18} />}
            label="Log a practice"
            color="emerald"
          />
          <QuickAction
            to="/matches"
            icon={<Swords size={18} />}
            label="Log a match — Pre / Post / Reflection"
            color="red"
          />
          <QuickAction
            to="/games"
            icon={<Gamepad2 size={18} />}
            label="Mini-games hub — 4 games, lots of XP"
            color="amber"
          />
          <QuickAction
            to="/videos"
            icon={<VideoIcon size={18} />}
            label="Video library — review your technique"
            color="red"
          />
          <QuickAction
            to="/opponents"
            icon={<Users size={18} />}
            label="Scout your opponents"
            color="brand"
          />
          <QuickAction
            to="/profile"
            icon={<User size={18} />}
            label="Build out your athlete profile"
            done={profileFairlyComplete(state.profile)}
            color="purple"
          />
        </div>
      </div>

      <InstallBanner />

      {/* Pinned Power Phrase */}
      {pinnedPhrase && (
        <Link
          to="/phrases"
          className="block relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 text-white p-5 shadow-elevated hover:shadow-card-hover transition"
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-amber-300" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-200">
                Your Mantra
              </span>
            </div>
            <blockquote className="text-lg font-extrabold leading-tight">
              &ldquo;{pinnedPhrase.text}&rdquo;
            </blockquote>
          </div>
        </Link>
      )}

      {/* Weekly Review prompt */}
      {!hasWeeklyReview && (
        <Link
          to="/review"
          className="block card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 hover:shadow-card-hover transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-sm">
              <Calendar size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900">
                Weekly Review awaits
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                3 wins, 1 challenge, 1 lesson, next goal · +50 XP
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400" />
          </div>
        </Link>
      )}

      {/* Mental Tools */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Mental Tools</h2>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            +XP each
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Link
            to="/visualize"
            className="rounded-2xl p-3 text-center bg-gradient-to-b from-purple-50 to-white border border-purple-100 hover:border-purple-200 hover:shadow-card-hover transition"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Eye size={16} />
            </div>
            <div className="text-[11px] font-bold text-slate-900 mt-2">
              Visualize
            </div>
          </Link>
          <Link
            to="/breathe"
            className="rounded-2xl p-3 text-center bg-gradient-to-b from-sky-50 to-white border border-sky-100 hover:border-sky-200 hover:shadow-card-hover transition"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Wind size={16} />
            </div>
            <div className="text-[11px] font-bold text-slate-900 mt-2">Breathe</div>
          </Link>
          <Link
            to="/lessons"
            className="rounded-2xl p-3 text-center bg-gradient-to-b from-amber-50 to-white border border-amber-100 hover:border-amber-200 hover:shadow-card-hover transition"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <div className="text-[11px] font-bold text-slate-900 mt-2">Lessons</div>
          </Link>
          <Link
            to="/phrases"
            className="rounded-2xl p-3 text-center bg-gradient-to-b from-red-50 to-white border border-red-100 hover:border-red-200 hover:shadow-card-hover transition"
          >
            <div className="w-9 h-9 mx-auto rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Sword size={16} />
            </div>
            <div className="text-[11px] font-bold text-slate-900 mt-2">Phrases</div>
          </Link>
        </div>
      </div>

      {/* Recent Badges */}
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
          <p className="text-sm text-slate-400">
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
                  className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-3 text-center shadow-sm"
                >
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="text-[11px] font-bold mt-1.5 leading-tight text-slate-700">
                    {b.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-2" />
    </div>
  );
}

function profileFairlyComplete(p: NonNullable<ReturnType<typeof useStore>["state"]["profile"]>): boolean {
  // Consider "fairly complete" if they've filled at least 4 of the extended sections.
  let filled = 0;
  if (p.heightInches || p.weightLbs || p.teamName) filled++;
  if (p.weightClass || p.primaryPosition) filled++;
  if (p.wrestlingStats || p.volleyballStats) filled++;
  if (p.tournaments && p.tournaments.length) filled++;
  if (p.awards && p.awards.length) filled++;
  if (p.goals && (p.goals.shortTerm || p.goals.season || p.goals.career)) filled++;
  return filled >= 4;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  brand: { bg: "bg-brand-50", icon: "text-brand-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
};

function QuickAction({
  to,
  icon,
  label,
  done,
  progress,
  color = "brand",
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  done?: boolean;
  progress?: string;
  color?: string;
}) {
  const c = colorMap[color] ?? colorMap.brand;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
        done
          ? "bg-green-50/80 border-green-200 shadow-glow-green"
          : "bg-white border-slate-100 hover:border-brand-200 hover:shadow-card-hover"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          done
            ? "bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-sm"
            : `${c.bg} ${c.icon}`
        }`}
      >
        {done ? "✓" : icon}
      </div>
      <div className="flex-1 font-semibold text-slate-700 text-sm">{label}</div>
      {progress && (
        <span className="text-xs font-bold text-slate-400 tabular-nums">
          {progress}
        </span>
      )}
      <ArrowRight size={16} className="text-slate-300" />
    </Link>
  );
}
