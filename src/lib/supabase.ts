import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client factory with graceful fallback.
 *
 * If the environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * are not set, the app still runs — it just falls back to local-only mode
 * (no cloud sync, no accounts, no connections). This keeps Phase 1 users
 * unaffected until the athlete's family is ready to turn on Phase 2.
 *
 * When both vars are set, the exported `supabase` is a live client. When
 * they aren't, it's `null` — every call site must check.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Helper for guard clauses — throws a clear error if called when unconfigured. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY to your environment variables."
    );
  }
  return supabase;
}
