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
  PracticeEntry,
  Profile,
} from "../types";
import { emptyState, loadState, saveState, clearState } from "./storage";
import { habitsForSport, getHabit } from "./habits";
import { evaluateBadges, todayISO } from "./gamification";

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
const QUOTE_XP = 10;
const PRE_MATCH_XP = 15;
const POST_MATCH_XP = 30;
const FULL_FRAMEWORK_BONUS = 10;
const WIN_BONUS = 5;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

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
        const entry: MentalCheckin = {
          ...c,
          id: already?.id ?? genId(),
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
    hasCheckinToday,
    hasClaimedQuoteToday,
    claimDailyQuote,
    completeTriviaRound,
    addMatch,
    updateMatch,
    deleteMatch,
    completeMentalSession,
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
