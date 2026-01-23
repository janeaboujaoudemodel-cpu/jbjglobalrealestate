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
  // In dev/preview AND production: unregister all service workers to remove PWA capability
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));

      // If a SW is controlling this page, force a single reload after unregistering.
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
