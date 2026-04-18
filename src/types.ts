// -----------------------------------------------------------------------------
// Accounts, Roles, and Connections (Phase 2)
// -----------------------------------------------------------------------------
export type AccountRole = "athlete" | "coach" | "parent";

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  athlete: "Athlete",
  coach: "Coach",
  parent: "Parent",
};

export const ACCOUNT_ROLE_EMOJIS: Record<AccountRole, string> = {
  athlete: "🤼",
  coach: "🎯",
  parent: "👨‍👩‍👧",
};

/** The signed-in user's own account record (mirrors the auth user). */
export interface Account {
  id: string; // Supabase auth user id (UUID)
  email: string;
  displayName: string;
  role: AccountRole;
  createdAt: string;
  avatarEmoji?: string;
}

/** A connection between an account and an athlete profile. */
export type ConnectionStatus = "pending" | "accepted" | "declined" | "revoked";

export interface ConnectionRequest {
  id: string;
  athleteAccountId: string; // the athlete's account id
  otherAccountId: string; // the coach or parent's account id
  /** Who sent the invite — matters for the accept-direction UI. */
  initiatedBy: AccountRole;
  /** The role being granted: "coach" or "parent" (athletes are always athletes). */
  connectedRole: AccountRole;
  status: ConnectionStatus;
  createdAt: string;
  respondedAt?: string;
  /** Friendly labels captured at invite time (so you see names before the invite is accepted). */
  athleteName?: string;
  athleteEmail?: string;
  otherName?: string;
  otherEmail?: string;
  note?: string; // optional message from sender
}

// -----------------------------------------------------------------------------

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
  /** Stable id for sync. Older local records may not have one. */
  id?: string;
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
// Opponent Tracker
// -----------------------------------------------------------------------------
export interface OpponentEntry {
  id: string;
  firstName?: string;
  lastName: string;
  teamName?: string;
  state?: string;
  coachName?: string;
  weightClass?: string; // wrestling
  position?: string; // volleyball
  grade?: string;
  jerseyNumber?: string;
  strategyNotes?: string; // "Watch for X, weak on Y"
  generalNotes?: string;
  createdAt: string;
  updatedAt?: string;
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
  opponent?: string; // free-text display name (kept in sync with linked opponent when set)
  opponentId?: string; // link to OpponentEntry when tracked
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

  // Loss-recovery flow — only offered when result === "loss". A short
  // 3-step ritual (feel it → name it → carry one thing forward) that
  // gives the athlete a structured way to process a tough match
  // instead of ruminating.
  lossRecoveryFeeling?: LossRecoveryFeeling;
  lossRecoveryLesson?: string;
  lossRecoveryCarryType?: LossRecoveryCarryType;
  lossRecoveryCarry?: string;
  lossRecoveryCompletedAt?: string; // ISO — null until filled

  xpEarned: number;
  createdAt: string; // ISO
}

export type LossRecoveryFeeling =
  | "frustrated"
  | "disappointed"
  | "angry"
  | "sad"
  | "numb"
  | "embarrassed"
  | "proud-anyway"
  | "other";

export type LossRecoveryCarryType =
  | "did-well"
  | "do-different"
  | "phrase";

// ---------------------------------------------------------------------------
// Personal records
// ---------------------------------------------------------------------------

/**
 * One logged attempt at a PR category (e.g. "Heaviest deadlift: 225 lbs on
 * 2026-04-18"). The current best for a category is the min or max across
 * all attempts, depending on `direction`.
 *
 * `categoryKey` is a stable identifier — for built-in categories it matches
 * one of the entries in the catalog in `lib/personalRecords.ts`; for custom
 * categories the athlete created it starts with `custom-` and is unique to
 * that athlete.
 */
export interface PersonalRecordAttempt {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  unit: PersonalRecordUnit;
  direction: PersonalRecordDirection;
  value: number;
  achievedOn: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO
}

