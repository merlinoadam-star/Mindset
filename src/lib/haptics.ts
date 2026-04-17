/**
 * Haptic feedback helpers — silent no-ops on devices that don't support
 * the Vibration API (most desktops, iOS Safari outside of PWA). Call
 * liberally; it won't annoy users who don't have the hardware.
 */

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* ignore — some browsers block this in iframes */
  }
}

/** Light tap — buttons, toggles, simple confirmations. */
export function hapticLight(): void {
  vibrate(10);
}

/** Medium tap — habit check-offs, goal set, normal actions. */
export function hapticMedium(): void {
  vibrate(20);
}

/** Success pattern — completing a match, leveling up, earning a badge. */
export function hapticSuccess(): void {
  vibrate([10, 50, 30]);
}

/** Celebration — level up, streak milestone. Longer + more rhythmic. */
export function hapticCelebrate(): void {
  vibrate([20, 40, 20, 40, 50]);
}

/** Error — something went wrong. */
export function hapticError(): void {
  vibrate([40, 30, 40]);
}
