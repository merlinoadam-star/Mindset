import type { PlaybookContext } from "./parentPlaybookContext";

/**
 * Parent Playbook — rules engine.
 *
 * Turns a PlaybookContext into a prioritized list of today's actions.
 * Each rule is a pure function that looks at the context and returns
 * zero-or-more PlaybookAction objects. Rules should be tone-safe and
 * never recommend that a parent "fix" anything — only celebrate,
 * support, or check in gently.
 *
 * Priority order:
 *   1. Time-sensitive (match today/tomorrow)
 *   2. Concerning patterns (low-mood streak, radio-silence)
 *   3. Celebrate-now events (PR, badge, win, recovery)
 *   4. Milestone events (streak thresholds)
 *
 * Action ids are deterministic and include a date key, so the same
 * event doesn't regenerate action cards a parent already dismissed.
 */

export type PlaybookTone = "celebrate" | "support" | "checkin";

export interface PlaybookCta {
  type: "cheer" | "ack" | "navigate";
  /** Button label shown in the UI. */
  label: string;
  /** For `cheer`: the exact text that will be sent via postFeedback. */
  cheerText?: string;
  /** For `navigate`: route to send the parent to. */
  to?: string;
}

export interface PlaybookAction {
  id: string;
  athleteId: string;
  athleteName: string;
  tone: PlaybookTone;
  emoji: string;
  title: string;
  subtitle?: string;
  cta: PlaybookCta;
  /** Higher = shows first in the list. */
  priority: number;
}

// Top-of-range priorities are time-sensitive; bottom are evergreen.
const P_MATCH = 90;
const P_LOW_MOOD = 80;
const P_RADIO_SILENCE = 75;
const P_LOSS_RECOVERY = 70;
const P_NEW_PR = 65;
const P_WIN = 60;
const P_BADGE = 55;
const P_STREAK_MILESTONE = 50;
const P_LOSS_SOFT = 45;

const STREAK_MILESTONES = [3, 5, 7, 14, 21, 30, 60, 100];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
}

function formatPrValue(value: number, unit: string): string {
  if (unit === "sec" && value >= 60) {
    const m = Math.floor(value / 60);
    const s = Math.round(value - m * 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${unit}`;
}

/** Current active streak — consecutive days including today or yesterday. */
function currentStreak(habitDates: string[]): number {
  if (habitDates.length === 0) return 0;
  const set = new Set(habitDates);
  const today = todayISO();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  // Streak is alive if activity today OR yesterday; start from that day.
  let anchor: string;
  if (set.has(today)) anchor = today;
  else if (set.has(yesterday)) anchor = yesterday;
  else return 0;

  let count = 0;
  const d = new Date(anchor + "T00:00:00");
  while (true) {
    const iso = d.toISOString().slice(0, 10);
    if (!set.has(iso)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Individual rules
// ---------------------------------------------------------------------------

function ruleUpcomingMatch(ctx: PlaybookContext): PlaybookAction[] {
  const today = todayISO();
  const tomorrow = tomorrowISO();
  // Look ahead only — the match list is sorted desc so we search it.
  const upcoming = ctx.matches.filter(
    (m) => m.date === today || m.date === tomorrow
  );
  return upcoming.map((m) => {
    const when = m.date === today ? "today" : "tomorrow";
    const opponentText = m.opponent ? ` vs ${m.opponent}` : "";
    return {
      id: `match-${m.id}-${today}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "support",
      emoji: "⚔️",
      title: `${ctx.firstName} has a match ${when}${opponentText}`,
      subtitle:
        when === "today"
          ? "One sentence of encouragement goes a long way. Keep it simple."
          : "Send something tonight so it lands before warm-ups tomorrow.",
      cta: {
        type: "cheer",
        label: "Send 💪 — You've got this",
        cheerText: "You've got this — proud of you no matter what.",
      },
      priority: when === "today" ? P_MATCH : P_MATCH - 5,
    };
  });
}

