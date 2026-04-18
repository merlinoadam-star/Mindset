import type {
  AppState,
  AwardEntry,
  MatchEntry,
  PersonalRecordAttempt,
  TournamentEntry,
  UnlockedBadge,
  VideoEntry,
} from "../types";
import { BADGES, getBadge } from "./gamification";

/**
 * Derives a chronological list of season events from the local AppState.
 * Pure function — no new storage, no new tables. Surfaces only meaningful
 * milestones (matches, new PRs, badges, tournaments, awards, loss-recovery
 * completions, coach/self video uploads) and skips daily noise like every
 * habit completion or every mood check-in.
 */

export type TimelineEventType =
  | "match"
  | "loss-recovery"
  | "pr"
  | "badge"
  | "tournament"
  | "award"
  | "video";

export interface TimelineEvent {
  id: string;
  /** ISO string suitable for sort; date-only OK if that's all we have. */
  when: string;
  /** Date used for display (YYYY-MM-DD). */
  date: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  emoji: string;
  /** Tailwind color keyword for the accent ring / icon tint. */
  accent:
    | "amber"
    | "indigo"
    | "emerald"
    | "rose"
    | "slate"
    | "purple"
    | "sky"
    | "brand";
  /** Route to navigate to when tapped. */
  linkTo?: string;
}

// ---------------------------------------------------------------------------
// Per-source derivation
// ---------------------------------------------------------------------------

function matchToEvents(m: MatchEntry): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const baseDate = m.date; // YYYY-MM-DD

  const resultLabel =
    m.result === "win"
      ? "Win"
      : m.result === "loss"
      ? "Loss"
      : m.result === "tie"
      ? "Tie"
      : "Logged";
  const resultEmoji =
    m.result === "win"
      ? "🏆"
      : m.result === "loss"
      ? "💪"
      : m.result === "tie"
      ? "🤝"
      : "📋";
  const accent =
    m.result === "win"
      ? "emerald"
      : m.result === "loss"
      ? "rose"
      : m.result === "tie"
      ? "amber"
      : "slate";

  events.push({
    id: `match-${m.id}`,
    when: m.createdAt || baseDate,
    date: baseDate,
    type: "match",
    title: `${resultLabel}${m.opponent ? ` vs ${m.opponent}` : ""}`,
    subtitle: m.event || undefined,
    emoji: resultEmoji,
    accent,
    linkTo: `/matches?open=${m.id}`,
  });

  if (m.lossRecoveryCompletedAt) {
    events.push({
      id: `loss-recovery-${m.id}`,
      when: m.lossRecoveryCompletedAt,
      date: m.lossRecoveryCompletedAt.slice(0, 10),
      type: "loss-recovery",
      title: "Worked through a tough match",
      subtitle: m.lossRecoveryCarry || m.lossRecoveryLesson || undefined,
      emoji: "💜",
      accent: "indigo",
      linkTo: `/matches?open=${m.id}`,
    });
  }

  return events;
}

/**
 * A personal-record attempt is timeline-worthy only if it set a NEW best
 * at the time it was logged (first attempt in a category, or strictly
 * better than any prior attempt for the same category respecting
 * direction). This keeps the timeline about growth moments, not every log.
 */
function personalRecordsToEvents(
  attempts: PersonalRecordAttempt[]
): TimelineEvent[] {
  if (attempts.length === 0) return [];
  const byCategory = new Map<string, PersonalRecordAttempt[]>();
  for (const a of attempts) {
    if (!byCategory.has(a.categoryKey)) byCategory.set(a.categoryKey, []);
    byCategory.get(a.categoryKey)!.push(a);
  }

  const events: TimelineEvent[] = [];
  for (const [, list] of byCategory) {
    const sorted = [...list].sort((a, b) =>
      a.achievedOn.localeCompare(b.achievedOn)
    );
    let bestSoFar: number | null = null;
    for (const a of sorted) {
      const beats =
        bestSoFar === null ||
        (a.direction === "higher" ? a.value > bestSoFar : a.value < bestSoFar);
      if (!beats) continue;
      bestSoFar = a.value;
      events.push({
        id: `pr-${a.id}`,
        when: a.createdAt || a.achievedOn,
        date: a.achievedOn,
        type: "pr",
        title: `New PR — ${a.categoryLabel}`,
        subtitle: formatPrValue(a),
        emoji: "🎯",
        accent: "amber",
        linkTo: "/records",
      });
    }
  }
  return events;
}

