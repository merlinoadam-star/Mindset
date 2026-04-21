import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { isUnlocked } from "../lib/unlocks";
import {
  ArrowRight,
  X,
  Flame,
  Trophy,
  TrendingUp,
  Heart,
  Sparkles,
  Award,
  Calendar,
  Zap,
  Share2,
} from "lucide-react";
import { useStore } from "../lib/store";
import { computeLevel } from "../lib/gamification";
import { getBadge } from "../lib/gamification";
import { isoDate, addDays } from "../lib/progressAnalytics";
import { fireConfetti } from "../components/Confetti";
import { hapticLight, hapticSuccess } from "../lib/haptics";

/**
 * Highlight Reel — auto-generated animated recap of the athlete's
 * journey over a chosen time window. Spotify-Wrapped-style sequence
 * of card screens, tap to advance, ends with a shareable summary.
 *
 * Query param:
 *   ?window=30days | season | all   (default: 30days)
 */

type TimeWindow = "30days" | "season" | "all";

interface ReelStats {
  window: TimeWindow;
  startDate: string;
  endDate: string;
  daysLogged: number;
  totalDays: number;
  consistencyPct: number;
  xpGained: number;
  level: number;
  levelTitle: string;
  longestStreak: number;
  topMatches: Array<{ opponent: string; date: string; score?: string }>;
  matchWins: number;
  matchLosses: number;
  bestWeek: { start: string; xp: number; days: number } | null;
  avgMood: number | null;
  moodImprovement: number;
  badgesEarned: Array<{ id: string; name: string; emoji: string }>;
  topPhrase: { text: string; timesUsed: number } | null;
  habitsCompleted: number;
  sessionsDone: number;
}

const WINDOW_LABELS: Record<TimeWindow, string> = {
  "30days": "Last 30 Days",
  season: "This Season",
  all: "All Time",
};

