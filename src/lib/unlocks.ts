/**
 * Level-gated unlocks.
 *
 * Everything here is DERIVED from the athlete's current level (see
 * `computeLevel` in gamification.ts). There is no separate "unlocked"
 * flag stored anywhere — an item is unlocked iff the athlete has
 * reached its required level. That means existing high-XP users get
 * every unlock the instant this ships, and rolling back the feature
 * can't leave the app in a weird half-unlocked state.
 *
 * Guiding rule: NEVER gate the core loop (Habits, Practice, Mindset,
 * Badges, Connections). Gates live on games, power-user tools, and
 * cosmetics — things that feel like rewards, not like the product.
 */

export type UnlockCategory = "game" | "tool" | "cosmetic";

export interface UnlockDef {
  id: string;              // stable dot-namespaced id, e.g. "game.flash"
  label: string;           // human-readable, shown in lock chips + toasts
  teaser: string;          // one-line hint shown on the locked card
  emoji: string;           // used in the unlock toast ("🔓 🧠 Focus Flash unlocked!")
  levelRequired: number;
  category: UnlockCategory;
  /** If true, the item is hidden entirely when locked (surprise reveal). */
  hiddenWhenLocked?: boolean;
}

export const UNLOCKS: UnlockDef[] = [
  // --- Games ---------------------------------------------------------------
  // Lvl 1 games are the gentle on-ramp — a brand-new athlete shouldn't
  // open the games hub and see everything locked. Flash / Scenarios /
  // PlayCall are graduated from there.
  {
    id: "game.reaction",
    label: "Reaction Tap",
    teaser: "Tap green, avoid red",
    emoji: "⚡",
    levelRequired: 1,
    category: "game",
  },
  {
    id: "game.trivia",
    label: "Sport Trivia",
    teaser: "Rules, legends, history",
    emoji: "🎮",
    levelRequired: 1,
    category: "game",
  },
  {
    id: "game.flash",
    label: "Focus Flash",
    teaser: "Memorize the sequence",
    emoji: "🧠",
    levelRequired: 3,
    category: "game",
  },
  {
    id: "game.scenarios",
    label: "Decision Drill",
    teaser: "Champion-mindset choices",
    emoji: "🧩",
    levelRequired: 4,
    category: "game",
  },
  {
    id: "game.playcall",
    label: "Play Call",
    teaser: "7 seconds. Call it right.",
    emoji: "⏱️",
    levelRequired: 5,
    category: "game",
  },

  // --- Tools ---------------------------------------------------------------
  {
    id: "tool.highlight-reel",
    label: "Highlight Reel",
    teaser: "Wrapped-style season recap",
    emoji: "🎬",
    levelRequired: 4,
    category: "tool",
  },
  {
    id: "tool.export",
    label: "Export Report",
    teaser: "Printable progress report",
    emoji: "📄",
    levelRequired: 6,
    category: "tool",
  },

  // --- Cosmetics (hidden until earned) ------------------------------------
  {
    id: "cosmetic.voice-personas",
    label: "Voice Coaches",
    teaser: "Extra AI coach voices",
    emoji: "🎤",
    levelRequired: 4,
    category: "cosmetic",
    hiddenWhenLocked: true,
  },
];

/** Prefix used to distinguish an unlock reveal from a badge in the reward
 *  toast payload. Matches the `__combo__` convention already in use. */
export const UNLOCK_PREFIX = "__unlock__";

export function isUnlocked(id: string, level: number): boolean {
  const u = UNLOCKS.find((x) => x.id === id);
  if (!u) return true; // unknown ids are always available (safe default)
  return level >= u.levelRequired;
}

/** Items that unlock exactly at this level. Used to build the level-up toast. */
export function unlocksAtLevel(level: number): UnlockDef[] {
  return UNLOCKS.filter((u) => u.levelRequired === level);
}

/** The next N locked items ahead of the athlete, sorted by level ascending.
 *  Used for the "next up" teaser on the dashboard. */
export function nextUnlocks(currentLevel: number, limit = 2): UnlockDef[] {
  return UNLOCKS.filter((u) => u.levelRequired > currentLevel)
    .sort((a, b) => a.levelRequired - b.levelRequired)
    .slice(0, limit);
}

/** Look up an unlock by id. Returns undefined if id is not registered. */
export function getUnlock(id: string): UnlockDef | undefined {
  return UNLOCKS.find((u) => u.id === id);
}
