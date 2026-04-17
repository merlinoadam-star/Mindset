/**
 * Skill catalog for coach-assignable weekly focuses.
 *
 * A coach picks a skill for the week; the athlete sees it pinned on
 * their dashboard with the emoji/color/description for context. Coaches
 * can still write free-text focuses — the catalog is just a shortcut
 * for the common cases.
 *
 * Add new skills by appending to the array below. IDs are permanent —
 * never change an existing ID, since it's stored in the weekly_focus
 * table and old entries would stop rendering correctly.
 */

export type SkillCategory = "mental" | "physical" | "recovery" | "mindset";

export interface SkillChallenge {
  id: string;
  emoji: string;
  title: string;
  /** Short blurb the athlete sees on their dashboard. */
  blurb: string;
  category: SkillCategory;
  /** Three concrete action ideas the coach can share if asked. */
  actions: string[];
}

export const SKILL_CATALOG: SkillChallenge[] = [
  // ----- Mental -----
  {
    id: "mental-toughness",
    emoji: "💪",
    title: "Mental Toughness",
    blurb:
      "Stay locked in when it gets hard. No excuses, no drama — just the next rep.",
    category: "mental",
    actions: [
      "Finish every drill even when tired",
      "Say one thing you're grateful for after every practice",
      "Pick a power phrase and use it when frustrated",
    ],
  },
  {
    id: "focus",
    emoji: "🎯",
    title: "Laser Focus",
    blurb:
      "Eliminate distractions. One thing at a time. Full attention on what matters.",
    category: "mental",
    actions: [
      "Put the phone in another room during practice",
      "Set a single goal at the start of each session",
      "Use box breathing before hard drills",
    ],
  },
  {
    id: "confidence",
    emoji: "🦁",
    title: "Compete Confidently",
    blurb: "Walk in like you belong. Your training earned you that right.",
    category: "mental",
    actions: [
      "Visualize success every morning",
      "Write down 3 wins from last week",
      "Use a power phrase before every match",
    ],
  },
  {
    id: "pressure",
    emoji: "🔥",
    title: "Thrive Under Pressure",
    blurb:
      "Pressure is a privilege. Slow breath, clear mind, trust your training.",
    category: "mental",
    actions: [
      "Box breathe before every match",
      "Rehearse the worst-case in your head — and how you respond",
      "Rate confidence 1–5 before each match",
    ],
  },

  // ----- Physical / Skill -----
  {
    id: "top-position",
    emoji: "👑",
    title: "Top Position",
    blurb: "Own the top. Ride time, breakdown, pinning combos.",
    category: "physical",
    actions: [
      "Drill breakdowns 10 mins a day",
      "Watch 1 pin-combo video per session",
      "Goal: 1+ pin attempt every live go",
    ],
  },
  {
    id: "bottom-position",
    emoji: "🧱",
    title: "Escape Every Time",
    blurb: "Bottom isn't a problem — it's a scoring opportunity.",
    category: "physical",
    actions: [
      "Drill stand-ups 10 mins a day",
      "Work one escape to elite level",
      "Hit a move in the first 10 seconds",
    ],
  },
  {
    id: "footwork",
    emoji: "⚡",
    title: "Sharpen Footwork",
    blurb:
      "Where your feet go, everything follows. Lighter, faster, more balanced.",
    category: "physical",
    actions: [
      "5 minutes of footwork drills daily",
      "Jump rope at the start of practice",
      "Stay on the balls of your feet live",
    ],
  },
  {
    id: "serve",
    emoji: "🎯",
    title: "Serve With Intent",
    blurb: "Every serve has a purpose. Aim small, miss small.",
    category: "physical",
    actions: [
      "10 targeted serves at end of practice",
      "Pick a zone before every serve",
      "Track % in between matches",
    ],
  },
  {
    id: "first-touch",
    emoji: "🤲",
    title: "Flawless First Touch",
    blurb: "The whole point depends on it. Platform. Angle. Patience.",
    category: "physical",
    actions: [
      "30 pepper reps every practice",
      "Call every ball loud and early",
      "Track pass ratings in matches",
    ],
  },
  {
    id: "finishing",
    emoji: "🏁",
    title: "Finish the Takedown",
    blurb: "Don't just shoot — finish. Power through the last foot.",
    category: "physical",
    actions: [
      "Drill finishes from ugly positions",
      "Wall walks daily",
      "Live go: 3+ takedown attempts",
    ],
  },

  // ----- Recovery -----
  {
    id: "sleep",
    emoji: "😴",
    title: "Sleep Like a Pro",
    blurb: "8+ hours every night. This is where gains happen.",
    category: "recovery",
    actions: [
      "Phone out of the bedroom",
      "Lights out by 9:30pm on school nights",
      "Log sleep hours every morning",
    ],
  },
  {
    id: "nutrition",
    emoji: "🥗",
    title: "Fuel Like an Athlete",
    blurb:
      "Protein at every meal. Water all day. No junk the day before you compete.",
    category: "recovery",
    actions: [
      "Protein with breakfast every day",
      "2+ water bottles before practice",
      "Log your meals 3 days this week",
    ],
  },
  {
    id: "stretching",
    emoji: "🧘",
    title: "Stay Loose",
    blurb: "10 minutes of mobility a day keeps injuries away.",
    category: "recovery",
    actions: [
      "10 min mobility before bed",
      "Foam roll after every practice",
      "Log recovery check-in daily",
    ],
  },

  // ----- Mindset / Habits -----
  {
    id: "show-up",
    emoji: "✅",
    title: "Show Up Every Day",
    blurb: "Consistency beats intensity. Log something every day this week.",
    category: "mindset",
    actions: [
      "Daily check-in, no excuses",
      "One habit completed every day",
      "Share progress with coach",
    ],
  },
  {
    id: "teammate",
    emoji: "🤝",
    title: "Be a Great Teammate",
    blurb: "The best players make everyone around them better.",
    category: "mindset",
    actions: [
      "Hype up one teammate per practice",
      "First to arrive, last to leave",
      "Help clean up the mats/court",
    ],
  },
];

export function getSkillById(id: string | null | undefined): SkillChallenge | null {
  if (!id) return null;
  return SKILL_CATALOG.find((s) => s.id === id) ?? null;
}

export const CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string; accent: string }> = {
  mental: {
    bg: "from-brand-50 to-purple-50 dark:from-brand-950 dark:to-purple-950",
    text: "text-brand-700 dark:text-brand-300",
    border: "border-brand-200 dark:border-brand-800",
    accent: "bg-brand-500",
  },
  physical: {
    bg: "from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    accent: "bg-orange-500",
  },
  recovery: {
    bg: "from-sky-50 to-emerald-50 dark:from-sky-950 dark:to-emerald-950",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
    accent: "bg-sky-500",
  },
  mindset: {
    bg: "from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    accent: "bg-amber-500",
  },
};

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  mental: "Mental",
  physical: "Skill",
  recovery: "Recovery",
  mindset: "Mindset",
};
