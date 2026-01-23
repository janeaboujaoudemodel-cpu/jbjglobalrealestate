/*
  Tombstone service worker.

  Why this file exists:
  Some static hosting setups keep old files accessible even after they are removed
  from the build output. If a previous PWA build deployed /sw.js, browsers can keep
  checking this URL for updates.

  This SW unregisters itself and clears caches to remove lingering PWA behavior.
*/

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        // Take control so we can clean up and then detach.
        await self.clients.claim();

        // Best-effort cache cleanup
        if (self.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }

        // Unregister this worker
        await self.registration.unregister();

        // Ask all open tabs to reload (so they are no longer controlled)
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        clients.forEach((client) => {
          try {
            client.navigate(client.url);
          } catch {
            // ignore
          }
        });
      } catch {
        // ignore
      }
    })()
  );
});

// If anything still tries to use the SW, just bypass it.
self.addEventListener("fetch", () => {});
