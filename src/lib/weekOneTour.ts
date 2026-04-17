/**
 * 7-day onboarding tour. Instead of dumping all 20+ features on a new
 * athlete at signup, we sequence ONE feature per day for their first
 * week. Each day the Dashboard surfaces a single card introducing the
 * day's feature with a CTA.
 *
 * Progression is anchored to `profile.createdAt` — we just compute
 * `daysSince(createdAt)` to pick which day's card to show. No
 * server-side state needed.
 *
 * Dismissals are per-day, stored in localStorage (per-device).
 */

export interface TourDay {
  /** 1-indexed day number. */
  day: number;
  emoji: string;
  title: string;
  /** One short sentence explaining why this matters. */
  blurb: string;
  /** Route to visit to try the feature. */
  ctaPath: string;
  ctaLabel: string;
  /** Hex gradient (tailwind classes) for the card background. */
  gradient: string;
}

export const TOUR_DAYS: TourDay[] = [
  {
    day: 1,
    emoji: "☀️",
    title: "Day 1 — The Morning Check-In",
    blurb:
      "30-second mood, gratitude, and one goal for the day. The best athletes start their day on purpose.",
    ctaPath: "/",
    ctaLabel: "Try it now",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    day: 2,
    emoji: "✅",
    title: "Day 2 — Stack Tiny Wins",
    blurb:
      "Your daily habits are where champions are made. Check off one and see the XP climb.",
    ctaPath: "/habits",
    ctaLabel: "See your habits",
    gradient: "from-emerald-500 via-teal-500 to-sky-500",
  },
  {
    day: 3,
    emoji: "💪",
    title: "Day 3 — Your Power Phrases",
    blurb:
      "Pick a mantra. Say it before the whistle. It's science — your brain listens when you talk to it right.",
    ctaPath: "/phrases",
    ctaLabel: "Build your list",
    gradient: "from-brand-500 via-purple-500 to-fuchsia-500",
  },
  {
    day: 4,
    emoji: "🌬️",
    title: "Day 4 — Breathe Like a Pro",
    blurb:
      "One minute of box breathing drops your heart rate and sharpens focus. Pros use this every day.",
    ctaPath: "/breathe",
    ctaLabel: "Try a breath",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
  },
  {
    day: 5,
    emoji: "👁️",
    title: "Day 5 — See It First",
    blurb:
      "Your brain can't tell the difference between seeing and doing. Visualize your best performance — then go do it.",
    ctaPath: "/visualize",
    ctaLabel: "Start a session",
    gradient: "from-purple-500 via-violet-500 to-brand-600",
  },
  {
    day: 6,
    emoji: "⚔️",
    title: "Day 6 — Match Prep & Reflect",
    blurb:
      "Log your next match. Set your focus before. Reflect on what worked after. This is where growth happens.",
    ctaPath: "/matches",
    ctaLabel: "Open match log",
    gradient: "from-slate-700 via-brand-700 to-purple-800",
  },
  {
    day: 7,
    emoji: "🚀",
    title: "Day 7 — Look How Far You've Come",
    blurb:
      "One week in. Check your streak, your XP, your charts. This is YOUR progress — earn it, own it, share it.",
    ctaPath: "/progress",
    ctaLabel: "See my progress",
    gradient: "from-orange-500 via-red-500 to-purple-600",
  },
];

const DISMISS_KEY = "mindset-week1-dismissed";
const RESET_KEY = "mindset-week1-reset-at";

/** Days since an ISO date, at local-midnight granularity. */
export function daysSince(iso: string): number {
  const then = new Date(iso);
  const thenMidnight = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate()
  );
  const today = new Date();
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  return Math.floor(
    (todayMidnight.getTime() - thenMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function readDismissed(): number[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeDismissed(days: number[]): void {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify(days));
  } catch {
    /* ignore */
  }
}

export function isDayDismissed(day: number): boolean {
  return readDismissed().includes(day);
}

export function dismissDay(day: number): void {
  const current = readDismissed();
  if (!current.includes(day)) {
    writeDismissed([...current, day]);
  }
}

/** Clear all dismissals — used by "Restart tour" in Settings. */
export function resetTour(): void {
  writeDismissed([]);
  try {
    localStorage.setItem(RESET_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

/**
 * Pick the TourDay to show today, or null if the tour is over / all
 * dismissed. Day index caps at 7; if the athlete is on day 3 and
 * already dismissed day 3, they see nothing today.
 */
export function pickTourDay(createdAt: string | undefined): TourDay | null {
  if (!createdAt) return null;
  const since = daysSince(createdAt);
  if (since < 0 || since > 6) return null;
  const dayNum = since + 1;
  if (isDayDismissed(dayNum)) return null;
  return TOUR_DAYS.find((d) => d.day === dayNum) ?? null;
}
