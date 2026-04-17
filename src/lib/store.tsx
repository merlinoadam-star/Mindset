import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  MatchEntry,
  MentalCheckin,
  MentalSession,
  NutritionLog,
  OpponentEntry,
  PowerPhrase,
  PracticeEntry,
  Profile,
  RecoveryCheckin,
  VideoEntry,
  WeeklyReview,
} from "../types";
import {
  deleteVideoBlob,
  extractThumbnail,
  getVideoDuration,
  saveVideoBlob,
} from "./videoStorage";
import { emptyState, loadState, saveState, clearState } from "./storage";
import { habitsForSport, getHabit } from "./habits";
import { todaysChallenge } from "./dailyChallenges";
import { comboLabel, unclaimedComboXp } from "./combos";
import { showReward } from "../components/RewardToast";
import {
  applyAutoFreezes,
  applyStreakXp,
  computeLevel,
  computeStreak,
  evaluateBadges,
  shouldEarnNewFreeze,
  todayISO,
} from "./gamification";
import {
  notifyConnectionsOfLevelUp,
  notifyConnectionsOfStreak,
} from "./milestoneAlerts";
import { fireConfetti } from "../components/Confetti";
import { hapticCelebrate, hapticMedium } from "./haptics";
import { useAuth } from "./authContext";
import {
  fetchAthleteProfile,
  rowToProfile,
  upsertAthleteProfile,
} from "./athleteSync";
import {
  fetchMatchesForAthlete,
  rowToMatch,
  syncAllMatches,
} from "./matchSync";
import {
  fetchAllAthleteData,
  rowToAward,
  rowToHabitCompletion,
  rowToMentalCheckin,
  rowToMentalSession,
  rowToNutritionLog,
  rowToOpponent,
  rowToPowerPhrase,
  rowToPractice,
  rowToRecoveryCheckin,
  rowToTournament,
  rowToUnlockedBadge,
  rowToWeeklyReview,
  syncAwards,
  syncHabitCompletions,
  syncMentalCheckins,
  syncMentalSessions,
  syncNutritionLogs,
  syncOpponents,
  syncPowerPhrases,
  syncPractices,
  syncRecoveryCheckins,
  syncTournaments,
  syncUnlockedBadges,
  syncWeeklyReviews,
} from "./dataSync";
import {
  deleteVideoFromCloud,
  updateVideoMetadata,
  uploadVideoToCloud,
} from "./videoSync";

