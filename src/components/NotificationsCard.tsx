import { useEffect, useState } from "react";
import { useAuth } from "../lib/authContext";
import {
  currentPermission,
  hasActiveSubscription,
  isPushSupported,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from "../lib/pushSubscription";
import { Bell, BellOff, AlertCircle } from "lucide-react";

/**
 * Settings card for enabling / disabling push notifications on this
 * device. Handles the whole permission → subscribe → save loop and
 * shows clear states for every possible outcome.
 */
export default function NotificationsCard() {
  const { user, configured } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    currentPermission()
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!isPushSupported) return;
      const has = await hasActiveSubscription();
      setSubscribed(has);
      setPermission(currentPermission());
    })();
  }, []);

  if (!configured || !user) return null;

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      const perm = await requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError(
          perm === "denied"
            ? "Notification permission was denied. You can change it in your browser settings."
            : "Permission not granted."
        );
        return;
      }
      const { error: subErr } = await subscribeToPush(user!.id);
      if (subErr) {
        setError(subErr);
        return;
      }
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }

  const notSupported = !isPushSupported;
  const denied = permission === "denied";

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            subscribed
              ? "bg-gradient-to-br from-purple-500 to-brand-600 text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900">Push Notifications</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Get alerts when your coach cheers you on
          </div>
        </div>
      </div>

      {notSupported && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            This browser doesn&apos;t support push notifications. On iPhone,
            add the app to your Home Screen first (Share → Add to Home
            Screen), then open it from there.
          </div>
        </div>
      )}

      {!notSupported && denied && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-900 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <div>
            Notifications are blocked. Open your browser&apos;s site settings
            and allow notifications for this site, then come back.
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-900">
          {error}
        </div>
      )}

      {!notSupported && !denied && (
        <button
          onClick={subscribed ? disable : enable}
          disabled={busy}
          className={`mt-3 w-full py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 ${
            subscribed
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-gradient-to-r from-purple-600 to-brand-600 text-white"
          }`}
        >
          {busy
            ? "Please wait..."
            : subscribed
            ? "Turn off notifications on this device"
            : "Enable notifications"}
        </button>
      )}

      {subscribed && (
        <p className="text-[11px] text-slate-500 mt-2 text-center">
          ✓ This device is subscribed. Enable on other devices separately.
        </p>
      )}
    </div>
  );
}
