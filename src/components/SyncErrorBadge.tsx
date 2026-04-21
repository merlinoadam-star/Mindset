import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import {
  getLatestSyncStatus,
  onSyncStatusChange,
  type SyncStatus,
} from "../lib/syncStatus";

/**
 * Nag badge that appears when a recent sync attempt failed.
 *
 * Rules:
 *   - Hidden when the latest sync succeeded.
 *   - Hidden when the device is offline (OfflineBanner covers that).
 *   - Dismissable via the ✕ button. Dismissal is scoped to this tab
 *     (no persistence) so a fresh reload will re-surface a genuine
 *     persistent failure without permanently muting it.
 *   - Shows the failing table name so a kid / parent can relay it to
 *     a maintainer instead of just seeing a generic "something broke."
 *
 * The earlier version claimed "tap to retry" and triggered a full
 * page reload, which created a frustrating loop when the underlying
 * sync was genuinely broken (e.g., one row that violates a CHECK
 * constraint) — tap, reload, same error, repeat. The new badge is
 * purely informational: it surfaces what's wrong and can be dismissed.
 * The store's auto-retry loop (30s → 2m → 5m backoff) continues
 * working in the background regardless of whether the badge is
 * visible.
 */
export default function SyncErrorBadge() {
  const [latest, setLatest] = useState<SyncStatus>(() => getLatestSyncStatus());
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [dismissedWhen, setDismissedWhen] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    return onSyncStatusChange(setLatest);
  }, []);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!online) return null;
  if (latest.status !== "error") return null;
  // Suppress re-showing the badge for failures that predate the most
  // recent dismissal. A brand-new error after dismissal (latest.when
  // strictly greater) breaks through and shows again.
  if (dismissedWhen !== null && latest.when <= dismissedWhen) return null;

  const tableLabel = latest.table
    ? latest.table.replace(/_/g, " ")
    : "Some data";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] pointer-events-auto max-w-[calc(100vw-2rem)]">
      <div className="bg-amber-500 text-white rounded-2xl shadow-elevated pl-4 pr-1.5 py-1.5 text-xs font-bold flex items-center gap-1.5">
        <AlertTriangle size={12} strokeWidth={3} />
        <span className="truncate">{tableLabel} not saving to cloud</span>
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="p-1 rounded-full hover:bg-amber-600 transition"
          aria-label={showDetails ? "Hide details" : "Show details"}
          aria-expanded={showDetails}
        >
          <ChevronDown
            size={12}
            strokeWidth={3}
            className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setDismissedWhen(latest.when)}
          className="p-1 rounded-full hover:bg-amber-600 transition"
          aria-label="Dismiss"
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
      {showDetails && (
        <div className="mt-1 mx-1 bg-slate-900 text-slate-100 rounded-xl shadow-elevated px-3 py-2 text-[10px] font-mono leading-snug break-all select-text">
          <div className="text-amber-300 font-bold mb-0.5">
            {latest.table ?? "unknown table"}
          </div>
          {latest.details ?? "(no details — check DevTools console)"}
        </div>
      )}
    </div>
  );
}
