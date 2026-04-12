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
/** Type of competition — tournaments, duals, individual matches, camps, etc. */
export type CompetitionType =
  | "tournament"
  | "dual"
  | "match"
  | "scrimmage"
  | "showcase"
  | "camp"
  | "other";

export interface TournamentEntry {
  id: string;
  name: string;
  year: number;
  result: string; // e.g. "1st", "2nd place", "Qualified", "All-Tournament Team"
  type?: CompetitionType; // defaults to "tournament" for backward compat
  date?: string; // optional YYYY-MM-DD for more specific dating
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
  // Process goals — what you'll DO (controllable, daily actions)
  processWeek?: string;
  processSeason?: string;
  // Outcome goals — what you want to ACHIEVE
  outcomeSeason?: string;
  outcomeCareer?: string;
  // Self-reflection
  strengths?: string;
  workingOn?: string;
  // Legacy fields — kept so existing data isn't lost
  shortTerm?: string;
  season?: string;
  career?: string;
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
  /** End-of-day goal review — undefined = not reviewed yet */
  goalMet?: boolean;
  goalReviewNote?: string;
  goalReviewedAt?: string; // ISO timestamp
  xpEarned: number;
}

// -----------------------------------------------------------------------------
// Matches — pre-match + post-match framework with Well/Better/Next reflection
// -----------------------------------------------------------------------------
export type MatchResult = "win" | "loss" | "tie";

export type WrestlingWinType =
  | "decision"
  | "major-decision"
  | "tech-fall"
  | "pin"
  | "forfeit"
  | "disqualification"
  | "injury-default";

export const WRESTLING_WIN_TYPE_LABELS: Record<WrestlingWinType, string> = {
  decision: "Decision",
  "major-decision": "Major Decision",
  "tech-fall": "Tech Fall",
  pin: "Pin",
  forfeit: "Forfeit",
  disqualification: "DQ",
  "injury-default": "Injury Default",
};

export interface WrestlingMatchDetails {
  winType?: WrestlingWinType;
  myScore?: number;
  theirScore?: number;
  pinTimeSeconds?: number; // if won by pin
  ridingTimeSeconds?: number;
  weightClass?: number;
}

export interface VolleyballSetScore {
  us: number;
  them: number;
}

export interface VolleyballMatchDetails {
  setScores?: VolleyballSetScore[]; // up to 5 sets
  positionPlayed?: VolleyballPosition;
  kills?: number;
  digs?: number;
  assists?: number;
  blocks?: number;
  aces?: number;
  errors?: number;
}

export interface MatchEntry {
  id: string;
  date: string; // YYYY-MM-DD

  // Basic info
  opponent?: string;
  event?: string; // tournament / meet / dual name
  location?: string;

  // Pre-match (the mental game)
  focusObjective?: string; // one-line goal for the match
  executeThis?: string; // one technique or play to nail
  mentalStateBefore?: Mood; // 1-5
  visualizationNote?: string;
  preMatchCompletedAt?: string; // ISO — null until filled

  // Post-match result
  result?: MatchResult;
  wrestling?: WrestlingMatchDetails;
  volleyball?: VolleyballMatchDetails;
  performanceRating?: Mood; // 1-5

  // Well / Better / Next reflection
  wentWell?: string;
  couldBeBetter?: string;
  nextFocus?: string;
  gratitude?: string;
  lessonLearned?: string;
  postMatchCompletedAt?: string; // ISO — null until filled

  xpEarned: number;
  createdAt: string; // ISO
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

export interface MentalSession {
  id: string;
  kind: "visualization" | "breathing" | "lesson";
  refId: string; // id of the visualization / breathing exercise / lesson
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO
  xpEarned: number;
}

// -----------------------------------------------------------------------------
// Weekly Review — Sunday-night style reflection
// -----------------------------------------------------------------------------
export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD of Monday
  wins: [string, string, string];
  challenge: string;
  learned: string;
  nextWeekGoal: string;
  createdAt: string;
  xpEarned: number;
}

// -----------------------------------------------------------------------------
// Power Phrases — athlete-authored mantras / self-talk
// -----------------------------------------------------------------------------
export interface PowerPhrase {
  id: string;
  text: string;
  createdAt: string;
  isPinned?: boolean;
  timesUsed?: number;
}

// -----------------------------------------------------------------------------
// Recovery Check-In — physical state tracking
// -----------------------------------------------------------------------------
export interface RecoveryCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours?: number;
  sleepQuality?: Mood; // 1 = terrible, 5 = excellent
  soreness?: Mood; // 1 = fresh, 5 = very sore
  energy?: Mood; // 1 = drained, 5 = charged
  notes?: string;
  xpEarned: number;
}

// -----------------------------------------------------------------------------
// Nutrition Log — positive fueling tracker (no calorie counting)
// -----------------------------------------------------------------------------
export interface NutritionLog {
  id: string;
  date: string; // YYYY-MM-DD
  // Did you eat these meals today?
  ateBreakfast?: boolean;
  ateLunch?: boolean;
  ateDinner?: boolean;
  ateSnacks?: boolean;
  // Food quality — tap to toggle
  hadProtein?: boolean;
  hadFruitVeg?: boolean;
  hadWholeGrains?: boolean;
  hadHealthyFats?: boolean;
  // Workout fueling
  preWorkoutFuel?: boolean;
  postWorkoutFuel?: boolean;
  // Hydration
  waterGlasses?: number; // 0-12+
  // Reflection
  proudOf?: string;
  notes?: string;
  xpEarned: number;
}

export interface AppState {
  profile: Profile | null;
  xp: number;
  habitCompletions: HabitCompletion[];
  practices: PracticeEntry[];
  matches: MatchEntry[];
  checkins: MentalCheckin[];
  mentalSessions: MentalSession[];
  weeklyReviews: WeeklyReview[];
  powerPhrases: PowerPhrase[];
  recoveryCheckins: RecoveryCheckin[];
  nutritionLogs: NutritionLog[];
  unlockedBadges: UnlockedBadge[];
  lastActiveDate: string | null;
  lastQuoteClaimDate: string | null;
  streakFreezes: number; // unused freezes in the bank
  usedFreezeDates: string[]; // YYYY-MM-DD dates where a freeze saved the streak
  lastFreezeEarnedAt: string | null; // ISO timestamp of last earned freeze
  triviaRoundsPlayed: number;
  triviaXpEarned: number;
  // Mini-game high scores (per game)
  gameBestScores: Record<string, number>;
  gameXpEarned: Record<string, number>;
}
