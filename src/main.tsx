import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { trackPWAOpened } from "./hooks/usePWAAnalytics";

// Detect if we're in a Lovable preview environment
const isLovablePreview = typeof window !== 'undefined' && 
  (window.location.hostname.includes('lovableproject.com') || 
   window.location.hostname.includes('lovable.app'));

// NOTE: In dev/preview, stale service workers can cache mixed Vite chunks.
// That can manifest as React hook runtime crashes (dispatcher is null) inside libraries.
// We proactively unregister SWs + clear caches in dev/preview to guarantee a single consistent bundle.
if (import.meta.env.DEV || isLovablePreview) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => undefined);
  }

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => undefined);
  }
} else {
  // Ensure the service worker is registered in production so the app is installable.
  registerSW({ immediate: true });

  // Track PWA app opens
  trackPWAOpened();
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
