export type Sport = "wrestling" | "volleyball";

export type Mood = 1 | 2 | 3 | 4 | 5;

export type Gender = "male" | "female" | "other" | "prefer-not-to-say";

export type Hand = "right" | "left" | "ambidextrous";

export type VolleyballPosition =
  | "setter"
  | "libero"
  | "middle-blocker"
  | "outside-hitter"
  | "opposite"
  | "defensive-specialist";

export type WrestlingStyle = "folkstyle" | "freestyle" | "greco-roman";

// ---------------------------------------------------------------------------
// Tournament & award entries
// ---------------------------------------------------------------------------
export interface TournamentEntry {
  id: string;
  name: string;
  year: number;
  result: string; // e.g. "1st", "2nd place", "Qualified", "All-Tournament Team"
}

export interface AwardEntry {
  id: string;
  name: string;
  year: number;
  note?: string;
}

// ---------------------------------------------------------------------------
// Sport-specific season stats
// ---------------------------------------------------------------------------
export interface WrestlingStats {
  season?: string; // e.g. "2024-25"
  wins?: number;
  losses?: number;
  pins?: number;
  techFalls?: number;
  majorDecisions?: number;
}

export interface VolleyballStats {
  season?: string; // e.g. "2024-25"
  matchesPlayed?: number;
  kills?: number;
  digs?: number;
  assists?: number;
  blocks?: number;
  aces?: number;
  hittingPct?: number; // e.g. 0.312
}

// ---------------------------------------------------------------------------
// Goals & self-reflection
// ---------------------------------------------------------------------------
export interface GoalsBlock {
  shortTerm?: string;
  season?: string;
  career?: string;
  strengths?: string;
  workingOn?: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export interface Profile {
  // Core identity (set during onboarding)
  name: string;
  sport: Sport;
  age: number;
  grade: string;
  createdAt: string;

  // Extended (all optional — filled in from Profile page)
  lastName?: string;
  gender?: Gender;
  heightInches?: number; // total height in inches
  weightLbs?: number;
  yearsPlaying?: number;
  teamName?: string;
  coachName?: string;
  jerseyNumber?: string;
  hometown?: string;

  // Wrestling-specific
  weightClass?: number; // e.g. 120, 132, 145
  wrestlingStyles?: WrestlingStyle[];

  // Volleyball-specific
  primaryPosition?: VolleyballPosition;
  secondaryPosition?: VolleyballPosition;
  dominantHand?: Hand;
  verticalJumpInches?: number;
  approachJumpInches?: number;

  // Stats & history
  wrestlingStats?: WrestlingStats;
  volleyballStats?: VolleyballStats;
  tournaments?: TournamentEntry[];
  awards?: AwardEntry[];
  goals?: GoalsBlock;
}

// ---------------------------------------------------------------------------
// The rest (unchanged)
// ---------------------------------------------------------------------------
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
  date: string;
  completedAt: string;
}

export interface PracticeEntry {
  id: string;
  date: string;
  durationMin: number;
  type: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  notes: string;
  drills?: string[];
  xpEarned: number;
}

export interface MentalCheckin {
  id: string;
  date: string;
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
  unlockedAt: string;
}

export interface AppState {
  profile: Profile | null;
  xp: number;
  habitCompletions: HabitCompletion[];
  practices: PracticeEntry[];
  checkins: MentalCheckin[];
  unlockedBadges: UnlockedBadge[];
  lastActiveDate: string | null;
  lastQuoteClaimDate: string | null;
  triviaRoundsPlayed: number;
  triviaXpEarned: number;
}
