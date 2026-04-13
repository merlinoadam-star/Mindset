// Mindset — Service Worker
// Handles web push notifications and click-through navigation.
//
// This is plain JS (no bundler) so it loads fast and has no build-step
// dependencies. Keep it tiny.

/* eslint-disable no-restricted-globals */
/* global self, clients */

const CACHE_NAME = "mindset-shell-v1";

// Minimal install — no aggressive caching (the main app bundle is
// cached by the browser from Vercel's CDN headers). This SW's real job
// is handling push events.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push handler — called when the server sends a web-push message,
// even when the app is closed.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Mindset", body: event.data?.text() || "" };
  }

  const title = data.title || "Mindset";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: {
      url: data.url || "/",
    },
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    // Vibration pattern (mobile only)
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click handler — focus an existing tab if open, otherwise open a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        // If we already have a Mindset tab open, focus it and navigate.
        if ("focus" in client) {
          try {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetUrl);
            }
            return;
          } catch {
            /* fall through and open a new window */
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
