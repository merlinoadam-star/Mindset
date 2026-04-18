import type {
  PersonalRecordAttempt,
  PersonalRecordDirection,
  PersonalRecordUnit,
  Sport,
} from "../types";

/**
 * Catalog of suggested PR categories per sport plus helpers for ranking
 * attempts, formatting values, and computing "current best". Custom
 * categories created by the athlete use the `custom-<uuid>` key namespace
 * and live alongside these.
 */

export interface PersonalRecordCategory {
  key: string;
  label: string;
  emoji: string;
  unit: PersonalRecordUnit;
  direction: PersonalRecordDirection;
  /** One-line hint shown under the label when adding. */
  hint?: string;
}

const COMMON_PR_CATEGORIES: PersonalRecordCategory[] = [
  {
    key: "pull-ups-max",
    label: "Max pull-ups",
    emoji: "💪",
    unit: "reps",
    direction: "higher",
    hint: "In one set, strict form.",
  },
  {
    key: "push-ups-1min",
    label: "Push-ups in 1 min",
    emoji: "🔥",
    unit: "reps",
    direction: "higher",
  },
  {
    key: "plank-hold",
    label: "Longest plank",
    emoji: "🧘",
    unit: "sec",
    direction: "higher",
  },
  {
    key: "mile-time",
    label: "Fastest mile",
    emoji: "🏃",
    unit: "sec",
    direction: "lower",
    hint: "Enter total seconds (e.g. 345 = 5:45).",
  },
];

const WRESTLING_PR_CATEGORIES: PersonalRecordCategory[] = [
  {
    key: "deadlift-max",
    label: "Heaviest deadlift",
    emoji: "🏋️",
    unit: "lbs",
    direction: "higher",
  },
  {
    key: "squat-max",
    label: "Heaviest squat",
    emoji: "🦵",
    unit: "lbs",
    direction: "higher",
  },
  {
    key: "rope-climb",
    label: "Fastest rope climb",
    emoji: "🪢",
    unit: "sec",
    direction: "lower",
  },
  {
    key: "box-jump",
    label: "Highest box jump",
    emoji: "📦",
    unit: "in",
    direction: "higher",
  },
];

const VOLLEYBALL_PR_CATEGORIES: PersonalRecordCategory[] = [
  {
    key: "vertical-jump",
    label: "Vertical jump",
    emoji: "⬆️",
    unit: "in",
    direction: "higher",
  },
  {
    key: "approach-jump",
    label: "Approach jump",
    emoji: "🏐",
    unit: "in",
    direction: "higher",
  },
  {
    key: "serve-streak",
    label: "Consecutive serves in",
    emoji: "🎯",
    unit: "serves",
    direction: "higher",
  },
  {
    key: "serve-speed",
    label: "Fastest serve",
    emoji: "💨",
    unit: "mph",
    direction: "higher",
  },
];

export function suggestedCategoriesForSport(
  sport: Sport
): PersonalRecordCategory[] {
  if (sport === "wrestling")
    return [...WRESTLING_PR_CATEGORIES, ...COMMON_PR_CATEGORIES];
  if (sport === "volleyball")
    return [...VOLLEYBALL_PR_CATEGORIES, ...COMMON_PR_CATEGORIES];
  return COMMON_PR_CATEGORIES;
}

/** Group attempts by category key and find the best-in-category. */
export interface PersonalRecordSummary {
  categoryKey: string;
  label: string;
  emoji?: string;
  unit: PersonalRecordUnit;
  direction: PersonalRecordDirection;
  best: PersonalRecordAttempt;
  history: PersonalRecordAttempt[]; // newest first, excluding best
  totalAttempts: number;
}

export function summarizeRecords(
  attempts: PersonalRecordAttempt[],
  sport: Sport
): PersonalRecordSummary[] {
  const byKey = new Map<string, PersonalRecordAttempt[]>();
  for (const a of attempts) {
    if (!byKey.has(a.categoryKey)) byKey.set(a.categoryKey, []);
    byKey.get(a.categoryKey)!.push(a);
  }

  const catalog = new Map<string, PersonalRecordCategory>();
  for (const c of suggestedCategoriesForSport(sport)) catalog.set(c.key, c);

  const out: PersonalRecordSummary[] = [];
  for (const [key, list] of byKey) {
    if (list.length === 0) continue;
    const first = list[0];
    const direction = first.direction;
    // Sort so the best is first, then the rest by achieved date desc.
    const sorted = [...list].sort((a, b) => {
      if (a.value !== b.value) {
        return direction === "higher" ? b.value - a.value : a.value - b.value;
      }
      return b.achievedOn.localeCompare(a.achievedOn);
    });
    const best = sorted[0];
    const history = [...list]
      .filter((a) => a.id !== best.id)
      .sort((a, b) => b.achievedOn.localeCompare(a.achievedOn));
    const catalogEntry = catalog.get(key);
    out.push({
      categoryKey: key,
      label: catalogEntry?.label ?? first.categoryLabel,
      emoji: catalogEntry?.emoji,
      unit: first.unit,
      direction: first.direction,
      best,
      history,
      totalAttempts: list.length,
    });
  }

  // Order: categories with a newer "best" first, so recent achievements
  // float to the top.
  out.sort((a, b) => b.best.achievedOn.localeCompare(a.best.achievedOn));
  return out;
}

/**
 * Is `attempt` a new best vs the existing attempts for its category?
 * `existing` should be all attempts with the same categoryKey AS OF
 * before `attempt` was logged.
 */
export function isNewRecord(
  attempt: PersonalRecordAttempt,
  existing: PersonalRecordAttempt[]
): boolean {
  if (existing.length === 0) return true; // first attempt counts as a PR
  const direction = attempt.direction;
  const bestValue =
    direction === "higher"
      ? Math.max(...existing.map((a) => a.value))
      : Math.min(...existing.map((a) => a.value));
  return direction === "higher"
    ? attempt.value > bestValue
    : attempt.value < bestValue;
}

/** Format a value + unit for display. Handles the `sec → m:ss` case. */
export function formatRecordValue(
  value: number,
  unit: PersonalRecordUnit
): string {
  if (unit === "sec" && value >= 60) {
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value - minutes * 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
  // Integers render without a decimal, decimals keep up to one place.
  const rounded = Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
  const unitLabel =
    unit === "sec"
      ? "sec"
      : unit === "reps"
      ? "reps"
      : unit === "serves"
      ? "serves"
      : unit;
  return `${rounded} ${unitLabel}`;
}

/** Parse a user-entered value string. Accepts plain numbers and m:ss for sec. */
export function parseRecordValue(
  raw: string,
  unit: PersonalRecordUnit
): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (unit === "sec" && trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length !== 2) return null;
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s >= 60) {
      return null;
    }
    return m * 60 + s;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function customCategoryKey(): string {
  return `custom-${crypto.randomUUID()}`;
}

export const ALL_UNITS: PersonalRecordUnit[] = [
  "lbs",
  "kg",
  "reps",
  "sec",
  "in",
  "cm",
  "mph",
  "serves",
];
