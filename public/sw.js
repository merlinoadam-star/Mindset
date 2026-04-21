// Fearless — Service Worker
// Handles web push notifications, click-through navigation, and
// offline caching so the app works with no/spotty connection.
//
// Caching strategy:
//   - HTML (navigation): network-first, falls back to cache. Keeps
//     users on the latest build when online, loads from cache offline.
//   - JS/CSS/fonts/images: cache-first with background update. After
//     first visit, these load instantly even on slow networks.
//   - API (Supabase): never cached. Stale data would be misleading.
//
// This is plain JS (no bundler) — keep it tiny and self-contained.

/* eslint-disable no-restricted-globals */
/* global self */

// `__BUILD_ID__` is substituted at build time by the sw-version-injector
// plugin in vite.config.ts (see the `closeBundle` hook). A unique value
// per deploy means the browser detects the SW as updated, activates the
// new version, and clears the previous cache entries — so users aren't
// stuck on stale JS when we ship a sync-affecting fix. In dev the token
// stays literal, which is fine because Vite's HMR handles freshness.
const VERSION = "__BUILD_ID__";
const STATIC_CACHE = `mindset-static-${VERSION}`;
const PAGE_CACHE = `mindset-pages-${VERSION}`;

// On install: precache the app shell so first-offline-load works.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/", "/index.html", "/manifest.json", "/icon.svg"]).catch(() => {})
    )
  );
});

// On activate: claim clients + clean up old cache versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith("mindset-") &&
              !k.endsWith(VERSION) &&
              k !== STATIC_CACHE &&
              k !== PAGE_CACHE
          )
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch handler — strategy depends on request type.
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GETs. POSTs/PUTs always go to network.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin: Supabase API, Anthropic, fonts.googleapis, etc.
  // Fonts we do want to cache (separate handling below).
  const isFontFile =
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com";

  if (url.origin !== self.location.origin && !isFontFile) {
    return; // let the browser handle it normally
  }

  // Skip Supabase function invokes even if same-origin (they're not).
  if (url.pathname.includes("/functions/v1/")) {
    return;
  }

  // HTML/navigation → network-first, fall back to cache
  if (
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html")
  ) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Static assets (JS, CSS, images, fonts) → cache-first
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    // Cache a copy of the successful response
    if (fresh.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    // Offline — serve from cache
    const cached = await caches.match(req);
    if (cached) return cached;
    // Final fallback: serve the root HTML (SPA routing handles the path)
    const fallback = await caches.match("/");
    if (fallback) return fallback;
    throw err;
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) {
    // Background refresh — don't block on it
    fetch(req)
      .then((fresh) => {
        if (fresh.ok) {
          caches.open(STATIC_CACHE).then((c) => c.put(req, fresh).catch(() => {}));
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(req, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    // No cache, no network → genuinely can't serve this one.
    throw err;
  }
}

// Push handler — called when the server sends a web-push message,
// even when the app is closed.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Fearless", body: event.data?.text() || "" };
  }

  const title = data.title || "Fearless";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: {
      url: data.url || "/",
    },
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
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
