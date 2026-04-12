import type { AppState } from "../types";

const STORAGE_KEY = "mindset-app-state-v1";

export const emptyState: AppState = {
  profile: null,
  xp: 0,
  habitCompletions: [],
  practices: [],
  checkins: [],
  unlockedBadges: [],
  lastActiveDate: null,
  lastQuoteClaimDate: null,
  triviaRoundsPlayed: 0,
  triviaXpEarned: 0,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as AppState;
    // Merge with empty state so new fields added later don't break old data
    return { ...emptyState, ...parsed };
  } catch {
    return emptyState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
