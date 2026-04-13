import { supabase } from "./supabase";
import { isUuid } from "./store";
import type {
  AwardEntry,
  HabitCompletion,
  MentalCheckin,
  MentalSession,
  NutritionLog,
  OpponentEntry,
  PowerPhrase,
  PracticeEntry,
  RecoveryCheckin,
  TournamentEntry,
  UnlockedBadge,
  WeeklyReview,
} from "../types";

/**
 * Phase 2B.5 — full-data sync between the athlete and the cloud.
 *
 * Every tracked entity (habits, practices, check-ins, opponents,
 * awards, tournaments, weekly reviews, power phrases, badges) gets the
 * same treatment: upsert the local set + delete cloud rows that no
 * longer exist locally. Records without UUID ids are gracefully
 * skipped (they stay local-only).
 */

// -----------------------------------------------------------------------------
// Generic sync helper
// -----------------------------------------------------------------------------

interface WithId {
  id?: string;
}

async function syncTable<T extends WithId>(
  tableName: string,
  athleteId: string,
  localRows: T[],
  toRow: (athleteId: string, item: T) => Record<string, unknown>
): Promise<void> {
  if (!supabase) return;
  try {
    const syncable = localRows.filter((r) => r.id && isUuid(r.id));

    if (syncable.length > 0) {
      const rows = syncable.map((r) => toRow(athleteId, r));
      const { error } = await supabase
        .from(tableName)
        .upsert(rows, { onConflict: "id" });
      if (error) {
        console.error(`${tableName} upsert failed`, error);
        return;
      }
    }

    const { data: cloudIds, error: qErr } = await supabase
      .from(tableName)
      .select("id")
      .eq("athlete_id", athleteId);
    if (qErr) {
      console.error(`${tableName} id fetch failed`, qErr);
      return;
    }

    const localIdSet = new Set(
      syncable.map((r) => r.id).filter((x): x is string => Boolean(x))
    );
    const toDelete = (cloudIds ?? [])
      .map((r) => r.id as string)
      .filter((id) => !localIdSet.has(id));

    if (toDelete.length > 0) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in("id", toDelete);
      if (error) console.error(`${tableName} delete failed`, error);
    }
  } catch (e) {
    console.error(`syncTable(${tableName})`, e);
  }
}

// -----------------------------------------------------------------------------
// Row converters — client shape → DB row
// -----------------------------------------------------------------------------

const practiceToRow = (athleteId: string, p: PracticeEntry) => ({
  id: p.id,
  athlete_id: athleteId,
  date: p.date,
  duration_min: p.durationMin,
  type: p.type,
  intensity: p.intensity,
  notes: p.notes || null,
  drills: p.drills ?? null,
  xp_earned: p.xpEarned,
});

const habitToRow = (athleteId: string, h: HabitCompletion) => ({
  id: h.id,
  athlete_id: athleteId,
  habit_id: h.habitId,
  date: h.date,
  completed_at: h.completedAt,
});

const opponentToRow = (athleteId: string, o: OpponentEntry) => ({
  id: o.id,
  athlete_id: athleteId,
  first_name: o.firstName ?? null,
  last_name: o.lastName,
  team_name: o.teamName ?? null,
  state: o.state ?? null,
  coach_name: o.coachName ?? null,
  weight_class: o.weightClass ?? null,
  position: o.position ?? null,
  grade: o.grade ?? null,
  jersey_number: o.jerseyNumber ?? null,
  strategy_notes: o.strategyNotes ?? null,
  general_notes: o.generalNotes ?? null,
  created_at: o.createdAt,
  updated_at: o.updatedAt ?? null,
});

const mentalCheckinToRow = (athleteId: string, c: MentalCheckin) => ({
  id: c.id,
  athlete_id: athleteId,
  date: c.date,
  mood: c.mood,
  gratitude: c.gratitude || null,
  goal: c.goal || null,
  goal_met: c.goalMet ?? null,
  goal_review_note: c.goalReviewNote ?? null,
  goal_reviewed_at: c.goalReviewedAt ?? null,
  xp_earned: c.xpEarned,
});

