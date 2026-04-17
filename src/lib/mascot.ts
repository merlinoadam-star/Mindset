import type { Sport } from "../types";

/**
 * Phase G — Mascot evolution. Each athlete has a sport-specific pet
 * that evolves through 5 stages as they level up. Wrestling athletes
 * get a bear line; volleyball athletes get a bird line.
 *
 * Stages unlock based on level:
 *   1-2  → Hatchling (egg)
 *   3-5  → Rookie
 *   6-8  → Varsity
 *   9-11 → Champion
 *   12+  → Legend
 */

export interface MascotStage {
  index: number;
  name: string;
  emoji: string;
  minLevel: number;
  description: string;
}

export const WRESTLING_STAGES: MascotStage[] = [
  {
    index: 0,
    name: "Hatchling",
    emoji: "🥚",
    minLevel: 1,
    description: "Just getting started — every legend begins here.",
  },
  {
    index: 1,
    name: "Cub",
    emoji: "🐻",
    minLevel: 3,
    description: "Small but scrappy. Learning the moves.",
  },
  {
    index: 2,
    name: "Varsity Bear",
    emoji: "🐻‍❄️",
    minLevel: 6,
    description: "Stronger, faster, sharper instincts.",
  },
  {
    index: 3,
    name: "Champion Bear",
    emoji: "🐻",
    minLevel: 9,
    description: "A force on the mat. Fear-inducing.",
  },
  {
    index: 4,
    name: "Legendary Bear",
    emoji: "🦁",
    minLevel: 12,
    description: "Unstoppable. Kings of the mat.",
  },
];

export const VOLLEYBALL_STAGES: MascotStage[] = [
  {
    index: 0,
    name: "Egg",
    emoji: "🥚",
    minLevel: 1,
    description: "Not much yet — but there's wings in there.",
  },
  {
    index: 1,
    name: "Chick",
    emoji: "🐤",
    minLevel: 3,
    description: "Little bird, big dreams. Learning to jump.",
  },
  {
    index: 2,
    name: "Fledgling",
    emoji: "🐦",
    minLevel: 6,
    description: "Taking flight. Finding your rhythm.",
  },
  {
    index: 3,
    name: "Falcon",
    emoji: "🦅",
    minLevel: 9,
    description: "Sharp eyes, powerful serves, bird of prey.",
  },
  {
    index: 4,
    name: "Phoenix",
    emoji: "🔥",
    minLevel: 12,
    description: "Mythical. Unstoppable. Rises every match.",
  },
];

export function stagesForSport(sport: Sport): MascotStage[] {
  return sport === "wrestling" ? WRESTLING_STAGES : VOLLEYBALL_STAGES;
}

export function currentStage(sport: Sport, level: number): MascotStage {
  const stages = stagesForSport(sport);
  for (let i = stages.length - 1; i >= 0; i--) {
    if (level >= stages[i].minLevel) return stages[i];
  }
  return stages[0];
}

export function nextStage(sport: Sport, level: number): MascotStage | null {
  const stages = stagesForSport(sport);
  const cur = currentStage(sport, level);
  const nextIdx = cur.index + 1;
  return stages[nextIdx] ?? null;
}

export const MASCOT_NAME_KEY = "mindset-mascot-name";

export function getMascotName(): string {
  return localStorage.getItem(MASCOT_NAME_KEY) ?? "";
}

export function setMascotName(name: string): void {
  if (name.trim()) {
    localStorage.setItem(MASCOT_NAME_KEY, name.trim().slice(0, 24));
  } else {
    localStorage.removeItem(MASCOT_NAME_KEY);
  }
}
