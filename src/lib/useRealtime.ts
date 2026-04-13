import { useEffect, useRef } from "react";
import type {
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Config {
  /** Postgres table name (in the public schema). */
  table: string;
  /** Optional PostgREST-style filter e.g. "athlete_id=eq.<uuid>". */
  filter?: string;
  /** Default: any event. */
  event?: Event;
  /** Disable the subscription (e.g. when user isn't signed in yet). */
  enabled?: boolean;
}

/**
 * Subscribe to Supabase Realtime changes on a single table. Calls
 * `onChange` any time a matching row is INSERTed / UPDATEd / DELETEd.
 *
 * Usage:
 *   useRealtime(
 *     { table: "feedback", filter: `athlete_id=eq.${id}` },
 *     () => refetch()
 *   );
 *
 * The onChange callback is wrapped in a ref so callers don't have to
 * memoize it. Safe when Supabase is unconfigured (no-ops).
 */
export function useRealtime(
  config: Config,
  onChange: (payload?: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): void {
  const fnRef = useRef(onChange);
  useEffect(() => {
    fnRef.current = onChange;
  }, [onChange]);

  const { table, filter, event = "*", enabled = true } = config;

  useEffect(() => {
    if (!supabase || !enabled) return;

    // Unique channel name per (table, filter, event) so React strict-mode
    // double-mounts don't collide.
    const channelName = `rt:${table}:${filter ?? "*"}:${event}:${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const subscriptionConfig: RealtimePostgresChangesFilter<"*"> = {
      event,
      schema: "public",
      table,
      ...(filter ? { filter } : {}),
    } as RealtimePostgresChangesFilter<"*">;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        subscriptionConfig,
        (payload) => fnRef.current(payload)
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [table, filter, event, enabled]);
}
