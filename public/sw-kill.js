/*
  Force-remove legacy PWA registrations.

  This file is intentionally separate from /sw.js so the app can register it once
  (with a cache-busting query) to override any previously registered Workbox SW.
*/

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        if (self.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } finally {
        try {
          await self.registration.unregister();
        } catch {
          // ignore
        }
      }
    })()
  );
});

self.addEventListener("fetch", () => {});