const mentalSessionToRow = (athleteId: string, s: MentalSession) => ({
  id: s.id,
  athlete_id: athleteId,
  kind: s.kind,
  ref_id: s.refId,
  date: s.date,
  completed_at: s.completedAt,
  xp_earned: s.xpEarned,
});

const recoveryToRow = (athleteId: string, r: RecoveryCheckin) => ({
  id: r.id,
  athlete_id: athleteId,
  date: r.date,
  sleep_hours: r.sleepHours ?? null,
  sleep_quality: r.sleepQuality ?? null,
  soreness: r.soreness ?? null,
  energy: r.energy ?? null,
  notes: r.notes ?? null,
  xp_earned: r.xpEarned,
});

const nutritionToRow = (athleteId: string, n: NutritionLog) => ({
  id: n.id,
  athlete_id: athleteId,
  date: n.date,
  ate_breakfast: n.ateBreakfast ?? null,
  ate_lunch: n.ateLunch ?? null,
  ate_dinner: n.ateDinner ?? null,
  ate_snacks: n.ateSnacks ?? null,
  had_protein: n.hadProtein ?? null,
  had_fruit_veg: n.hadFruitVeg ?? null,
  had_whole_grains: n.hadWholeGrains ?? null,
  had_healthy_fats: n.hadHealthyFats ?? null,
  pre_workout_fuel: n.preWorkoutFuel ?? null,
  post_workout_fuel: n.postWorkoutFuel ?? null,
  water_glasses: n.waterGlasses ?? null,
  proud_of: n.proudOf ?? null,
  notes: n.notes ?? null,
  xp_earned: n.xpEarned,
});

const weeklyReviewToRow = (athleteId: string, w: WeeklyReview) => ({
  id: w.id,
  athlete_id: athleteId,
  week_start_date: w.weekStartDate,
  wins: w.wins,
  challenge: w.challenge || null,
  learned: w.learned || null,
  next_week_goal: w.nextWeekGoal || null,
  xp_earned: w.xpEarned,
  created_at: w.createdAt,
});

const powerPhraseToRow = (athleteId: string, p: PowerPhrase) => ({
  id: p.id,
  athlete_id: athleteId,
  text: p.text,
  is_pinned: p.isPinned ?? false,
  times_used: p.timesUsed ?? 0,
  created_at: p.createdAt,
});

const tournamentToRow = (athleteId: string, t: TournamentEntry) => ({
  id: t.id,
  athlete_id: athleteId,
  name: t.name,
  year: t.year,
  result: t.result,
  type: t.type ?? null,
  date: t.date ?? null,
});

const awardToRow = (athleteId: string, a: AwardEntry) => ({
  id: a.id,
  athlete_id: athleteId,
  name: a.name,
  year: a.year,
  note: a.note ?? null,
});

// -----------------------------------------------------------------------------
// Typed sync functions
// -----------------------------------------------------------------------------

export const syncPractices = (athleteId: string, list: PracticeEntry[]) =>
  syncTable("practices", athleteId, list, practiceToRow);
export const syncHabitCompletions = (
  athleteId: string,
  list: HabitCompletion[]
) => syncTable("habit_completions", athleteId, list, habitToRow);
export const syncOpponents = (athleteId: string, list: OpponentEntry[]) =>
  syncTable("opponents", athleteId, list, opponentToRow);
