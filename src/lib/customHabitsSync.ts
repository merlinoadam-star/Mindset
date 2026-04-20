import { supabase } from "./supabase";
import type { HabitDefinition } from "../types";

/**
 * Custom habits sync layer. The DB row uses the same shape as the
 * preset HabitDefinition (modulo `sports`, which doesn't apply to a
 * single athlete's personal habit). We map to the same interface so
 * downstream code can treat preset + custom uniformly.
 */

export interface CustomHabitRow {
  id: string;
  athlete_account_id: string;
  label: string;
  description: string | null;
  emoji: string;
  xp: number;
  category: HabitDefinition["category"];
  created_at: string;
  updated_at: string;
}

/** Convert a DB row into the HabitDefinition shape used by the UI. */
export function rowToHabit(row: CustomHabitRow): HabitDefinition {
  return {
    id: row.id, // UUID — preset ids are short strings, no collision
    label: row.label,
    description: row.description ?? "",
    emoji: row.emoji,
    xp: row.xp,
    sports: "all",
    category: row.category,
  };
}

export async function fetchCustomHabits(
  athleteAccountId: string
): Promise<CustomHabitRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("custom_habits")
    .select("*")
    .eq("athlete_account_id", athleteAccountId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as CustomHabitRow[];
}

export interface CreateCustomHabitInput {
  athleteAccountId: string;
  label: string;
  description?: string | null;
  emoji?: string;
  xp?: number;
  category?: HabitDefinition["category"];
}

export async function createCustomHabit(
  input: CreateCustomHabitInput
): Promise<{ row?: CustomHabitRow; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const label = input.label.trim();
  if (!label) return { error: "Give your habit a name." };

  const { data, error } = await supabase
    .from("custom_habits")
    .insert({
      athlete_account_id: input.athleteAccountId,
      label,
      description: input.description?.trim() || null,
      emoji: input.emoji || "⭐",
      xp:
        typeof input.xp === "number" && input.xp >= 0 && input.xp <= 50
          ? Math.round(input.xp)
          : 10,
      category: input.category ?? "physical",
    })
    .select()
    .single();
  if (error) return { error: error.message };
  return { row: data as CustomHabitRow };
}

export async function deleteCustomHabit(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const { error } = await supabase.from("custom_habits").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function updateCustomHabit(
  id: string,
  patch: Partial<Omit<CustomHabitRow, "id" | "athlete_account_id" | "created_at" | "updated_at">>
): Promise<{ row?: CustomHabitRow; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const { data, error } = await supabase
    .from("custom_habits")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { error: error.message };
  return { row: data as CustomHabitRow };
}
