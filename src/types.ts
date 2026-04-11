export type Sport = "wrestling" | "volleyball";

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface Profile {
  name: string;
  sport: Sport;
  age: number;
  grade: string;
  createdAt: string; // ISO date
}

export interface HabitDefinition {
  id: string;
  label: string;
  description: string;
  emoji: string;
  xp: number;
  sports: Sport[] | "all";
  category: "physical" | "mental" | "recovery" | "skill";
}

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
}

export interface PracticeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  durationMin: number;
  type: string; // e.g. "drilling", "live", "serving", "scrimmage"
  intensity: 1 | 2 | 3 | 4 | 5;
  notes: string;
  drills?: string[]; // specific skill drills worked on this session
  xpEarned: number;
}

export interface MentalCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  mood: Mood;
  gratitude: string;
  goal: string;
  xpEarned: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: string;
}

export interface UnlockedBadge {
  id: string;
  unlockedAt: string; // ISO timestamp
}

export interface AppState {
  profile: Profile | null;
  xp: number;
  habitCompletions: HabitCompletion[];
  practices: PracticeEntry[];
  checkins: MentalCheckin[];
  unlockedBadges: UnlockedBadge[];
  lastActiveDate: string | null; // YYYY-MM-DD — last day any XP was earned
  lastQuoteClaimDate: string | null; // YYYY-MM-DD — last day the daily quote XP was claimed
}
