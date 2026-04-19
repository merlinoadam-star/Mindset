import { supabase } from "./supabase";

/**
 * Coach-pushed practice plan sync layer.
 *
 * A plan is a (coach, athlete, day) tuple carrying a list of items.
 * Items are stored as JSONB on the plan row; completions live in a
 * separate table so the coach's authored content stays immutable
 * and the athlete's ticks are isolated per row.
 */

export interface PracticePlanItem {
  id: string;         // stable per-item id (uuid or nanoid) — lives inside the JSONB
  label: string;      // "3 rounds of live goes"
  description?: string; // optional "focus on bottom position"
  xp: number;         // reward when ticked
}

export interface PracticePlan {
  id: string;
  coach_account_id: string;
  athlete_account_id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  items: PracticePlanItem[];
  created_at: string;
  updated_at: string;
}

export interface PracticePlanCompletion {
  plan_id: string;
  item_id: string;
  athlete_account_id: string;
  xp_awarded: number;
  completed_at: string;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Coach creates or replaces today's plan for a specific athlete.
 * Uses ON CONFLICT via upsert on (coach, athlete, date) so pushing
 * again overwrites the prior plan for the day.
 */
export async function upsertPracticePlan(params: {
  coachAccountId: string;
  athleteAccountId: string;
  date?: string;      // defaults to today
  title: string;
  items: PracticePlanItem[];
}): Promise<{ plan?: PracticePlan; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const date = params.date ?? todayISO();

  const { data, error } = await supabase
    .from("coach_practice_plans")
    .upsert(
      {
        coach_account_id: params.coachAccountId,
        athlete_account_id: params.athleteAccountId,
        date,
        title: params.title,
        items: params.items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "coach_account_id,athlete_account_id,date" }
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { plan: data as PracticePlan };
}

/**
 * Athlete-side: fetch today's plan (if any) plus their completion
 * state for it. Returns `null` if no plan was pushed for today.
 */
export async function fetchTodaysPlanForAthlete(
  athleteAccountId: string
): Promise<{
  plan: PracticePlan | null;
  completions: PracticePlanCompletion[];
  coachName?: string;
}> {
  if (!supabase) return { plan: null, completions: [] };
  const date = todayISO();

  const { data: planRow } = await supabase
    .from("coach_practice_plans")
    .select("*")
    .eq("athlete_account_id", athleteAccountId)
    .eq("date", date)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!planRow) return { plan: null, completions: [] };

  const plan = planRow as PracticePlan;
  const { data: comps } = await supabase
    .from("coach_practice_plan_completions")
    .select("*")
    .eq("plan_id", plan.id)
    .eq("athlete_account_id", athleteAccountId);

  // Look up coach's display name — nice-to-have for the card header.
  let coachName: string | undefined;
  const { data: coach } = await supabase
    .from("accounts")
    .select("display_name")
    .eq("id", plan.coach_account_id)
    .maybeSingle();
  if (coach && "display_name" in coach) {
    coachName = (coach as { display_name?: string }).display_name ?? undefined;
  }

  return {
    plan,
    completions: (comps ?? []) as PracticePlanCompletion[],
    coachName,
  };
}

/**
 * Mark an item complete. Idempotent — repeat calls hit the primary-
 * key unique constraint and return 23505; we swallow that.
 */
export async function completePlanItem(params: {
  planId: string;
  itemId: string;
  athleteAccountId: string;
  xp: number;
}): Promise<{ error?: string; alreadyComplete?: boolean }> {
  if (!supabase) return { error: "Sync not configured." };
  const { error } = await supabase
    .from("coach_practice_plan_completions")
    .insert({
      plan_id: params.planId,
      item_id: params.itemId,
      athlete_account_id: params.athleteAccountId,
      xp_awarded: params.xp,
    });
  if (error) {
    if (error.code === "23505") return { alreadyComplete: true };
    return { error: error.message };
  }
  return {};
}

/**
 * Un-tick an item.
 */
export async function uncompletePlanItem(params: {
  planId: string;
  itemId: string;
  athleteAccountId: string;
}): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const { error } = await supabase
    .from("coach_practice_plan_completions")
    .delete()
    .eq("plan_id", params.planId)
    .eq("item_id", params.itemId)
    .eq("athlete_account_id", params.athleteAccountId);
  if (error) return { error: error.message };
  return {};
}

/**
 * Small stable id helper for inline item ids.
 */
export function generateItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