function ruleLowMoodStreak(ctx: PlaybookContext): PlaybookAction[] {
  if (ctx.recentMoods.length < 3) return [];
  // Look at the most recent 5 check-ins; if 3+ are ≤ 2 (the low end),
  // nudge a gentle conversation. "≤2" on the 1-5 scale signals rough.
  const recent = ctx.recentMoods.slice(0, 5);
  const lows = recent.filter(
    (m) => typeof m.mood === "number" && m.mood <= 2
  ).length;
  if (lows < 3) return [];
  return [
    {
      id: `low-mood-${todayISO()}-${ctx.athleteId}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "checkin",
      emoji: "💗",
      title: `${ctx.firstName} has had a rough stretch`,
      subtitle:
        "Her last few check-ins were low. Ask how she's doing — listen more than fix.",
      cta: {
        type: "ack",
        label: "Got it",
      },
      priority: P_LOW_MOOD,
    },
  ];
}

function ruleRadioSilence(ctx: PlaybookContext): PlaybookAction[] {
  if (ctx.habitDates.length === 0 && ctx.recentMoods.length === 0) {
    // Brand new athlete, no history yet — skip.
    return [];
  }
  const sortedDates = [...ctx.habitDates, ...ctx.recentMoods.map((m) => m.date)].sort();
  const latest = sortedDates[sortedDates.length - 1];
  if (!latest) return [];
  const gap = daysBetween(latest, todayISO());
  if (gap < 3 || gap > 21) return []; // 3-21 days — suggests drift, not dropped
  return [
    {
      id: `silence-${todayISO()}-${ctx.athleteId}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "checkin",
      emoji: "🌱",
      title: `${ctx.firstName} hasn't logged in a few days`,
      subtitle:
        "No pressure check-in tonight — ask about something outside of sports.",
      cta: {
        type: "ack",
        label: "Got it",
      },
      priority: P_RADIO_SILENCE,
    },
  ];
}

