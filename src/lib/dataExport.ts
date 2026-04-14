import { supabase } from "./supabase";
import type { AppState, Account } from "../types";

/**
 * Phase 3B.3 — user data export.
 *
 * Bundles everything the signed-in user owns into a single JSON blob
 * and triggers a browser download. For athletes this is their entire
 * training history (profile, matches, practices, habits, opponents,
 * phrases, etc.). For coaches / parents it's their account plus any
 * feedback / weekly focus they've authored.
 *
 * Local state is already the source of truth for athletes (hydrated
 * from cloud on sign-in), so we export that directly. Coaches/parents
 * don't have a local state bundle — we fetch their authored rows
 * straight from Supabase.
 */

function triggerDownload(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function yyyymmdd(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Export an athlete's full local state, plus their account metadata. */
export function exportAthleteData(
  account: Account | null,
  state: AppState
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: "mindset-v1",
    account: account
      ? {
          id: account.id,
          email: account.email,
          displayName: account.displayName,
          role: account.role,
          createdAt: account.createdAt,
        }
      : null,
    // Everything athlete-scoped. Videos keep their metadata but the
    // actual blob bytes are not included — a JSON export is already big
    // enough without them.
    appState: {
      ...state,
      videos: state.videos.map((v) => ({
        ...v,
        // Drop the thumbnail data URL — it's ~10KB of base64 per video
        // and can be regenerated. Keep cloud storagePath so the user
        // could re-hydrate later if they re-import.
        thumbnailDataUrl: undefined,
      })),
    },
  };
  const safeName = (account?.displayName ?? state.profile?.name ?? "athlete")
    .replace(/[^\w-]+/g, "_")
    .toLowerCase();
  triggerDownload(`mindset-${safeName}-${yyyymmdd()}.json`, JSON.stringify(payload, null, 2));
}

/** Export everything a coach or parent has authored. */
export async function exportCoachParentData(
  account: Account
): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const [feedbackRes, focusRes, connectionsRes] = await Promise.all([
    supabase.from("feedback").select("*").eq("author_id", account.id),
    supabase.from("weekly_focus").select("*").eq("author_id", account.id),
    supabase
      .from("connections")
      .select("*")
      .or(
        `athlete_account_id.eq.${account.id},other_account_id.eq.${account.id}`
      ),
  ]);

  if (feedbackRes.error) return { error: feedbackRes.error.message };
  if (focusRes.error) return { error: focusRes.error.message };
  if (connectionsRes.error) return { error: connectionsRes.error.message };

  const payload = {
    exportedAt: new Date().toISOString(),
    schemaVersion: "mindset-v1",
    account: {
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      createdAt: account.createdAt,
    },
    feedback: feedbackRes.data ?? [],
    weeklyFocus: focusRes.data ?? [],
    connections: connectionsRes.data ?? [],
  };

  const safeName = account.displayName
    .replace(/[^\w-]+/g, "_")
    .toLowerCase();
  triggerDownload(
    `mindset-${safeName}-${yyyymmdd()}.json`,
    JSON.stringify(payload, null, 2)
  );
  return {};
}