export default function HighlightReelPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { state } = useStore();

  const windowParam = (params.get("window") as TimeWindow) || "30days";

  const stats = useMemo(
    () => computeReelStats(state, windowParam),
    [state, windowParam]
  );

  const cards = useMemo(() => buildCards(stats, state.profile?.name ?? ""), [stats, state.profile?.name]);

  const [idx, setIdx] = useState(0);

  const next = () => {
    if (idx < cards.length - 1) {
      hapticLight();
      setIdx((i) => i + 1);
    }
  };
  const back = () => {
    if (idx > 0) {
      hapticLight();
      setIdx((i) => i - 1);
    }
  };

  // Confetti on final card
  useEffect(() => {
    if (idx === cards.length - 1) {
      fireConfetti(120);
      hapticSuccess();
    }
  }, [idx, cards.length]);

  if (!state.profile) {
    navigate("/");
    return null;
  }

  // Level gate — Highlight Reel is earned at Lvl 4.
  if (!isUnlocked("tool.highlight-reel", computeLevel(state.xp, state.profile.sport).level)) {
    return <Navigate to="/" replace />;
  }

  const card = cards[idx];

  return (
    <div
      className={`fixed inset-0 z-[75] bg-gradient-to-b ${card.gradient} text-white overflow-hidden flex flex-col`}
      onClick={next}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex-1 mx-3 flex items-center gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  i < idx ? "w-full" : i === idx ? "w-full" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 tabular-nums">
          {idx + 1}/{cards.length}
        </div>
      </div>

      {/* Card content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-24 animate-pop-in" key={idx}>
        {card.render()}
      </div>

      {/* Bottom hint */}
      <div
        className="absolute bottom-0 left-0 right-0 pb-6 px-6 flex items-center justify-between text-white/50 text-xs font-semibold"
        onClick={(e) => e.stopPropagation()}
      >
        {idx > 0 ? (
          <button onClick={back} className="px-3 py-1.5">
            ← Back
          </button>
        ) : (
          <span />
        )}
        {idx < cards.length - 1 ? (
          <button onClick={next} className="px-3 py-1.5 inline-flex items-center gap-1">
            Tap to continue <ArrowRight size={12} />
          </button>
        ) : (
          <button
            onClick={() => handleShare(stats, state.profile?.name ?? "")}
            className="px-4 py-2 rounded-xl bg-white text-slate-900 font-extrabold text-sm inline-flex items-center gap-1.5"
          >
            <Share2 size={14} /> Share my reel
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Stats computation
// =============================================================================

function computeReelStats(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  window: TimeWindow
): ReelStats {
  const today = new Date();
  const endDate = isoDate(today);
  let startDate: string;
  let totalDays: number;

  if (window === "30days") {
    startDate = isoDate(addDays(today, -29));
    totalDays = 30;
  } else if (window === "season") {
    startDate = isoDate(addDays(today, -119));
    totalDays = 120;
  } else {
    // all time — use earliest data
    const all: string[] = [];
    for (const r of state.habitCompletions ?? []) if (r.date) all.push(r.date);
    for (const r of state.practices ?? []) if (r.date) all.push(r.date);
    for (const r of state.checkins ?? []) if (r.date) all.push(r.date);
    for (const r of state.matches ?? []) if (r.date) all.push(r.date);
    all.sort();
    startDate = all[0] ?? isoDate(addDays(today, -29));
    totalDays =
      Math.max(
        1,
        Math.floor(
          (today.getTime() - new Date(startDate + "T00:00:00").getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );
  }

  const inRange = (d: string | null | undefined): boolean =>
    !!d && d >= startDate && d <= endDate;

  // Sum XP
  const sumXp = (arr: Array<{ date?: string; xpEarned?: number }>): number =>
    arr.filter((r) => inRange(r.date)).reduce((s, r) => s + (r.xpEarned ?? 0), 0);

  const habitXp = (state.habitCompletions ?? []).filter(
    (r: { date: string }) => inRange(r.date)
  ).length * 5;

  const xpGained =
    habitXp +
    sumXp(state.practices ?? []) +
    sumXp(state.checkins ?? []) +
    sumXp(state.matches ?? []) +
    sumXp(state.mentalSessions ?? []) +
    sumXp(state.recoveryCheckins ?? []) +
    sumXp(state.nutritionLogs ?? []) +
    sumXp(state.weeklyReviews ?? []);

  // Active days in range
  const activeDaysSet = new Set<string>();
  const addIf = (arr: Array<{ date?: string }>) => {
    for (const r of arr) if (inRange(r.date)) activeDaysSet.add(r.date!);
  };
  addIf(state.habitCompletions ?? []);
  addIf(state.practices ?? []);
  addIf(state.checkins ?? []);
  addIf(state.matches ?? []);
  addIf(state.mentalSessions ?? []);
  addIf(state.recoveryCheckins ?? []);

  const daysLogged = activeDaysSet.size;
  const consistencyPct = Math.round((daysLogged / totalDays) * 100);

  // Longest streak within window
  let longestStreak = 0;
  let current = 0;
  const sortedDays = [...activeDaysSet].sort();
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) current = 1;
    else {
      const prev = new Date(sortedDays[i - 1] + "T12:00:00");
      const cur = new Date(sortedDays[i] + "T12:00:00");
      const diff = Math.round(
        (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      current = diff === 1 ? current + 1 : 1;
    }
    if (current > longestStreak) longestStreak = current;
  }

  // Level
  const levelInfo = state.profile
    ? computeLevel(state.xp ?? 0, state.profile.sport)
    : { level: 1, title: "" };

  // Top matches — wins in range
  const winMatches = (state.matches ?? [])
    .filter(
      (m: { result?: string; date?: string }) =>
        m.result === "win" && inRange(m.date)
    )
    .sort((a: { date: string }, b: { date: string }) =>
      b.date.localeCompare(a.date)
    )
    .slice(0, 3)
    .map(
      (m: {
        opponent?: string;
        date: string;
        wrestling?: { myScore?: number; theirScore?: number };
        volleyball?: { setScores?: Array<{ us: number; them: number }> };
      }) => ({
        opponent: m.opponent ?? "Opponent",
        date: m.date,
        score: formatMatchScore(m),
      })
    );

  const matchesInRange = (state.matches ?? []).filter((m: { date?: string }) =>
    inRange(m.date)
  );
  const matchWins = matchesInRange.filter(
    (m: { result?: string }) => m.result === "win"
  ).length;
  const matchLosses = matchesInRange.filter(
    (m: { result?: string }) => m.result === "loss"
  ).length;

  // Best week — scan week-by-week starting from startDate
  let bestWeek: { start: string; xp: number; days: number } | null = null;
  const wkStart = new Date(startDate + "T12:00:00");
  while (isoDate(wkStart) <= endDate) {
    const wkEnd = addDays(wkStart, 6);
    const wkEndIso = isoDate(wkEnd);
    const weekMatches = (arr: Array<{ date?: string; xpEarned?: number }>) =>
      arr.filter((r) => r.date && r.date >= isoDate(wkStart) && r.date <= wkEndIso);

    const wkHabitXp =
      weekMatches(state.habitCompletions ?? []).length * 5;
    const wkXp =
      wkHabitXp +
      weekMatches(state.practices ?? []).reduce(
        (s, r) => s + (r.xpEarned ?? 0),
        0
      ) +
      weekMatches(state.checkins ?? []).reduce(
        (s, r) => s + (r.xpEarned ?? 0),
        0
      ) +
      weekMatches(state.matches ?? []).reduce(
        (s, r) => s + (r.xpEarned ?? 0),
        0
      );

    const wkDaySet = new Set<string>();
    for (const arr of [
      state.habitCompletions ?? [],
      state.practices ?? [],
      state.checkins ?? [],
      state.matches ?? [],
    ]) {
      for (const r of arr as Array<{ date?: string }>) {
        if (r.date && r.date >= isoDate(wkStart) && r.date <= wkEndIso)
          wkDaySet.add(r.date);
      }
    }

    if (!bestWeek || wkXp > bestWeek.xp) {
      if (wkXp > 0) {
        bestWeek = {
          start: isoDate(wkStart),
          xp: wkXp,
          days: wkDaySet.size,
        };
      }
    }

    wkStart.setDate(wkStart.getDate() + 7);
  }

  // Mood — avg + improvement (first third vs last third)
  const moodsInRange = (state.checkins ?? [])
    .filter((c: { date?: string; mood?: number }) => inRange(c.date) && c.mood)
    .sort((a: { date: string }, b: { date: string }) =>
      a.date.localeCompare(b.date)
    );
  const avgMood =
    moodsInRange.length > 0
      ? moodsInRange.reduce(
          (s: number, c: { mood: number }) => s + c.mood,
          0
        ) / moodsInRange.length
      : null;

  let moodImprovement = 0;
  if (moodsInRange.length >= 4) {
    const third = Math.floor(moodsInRange.length / 3);
    const first = moodsInRange.slice(0, third);
    const last = moodsInRange.slice(-third);
    const avgFirst =
      first.reduce((s: number, c: { mood: number }) => s + c.mood, 0) /
      first.length;
    const avgLast =
      last.reduce((s: number, c: { mood: number }) => s + c.mood, 0) /
      last.length;
    moodImprovement = Math.round((avgLast - avgFirst) * 10) / 10;
  }

  // Badges earned in range
  const badgesEarned = (state.unlockedBadges ?? [])
    .filter((b: { unlockedAt?: string }) => {
      if (!b.unlockedAt) return false;
      const date = b.unlockedAt.slice(0, 10);
      return date >= startDate && date <= endDate;
    })
    .map((b: { id: string }) => {
      const def = getBadge(b.id);
      return def
        ? { id: b.id, name: def.name, emoji: def.emoji }
        : { id: b.id, name: b.id, emoji: "🏅" };
    });

  // Top power phrase
  const topPhraseSrc = [...(state.powerPhrases ?? [])]
    .filter((p: { timesUsed?: number }) => (p.timesUsed ?? 0) > 0)
    .sort(
      (a: { timesUsed?: number }, b: { timesUsed?: number }) =>
        (b.timesUsed ?? 0) - (a.timesUsed ?? 0)
    )[0];
  const topPhrase = topPhraseSrc
    ? {
        text: topPhraseSrc.text,
        timesUsed: topPhraseSrc.timesUsed ?? 0,
      }
    : null;

  const habitsCompleted = (state.habitCompletions ?? []).filter(
    (r: { date?: string }) => inRange(r.date)
  ).length;
  const sessionsDone = (state.mentalSessions ?? []).filter(
    (r: { date?: string }) => inRange(r.date)
  ).length;

  return {
    window,
    startDate,
    endDate,
    daysLogged,
    totalDays,
    consistencyPct,
    xpGained,
    level: levelInfo.level,
    levelTitle: levelInfo.title ?? "",
    longestStreak,
    topMatches: winMatches,
    matchWins,
    matchLosses,
    bestWeek,
    avgMood,
    moodImprovement,
    badgesEarned,
    topPhrase,
    habitsCompleted,
    sessionsDone,
  };
}

function formatMatchScore(m: {
  wrestling?: { myScore?: number; theirScore?: number };
  volleyball?: { setScores?: Array<{ us: number; them: number }> };
}): string | undefined {
  if (m.wrestling?.myScore !== undefined && m.wrestling?.theirScore !== undefined) {
    return `${m.wrestling.myScore}-${m.wrestling.theirScore}`;
  }
  if (m.volleyball?.setScores && m.volleyball.setScores.length > 0) {
    return m.volleyball.setScores
      .map((s) => `${s.us}-${s.them}`)
      .join(", ");
  }
  return undefined;
}

// =============================================================================
// Cards
// =============================================================================

interface Card {
  gradient: string;
  render: () => React.ReactNode;
}

function buildCards(stats: ReelStats, name: string): Card[] {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const cards: Card[] = [];

  // Intro
  cards.push({
    gradient: "from-slate-950 via-brand-900 to-purple-900",
    render: () => (
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] font-bold text-white/60 mb-3">
          Fearless Reel
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight leading-[1.05]">
          Hey {first || "there"}.
        </h1>
        <h2 className="text-4xl font-extrabold tracking-tight leading-tight mt-4 text-white/90">
          Let's look back.
        </h2>
        <p className="text-white/60 text-sm mt-8">
          {WINDOW_LABELS[stats.window]}
        </p>
      </div>
    ),
  });

  // Days logged
  cards.push({
    gradient: "from-emerald-900 via-teal-800 to-sky-900",
    render: () => (
      <div className="text-center">
        <Calendar size={36} className="mx-auto text-white/70 mb-3" />
        <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
          You showed up
        </div>
        <div className="text-[7rem] font-extrabold leading-none tabular-nums my-2">
          {stats.daysLogged}
        </div>
        <div className="text-lg font-bold">
          days{" "}
          <span className="text-white/60 text-base font-medium">
            out of {stats.totalDays}
          </span>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-sm font-bold">
          {stats.consistencyPct}% consistent
        </div>
      </div>
    ),
  });

  // Level
  if (stats.level > 0) {
    cards.push({
      gradient: "from-brand-900 via-purple-900 to-fuchsia-900",
      render: () => (
        <div className="text-center">
          <TrendingUp size={36} className="mx-auto text-white/70 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            You leveled up to
          </div>
          <div className="text-[7rem] font-extrabold leading-none tabular-nums my-2">
            {stats.level}
          </div>
          {stats.levelTitle && (
            <div className="text-2xl font-extrabold tracking-tight">
              {stats.levelTitle}
            </div>
          )}
          <p className="text-white/60 text-sm mt-4">
            Every rep, every check-in got you here.
          </p>
        </div>
      ),
    });
  }

  // XP
  if (stats.xpGained > 0) {
    cards.push({
      gradient: "from-amber-900 via-orange-900 to-red-900",
      render: () => (
        <div className="text-center">
          <Zap size={36} className="mx-auto text-white/70 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            You earned
          </div>
          <div className="text-[6rem] font-extrabold leading-none tabular-nums my-2">
            +{stats.xpGained.toLocaleString()}
          </div>
          <div className="text-2xl font-extrabold">XP</div>
          <p className="text-white/60 text-sm mt-6 max-w-xs mx-auto">
            That's{" "}
            <span className="text-white font-bold">
              {Math.round(stats.xpGained / Math.max(1, stats.daysLogged))}
            </span>{" "}
            XP per active day.
          </p>
        </div>
      ),
    });
  }

  // Longest streak
  if (stats.longestStreak >= 3) {
    cards.push({
      gradient: "from-orange-900 via-amber-800 to-yellow-900",
      render: () => (
        <div className="text-center">
          <Flame size={42} className="mx-auto text-orange-300 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            Longest streak
          </div>
          <div className="text-[7rem] font-extrabold leading-none tabular-nums my-2">
            {stats.longestStreak}
          </div>
          <div className="text-2xl font-extrabold">days in a row 🔥</div>
          <p className="text-white/60 text-sm mt-6">
            Consistency is your superpower.
          </p>
        </div>
      ),
    });
  }

  // Habits
  if (stats.habitsCompleted >= 10) {
    cards.push({
      gradient: "from-sky-900 via-blue-900 to-indigo-900",
      render: () => (
        <div className="text-center">
          <Sparkles size={36} className="mx-auto text-white/70 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            Habits checked off
          </div>
          <div className="text-[7rem] font-extrabold leading-none tabular-nums my-2">
            {stats.habitsCompleted}
          </div>
          <p className="text-white/60 text-sm mt-4 max-w-xs mx-auto">
            Small wins every day. That's how it gets built.
          </p>
        </div>
      ),
    });
  }

  // Top matches
  if (stats.topMatches.length > 0) {
    cards.push({
      gradient: "from-red-900 via-rose-900 to-slate-900",
      render: () => (
        <div className="text-center w-full max-w-sm">
          <Trophy size={36} className="mx-auto text-amber-300 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            {stats.topMatches.length === 1 ? "Your win" : `Top ${stats.topMatches.length} wins`}
          </div>
          <div className="text-2xl font-extrabold tracking-tight mt-2 mb-6">
            {stats.matchWins}-{stats.matchLosses} record
          </div>
          <div className="space-y-2 text-left">
            {stats.topMatches.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/10 border border-white/20 p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-extrabold flex-shrink-0">
                  W
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">vs. {m.opponent}</div>
                  <div className="text-[11px] text-white/60 truncate">
                    {formatFriendlyDate(m.date)}
                    {m.score && ` · ${m.score}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Best week
  if (stats.bestWeek && stats.bestWeek.xp > 0) {
    cards.push({
      gradient: "from-purple-900 via-brand-900 to-indigo-900",
      render: () => (
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            Best week
          </div>
          <div className="text-2xl font-extrabold mt-2">
            Week of {formatFriendlyDate(stats.bestWeek!.start)}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <div className="text-xs uppercase tracking-wider text-white/60 font-bold">
                XP
              </div>
              <div className="text-4xl font-extrabold tabular-nums mt-1">
                {stats.bestWeek!.xp}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
              <div className="text-xs uppercase tracking-wider text-white/60 font-bold">
                Active
              </div>
              <div className="text-4xl font-extrabold tabular-nums mt-1">
                {stats.bestWeek!.days}/7
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-6">You were unstoppable.</p>
        </div>
      ),
    });
  }

  // Mood
  if (stats.avgMood !== null) {
    cards.push({
      gradient: "from-pink-900 via-rose-900 to-purple-900",
      render: () => (
        <div className="text-center">
          <Heart size={36} className="mx-auto text-pink-300 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            Average mood
          </div>
          <div className="text-[7rem] font-extrabold leading-none tabular-nums my-2">
            {stats.avgMood!.toFixed(1)}
            <span className="text-white/40 text-4xl">/5</span>
          </div>
          {stats.moodImprovement > 0.3 && (
            <div className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 text-sm font-bold">
              ↑ +{stats.moodImprovement} from earlier
            </div>
          )}
          {stats.moodImprovement <= 0.3 && stats.moodImprovement >= -0.3 && (
            <p className="text-white/60 text-sm mt-4">Steady as it comes.</p>
          )}
        </div>
      ),
    });
  }

  // Badges
  if (stats.badgesEarned.length > 0) {
    cards.push({
      gradient: "from-yellow-900 via-amber-900 to-orange-900",
      render: () => (
        <div className="text-center w-full max-w-sm">
          <Award size={36} className="mx-auto text-amber-300 mb-3" />
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-1">
            Badges unlocked
          </div>
          <div className="text-2xl font-extrabold my-2">
            {stats.badgesEarned.length} new badge
            {stats.badgesEarned.length === 1 ? "" : "s"}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {stats.badgesEarned.slice(0, 8).map((b) => (
              <div
                key={b.id}
                className="rounded-xl bg-white/10 border border-white/20 p-2 flex flex-col items-center w-20"
              >
                <div className="text-3xl leading-none">{b.emoji}</div>
                <div className="text-[10px] font-bold text-white/80 mt-1 text-center leading-tight">
                  {b.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  // Top phrase
  if (stats.topPhrase) {
    const phrase = stats.topPhrase;
    cards.push({
      gradient: "from-brand-900 via-purple-900 to-fuchsia-800",
      render: () => (
        <div className="text-center max-w-md">
          <div className="text-4xl mb-3">💬</div>
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-white/70 mb-2">
            Your go-to mantra
          </div>
          <div className="text-3xl font-extrabold tracking-tight leading-tight mt-6 italic">
            "{phrase.text}"
          </div>
          <p className="text-white/60 text-sm mt-6">
            Used {phrase.timesUsed}× when it mattered.
          </p>
        </div>
      ),
    });
  }

  // Finale
  cards.push({
    gradient: "from-orange-600 via-red-700 to-purple-900",
    render: () => (
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4 animate-pulse-soft">🚀</div>
        <div className="text-xs uppercase tracking-[0.25em] font-bold text-white/70 mb-2">
          {first ? `${first}'s Reel` : "Your Reel"}
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight leading-[1.05] mb-6">
          That's the grind.
        </h1>
        <div className="rounded-3xl bg-white/10 border border-white/20 p-5 text-left">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Active days" value={String(stats.daysLogged)} />
            <Stat label="XP earned" value={`+${stats.xpGained.toLocaleString()}`} />
            <Stat
              label="Longest streak"
              value={`${stats.longestStreak}d`}
            />
            <Stat
              label="Match record"
              value={`${stats.matchWins}-${stats.matchLosses}`}
            />
          </div>
        </div>
        <p className="text-white/70 text-sm mt-6 leading-relaxed">
          Now go write the next chapter.
        </p>
      </div>
    ),
  });

  return cards;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-white/60">
        {label}
      </div>
      <div className="text-xl font-extrabold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function formatFriendlyDate(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// =============================================================================
// Share
// =============================================================================

async function handleShare(stats: ReelStats, name: string): Promise<void> {
  const summary = `My Fearless Reel: ${stats.daysLogged} active days · +${stats.xpGained} XP · ${stats.longestStreak}d streak · ${stats.matchWins}-${stats.matchLosses} record. Lvl ${stats.level}${stats.levelTitle ? ` ${stats.levelTitle}` : ""}.`;
  const title = name ? `${name}'s Fearless Reel` : "My Fearless Reel";

  type Nav = Navigator & {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
  };
  const nav = navigator as Nav;
  if (typeof nav.share === "function") {
    try {
      await nav.share({ title, text: summary, url: window.location.origin });
      hapticSuccess();
      return;
    } catch {
      /* user cancelled — fall through to clipboard */
    }
  }
  try {
    await navigator.clipboard.writeText(summary);
    hapticSuccess();
    alert("Copied to clipboard!");
  } catch {
    alert(summary);
  }
}
