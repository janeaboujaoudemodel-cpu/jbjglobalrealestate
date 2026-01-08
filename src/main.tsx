import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { trackPWAOpened } from "./hooks/usePWAAnalytics";

// Ensure the service worker is registered in production so the app is installable.
registerSW({ immediate: true });

// Track PWA app opens
trackPWAOpened();

createRoot(document.getElementById("root")!).render(
  <App />
);
