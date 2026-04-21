/**
 * Tiny pub-sub for sync health.
 *
 * Every data-sync function (habit completions, mental sessions, profile
 * upsert, etc.) reports success / failure here. The SyncErrorBadge
 * component subscribes and nags the athlete when writes aren't landing
 * — the whole class of "kid's streak silently broke because a batch
 * upsert failed and nobody ever opened DevTools" problems.
 *
 * In-memory only, which is fine because sync only runs while the app
 * is open. A fresh page load starts from "ok" and any real failure
 * will re-surface on the next sync attempt (debounced to ~1s after
 * any write).
 */

export type SyncStatusKind = "ok" | "error";

export interface SyncStatus {
  status: SyncStatusKind;
  when: number; // Date.now()
  table?: string; // e.g. "habit_completions" — which sync reported this
  details?: string; // error message, if any
}

type Listener = (s: SyncStatus) => void;

let listeners: Listener[] = [];
let latest: SyncStatus = { status: "ok", when: 0 };

export function reportSyncStatus(
  status: SyncStatusKind,
  opts: { table?: string; details?: string } = {}
) {
  latest = { status, when: Date.now(), table: opts.table, details: opts.details };
  for (const l of listeners) l(latest);
}

export function getLatestSyncStatus(): SyncStatus {
  return latest;
}

export function onSyncStatusChange(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
