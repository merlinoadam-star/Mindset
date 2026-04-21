import { useEffect, useRef } from "react";
import { useStore } from "../lib/store";
import { computeLevel } from "../lib/gamification";
import { UNLOCK_PREFIX, unlocksAtLevel } from "../lib/unlocks";
import { showReward } from "./RewardToast";
import { hapticSuccess } from "../lib/haptics";
import { fireConfetti } from "./Confetti";

/**
 * Watches the athlete's XP and, when they cross into a new level,
 * shows a RewardToast celebrating any items that unlocked at that
 * level. Keeps this logic in one place so the 17 XP-awarding actions
 * in the store don't each need to care about unlocks.
 *
 * The first render establishes the baseline level — we don't toast
 * for a level the user already had before this watcher mounted, only
 * for levels they cross afterwards.
 *
 * Silently no-ops when there's no profile (pre-onboarding / coach /
 * parent accounts without a local athlete profile).
 */
export default function LevelUpWatcher() {
  const { state } = useStore();
  const lastLevelRef = useRef<number | null>(null);

  const sport = state.profile?.sport;
  const currentLevel = sport ? computeLevel(state.xp, sport).level : null;

  useEffect(() => {
    if (currentLevel == null) return;

    // Initialize baseline on first render with a profile present.
    if (lastLevelRef.current == null) {
      lastLevelRef.current = currentLevel;
      return;
    }

    if (currentLevel <= lastLevelRef.current) {
      // No level-up (or XP went down due to a badge reversal). Keep
      // the ref in sync so subsequent comparisons are accurate.
      lastLevelRef.current = currentLevel;
      return;
    }

    // Crossed one or more levels — collect unlocks at each crossed
    // level (inclusive of the new current level).
    const unlockIds: string[] = [];
    for (let lvl = lastLevelRef.current + 1; lvl <= currentLevel; lvl++) {
      for (const u of unlocksAtLevel(lvl)) {
        if (!u.hiddenWhenLocked) {
          // Hidden-until-earned cosmetics still show on unlock;
          // they just don't appear on the locked-card list. The
          // hiddenWhenLocked flag is about the lock state, not the
          // reveal moment.
          unlockIds.push(UNLOCK_PREFIX + u.id);
        } else {
          unlockIds.push(UNLOCK_PREFIX + u.id);
        }
      }
    }

    if (unlockIds.length > 0) {
      showReward(0, unlockIds);
      hapticSuccess();
      fireConfetti(80);
    }

    lastLevelRef.current = currentLevel;
  }, [currentLevel]);

  return null;
}
