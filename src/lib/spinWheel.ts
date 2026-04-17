/**
 * Phase G — Spin the Wheel rewards.
 * One spin per day. 8 slices, weighted so common small rewards show
 * up most and the rare big ones feel special.
 */

export interface SpinSlice {
  id: string;
  label: string;
  short: string; // text shown on the wheel
  emoji: string;
  color: string; // slice background
  type: "xp" | "freeze" | "mystery";
  xp?: number;
}

export const SPIN_SLICES: SpinSlice[] = [
  {
    id: "xp-10",
    label: "+10 XP",
    short: "+10",
    emoji: "⚡",
    color: "#60a5fa",
    type: "xp",
    xp: 10,
  },
  {
    id: "xp-25",
    label: "+25 XP",
    short: "+25",
    emoji: "⚡",
    color: "#818cf8",
    type: "xp",
    xp: 25,
  },
  {
    id: "freeze",
    label: "Streak Freeze",
    short: "❄️",
    emoji: "❄️",
    color: "#38bdf8",
    type: "freeze",
  },
  {
    id: "xp-50",
    label: "+50 XP",
    short: "+50",
    emoji: "✨",
    color: "#a78bfa",
    type: "xp",
    xp: 50,
  },
  {
    id: "xp-15",
    label: "+15 XP",
    short: "+15",
    emoji: "⚡",
    color: "#34d399",
    type: "xp",
    xp: 15,
  },
  {
    id: "xp-100",
    label: "+100 XP",
    short: "+100",
    emoji: "🔥",
    color: "#fb923c",
    type: "xp",
    xp: 100,
  },
  {
    id: "mystery",
    label: "Mystery XP!",
    short: "?",
    emoji: "🎁",
    color: "#f472b6",
    type: "mystery",
  },
  {
    id: "xp-200",
    label: "JACKPOT +200 XP",
    short: "JACKPOT",
    emoji: "🏆",
    color: "#facc15",
    type: "xp",
    xp: 200,
  },
];

/**
 * Weighted pick. Returns the index of the chosen slice AND the final
 * rotation angle (deg) to land the pointer on that slice, including
 * extra spins for visual effect.
 */
export function pickSpin(): {
  index: number;
  rotationDeg: number;
  slice: SpinSlice;
  mysteryXp?: number;
} {
  // Weights (same order as SPIN_SLICES). Higher = more likely.
  // Big jackpot (+200) and Mystery are rare. +10/+15/+25 are common.
  const weights = [
    24, // +10
    22, // +25
    12, // freeze
    14, // +50
    20, // +15
    5, // +100
    2, // mystery
    1, // jackpot
  ];
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  let pickedIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    if (roll < weights[i]) {
      pickedIndex = i;
      break;
    }
    roll -= weights[i];
  }
  const slice = SPIN_SLICES[pickedIndex];

  // Compute the angle to rotate so the pointer (at 12 o'clock) lands
  // on the center of the chosen slice. The wheel is laid out clockwise
  // starting at 12 o'clock, so slice i's center is at (i + 0.5) * 45deg.
  const sliceAngle = 360 / SPIN_SLICES.length;
  const sliceCenter = pickedIndex * sliceAngle + sliceAngle / 2;
  // Rotate the WHEEL counter-clockwise so the slice center aligns with
  // the stationary pointer at 0°. Add 6 full rotations for the spin
  // animation.
  const baseRotation = 360 * 6;
  // Add a small random jitter within the slice so it doesn't always
  // land dead-center.
  const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
  const rotationDeg = baseRotation + (360 - sliceCenter) + jitter;

  // For Mystery, pick a random XP 30-150 range.
  let mysteryXp: number | undefined;
  if (slice.type === "mystery") {
    mysteryXp = 30 + Math.floor(Math.random() * 121);
  }

  return { index: pickedIndex, rotationDeg, slice, mysteryXp };
}