function ruleLossRecoveryCompleted(ctx: PlaybookContext): PlaybookAction[] {
  const out: PlaybookAction[] = [];
  for (const m of ctx.matches) {
    if (!m.loss_recovery_completed_at) continue;
    const completedDate = m.loss_recovery_completed_at.slice(0, 10);
    const gap = daysBetween(completedDate, todayISO());
    if (gap > 2) continue;
    out.push({
      id: `recovery-${m.id}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "celebrate",
      emoji: "💜",
      title: `${ctx.firstName} worked through a tough match`,
      subtitle:
        "Processing a loss takes real courage. Not 'it's okay' — acknowledge the work.",
      cta: {
        type: "cheer",
        label: "Send 💜 — Proud of you",
        cheerText: "Proud of you for facing that head-on.",
      },
      priority: P_LOSS_RECOVERY,
    });
  }
  return out;
}

function ruleNewPR(ctx: PlaybookContext): PlaybookAction[] {
  // Show the most recent PR only — piling up multiple PR cards gets noisy.
  const pr = ctx.recentPRs[0];
  if (!pr) return [];
  const gap = daysBetween(pr.achieved_on, todayISO());
  if (gap > 3) return []; // only fresh
  return [
    {
      id: `pr-${pr.id}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "celebrate",
      emoji: "🎯",
      title: `${ctx.firstName} hit a new PR`,
      subtitle: `${pr.category_label}: ${formatPrValue(pr.value, pr.unit)}`,
      cta: {
        type: "cheer",
        label: "Send 🔥 — Let's go!",
        cheerText: `Huge! ${pr.category_label} — that's real work paying off.`,
      },
      priority: P_NEW_PR,
    },
  ];
}

function ruleRecentWin(ctx: PlaybookContext): PlaybookAction[] {
  const win = ctx.matches.find((m) => m.result === "win");
  if (!win) return [];
  const gap = daysBetween(win.date, todayISO());
  if (gap > 2) return [];
  return [
    {
      id: `win-${win.id}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "celebrate",
      emoji: "🏆",
      title: `${ctx.firstName} won${win.opponent ? ` vs ${win.opponent}` : ""}`,
      subtitle:
        "Celebrate the effort, not just the outcome — what did you see her do well?",
      cta: {
        type: "cheer",
        label: "Send 🏆 — Huge!",
        cheerText: "So proud of how you showed up today. Huge win.",
      },
      priority: P_WIN,
    },
  ];
}

function ruleRecentLossNoRecovery(ctx: PlaybookContext): PlaybookAction[] {
  const loss = ctx.matches.find(
    (m) => m.result === "loss" && !m.loss_recovery_completed_at
  );
  if (!loss) return [];
  const gap = daysBetween(loss.date, todayISO());
  if (gap > 2) return [];
  return [
    {
      id: `loss-${loss.id}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "checkin",
      emoji: "🤍",
      title: `${ctx.firstName} had a tough match`,
      subtitle:
        "Tonight: no analysis, no fixing. Tomorrow's fine for that. Just be there.",
      cta: {
        type: "ack",
        label: "Got it",
      },
      priority: P_LOSS_SOFT,
    },
  ];
}

function ruleRecentBadge(ctx: PlaybookContext): PlaybookAction[] {
  const badge = ctx.recentBadges[0];
  if (!badge) return [];
  const gap = daysBetween(badge.unlocked_at.slice(0, 10), todayISO());
  if (gap > 7) return [];
  return [
    {
      id: `badge-${badge.id}-${badge.unlocked_at.slice(0, 10)}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "celebrate",
      emoji: "🏅",
      title: `${ctx.firstName} unlocked a new badge`,
      subtitle: "Small things add up. Notice it.",
      cta: {
        type: "cheer",
        label: "Send 🎉 — Seeing it!",
        cheerText: "Caught you unlocking a new badge — that dedication shows.",
      },
      priority: P_BADGE,
    },
  ];
}

function ruleStreakMilestone(ctx: PlaybookContext): PlaybookAction[] {
  const streak = currentStreak(ctx.habitDates);
  if (streak === 0) return [];
  // Only surface on the exact day they cross a milestone. Milestones
  // are tied to a date key so a parent who dismissed yesterday's
  // "3-day" card doesn't see it again the next day.
  const matchingMilestone = STREAK_MILESTONES.find((m) => m === streak);
  if (!matchingMilestone) return [];
  return [
    {
      id: `streak-${matchingMilestone}-${ctx.athleteId}-${todayISO()}`,
      athleteId: ctx.athleteId,
      athleteName: ctx.athleteName,
      tone: "celebrate",
      emoji: "🔥",
      title: `${ctx.firstName} hit a ${matchingMilestone}-day streak`,
      subtitle: "Consistency is a muscle. Name it.",
      cta: {
        type: "cheer",
        label: `Send 🔥 — ${matchingMilestone} days strong`,
        cheerText: `${matchingMilestone} days in a row — that's the kind of consistency that builds everything else.`,
      },
      priority: P_STREAK_MILESTONE,
    },
  ];
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const ALL_RULES: Array<(ctx: PlaybookContext) => PlaybookAction[]> = [
  ruleUpcomingMatch,
  ruleLowMoodStreak,
  ruleRadioSilence,
  ruleLossRecoveryCompleted,
  ruleNewPR,
  ruleRecentWin,
  ruleRecentLossNoRecovery,
  ruleRecentBadge,
  ruleStreakMilestone,
];

export function buildPlaybook(ctx: PlaybookContext): PlaybookAction[] {
  const all: PlaybookAction[] = [];
  for (const rule of ALL_RULES) {
    try {
      all.push(...rule(ctx));
    } catch (e) {
      // A bad rule shouldn't blow up the whole card. Log and move on.
      console.warn("Parent playbook rule failed", e);
    }
  }
  all.sort((a, b) => b.priority - a.priority);
  return all;
}
