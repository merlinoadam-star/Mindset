import { supabase } from "./supabase";
import { clearState } from "./storage";

/**
 * Phase 3B.2 — permanent account deletion.
 *
 * Invokes the `delete-account` edge function, which uses the service
 * role to wipe every row owned by the caller and then drops their auth
 * user. Afterwards we clear local storage + sign out so the browser
 * isn't left pointing at a now-nonexistent user.
 */

export async function deleteMyAccount(): Promise<{ error?: string }> {
  if (!supabase) return { error: "Sync isn't configured." };

  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: {},
  });
  if (error) return { error: error.message };
  if (data && data.ok === false) {
    return { error: data.error ?? "Account deletion failed." };
  }

  // Clear local state first so the redirect lands on a fresh app shell.
  clearState();

  // Sign out to clear any cached tokens.
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore — the auth user is already gone on the server */
  }

  return {};
}
