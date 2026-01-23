import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Detect if we're in a Lovable preview environment
const isLovablePreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

async function prepareRuntime() {
  // In dev/preview AND production: remove all service workers to eliminate any PWA capability.
  // IMPORTANT: This must never block the initial React render (white-screen risk).
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();

      // If there is an old Workbox SW, override it once with a small “kill” SW.
      // This helps in cases where the legacy SW is stubborn due to caching.
      const killKey = "__lovable_force_sw_kill_done__";
      if (regs.length > 0 && !sessionStorage.getItem(killKey)) {
        sessionStorage.setItem(killKey, "1");
        try {
          await navigator.serviceWorker.register(`/sw-kill.js?v=${Date.now()}`, {
            scope: "/",
          });
        } catch {
          // ignore
        }
      }

      const regs2 = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs2.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort cleanup; continue to render
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  // Always render immediately; run runtime cleanup in the background.
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Fire-and-forget cleanup.
  void prepareRuntime();
}