interface StoreContextValue {
  state: AppState;
  setProfile: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  toggleHabit: (habitId: string) => { awardedXp: number; newlyUnlocked: string[] };
  isHabitDoneToday: (habitId: string) => boolean;
  addPractice: (
    p: Omit<PracticeEntry, "id" | "xpEarned">
  ) => { awardedXp: number; newlyUnlocked: string[] };
  addCheckin: (
    c: Omit<MentalCheckin, "id" | "xpEarned">
  ) => { awardedXp: number; newlyUnlocked: string[] };
  reviewGoal: (
    checkinId: string,
    met: boolean,
    note?: string
  ) => { awardedXp: number; newlyUnlocked: string[] };
  setDailyGoal: (
    goal: string
  ) => { awardedXp: number; newlyUnlocked: string[]; checkinId: string };
  hasCheckinToday: boolean;
  hasClaimedQuoteToday: boolean;
  claimDailyQuote: () => {
    awardedXp: number;
    newlyUnlocked: string[];
    alreadyClaimed: boolean;
  };
  claimDailyChallenge: () => {
    awardedXp: number;
    newlyUnlocked: string[];
    alreadyClaimed: boolean;
    notDone: boolean;
  };
  hasClaimedChallengeToday: boolean;
  completeTriviaRound: (
    correctCount: number,
    totalQuestions: number
  ) => { awardedXp: number; newlyUnlocked: string[] };
  addMatch: (
    m: Pick<MatchEntry, "date" | "opponent" | "event" | "location"> & {
      opponentId?: string;
    }
  ) => string;
  updateMatch: (
    id: string,
    updates: Partial<MatchEntry>
  ) => { awardedXp: number; newlyUnlocked: string[] };
  deleteMatch: (id: string) => void;
  completeMentalSession: (
    kind: MentalSession["kind"],
    refId: string,
    xp: number
  ) => { awardedXp: number; newlyUnlocked: string[] };
  saveWeeklyReview: (
    review: Omit<WeeklyReview, "id" | "createdAt" | "xpEarned">
  ) => { awardedXp: number; newlyUnlocked: string[] };
  addPowerPhrase: (text: string) => { awardedXp: number; newlyUnlocked: string[] };
  deletePowerPhrase: (id: string) => void;
  togglePinnedPhrase: (id: string) => void;
  incrementPhraseUse: (id: string) => void;
  saveRecoveryCheckin: (
    data: Omit<RecoveryCheckin, "id" | "xpEarned">
  ) => { awardedXp: number; newlyUnlocked: string[] };
  saveNutritionLog: (
    data: Omit<NutritionLog, "id" | "xpEarned">
  ) => { awardedXp: number; newlyUnlocked: string[] };
  completeGameRound: (
    gameId: string,
    score: number,
    xp: number
  ) => { awardedXp: number; newlyUnlocked: string[]; isNewBest: boolean };
  addOpponent: (
    data: Omit<OpponentEntry, "id" | "createdAt" | "updatedAt">
  ) => string;
  updateOpponent: (id: string, updates: Partial<OpponentEntry>) => void;
  deleteOpponent: (id: string) => void;
  addVideo: (
    blob: Blob,
    metadata: Omit<
      VideoEntry,
      "id" | "createdAt" | "blobKey" | "mimeType" | "sizeBytes" | "durationSec" | "thumbnailDataUrl"
    >
  ) => Promise<{ awardedXp: number; newlyUnlocked: string[]; videoId: string }>;
  updateVideo: (id: string, updates: Partial<VideoEntry>) => void;
  deleteVideo: (id: string) => Promise<void>;
  setVoicePersona: (id: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function genId(): string {
  // Prefer real UUIDs so records sync cleanly to Supabase's UUID columns.
  // Falls back to a pseudo-random string on very old browsers.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** True if the given id looks like a UUID (cloud-syncable). */
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id
  );
}

function xpForPractice(durationMin: number, intensity: number): number {
  // Base 10 XP + 1 XP per minute + up to 20 bonus XP for intensity (1-5)
  return 10 + Math.round(durationMin) + intensity * 4;
}

const CHECKIN_XP = 15;
const GOAL_REVIEW_XP = 10;
const GOAL_SET_XP = 5;
const QUOTE_XP = 10;
const PRE_MATCH_XP = 15;
const POST_MATCH_XP = 30;
const FULL_FRAMEWORK_BONUS = 10;
const WIN_BONUS = 5;
const WEEKLY_REVIEW_XP = 50;
const POWER_PHRASE_CREATE_XP = 10;
const RECOVERY_CHECKIN_XP = 15;
const NUTRITION_LOG_XP = 15;
const NUTRITION_BONUS_XP = 5; // bonus when 3+ quality items logged
const VIDEO_UPLOAD_XP = 10;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    // Auto-apply streak freezes on app load to protect past streaks
    const result = applyAutoFreezes(loaded);
    return {
      ...loaded,
      streakFreezes: result.streakFreezes,
      usedFreezeDates: result.usedFreezeDates,
    };
  });
  const { account } = useAuth();

  // Tracks whether we've pulled the athlete's cloud data into local state
  // for this sign-in session. All sync-UP effects wait on this so we don't
  // upload empty local state over existing cloud data on a new device.
  const [cloudHydrated, setCloudHydrated] = useState(false);

  // Today's date — recomputed periodically so unchanged tab sessions still
  // detect a day rollover (e.g. phone left open overnight).
  const [today, setToday] = useState<string>(() => todayISO());

  // Stable ref the video callbacks use to read the current athlete id
  // without re-creating themselves every render.
  const athleteAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    athleteAccountIdRef.current =
      account && account.role === "athlete" ? account.id : null;
  }, [account]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Hydrate local state from Supabase on athlete sign-in. Without this the
  // app only ever WRITES to Supabase and new devices come up blank (forcing
  // the user through onboarding, which then overwrites their cloud profile).
  //
  // Merge strategy: items present in the cloud replace local items with the
  // same id; items that exist only locally (never synced yet) are kept.
  // If the cloud is completely empty (first-time user), we leave local state
  // alone so the subsequent upload pushes it up.
  const hydratedAccountIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!account || account.role !== "athlete") {
      hydratedAccountIdRef.current = null;
      setCloudHydrated(false);
      return;
    }
    // Already hydrated for THIS account — skip. Switching athletes resets.
    if (hydratedAccountIdRef.current === account.id) return;

    let cancelled = false;
    (async () => {
      try {
        const [profileRow, dataRows, matchRows] = await Promise.all([
          fetchAthleteProfile(account.id),
          fetchAllAthleteData(account.id),
          fetchMatchesForAthlete(account.id),
        ]);
        if (cancelled) return;

        const mergeById = <T extends { id?: string }>(
          cloud: T[],
          local: T[]
        ): T[] => {
          if (cloud.length === 0) return local;
          const cloudIds = new Set(
            cloud.map((c) => c.id).filter((x): x is string => Boolean(x))
          );
          const localOnly = local.filter(
            (l) => !l.id || !cloudIds.has(l.id)
          );
          return [...cloud, ...localOnly];
        };

        setState((prev) => {
          let profile = prev.profile;
          let xp = prev.xp;
          let voicePersonaId = prev.voicePersonaId;
          if (profileRow) {
            const cloudProfile = rowToProfile(profileRow);
            // Preserve local tournaments/awards if cloud profile doesn't have them
            // yet (they sync via their own tables).
            profile = {
              ...cloudProfile,
              tournaments: cloudProfile.tournaments ?? prev.profile?.tournaments,
              awards: cloudProfile.awards ?? prev.profile?.awards,
            };
            // Cloud XP is authoritative — it may have been earned on another device.
            xp = Math.max(profileRow.xp ?? 0, prev.xp);
            voicePersonaId = profileRow.voice_persona_id ?? prev.voicePersonaId;
          }

          const matches = mergeById(matchRows.map(rowToMatch), prev.matches);

          const practices = dataRows
            ? mergeById(dataRows.practices.map(rowToPractice), prev.practices)
            : prev.practices;
          const habitCompletions = dataRows
            ? mergeById(
                dataRows.habits.map(rowToHabitCompletion),
                prev.habitCompletions
              )
            : prev.habitCompletions;
          const opponents = dataRows
            ? mergeById(dataRows.opponents.map(rowToOpponent), prev.opponents)
            : prev.opponents;
          const checkins = dataRows
            ? mergeById(
                dataRows.mentalCheckins.map(rowToMentalCheckin),
                prev.checkins
              )
            : prev.checkins;
          const mentalSessions = dataRows
            ? mergeById(
                dataRows.mentalSessions.map(rowToMentalSession),
                prev.mentalSessions ?? []
              )
            : prev.mentalSessions;
          const recoveryCheckins = dataRows
            ? mergeById(
                dataRows.recovery.map(rowToRecoveryCheckin),
                prev.recoveryCheckins ?? []
              )
            : prev.recoveryCheckins;
          const nutritionLogs = dataRows
            ? mergeById(
                dataRows.nutrition.map(rowToNutritionLog),
                prev.nutritionLogs ?? []
              )
            : prev.nutritionLogs;
          const weeklyReviews = dataRows
            ? mergeById(
                dataRows.weeklyReviews.map(rowToWeeklyReview),
                prev.weeklyReviews ?? []
              )
            : prev.weeklyReviews;
          const powerPhrases = dataRows
            ? mergeById(
                dataRows.powerPhrases.map(rowToPowerPhrase),
                prev.powerPhrases ?? []
              )
            : prev.powerPhrases;
          const unlockedBadges = dataRows
            ? mergeById(
                dataRows.badges.map(rowToUnlockedBadge),
                prev.unlockedBadges
              )
            : prev.unlockedBadges;

          // Tournaments + awards live on the profile object. Fold the fetched
          // rows into the profile (again, cloud wins by id, local-only entries
          // are preserved).
          const cloudTournaments = dataRows
            ? dataRows.tournaments.map(rowToTournament)
            : [];
          const cloudAwards = dataRows ? dataRows.awards.map(rowToAward) : [];
          if (profile) {
            profile = {
              ...profile,
              tournaments:
                cloudTournaments.length > 0
                  ? mergeById(cloudTournaments, profile.tournaments ?? [])
                  : profile.tournaments,
              awards:
                cloudAwards.length > 0
                  ? mergeById(cloudAwards, profile.awards ?? [])
                  : profile.awards,
            };
          }

          return {
            ...prev,
            profile,
            xp,
            voicePersonaId,
            matches,
            practices,
            habitCompletions,
            opponents,
            checkins,
            mentalSessions,
            recoveryCheckins,
            nutritionLogs,
            weeklyReviews,
            powerPhrases,
            unlockedBadges,
          };
        });
      } catch (e) {
        console.error("Cloud hydration failed", e);
      } finally {
        if (!cancelled) {
          hydratedAccountIdRef.current = account.id;
          setCloudHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account]);

  // Day-change detector — re-reads today's date every minute. When the date
  // actually changes (typically overnight), React re-renders any component
  // that depends on `today`, which naturally clears "today-scoped" UI like
  // the daily goal card and makes habit toggles fresh for the new day.
  // Long-term data (matches, practices, tournaments) isn't affected.
  useEffect(() => {
    const tick = () => {
      const now = todayISO();
      setToday((prev) => (prev === now ? prev : now));
    };
    const id = window.setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Phase 2B.2 — Auto-sync athlete profile to Supabase when signed in.
  // Writes are debounced so we don't spam the database on every tiny
  // change. If sync fails, the local state is unaffected.
  // Gated on cloudHydrated so we don't upload an empty profile over the
  // real one on a fresh device before the fetch comes back.
  useEffect(() => {
    if (
      !account ||
      account.role !== "athlete" ||
      !state.profile ||
      !cloudHydrated
    ) {
      return;
    }
    const id = window.setTimeout(() => {
      upsertAthleteProfile(
        account.id,
        state.profile!,
        state.xp,
        state.voicePersonaId ?? "natural"
      );
    }, 800);
    return () => window.clearTimeout(id);
  }, [
    account,
    cloudHydrated,
    state.profile,
    state.xp,
    state.voicePersonaId,
  ]);

  // Phase 2B.4 — Auto-sync match log to Supabase when signed in.
  // Upserts every match and deletes cloud rows that no longer exist locally.
  // Debounced. Old non-UUID records are skipped (they stay local-only).
  // Every sync-UP effect below waits on cloudHydrated so a fresh device
  // doesn't wipe the user's cloud data before the initial fetch completes.
  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncAllMatches(account.id, state.matches);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.matches]);

  // Phase 2B.5 — Sync all other athlete data types. Each gets its own
  // debounced effect so unrelated changes don't trigger cross-entity
  // syncs. The helpers are idempotent by id.
  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncPractices(account.id, state.practices);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.practices]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncHabitCompletions(account.id, state.habitCompletions);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.habitCompletions]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncOpponents(account.id, state.opponents);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.opponents]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncMentalCheckins(account.id, state.checkins);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.checkins]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncMentalSessions(account.id, state.mentalSessions ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.mentalSessions]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncRecoveryCheckins(account.id, state.recoveryCheckins ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.recoveryCheckins]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncNutritionLogs(account.id, state.nutritionLogs ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.nutritionLogs]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncWeeklyReviews(account.id, state.weeklyReviews ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.weeklyReviews]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncPowerPhrases(account.id, state.powerPhrases ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.powerPhrases]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncTournaments(account.id, state.profile?.tournaments ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.profile?.tournaments]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncAwards(account.id, state.profile?.awards ?? []);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.profile?.awards]);

  useEffect(() => {
    if (!account || account.role !== "athlete" || !cloudHydrated) return;
    const id = window.setTimeout(() => {
      syncUnlockedBadges(account.id, state.unlockedBadges);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [account, cloudHydrated, state.unlockedBadges]);

  // After any XP-earning activity, check if the athlete has earned a new freeze
  useEffect(() => {
    if (shouldEarnNewFreeze(state)) {
      setState((prev) => ({
        ...prev,
        streakFreezes: Math.min(2, (prev.streakFreezes ?? 0) + 1),
        lastFreezeEarnedAt: new Date().toISOString(),
      }));
    }
    // Re-check whenever active data changes (habits, practices, matches, etc.)
  }, [
    state.habitCompletions.length,
    state.practices.length,
    state.matches.length,
    state.checkins.length,
    state.mentalSessions?.length,
    state.recoveryCheckins?.length,
  ]);

  // Combo bonus — auto-award bonus XP when the athlete reaches a new
  // combo tier (new activity type added in the same day).
  useEffect(() => {
    const today = todayISO();
    const { amount, newTier } = unclaimedComboXp(state, today);
    if (amount <= 0) return;
    setState((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      lastComboDate: today,
      comboTiersClaimed: newTier,
    }));
    // Small delay so it doesn't pile on top of the action's own toast
    window.setTimeout(() => {
      const label = comboLabel(newTier);
      showReward(amount, [`__combo__${label}`]);
    }, 400);
  }, [
    state.habitCompletions.length,
    state.practices.length,
    state.checkins.length,
    state.mentalSessions?.length,
    state.recoveryCheckins?.length,
    state.nutritionLogs?.length,
  ]);

  // Phase 3A.3 — milestone alerts. When the athlete crosses a level-up
  // or a streak milestone, push a congrats to every connected coach /
  // parent. Refs start null; the first observation after hydration
  // records the current value WITHOUT firing a push (so we don't spam
  // parents with "just leveled up!" for old levels the athlete earned
  // long ago).
  const prevLevelRef = useRef<number | null>(null);
  const prevStreakMilestoneRef = useRef<number | null>(null);
  const STREAK_MILESTONES = useMemo(() => [3, 7, 14, 30, 60, 100, 365], []);

  // Level-up detection — watches xp + sport/name
  useEffect(() => {
    if (
      !account ||
      account.role !== "athlete" ||
      !state.profile ||
      !cloudHydrated
    ) {
      prevLevelRef.current = null;
      return;
    }
    const { level, title } = computeLevel(state.xp, state.profile.sport);
    if (prevLevelRef.current === null) {
      prevLevelRef.current = level;
      return;
    }
    if (level > prevLevelRef.current) {
      notifyConnectionsOfLevelUp(
        account.id,
        state.profile.name,
        level,
        title
      );
      // Celebrate on the athlete's own device
      fireConfetti(80);
      hapticCelebrate();
    }
    prevLevelRef.current = level;
  }, [
    account,
    cloudHydrated,
    state.xp,
    state.profile?.sport,
    state.profile?.name,
  ]);

  // Streak milestone detection. Uses activity-length deps as a cheap
  // trigger for "something that could affect the streak just happened".
  useEffect(() => {
    if (
      !account ||
      account.role !== "athlete" ||
      !state.profile ||
      !cloudHydrated
    ) {
      prevStreakMilestoneRef.current = null;
      return;
    }
    const streak = computeStreak(state);
    // Find the highest milestone the current streak has crossed.
    let current: number | null = null;
    for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
      if (streak >= STREAK_MILESTONES[i]) {
        current = STREAK_MILESTONES[i];
        break;
      }
    }
    if (prevStreakMilestoneRef.current === null) {
      prevStreakMilestoneRef.current = current;
      return;
    }
    if (
      current !== null &&
      (prevStreakMilestoneRef.current === null ||
        current > prevStreakMilestoneRef.current)
    ) {
      notifyConnectionsOfStreak(account.id, state.profile.name, current);
      fireConfetti(80);
      hapticCelebrate();
    }
    prevStreakMilestoneRef.current = current;
    // state is intentionally omitted from deps — we key on the activity
    // arrays that actually feed into computeStreak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    cloudHydrated,
    state.profile?.name,
    state.habitCompletions.length,
    state.practices.length,
    state.checkins.length,
    state.mentalSessions?.length,
    state.recoveryCheckins?.length,
    state.nutritionLogs?.length,
    STREAK_MILESTONES,
  ]);

  const setProfile = useCallback((profile: Profile) => {
    setState((prev) => ({ ...prev, profile }));
  }, []);

  const updateProfile = useCallback((updates: Partial<Profile>) => {
    setState((prev) => {
      if (!prev.profile) return prev;
      return { ...prev, profile: { ...prev.profile, ...updates } };
    });
  }, []);

  const isHabitDoneToday = useCallback(
    (habitId: string) => {
      const today = todayISO();
      return state.habitCompletions.some(
        (c) => c.habitId === habitId && c.date === today
      );
    },
    [state.habitCompletions]
  );

  const toggleHabit = useCallback(
    (habitId: string) => {
      const habit = getHabit(habitId);
      if (!habit) return { awardedXp: 0, newlyUnlocked: [] };
      const today = todayISO();

      hapticMedium();

      let awardedXp = 0;
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        const already = prev.habitCompletions.find(
          (c) => c.habitId === habitId && c.date === today
        );
        let next: AppState;
        if (already) {
          // Un-complete: remove completion and refund XP
          awardedXp = -habit.xp;
          next = {
            ...prev,
            xp: Math.max(0, prev.xp - habit.xp),
            habitCompletions: prev.habitCompletions.filter(
              (c) => !(c.habitId === habitId && c.date === today)
            ),
          };
        } else {
          awardedXp = applyStreakXp(habit.xp, prev);
          next = {
            ...prev,
            xp: prev.xp + awardedXp,
            lastActiveDate: today,
            habitCompletions: [
              ...prev.habitCompletions,
              {
                id: genId(),
                habitId,
                date: today,
                completedAt: new Date().toISOString(),
              },
            ],
          };
        }

        // Evaluate badges on the new state
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });

      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const addPractice = useCallback(
    (p: Omit<PracticeEntry, "id" | "xpEarned">) => {
      let xpEarned = xpForPractice(p.durationMin, p.intensity);
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        const boostedXp = applyStreakXp(xpEarned, prev);
        xpEarned = boostedXp;
        const entry: PracticeEntry = {
          ...p,
          id: genId(),
          xpEarned: boostedXp,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + boostedXp,
          lastActiveDate: todayISO(),
          practices: [entry, ...prev.practices],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });

      return { awardedXp: xpEarned, newlyUnlocked };
    },
    []
  );

  const addCheckin = useCallback(
    (c: Omit<MentalCheckin, "id" | "xpEarned">) => {
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        // Only one check-in per day; replace if one exists
        const filtered = prev.checkins.filter((x) => x.date !== c.date);
        const already = prev.checkins.find((x) => x.date === c.date);
        // If they changed the goal, reset the review so they evaluate the new one
        const goalChanged = already && already.goal !== c.goal;
        const entry: MentalCheckin = {
          ...c,
          id: already?.id ?? genId(),
          // Preserve review fields unless the goal itself changed
          goalMet: goalChanged ? undefined : already?.goalMet,
          goalReviewNote: goalChanged ? undefined : already?.goalReviewNote,
          goalReviewedAt: goalChanged ? undefined : already?.goalReviewedAt,
          xpEarned: already ? 0 : applyStreakXp(CHECKIN_XP, prev),
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + entry.xpEarned,
          lastActiveDate: todayISO(),
          checkins: [entry, ...filtered],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });

      return { awardedXp: CHECKIN_XP, newlyUnlocked };
    },
    []
  );

  const setDailyGoal = useCallback((goal: string) => {
    let newlyUnlocked: string[] = [];
    let awardedXp = 0;
    let checkinId = "";
    const trimmed = goal.trim();
    setState((prev) => {
      const today = todayISO();
      const existing = prev.checkins.find((c) => c.date === today);
      // If goal changed, clear the review so they evaluate the new goal
      const goalChanged = existing && existing.goal !== trimmed;
      // Only award XP on first time a goal is set for the day
      const isFirstGoalToday = !existing || !existing.goal;
      awardedXp = isFirstGoalToday ? GOAL_SET_XP : 0;

      const entry: MentalCheckin = existing
        ? {
            ...existing,
            goal: trimmed,
            goalMet: goalChanged ? undefined : existing.goalMet,
            goalReviewNote: goalChanged ? undefined : existing.goalReviewNote,
            goalReviewedAt: goalChanged ? undefined : existing.goalReviewedAt,
          }
        : {
            id: genId(),
            date: today,
            mood: 3,
            gratitude: "",
            goal: trimmed,
            xpEarned: awardedXp,
          };
      checkinId = entry.id;

      let next: AppState = {
        ...prev,
        xp: prev.xp + awardedXp,
        lastActiveDate: today,
        checkins: [entry, ...prev.checkins.filter((c) => c.id !== entry.id)],
      };
      const sportHabitCount = prev.profile
        ? habitsForSport(prev.profile.sport).length
        : 0;
      newlyUnlocked = evaluateBadges(next, sportHabitCount);
      if (newlyUnlocked.length > 0) {
        const now = new Date().toISOString();
        next = {
          ...next,
          unlockedBadges: [
            ...next.unlockedBadges,
            ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
          ],
        };
      }
      return next;
    });
    return { awardedXp, newlyUnlocked, checkinId };
  }, []);

  const reviewGoal = useCallback(
    (checkinId: string, met: boolean, note?: string) => {
      let newlyUnlocked: string[] = [];
      let awardedXp = 0;
      setState((prev) => {
        const target = prev.checkins.find((c) => c.id === checkinId);
        if (!target) return prev;
        // Only award XP on first review
        const isFirstReview = target.goalReviewedAt == null;
        awardedXp = isFirstReview ? GOAL_REVIEW_XP : 0;
        const updated: MentalCheckin = {
          ...target,
          goalMet: met,
          goalReviewNote: note?.trim() || undefined,
          goalReviewedAt: new Date().toISOString(),
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + awardedXp,
          lastActiveDate: todayISO(),
          checkins: prev.checkins.map((c) =>
            c.id === checkinId ? updated : c
          ),
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const claimDailyQuote = useCallback(() => {
    const today = todayISO();
    let newlyUnlocked: string[] = [];
    let alreadyClaimed = false;

    setState((prev) => {
      if (prev.lastQuoteClaimDate === today) {
        alreadyClaimed = true;
        return prev;
      }
      const boostedQuoteXp = applyStreakXp(QUOTE_XP, prev);
      let next: AppState = {
        ...prev,
        xp: prev.xp + boostedQuoteXp,
        lastActiveDate: today,
        lastQuoteClaimDate: today,
      };
      const sportHabitCount = prev.profile
        ? habitsForSport(prev.profile.sport).length
        : 0;
      newlyUnlocked = evaluateBadges(next, sportHabitCount);
      if (newlyUnlocked.length > 0) {
        const now = new Date().toISOString();
        next = {
          ...next,
          unlockedBadges: [
            ...next.unlockedBadges,
            ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
          ],
        };
      }
      return next;
    });

    return {
      awardedXp: alreadyClaimed ? 0 : QUOTE_XP,
      newlyUnlocked,
      alreadyClaimed,
    };
  }, []);

  const claimDailyChallenge = useCallback(() => {
    const today = todayISO();
    let awardedXp = 0;
    let newlyUnlocked: string[] = [];
    let alreadyClaimed = false;
    let notDone = false;

    setState((prev) => {
      if (prev.lastChallengeClaimDate === today) {
        alreadyClaimed = true;
        return prev;
      }
      const challenge = todaysChallenge(today);
      const { done } = challenge.evaluate(prev, today);
      if (!done) {
        notDone = true;
        return prev;
      }
      awardedXp = challenge.xp;
      let next: AppState = {
        ...prev,
        xp: prev.xp + awardedXp,
        lastActiveDate: today,
        lastChallengeClaimDate: today,
      };
      const sportHabitCount = prev.profile
        ? habitsForSport(prev.profile.sport).length
        : 0;
      newlyUnlocked = evaluateBadges(next, sportHabitCount);
      if (newlyUnlocked.length > 0) {
        const now = new Date().toISOString();
        next = {
          ...next,
          unlockedBadges: [
            ...next.unlockedBadges,
            ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
          ],
        };
      }
      return next;
    });

    return { awardedXp, newlyUnlocked, alreadyClaimed, notDone };
  }, []);

  const completeTriviaRound = useCallback(
    (correctCount: number, totalQuestions: number) => {
      const isPerfect = correctCount === totalQuestions;
      const xpEarned = correctCount * 10 + (isPerfect ? 15 : 0);
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        let next: AppState = {
          ...prev,
          xp: prev.xp + xpEarned,
          lastActiveDate: todayISO(),
          triviaRoundsPlayed: prev.triviaRoundsPlayed + 1,
          triviaXpEarned: prev.triviaXpEarned + xpEarned,
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });

      return { awardedXp: xpEarned, newlyUnlocked };
    },
    []
  );

  const addMatch = useCallback(
    (
      m: Pick<MatchEntry, "date" | "opponent" | "event" | "location"> & {
        opponentId?: string;
      }
    ) => {
      const id = genId();
      const entry: MatchEntry = {
        id,
        date: m.date,
        opponent: m.opponent,
        opponentId: m.opponentId,
        event: m.event,
        location: m.location,
        xpEarned: 0,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        matches: [entry, ...prev.matches],
      }));
      return id;
    },
    []
  );

  const updateMatch = useCallback(
    (id: string, updates: Partial<MatchEntry>) => {
      let awardedXp = 0;
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        const existing = prev.matches.find((m) => m.id === id);
        if (!existing) return prev;

        // Figure out what was just completed for XP purposes
        const becamePreMatch =
          !existing.preMatchCompletedAt &&
          (updates.preMatchCompletedAt ||
            (updates.focusObjective && !existing.focusObjective));
        const becamePostMatch =
          !existing.postMatchCompletedAt &&
          (updates.postMatchCompletedAt ||
            (updates.result && !existing.result));

        let newXp = 0;
        if (becamePreMatch) newXp += PRE_MATCH_XP;
        if (becamePostMatch) {
          newXp += POST_MATCH_XP;
          // Bonus if full framework (pre + post both completed)
          if (existing.preMatchCompletedAt || becamePreMatch) {
            newXp += FULL_FRAMEWORK_BONUS;
          }
          // Small win bonus
          if (updates.result === "win") {
            newXp += WIN_BONUS;
          }
        }

        const merged: MatchEntry = {
          ...existing,
          ...updates,
          xpEarned: existing.xpEarned + newXp,
        };

        awardedXp = newXp;

        let next: AppState = {
          ...prev,
          xp: prev.xp + newXp,
          lastActiveDate: newXp > 0 ? todayISO() : prev.lastActiveDate,
          matches: prev.matches.map((m) => (m.id === id ? merged : m)),
        };

        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((bid) => ({
                id: bid,
                unlockedAt: now,
              })),
            ],
          };
        }
        return next;
      });

      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const deleteMatch = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== id),
    }));
  }, []);

  const saveWeeklyReview = useCallback(
    (review: Omit<WeeklyReview, "id" | "createdAt" | "xpEarned">) => {
      let newlyUnlocked: string[] = [];
      let awardedXp = 0;
      setState((prev) => {
        // If a review for this week already exists, replace it (no double XP)
        const existing = prev.weeklyReviews.find(
          (r) => r.weekStartDate === review.weekStartDate
        );
        awardedXp = existing ? 0 : WEEKLY_REVIEW_XP;
        const entry: WeeklyReview = {
          ...review,
          id: existing?.id ?? genId(),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          xpEarned: existing?.xpEarned ?? WEEKLY_REVIEW_XP,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + awardedXp,
          lastActiveDate: todayISO(),
          weeklyReviews: [
            entry,
            ...prev.weeklyReviews.filter((r) => r.id !== entry.id),
          ],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const addPowerPhrase = useCallback((text: string) => {
    let newlyUnlocked: string[] = [];
    let awardedXp = 0;
    setState((prev) => {
      const isFirst = prev.powerPhrases.length === 0;
      awardedXp = POWER_PHRASE_CREATE_XP;
      const entry: PowerPhrase = {
        id: genId(),
        text: text.trim(),
        createdAt: new Date().toISOString(),
        isPinned: isFirst, // pin the first one automatically
      };
      let next: AppState = {
        ...prev,
        xp: prev.xp + awardedXp,
        lastActiveDate: todayISO(),
        powerPhrases: [entry, ...prev.powerPhrases],
      };
      const sportHabitCount = prev.profile
        ? habitsForSport(prev.profile.sport).length
        : 0;
      newlyUnlocked = evaluateBadges(next, sportHabitCount);
      if (newlyUnlocked.length > 0) {
        const now = new Date().toISOString();
        next = {
          ...next,
          unlockedBadges: [
            ...next.unlockedBadges,
            ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
          ],
        };
      }
      return next;
    });
    return { awardedXp, newlyUnlocked };
  }, []);

  const deletePowerPhrase = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      powerPhrases: prev.powerPhrases.filter((p) => p.id !== id),
    }));
  }, []);

  const togglePinnedPhrase = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      powerPhrases: prev.powerPhrases.map((p) =>
        p.id === id
          ? { ...p, isPinned: !p.isPinned }
          : p.isPinned
          ? { ...p, isPinned: false } // only one pinned at a time
          : p
      ),
    }));
  }, []);

  const incrementPhraseUse = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      powerPhrases: prev.powerPhrases.map((p) =>
        p.id === id ? { ...p, timesUsed: (p.timesUsed ?? 0) + 1 } : p
      ),
    }));
  }, []);

  const saveNutritionLog = useCallback(
    (data: Omit<NutritionLog, "id" | "xpEarned">) => {
      let newlyUnlocked: string[] = [];
      let awardedXp = 0;
      setState((prev) => {
        const existing = prev.nutritionLogs.find((n) => n.date === data.date);
        // Count quality items to compute bonus XP
        const qualityCount = [
          data.hadProtein,
          data.hadFruitVeg,
          data.hadWholeGrains,
          data.hadHealthyFats,
        ].filter(Boolean).length;
        const bonus = qualityCount >= 3 ? NUTRITION_BONUS_XP : 0;

        awardedXp = existing ? 0 : NUTRITION_LOG_XP + bonus;
        const entry: NutritionLog = {
          ...data,
          id: existing?.id ?? genId(),
          xpEarned: existing?.xpEarned ?? NUTRITION_LOG_XP + bonus,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + awardedXp,
          lastActiveDate: todayISO(),
          nutritionLogs: [
            entry,
            ...prev.nutritionLogs.filter((n) => n.id !== entry.id),
          ],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const saveRecoveryCheckin = useCallback(
    (data: Omit<RecoveryCheckin, "id" | "xpEarned">) => {
      let newlyUnlocked: string[] = [];
      let awardedXp = 0;
      setState((prev) => {
        const existing = prev.recoveryCheckins.find(
          (r) => r.date === data.date
        );
        awardedXp = existing ? 0 : RECOVERY_CHECKIN_XP;
        const entry: RecoveryCheckin = {
          ...data,
          id: existing?.id ?? genId(),
          xpEarned: existing?.xpEarned ?? RECOVERY_CHECKIN_XP,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + awardedXp,
          lastActiveDate: todayISO(),
          recoveryCheckins: [
            entry,
            ...prev.recoveryCheckins.filter((r) => r.id !== entry.id),
          ],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp, newlyUnlocked };
    },
    []
  );

  const completeGameRound = useCallback(
    (gameId: string, score: number, xp: number) => {
      let newlyUnlocked: string[] = [];
      let isNewBest = false;
      setState((prev) => {
        const prevBest = prev.gameBestScores?.[gameId] ?? 0;
        isNewBest = score > prevBest;
        let next: AppState = {
          ...prev,
          xp: prev.xp + xp,
          lastActiveDate: todayISO(),
          gameBestScores: {
            ...(prev.gameBestScores ?? {}),
            [gameId]: Math.max(prevBest, score),
          },
          gameXpEarned: {
            ...(prev.gameXpEarned ?? {}),
            [gameId]: (prev.gameXpEarned?.[gameId] ?? 0) + xp,
          },
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp: xp, newlyUnlocked, isNewBest };
    },
    []
  );

  const addOpponent = useCallback(
    (data: Omit<OpponentEntry, "id" | "createdAt" | "updatedAt">) => {
      const id = genId();
      const entry: OpponentEntry = {
        id,
        createdAt: new Date().toISOString(),
        ...data,
      };
      setState((prev) => ({
        ...prev,
        opponents: [entry, ...prev.opponents],
      }));
      return id;
    },
    []
  );

  const updateOpponent = useCallback(
    (id: string, updates: Partial<OpponentEntry>) => {
      setState((prev) => {
        const target = prev.opponents.find((o) => o.id === id);
        if (!target) return prev;
        const updated: OpponentEntry = {
          ...target,
          ...updates,
          id: target.id,
          updatedAt: new Date().toISOString(),
        };
        // Also update any linked matches so the display name stays in sync
        const displayName = [updated.firstName, updated.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        return {
          ...prev,
          opponents: prev.opponents.map((o) => (o.id === id ? updated : o)),
          matches: prev.matches.map((m) =>
            m.opponentId === id
              ? { ...m, opponent: displayName || m.opponent }
              : m
          ),
        };
      });
    },
    []
  );

  const deleteOpponent = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      opponents: prev.opponents.filter((o) => o.id !== id),
      // Keep the matches, just remove the link (leaves the free-text name)
      matches: prev.matches.map((m) =>
        m.opponentId === id ? { ...m, opponentId: undefined } : m
      ),
    }));
  }, []);

  const addVideo = useCallback(
    async (
      blob: Blob,
      metadata: Omit<
        VideoEntry,
        | "id"
        | "createdAt"
        | "blobKey"
        | "mimeType"
        | "sizeBytes"
        | "durationSec"
        | "thumbnailDataUrl"
      >
    ) => {
      const id = genId();
      const blobKey = `vid_${id}`;
      // Persist the binary first — if this fails, metadata never appears
      await saveVideoBlob(blobKey, blob);
      // Generate thumbnail + duration (best-effort — okay to fail)
      const [thumbnailDataUrl, durationSec] = await Promise.all([
        extractThumbnail(blob).catch(() => undefined),
        getVideoDuration(blob).catch(() => undefined),
      ]);

      const entry: VideoEntry = {
        id,
        createdAt: new Date().toISOString(),
        blobKey,
        mimeType: blob.type || "video/mp4",
        sizeBytes: blob.size,
        durationSec,
        thumbnailDataUrl,
        author: metadata.author ?? "athlete",
        audience: metadata.audience ?? "self",
        ...metadata,
      };

      let newlyUnlocked: string[] = [];
      setState((prev) => {
        let next: AppState = {
          ...prev,
          xp: prev.xp + VIDEO_UPLOAD_XP,
          lastActiveDate: todayISO(),
          videos: [entry, ...prev.videos],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((bid) => ({ id: bid, unlockedAt: now })),
            ],
          };
        }
        return next;
      });

      // Phase 2B.6 — also push the video to Supabase Storage when signed
      // in. Fire-and-forget; local state stays authoritative.
      const athleteId = athleteAccountIdRef.current;
      if (athleteId) {
        uploadVideoToCloud(athleteId, entry, blob)
          .then((path) => {
            if (path) {
              setState((prev) => ({
                ...prev,
                videos: prev.videos.map((v) =>
                  v.id === entry.id ? { ...v, storagePath: path } : v
                ),
              }));
            }
          })
          .catch((e) => console.error("Video cloud upload failed", e));
      }

      return { awardedXp: VIDEO_UPLOAD_XP, newlyUnlocked, videoId: id };
    },
    []
  );

  const updateVideo = useCallback((id: string, updates: Partial<VideoEntry>) => {
    let merged: VideoEntry | undefined;
    setState((prev) => {
      const next = {
        ...prev,
        videos: prev.videos.map((v) => {
          if (v.id !== id) return v;
          merged = { ...v, ...updates, id: v.id, blobKey: v.blobKey };
          return merged;
        }),
      };
      return next;
    });
    // Also push metadata changes to the cloud
    if (merged && athleteAccountIdRef.current) {
      updateVideoMetadata(merged).catch((e) =>
        console.error("Video meta sync failed", e)
      );
    }
  }, []);

  const setVoicePersona = useCallback((id: string) => {
    setState((prev) => ({ ...prev, voicePersonaId: id }));
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    // Find blob key + storage path before we drop the row from state
    let blobKey: string | undefined;
    let storagePath: string | undefined;
    setState((prev) => {
      const target = prev.videos.find((v) => v.id === id);
      blobKey = target?.blobKey;
      storagePath = target?.storagePath;
      return {
        ...prev,
        videos: prev.videos.filter((v) => v.id !== id),
      };
    });
    if (blobKey) {
      try {
        await deleteVideoBlob(blobKey);
      } catch (e) {
        console.error("Failed to delete video blob", e);
      }
    }
    // Phase 2B.6 — also remove from cloud storage + row
    if (athleteAccountIdRef.current) {
      deleteVideoFromCloud(id, storagePath).catch((e) =>
        console.error("Video cloud delete failed", e)
      );
    }
  }, []);

  const completeMentalSession = useCallback(
    (kind: MentalSession["kind"], refId: string, xp: number) => {
      let newlyUnlocked: string[] = [];
      setState((prev) => {
        const entry: MentalSession = {
          id: genId(),
          kind,
          refId,
          date: todayISO(),
          completedAt: new Date().toISOString(),
          xpEarned: xp,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + xp,
          lastActiveDate: todayISO(),
          mentalSessions: [entry, ...prev.mentalSessions],
        };
        const sportHabitCount = prev.profile
          ? habitsForSport(prev.profile.sport).length
          : 0;
        newlyUnlocked = evaluateBadges(next, sportHabitCount);
        if (newlyUnlocked.length > 0) {
          const now = new Date().toISOString();
          next = {
            ...next,
            unlockedBadges: [
              ...next.unlockedBadges,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          };
        }
        return next;
      });
      return { awardedXp: xp, newlyUnlocked };
    },
    []
  );

  const resetAll = useCallback(() => {
    clearState();
    setState(emptyState);
  }, []);

  const hasCheckinToday = useMemo(
    () => state.checkins.some((c) => c.date === today),
    [state.checkins, today]
  );

  const hasClaimedQuoteToday = useMemo(
    () => state.lastQuoteClaimDate === today,
    [state.lastQuoteClaimDate, today]
  );

  const hasClaimedChallengeToday = useMemo(
    () => state.lastChallengeClaimDate === today,
    [state.lastChallengeClaimDate, today]
  );

  const value: StoreContextValue = {
    state,
    setProfile,
    updateProfile,
    toggleHabit,
    isHabitDoneToday,
    addPractice,
    addCheckin,
    reviewGoal,
    setDailyGoal,
    hasCheckinToday,
    hasClaimedQuoteToday,
    hasClaimedChallengeToday,
    claimDailyQuote,
    claimDailyChallenge,
    completeTriviaRound,
    addMatch,
    updateMatch,
    deleteMatch,
    completeMentalSession,
    saveWeeklyReview,
    addPowerPhrase,
    deletePowerPhrase,
    togglePinnedPhrase,
    incrementPhraseUse,
    saveRecoveryCheckin,
    saveNutritionLog,
    completeGameRound,
    addOpponent,
    updateOpponent,
    deleteOpponent,
    addVideo,
    updateVideo,
    deleteVideo,
    setVoicePersona,
    resetAll,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
