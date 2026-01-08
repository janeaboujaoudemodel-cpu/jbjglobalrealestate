import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { trackPWAOpened } from "./hooks/usePWAAnalytics";

// Track PWA app opens
trackPWAOpened();

createRoot(document.getElementById("root")!).render(<App />);
