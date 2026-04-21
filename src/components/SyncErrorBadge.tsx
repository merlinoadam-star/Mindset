import { useEffect, useState } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import {
  getLatestSyncStatus,
  onSyncStatusChange,
  type SyncStatus,
} from "../lib/syncStatus";

/**
 * Nag badge that appears when a recent sync attempt failed. Kids can't
 * escalate problems they don't see — without this, a silent sync
 * failure means their streak quietly breaks from the coach's view and
 * nobody notices for days.
 *
 * Appearance:
 *   - Hidden when the latest sync succeeded.
 *   - Hidden when the device is offline (OfflineBanner covers that).
 *   - Shown as a small amber pill above the bottom nav when online
 *     and the last sync failed. Tapping hard-reloads — crude but
 *     reliable; a fresh page load re-runs cloud hydration which
 *     re-attempts every sync against the current DB state.
 */
export default function SyncErrorBadge() {
  const [latest, setLatest] = useState<SyncStatus>(() => getLatestSyncStatus());
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

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

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] pointer-events-none">
      <button
        onClick={() => window.location.reload()}
        className="pointer-events-auto bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-elevated px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition active:scale-[0.97]"
        aria-label="Sync failed — tap to retry"
      >
        <AlertTriangle size={12} strokeWidth={3} />
        <span>Progress not saving — tap to retry</span>
        <RotateCw size={12} strokeWidth={3} />
      </button>
    </div>
  );
}
