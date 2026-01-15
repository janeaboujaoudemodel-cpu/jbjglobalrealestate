import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { trackPWAOpened } from "./hooks/usePWAAnalytics";

// Detect if we're in a Lovable preview environment
const isLovablePreview =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

async function prepareRuntime() {
  // NOTE: In dev/preview, stale service workers can cache mixed Vite chunks.
  // That can manifest as React hook runtime crashes (dispatcher is null) inside libraries.
  // We proactively unregister SWs + clear caches in dev/preview and ONLY render once cleanup finishes.
  if (import.meta.env.DEV || isLovablePreview) {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));

        // If a SW is controlling this page, force a single reload after unregistering.
        // This prevents a "mixed chunks" first render.
        if (navigator.serviceWorker.controller) {
          const flagKey = "__lovable_sw_cleanup_reload_done__";
          if (!sessionStorage.getItem(flagKey)) {
            sessionStorage.setItem(flagKey, "1");
            window.location.reload();
            return { shouldRender: false } as const;
          }
        }
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // best-effort cleanup; continue to render
    }

    return { shouldRender: true } as const;
  }

  // Production: register SW so the app is installable.
  registerSW({ immediate: true });

  // Track PWA app opens
  trackPWAOpened();

  return { shouldRender: true } as const;
}

const rootElement = document.getElementById("root");
if (rootElement) {
  prepareRuntime().then(({ shouldRender }) => {
    if (!shouldRender) return;
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}

