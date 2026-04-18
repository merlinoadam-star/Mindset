import { supabase } from "./supabase";
import type { AccountRole } from "../types";

/**
 * Adult Chats — private coach↔parent messaging scoped to an athlete.
 *
 * The athlete has no read access (enforced at the DB level via RLS).
 * All operations here assume the caller is either the coach or the
 * parent in the thread — the DB will reject writes that don't match.
 */

export interface AdultChatMessage {
  id: string;
  athlete_account_id: string;
  coach_account_id: string;
  parent_account_id: string;
  sender_account_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
  /** Set by enrichWithNames. */
  sender_name?: string;
}

/**
 * A 1:1 thread is uniquely identified by (athlete, coach, parent).
 * Callers construct this from connection data on their side.
 */
export interface AdultChatThreadKey {
  athleteAccountId: string;
  coachAccountId: string;
  parentAccountId: string;
}

async function enrichWithNames(
  rows: AdultChatMessage[]
): Promise<AdultChatMessage[]> {
  if (!supabase || rows.length === 0) return rows;
  const ids = [...new Set(rows.map((r) => r.sender_account_id))];
  const { data: accts } = await supabase
    .from("accounts")
    .select("id, display_name")
    .in("id", ids);
  const map = new Map<string, string>(
    (accts ?? []).map((a) => [a.id, a.display_name ?? ""])
  );
  return rows.map((r) => ({
    ...r,
    sender_name: map.get(r.sender_account_id) ?? "",
  }));
}

export async function fetchAdultChatThread(
  key: AdultChatThreadKey
): Promise<{ messages: AdultChatMessage[]; error?: string }> {
  if (!supabase) return { messages: [], error: "Sync not configured." };
  const { data, error } = await supabase
    .from("adult_chats")
    .select("*")
    .eq("athlete_account_id", key.athleteAccountId)
    .eq("coach_account_id", key.coachAccountId)
    .eq("parent_account_id", key.parentAccountId)
    .order("created_at", { ascending: true });
  if (error) return { messages: [], error: error.message };
  const enriched = await enrichWithNames((data ?? []) as AdultChatMessage[]);
  return { messages: enriched };
}

export async function sendAdultChatMessage(params: {
  key: AdultChatThreadKey;
  senderAccountId: string;
  senderRole: AccountRole;
  senderName: string;
  recipientAccountId: string;
  athleteName: string;
  text: string;
}): Promise<{ message?: AdultChatMessage; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const text = params.text.trim();
  if (!text) return { error: "Message is empty." };
  if (text.length > 4000) return { error: "Message is too long (4000 char max)." };

  const { data, error } = await supabase
    .from("adult_chats")
    .insert({
      athlete_account_id: params.key.athleteAccountId,
      coach_account_id: params.key.coachAccountId,
      parent_account_id: params.key.parentAccountId,
      sender_account_id: params.senderAccountId,
      text,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Fire a push to the other adult. Fire-and-forget — the message was
  // saved whether or not the push goes through.
  const preview = text.length > 80 ? text.slice(0, 77) + "..." : text;
  const roleLabel = params.senderRole === "coach" ? "coach" : "parent";
  try {
    supabase.functions
      .invoke("send-push", {
        body: {
          toAccountId: params.recipientAccountId,
          title: `${params.senderName || roleLabel} — about ${params.athleteName}`,
          body: preview,
          url: `/chat/${params.key.athleteAccountId}/${params.senderAccountId}`,
          tag: `adult-chat-${params.key.athleteAccountId}-${params.senderAccountId}`,
          // No prefKey — adult chats aren't covered by the athlete-side
          // notification prefs. The recipient is an adult and can turn
          // off browser notifications at the OS level if needed.
        },
      })
      .then(
        () => {},
        () => {}
      );
  } catch {
    /* push is best-effort */
  }

  return { message: data as AdultChatMessage };
}

/** Mark all unread messages in a thread that were NOT sent by me as read. */
export async function markAdultChatRead(
  key: AdultChatThreadKey,
  myAccountId: string
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("adult_chats")
    .update({ read_at: new Date().toISOString() })
    .eq("athlete_account_id", key.athleteAccountId)
    .eq("coach_account_id", key.coachAccountId)
    .eq("parent_account_id", key.parentAccountId)
    .neq("sender_account_id", myAccountId)
    .is("read_at", null);
}

/**
 * Count of unread messages across ALL threads I participate in. Used
 * to show a single "you have messages" dot in navigation.
 */
export async function fetchUnreadAdultChatCount(
  myAccountId: string
): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("adult_chats")
    .select("id", { head: true, count: "exact" })
    .is("read_at", null)
    .neq("sender_account_id", myAccountId)
    .or(
      `coach_account_id.eq.${myAccountId},parent_account_id.eq.${myAccountId}`
    );
  if (error) return 0;
  return count ?? 0;
}

/**
 * Per-thread unread counts. Returns a map keyed by the OTHER
 * participant's account id (so the caller can look up by the person
 * they're chatting with).
 */
export async function fetchUnreadAdultChatByOther(
  myAccountId: string,
  athleteAccountId: string
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!supabase) return out;
  const { data, error } = await supabase
    .from("adult_chats")
    .select("coach_account_id, parent_account_id, sender_account_id")
    .eq("athlete_account_id", athleteAccountId)
    .is("read_at", null)
    .neq("sender_account_id", myAccountId)
    .or(
      `coach_account_id.eq.${myAccountId},parent_account_id.eq.${myAccountId}`
    );
  if (error || !data) return out;
  for (const row of data as Array<{
    coach_account_id: string;
    parent_account_id: string;
    sender_account_id: string;
  }>) {
    // The "other" is whichever participant isn't me.
    const other =
      row.coach_account_id === myAccountId
        ? row.parent_account_id
        : row.coach_account_id;
    out.set(other, (out.get(other) ?? 0) + 1);
  }
  return out;
}
