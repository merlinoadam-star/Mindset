import { useEffect } from "react";
import { useAuth } from "../lib/authContext";
import {
  fetchUnseenAthleteXpGifts,
  markAthleteXpGiftSeen,
} from "../lib/parentXpSync";
import { showReward } from "./RewardToast";

/**
 * Athlete-side consumer for combo XP gifts from a parent/coach.
 *
 * Mounts on the athlete's Dashboard. On mount, fetches any unseen
 * `athlete_xp_gifts` rows and fires a reward toast for each ("nice
 * combo — your parent checked in on you today, +5 XP"), then marks
 * them seen. Local XP bumps arrive via the normal cloud-hydration
 * path (athletes.xp uses Math.max on fetch), so by the time the
 * toast shows the bar is already up to date on a fresh load.
 *
 * No UI of its own — just side effects.
 */
export default function ComboGiftConsumer() {
  const { account } = useAuth();

  useEffect(() => {
    if (!account || account.role !== "athlete") return;
    let cancelled = false;

    (async () => {
      const gifts = await fetchUnseenAthleteXpGifts(account.id);
      if (cancelled) return;

      // Stagger so multiple gifts don't collapse into a single toast render.
      gifts.forEach((g, idx) => {
        window.setTimeout(() => {
          showReward(g.xp, [`__combo__${g.reason}`]);
        }, idx * 900);
        markAthleteXpGiftSeen(g.id);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [account]);

  return null;
}