function formatPrValue(a: PersonalRecordAttempt): string {
  if (a.unit === "sec" && a.value >= 60) {
    const minutes = Math.floor(a.value / 60);
    const seconds = Math.round(a.value - minutes * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  const rounded = Number.isInteger(a.value)
    ? a.value.toString()
    : a.value.toFixed(1);
  return `${rounded} ${a.unit}`;
}

function badgesToEvents(unlocked: UnlockedBadge[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const u of unlocked) {
    const def = getBadge(u.id) ?? BADGES.find((b) => b.id === u.id);
    if (!def) continue;
    events.push({
      id: `badge-${u.id}`,
      when: u.unlockedAt,
      date: u.unlockedAt.slice(0, 10),
      type: "badge",
      title: `Badge: ${def.name}`,
      subtitle: def.description,
      emoji: def.emoji ?? "🏅",
      accent: "purple",
      linkTo: "/badges",
    });
  }
  return events;
}

function tournamentToEvent(t: TournamentEntry): TimelineEvent | null {
  // Tournaments without a specific date fall back to Jan 1 of the year —
  // still useful on a yearly view but flagged subtly in the subtitle.
  const date = t.date ?? `${t.year}-01-01`;
  const approx = !t.date;
  return {
    id: `tournament-${t.id}`,
    when: date,
    date,
    type: "tournament",
    title: `${t.name}${t.result ? ` — ${t.result}` : ""}`,
    subtitle: approx ? `${t.year} (date not set)` : undefined,
    emoji: "🏟️",
    accent: "brand",
    linkTo: "/profile",
  };
}

function awardToEvent(a: AwardEntry): TimelineEvent {
  const date = `${a.year}-01-01`;
  return {
    id: `award-${a.id}`,
    when: date,
    date,
    type: "award",
    title: `Award: ${a.name}`,
    subtitle: a.note || `${a.year}`,
    emoji: "🎖️",
    accent: "amber",
    linkTo: "/profile",
  };
}

function videoToEvent(v: VideoEntry): TimelineEvent {
  return {
    id: `video-${v.id}`,
    when: v.createdAt,
    date: v.createdAt.slice(0, 10),
    type: "video",
    title: v.title || "Video uploaded",
    subtitle: v.description || undefined,
    emoji: "🎬",
    accent: "sky",
    linkTo: `/videos?v=${v.id}`,
  };
}

// ---------------------------------------------------------------------------
// Public: build the full event list for a window
// ---------------------------------------------------------------------------

export type TimelineWindow = "30d" | "90d" | "all";

function windowCutoff(win: TimelineWindow): string | null {
  if (win === "all") return null;
  const days = win === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function buildTimeline(
  state: AppState,
  win: TimelineWindow = "90d"
): TimelineEvent[] {
  const cutoff = windowCutoff(win);
  const events: TimelineEvent[] = [];

  state.matches.forEach((m) => events.push(...matchToEvents(m)));
  events.push(...personalRecordsToEvents(state.personalRecords ?? []));
  events.push(...badgesToEvents(state.unlockedBadges ?? []));
  (state.profile?.tournaments ?? []).forEach((t) => {
    const e = tournamentToEvent(t);
    if (e) events.push(e);
  });
  (state.profile?.awards ?? []).forEach((a) => events.push(awardToEvent(a)));
  (state.videos ?? []).forEach((v) => events.push(videoToEvent(v)));

  const filtered = cutoff
    ? events.filter((e) => e.date >= cutoff)
    : events;

  // Sort by when desc (newest first) with date as a secondary key so
  // events that only have a date (no timestamp) still sort reasonably.
  filtered.sort((a, b) => {
    if (a.when !== b.when) return b.when.localeCompare(a.when);
    return b.date.localeCompare(a.date);
  });

  return filtered;
}

/**
 * Group events by "Month Year" (e.g. "April 2026") preserving the
 * newest-first order within groups.
 */
export function groupByMonth(
  events: TimelineEvent[]
): Array<{ label: string; events: TimelineEvent[] }> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const d = new Date(e.date + "T00:00:00");
    const label = d.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(e);
  }
  return Array.from(groups, ([label, events]) => ({ label, events }));
}

export interface TimelineStats {
  totalEvents: number;
  wins: number;
  losses: number;
  newPRs: number;
  badges: number;
}

export function timelineStats(events: TimelineEvent[]): TimelineStats {
  const wins = events.filter(
    (e) => e.type === "match" && e.title.startsWith("Win")
  ).length;
  const losses = events.filter(
    (e) => e.type === "match" && e.title.startsWith("Loss")
  ).length;
  const newPRs = events.filter((e) => e.type === "pr").length;
  const badges = events.filter((e) => e.type === "badge").length;
  return {
    totalEvents: events.length,
    wins,
    losses,
    newPRs,
    badges,
  };
}
