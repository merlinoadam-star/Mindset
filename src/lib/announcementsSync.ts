import { supabase } from "./supabase";

/**
 * Team announcements sync layer.
 *
 * Coaches post a one-way message, all athletes + parents connected
 * to that coach's team can read it. Each reader marks read
 * independently via a tiny join table.
 *
 * Callers don't need to filter by expiration — the server-side RLS
 * allows coaches/their team to read anything, and we render with a
 * client-side expiry filter so an expired one doesn't clutter the UI.
 */

export interface Announcement {
  id: string;
  coach_account_id: string;
  title: string | null;
  body: string;
  expires_at: string | null;
  created_at: string;
  /** Joined at read time. */
  coach_name?: string;
  /** Hydrated from team_announcement_reads for the current user. */
  read_at?: string | null;
}

const DEFAULT_EXPIRY_DAYS = 7;

function iso(d: Date): string {
  return d.toISOString();
}

export async function postAnnouncement(params: {
  coachAccountId: string;
  title?: string | null;
  body: string;
  /** Days until auto-expiry. Defaults to 7. Pass 0 / null for no expiry. */
  expiresInDays?: number | null;
}): Promise<{ announcement?: Announcement; error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const body = params.body.trim();
  if (!body) return { error: "Message is empty." };

  const days =
    typeof params.expiresInDays === "number" ? params.expiresInDays : DEFAULT_EXPIRY_DAYS;
  const expires_at =
    days > 0 ? iso(new Date(Date.now() + days * 24 * 3600 * 1000)) : null;

  const { data, error } = await supabase
    .from("team_announcements")
    .insert({
      coach_account_id: params.coachAccountId,
      title: params.title?.trim() || null,
      body,
      expires_at,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { announcement: data as Announcement };
}

/**
 * Fetch visible announcements for the current user. Result includes
 * read_at if the user has already marked read. Filters out items
 * past their expires_at client-side so expired announcements don't
 * clutter the UI even if they haven't been purged.
 */
export async function fetchAnnouncementsForMe(): Promise<Announcement[]> {
  if (!supabase) return [];
  const { data: rows, error } = await supabase
    .from("team_announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !rows) return [];

  const unexpired = (rows as Announcement[]).filter(
    (a) => !a.expires_at || new Date(a.expires_at).getTime() > Date.now()
  );
  if (unexpired.length === 0) return [];

  // Hydrate the reader's read marks.
  const ids = unexpired.map((a) => a.id);
  const { data: reads } = await supabase
    .from("team_announcement_reads")
    .select("announcement_id, read_at")
    .in("announcement_id", ids);
  const readMap = new Map<string, string>(
    (reads ?? []).map((r) => [
      (r as { announcement_id: string }).announcement_id,
      (r as { read_at: string }).read_at,
    ])
  );

  // Hydrate coach names in one round trip.
  const coachIds = [...new Set(unexpired.map((a) => a.coach_account_id))];
  const { data: coaches } = await supabase
    .from("accounts")
    .select("id, display_name")
    .in("id", coachIds);
  const nameMap = new Map<string, string>(
    (coaches ?? []).map((c) => [
      (c as { id: string }).id,
      (c as { display_name: string }).display_name ?? "",
    ])
  );

  return unexpired.map((a) => ({
    ...a,
    coach_name: nameMap.get(a.coach_account_id),
    read_at: readMap.get(a.id) ?? null,
  }));
}

export async function markAnnouncementRead(params: {
  announcementId: string;
  readerAccountId: string;
}): Promise<void> {
  if (!supabase) return;
  // Idempotent — primary key means duplicate inserts hit 23505 and
  // we swallow that silently.
  await supabase
    .from("team_announcement_reads")
    .insert({
      announcement_id: params.announcementId,
      reader_account_id: params.readerAccountId,
    })
    .then(() => {}, () => {});
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync not configured." };
  const { error } = await supabase
    .from("team_announcements")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}