export type PersonalRecordDirection = "higher" | "lower";
export type PersonalRecordUnit =
  | "lbs"
  | "kg"
  | "reps"
  | "sec"
  | "in"
  | "cm"
  | "mph"
  | "serves";

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
  kind: "visualization" | "breathing" | "lesson" | "scenarios";
  refId: string; // id of the visualization / breathing exercise / lesson / scenario round
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
// Video Library
// -----------------------------------------------------------------------------
export type VideoTag =
  | "technique"
  | "match"
  | "drill"
  | "form-check"
  | "highlight"
  | "other";

export const VIDEO_TAG_LABELS: Record<VideoTag, string> = {
  technique: "Technique",
  match: "Match",
  drill: "Drill",
  "form-check": "Form Check",
  highlight: "Highlight",
  other: "Other",
};

export const VIDEO_TAG_EMOJIS: Record<VideoTag, string> = {
  technique: "🎯",
  match: "🏆",
  drill: "🔁",
  "form-check": "🔍",
  highlight: "⭐",
  other: "🎥",
};

/** Who is intended to review this video. */
export type VideoAudience = "self" | "coach" | "parent";

/** Source role that uploaded — prepared for Phase 2 sharing. */
export type VideoAuthor = "athlete" | "coach" | "parent";

export interface VideoEntry {
  id: string;
  title: string;
  description?: string;
  createdAt: string; // ISO
  tag: VideoTag;
  durationSec?: number;
  thumbnailDataUrl?: string; // small jpeg frame, captured at ~0.1s
  blobKey: string; // key into IndexedDB where the video blob lives
  storagePath?: string; // path inside Supabase Storage `videos` bucket (Phase 2B.6)
  mimeType: string;
  sizeBytes: number;

  // Author & audience (Phase 1 is always athlete→self; Phase 2 unlocks coach/parent)
  author?: VideoAuthor; // defaults to "athlete"
  audience?: VideoAudience; // defaults to "self"

  // Self notes (always available)
  selfNotes?: string;

  // Review loop (Phase 2 — fields are stored locally for now)
  markedForReview?: boolean;
  reviewedAt?: string; // ISO
  reviewerNotes?: string;
  sharedWith?: string[]; // ids / codes of people this was shared with (Phase 2)
}
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
  opponents: OpponentEntry[];
  checkins: MentalCheckin[];
  mentalSessions: MentalSession[];
  weeklyReviews: WeeklyReview[];
  powerPhrases: PowerPhrase[];
  recoveryCheckins: RecoveryCheckin[];
  nutritionLogs: NutritionLog[];
  videos: VideoEntry[];
  personalRecords: PersonalRecordAttempt[];
  voicePersonaId?: string; // selected TTS persona ("natural", "champ", etc.)
  unlockedBadges: UnlockedBadge[];
  lastActiveDate: string | null;
  lastQuoteClaimDate: string | null;
  /** YYYY-MM-DD of the last day they claimed the daily challenge bonus. */
  lastChallengeClaimDate?: string | null;
  /** YYYY-MM-DD of the day the combo counter applies to. */
  lastComboDate?: string | null;
  /** How many combo tiers have been rewarded today (0-6). */
  comboTiersClaimed?: number;
  /** YYYY-MM-DD of the last login bonus awarded. */
  lastLoginBonusDate?: string | null;
  /** YYYY-MM-DD of the last daily spin. */
  lastSpinDate?: string | null;
  streakFreezes: number; // unused freezes in the bank
  usedFreezeDates: string[]; // YYYY-MM-DD dates where a freeze saved the streak
  lastFreezeEarnedAt: string | null; // ISO timestamp of last earned freeze
  triviaRoundsPlayed: number;
  triviaXpEarned: number;
  // Mini-game high scores (per game)
  gameBestScores: Record<string, number>;
  gameXpEarned: Record<string, number>;
  gamePlaysCount: Record<string, number>;
}
