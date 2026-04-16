import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Target, Calendar, X, ChevronRight } from "lucide-react";
import { useStore } from "../lib/store";
import {
  activeDatesSet,
  computeStreak,
  currentWeekMondayISO,
  isStreakAlive,
  todayISO,
} from "../lib/gamification";

/**
 * Phase 3C — smart in-app reminders.
 *
 * Computes the single highest-priority nudge to surface on the
 * dashboard and lets the user dismiss it for the day. Dismissal keys
 * are scoped by type + date so the same reminder reappears tomorrow.
 *
 * Priority order (top wins):
 *   1. Pre-match prep (match within 48 hours, no pre-match done)
 *   2. Streak save (streak alive, no activity today, afternoon+)
 *   3. Weekly review (Sunday afternoon, no review yet this week)
 */

type Reminder =
  | {
      kind: "streak";
      streak: number;
    }
  | {
      kind: "prematch";
      matchId: string;
      opponent: string;
      daysAway: number;
    }
  | { kind: "review"; weekStart: string };

const DISMISS_PREFIX = "mindset-reminder-dismissed-v1";

function readDismissed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_PREFIX) || "{}");
  } catch {
    return {};
  }
}

function writeDismissed(map: Record<string, string>) {
  try {
    localStorage.setItem(DISMISS_PREFIX, JSON.stringify(map));
  } catch {
    /* quota — ignore */
  }
}

function dismissalKey(r: Reminder): string {
  if (r.kind === "prematch") return `prematch:${r.matchId}:${todayISO()}`;
  if (r.kind === "review") return `review:${r.weekStart}`;
  return `${r.kind}:${todayISO()}`;
}

export default function ReminderBanner() {
  const { state } = useStore();
  const [dismissed, setDismissed] = useState(() => readDismissed());

  const reminder: Reminder | null = useMemo(() => {
    if (!state.profile) return null;
    const today = todayISO();
    const now = new Date();
    const hour = now.getHours();

    // 1. Pre-match prep — match scheduled in next 48h without pre-match completed
    const in48h = new Date();
    in48h.setDate(in48h.getDate() + 2);
    const upcoming = state.matches.find((m) => {
      if (!m.date || m.preMatchCompletedAt) return false;
      const d = new Date(m.date + "T12:00:00");
      return d >= now && d <= in48h;
    });
    if (upcoming) {
      const matchDate = new Date(upcoming.date + "T12:00:00");
      const daysAway = Math.max(
        0,
        Math.round(
          (matchDate.getTime() - new Date(today + "T12:00:00").getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      return {
        kind: "prematch",
        matchId: upcoming.id,
        opponent: upcoming.opponent || "your next match",
        daysAway,
      };
    }

    // 2. Streak save — only shows after 4pm local so we don't nag in the morning
    if (hour >= 16) {
      const active = activeDatesSet(state);
      const alive = isStreakAlive(state);
      const streak = computeStreak(state);
      if (streak > 0 && alive && !active.has(today)) {
        return { kind: "streak", streak };
      }
    }

    // 3. Weekly review — Sunday from noon onwards, if this week's review
    //    hasn't been done yet
    if (now.getDay() === 0 && hour >= 12) {
      const thisWeek = currentWeekMondayISO();
      const done = state.weeklyReviews.some(
        (r) => r.weekStartDate === thisWeek
      );
      if (!done) return { kind: "review", weekStart: thisWeek };
    }

    return null;
  }, [state]);

  if (!reminder) return null;

  const key = dismissalKey(reminder);
  if (dismissed[key]) return null;

  const dismiss = () => {
    const next = { ...dismissed, [key]: new Date().toISOString() };
    writeDismissed(next);
    setDismissed(next);
  };

  if (reminder.kind === "streak") {
    return (
      <Banner
        to="/habits"
        color="amber"
        icon={<Flame size={18} />}
        title={`Don't break your ${reminder.streak}-day streak!`}
        desc="Do one thing today to keep your streak alive!"
        cta="Keep it alive"
        onDismiss={dismiss}
      />
    );
  }

  if (reminder.kind === "prematch") {
    const when =
      reminder.daysAway === 0
        ? "today"
        : reminder.daysAway === 1
        ? "tomorrow"
        : `in ${reminder.daysAway} days`;
    return (
      <Banner
        to="/matches"
        color="purple"
        icon={<Target size={18} />}
        title={`Match vs. ${reminder.opponent} ${when}`}
        desc="Lock in your focus and mental prep before you step on."
        cta="Pre-match prep"
        onDismiss={dismiss}
      />
    );
  }

  if (reminder.kind === "review") {
    return (
      <Banner
        to="/review"
        color="blue"
        icon={<Calendar size={18} />}
        title="Week in review"
        desc="It's Sunday — take 2 minutes to reflect on your wins."
        cta="Reflect"
        onDismiss={dismiss}
      />
    );
  }

  return null;
}

type BannerColor = "amber" | "purple" | "blue";

const COLORS: Record<
  BannerColor,
  { bg: string; border: string; icon: string; title: string; cta: string }
> = {
  amber: {
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    icon: "bg-amber-500",
    title: "text-amber-900",
    cta: "text-amber-700 hover:text-amber-900",
  },
  purple: {
    bg: "from-purple-50 to-brand-50",
    border: "border-purple-200",
    icon: "bg-purple-500",
    title: "text-purple-900",
    cta: "text-purple-700 hover:text-purple-900",
  },
  blue: {
    bg: "from-sky-50 to-blue-50",
    border: "border-sky-200",
    icon: "bg-sky-500",
    title: "text-sky-900",
    cta: "text-sky-700 hover:text-sky-900",
  },
};

function Banner({
  to,
  color,
  icon,
  title,
  desc,
  cta,
  onDismiss,
}: {
  to: string;
  color: BannerColor;
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  onDismiss: () => void;
}) {
  const c = COLORS[color];
  return (
    <div
      className={`card bg-gradient-to-br ${c.bg} ${c.border} relative pr-10`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${c.icon} text-white flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold leading-snug ${c.title}`}>{title}</div>
          <div className="text-xs text-slate-600 mt-0.5 leading-snug">
            {desc}
          </div>
          <Link
            to={to}
            className={`inline-flex items-center gap-1 mt-2 text-xs font-bold ${c.cta}`}
          >
            {cta} <ChevronRight size={12} />
          </Link>
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  );
}
