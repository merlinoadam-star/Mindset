import { supabase } from "./supabase";
import type { Profile } from "../types";
import { reportSyncStatus } from "./syncStatus";

/**
 * Phase 2B.2 — syncing the athlete's profile to Supabase.
 *
 * We keep localStorage as the working store (fast, offline-capable).
 * When the athlete is signed in, we write their profile through to the
 * cloud on change. Coaches and parents read from the cloud to see the
 * athlete's data.
 *
 * The sync is one-way for now (local → cloud). Two-way sync is future
 * work once we handle conflict resolution.
 */

function profileToRow(
  accountId: string,
  profile: Profile,
  xp: number,
  voicePersonaId: string,
  usedFreezeDates: string[]
) {
  return {
    id: accountId,
    name: profile.name,
    last_name: profile.lastName ?? null,
    sport: profile.sport,
    age: profile.age,
    grade: profile.grade,
    gender: profile.gender ?? null,
    height_inches: profile.heightInches ?? null,
    weight_lbs: profile.weightLbs ?? null,
    years_playing: profile.yearsPlaying ?? null,
    team_name: profile.teamName ?? null,
    coach_name: profile.coachName ?? null,
    jersey_number: profile.jerseyNumber ?? null,
    hometown: profile.hometown ?? null,
    weight_class: profile.weightClass ?? null,
    wrestling_styles: profile.wrestlingStyles ?? null,
    primary_position: profile.primaryPosition ?? null,
    secondary_position: profile.secondaryPosition ?? null,
    dominant_hand: profile.dominantHand ?? null,
    vertical_jump_inches: profile.verticalJumpInches ?? null,
    approach_jump_inches: profile.approachJumpInches ?? null,
    goals: profile.goals ?? null,
    wrestling_stats: profile.wrestlingStats ?? null,
    volleyball_stats: profile.volleyballStats ?? null,
    xp,
    voice_persona_id: voicePersonaId,
    // Synced so the coach-roster streak can apply the same freeze
    // logic the athlete app uses locally. See streak_freezes.sql.
    used_freeze_dates: usedFreezeDates,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertAthleteProfile(
  accountId: string,
  profile: Profile,
  xp: number,
  voicePersonaId: string,
  usedFreezeDates: string[]
): Promise<{ error?: string }> {
  if (!supabase) return {};
  const row = profileToRow(
    accountId,
    profile,
    xp,
    voicePersonaId,
    usedFreezeDates
  );
  const { error } = await supabase
    .from("athletes")
    .upsert(row, { onConflict: "id" });
  if (error) {
    console.error("Failed to sync athlete profile", error);
    reportSyncStatus("error", {
      table: "athletes",
      details: error.message,
    });
    return { error: error.message };
  }
  reportSyncStatus("ok", { table: "athletes" });
  return {};
}

/**
 * Returned as-is from the database. Snake-case fields from Postgres are
 * mapped back to the client-side Profile shape by fetchAthleteProfile().
 */
export interface DbAthleteRow {
  id: string;
  name: string;
  last_name: string | null;
  sport: "wrestling" | "volleyball";
  age: number;
  grade: string;
  gender: string | null;
  height_inches: number | null;
  weight_lbs: number | null;
  years_playing: number | null;
  team_name: string | null;
  coach_name: string | null;
  jersey_number: string | null;
  hometown: string | null;
  weight_class: number | null;
  wrestling_styles: string[] | null;
  primary_position: string | null;
  secondary_position: string | null;
  dominant_hand: string | null;
  vertical_jump_inches: number | null;
  approach_jump_inches: number | null;
  goals: Record<string, unknown> | null;
  wrestling_stats: Record<string, unknown> | null;
  volleyball_stats: Record<string, unknown> | null;
  xp: number;
  voice_persona_id: string | null;
  used_freeze_dates: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAthleteProfile(
  athleteId: string
): Promise<DbAthleteRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", athleteId)
    .maybeSingle();
  if (error) {
    console.error("Failed to fetch athlete profile", error);
    return null;
  }
  return data as DbAthleteRow | null;
}

/** Convert a database row back into the client-side Profile shape. */
export function rowToProfile(row: DbAthleteRow): Profile {
  return {
    name: row.name,
    lastName: row.last_name ?? undefined,
    sport: row.sport,
    age: row.age,
    grade: row.grade,
    gender: (row.gender ?? undefined) as Profile["gender"],
    heightInches: row.height_inches ?? undefined,
    weightLbs: row.weight_lbs ?? undefined,
    yearsPlaying: row.years_playing ?? undefined,
    teamName: row.team_name ?? undefined,
    coachName: row.coach_name ?? undefined,
    jerseyNumber: row.jersey_number ?? undefined,
    hometown: row.hometown ?? undefined,
    weightClass: row.weight_class ?? undefined,
    wrestlingStyles: row.wrestling_styles as Profile["wrestlingStyles"],
    primaryPosition: (row.primary_position ??
      undefined) as Profile["primaryPosition"],
    secondaryPosition: (row.secondary_position ??
      undefined) as Profile["secondaryPosition"],
    dominantHand: (row.dominant_hand ?? undefined) as Profile["dominantHand"],
    verticalJumpInches: row.vertical_jump_inches ?? undefined,
    approachJumpInches: row.approach_jump_inches ?? undefined,
    goals: (row.goals ?? undefined) as Profile["goals"],
    wrestlingStats: (row.wrestling_stats ??
      undefined) as Profile["wrestlingStats"],
    volleyballStats: (row.volleyball_stats ??
      undefined) as Profile["volleyballStats"],
    createdAt: row.created_at,
  };
}
