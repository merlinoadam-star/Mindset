import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AppState,
  MatchEntry,
  MentalCheckin,
  MentalSession,
  NutritionLog,
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
import {
  applyAutoFreezes,
  evaluateBadges,
  shouldEarnNewFreeze,
  todayISO,
} from "./gamification";

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
  completeTriviaRound: (
    correctCount: number,
    totalQuestions: number
  ) => { awardedXp: number; newlyUnlocked: string[] };
  addMatch: (m: Pick<MatchEntry, "date" | "opponent" | "event" | "location">) => string;
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
  addVideo: (
    blob: Blob,
    metadata: Omit<
      VideoEntry,
      "id" | "createdAt" | "blobKey" | "mimeType" | "sizeBytes" | "durationSec" | "thumbnailDataUrl"
    >
  ) => Promise<{ awardedXp: number; newlyUnlocked: string[]; videoId: string }>;
  updateVideo: (id: string, updates: Partial<VideoEntry>) => void;
  deleteVideo: (id: string) => Promise<void>;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
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

  useEffect(() => {
    saveState(state);
  }, [state]);

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
          awardedXp = habit.xp;
          next = {
            ...prev,
            xp: prev.xp + habit.xp,
            lastActiveDate: today,
            habitCompletions: [
              ...prev.habitCompletions,
              {
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
      const xpEarned = xpForPractice(p.durationMin, p.intensity);
      let newlyUnlocked: string[] = [];

      setState((prev) => {
        const entry: PracticeEntry = {
          ...p,
          id: genId(),
          xpEarned,
        };
        let next: AppState = {
          ...prev,
          xp: prev.xp + xpEarned,
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
          xpEarned: already ? 0 : CHECKIN_XP,
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
      let next: AppState = {
        ...prev,
        xp: prev.xp + QUOTE_XP,
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
    (m: Pick<MatchEntry, "date" | "opponent" | "event" | "location">) => {
      const id = genId();
      const entry: MatchEntry = {
        id,
        date: m.date,
        opponent: m.opponent,
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

      return { awardedXp: VIDEO_UPLOAD_XP, newlyUnlocked, videoId: id };
    },
    []
  );

  const updateVideo = useCallback((id: string, updates: Partial<VideoEntry>) => {
    setState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === id ? { ...v, ...updates, id: v.id, blobKey: v.blobKey } : v
      ),
    }));
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    // Find blob key first so we can clean up IndexedDB
    let blobKey: string | undefined;
    setState((prev) => {
      const target = prev.videos.find((v) => v.id === id);
      blobKey = target?.blobKey;
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
    () => state.checkins.some((c) => c.date === todayISO()),
    [state.checkins]
  );

  const hasClaimedQuoteToday = useMemo(
    () => state.lastQuoteClaimDate === todayISO(),
    [state.lastQuoteClaimDate]
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
    claimDailyQuote,
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
    addVideo,
    updateVideo,
    deleteVideo,
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
