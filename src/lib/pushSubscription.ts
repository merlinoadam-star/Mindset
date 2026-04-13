import { supabase } from "./supabase";

/**
 * Web Push subscription flow.
 *
 * Steps:
 *   1. Register the service worker at /sw.js
 *   2. Ask the user for Notification permission
 *   3. Call pushManager.subscribe() with our VAPID public key
 *   4. Persist the subscription's endpoint + keys in Supabase so the
 *      Edge Function can look them up when it needs to send a push
 *
 * The VAPID public key must be set via VITE_VAPID_PUBLIC_KEY. When
 * that's missing, registration is skipped gracefully.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

export const isPushSupported =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export function currentPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
}

/** Register the service worker if not already registered. */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration("/sw.js");
    if (existing) return existing;
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("Service worker registration failed", e);
    return null;
  }
}

/** Request the user grants Notification permission. Returns the final state. */
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

/**
 * Subscribe this device to push and save the subscription in Supabase.
 * Requires the user to already have notification permission.
 */
export async function subscribeToPush(
  accountId: string
): Promise<{ error?: string }> {
  if (!isPushSupported) return { error: "This browser doesn't support push." };
  if (!VAPID_PUBLIC_KEY)
    return {
      error: "Push isn't configured yet (missing VAPID key).",
    };
  if (!supabase) return { error: "Sync isn't configured." };

  const reg = await ensureServiceWorker();
  if (!reg) return { error: "Couldn't register service worker." };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      // Copy into a fresh ArrayBuffer so TS is happy about the
      // BufferSource type (some Uint8Array generics resolve to
      // SharedArrayBuffer-compatible variants).
      const keyBytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const keyBuffer = new Uint8Array(keyBytes.length);
      keyBuffer.set(keyBytes);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBuffer.buffer,
      });
    } catch (e) {
      return {
        error:
          "Couldn't subscribe to push. Make sure notifications are allowed in your browser settings.",
      };
    }
  }

  const json = sub.toJSON();
  const endpoint = sub.endpoint;
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      account_id: accountId,
      endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return {};
}

/** Unsubscribe this device and delete the DB row. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported) return;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    try {
      await sub.unsubscribe();
    } catch (e) {
      console.error("Unsubscribe failed", e);
    }
    if (supabase) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", endpoint);
    }
  }
}

export async function hasActiveSubscription(): Promise<boolean> {
  if (!isPushSupported) return false;
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = await reg?.pushManager.getSubscription();
  return Boolean(sub);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert URL-safe base64 VAPID key into the Uint8Array subscribe() expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Full = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Full);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}