export const syncMentalCheckins = (
  athleteId: string,
  list: MentalCheckin[]
) => syncTable("mental_checkins", athleteId, list, mentalCheckinToRow);
export const syncMentalSessions = (
  athleteId: string,
  list: MentalSession[]
) => syncTable("mental_sessions", athleteId, list, mentalSessionToRow);
export const syncRecoveryCheckins = (
  athleteId: string,
  list: RecoveryCheckin[]
) => syncTable("recovery_checkins", athleteId, list, recoveryToRow);
export const syncNutritionLogs = (athleteId: string, list: NutritionLog[]) =>
  syncTable("nutrition_logs", athleteId, list, nutritionToRow);
export const syncWeeklyReviews = (athleteId: string, list: WeeklyReview[]) =>
  syncTable("weekly_reviews", athleteId, list, weeklyReviewToRow);
export const syncPowerPhrases = (athleteId: string, list: PowerPhrase[]) =>
  syncTable("power_phrases", athleteId, list, powerPhraseToRow);
export const syncTournaments = (
  athleteId: string,
  list: TournamentEntry[]
) => syncTable("tournaments", athleteId, list, tournamentToRow);
export const syncAwards = (athleteId: string, list: AwardEntry[]) =>
  syncTable("awards", athleteId, list, awardToRow);

// -----------------------------------------------------------------------------
// Unlocked badges — composite primary key (athlete_id, id)
// -----------------------------------------------------------------------------

export async function syncUnlockedBadges(
  athleteId: string,
  list: UnlockedBadge[]
): Promise<void> {
  if (!supabase) return;
  try {
    if (list.length > 0) {
      const rows = list.map((b) => ({
        id: b.id,
        athlete_id: athleteId,
        unlocked_at: b.unlockedAt,
      }));
      const { error } = await supabase
        .from("unlocked_badges")
        .upsert(rows, { onConflict: "athlete_id,id" });
      if (error) console.error("badges upsert failed", error);
    }
  } catch (e) {
    console.error("syncUnlockedBadges", e);
  }
}

// -----------------------------------------------------------------------------
// Fetches (for the coach / parent side)
// -----------------------------------------------------------------------------

type AnyRow = Record<string, unknown>;

async function fetchAll(
  table: string,
  athleteId: string,
  order?: { column: string; ascending: boolean }
): Promise<AnyRow[]> {
  if (!supabase) return [];
  let q = supabase.from(table).select("*").eq("athlete_id", athleteId);
  if (order) q = q.order(order.column, { ascending: order.ascending });
  const { data, error } = await q;
  if (error) {
    console.error(`fetch ${table} error`, error);
    return [];
  }
  return (data ?? []) as AnyRow[];
}

export async function fetchAllAthleteData(athleteId: string) {
  if (!supabase) return null;
  const [
    practices,
    habits,
    opponents,
    mentalCheckins,
    recovery,
    nutrition,
    weeklyReviews,
    powerPhrases,
    tournaments,
    awards,
    badges,
    mentalSessions,
  ] = await Promise.all([
    fetchAll("practices", athleteId, { column: "date", ascending: false }),
    fetchAll("habit_completions", athleteId, { column: "date", ascending: false }),
    fetchAll("opponents", athleteId),
    fetchAll("mental_checkins", athleteId, { column: "date", ascending: false }),
    fetchAll("recovery_checkins", athleteId, { column: "date", ascending: false }),
    fetchAll("nutrition_logs", athleteId, { column: "date", ascending: false }),
    fetchAll("weekly_reviews", athleteId, { column: "week_start_date", ascending: false }),
    fetchAll("power_phrases", athleteId),
    fetchAll("tournaments", athleteId, { column: "year", ascending: false }),
    fetchAll("awards", athleteId, { column: "year", ascending: false }),
    fetchAll("unlocked_badges", athleteId, { column: "unlocked_at", ascending: false }),
    fetchAll("mental_sessions", athleteId, { column: "date", ascending: false }),
  ]);

  return {
    practices,
    habits,
    opponents,
    mentalCheckins,
    recovery,
    nutrition,
    weeklyReviews,
    powerPhrases,
    tournaments,
    awards,
    badges,
    mentalSessions,
  };
}
