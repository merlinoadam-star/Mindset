import { supabase } from "./supabase";
import { isUuid } from "./store";
import type {
  PersonalRecordAttempt,
  PersonalRecordDirection,
  PersonalRecordUnit,
} from "../types";

/**
 * Sync layer for personal_records. Same pattern as matchSync: full
 * upsert + delete-diff. Fire-and-forget; local state stays authoritative.
 */

interface DbPersonalRecordRow {
  id: string;
  athlete_id: string;
  category_key: string;
  category_label: string;
  unit: string;
  direction: "higher" | "lower";
  value: number;
  achieved_on: string;
  notes: string | null;
  created_at: string;
}

function attemptToRow(athleteId: string, a: PersonalRecordAttempt) {
  return {
    id: a.id,
    athlete_id: athleteId,
    category_key: a.categoryKey,
    category_label: a.categoryLabel,
    unit: a.unit,
    direction: a.direction,
    value: a.value,
    achieved_on: a.achievedOn,
    notes: a.notes ?? null,
    created_at: a.createdAt,
  };
}

export async function syncAllPersonalRecords(
  athleteId: string,
  local: PersonalRecordAttempt[]
): Promise<void> {
  if (!supabase) return;
  try {
    const syncable = local.filter((a) => isUuid(a.id));
    if (syncable.length > 0) {
      const rows = syncable.map((a) => attemptToRow(athleteId, a));
      const { error: upErr } = await supabase
        .from("personal_records")
        .upsert(rows, { onConflict: "id" });
      if (upErr) {
        console.error("personal_records upsert failed", upErr);
        return;
      }
    }

    const { data: cloudIds, error: qErr } = await supabase
      .from("personal_records")
      .select("id")
      .eq("athlete_id", athleteId);
    if (qErr) {
      console.error("personal_records cloud-id fetch failed", qErr);
      return;
    }

    const localIdSet = new Set(syncable.map((a) => a.id));
    const toDelete = (cloudIds ?? [])
      .map((r) => r.id as string)
      .filter((id) => !localIdSet.has(id));

    if (toDelete.length > 0) {
      const { error: dErr } = await supabase
        .from("personal_records")
        .delete()
        .in("id", toDelete);
      if (dErr) console.error("personal_records cloud delete failed", dErr);
    }
  } catch (e) {
    console.error("syncAllPersonalRecords error", e);
  }
}

export async function fetchPersonalRecordsForAthlete(
  athleteId: string
): Promise<PersonalRecordAttempt[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("achieved_on", { ascending: false });
  if (error) {
    console.error("fetchPersonalRecordsForAthlete error", error);
    return [];
  }
  return (data ?? []).map(rowToAttempt);
}

export function rowToAttempt(row: DbPersonalRecordRow): PersonalRecordAttempt {
  return {
    id: row.id,
    categoryKey: row.category_key,
    categoryLabel: row.category_label,
    unit: row.unit as PersonalRecordUnit,
    direction: row.direction as PersonalRecordDirection,
    value: Number(row.value),
    achievedOn: row.achieved_on,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}
