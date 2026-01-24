import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide the boot fallback once React has successfully mounted.
const hideBootFallback = () => {
  try {
    const fallback = document.getElementById("boot-fallback");
    if (fallback) fallback.style.display = "none";
    // Clear the timeout that would show error message
    if ((window as any).__jbjBootTimeout) {
      clearTimeout((window as any).__jbjBootTimeout);
    }
  } catch {
    // Ignore
  }
};

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    hideBootFallback();
  } catch (err) {
    // Critical mount failure - keep fallback visible and log.
    console.error("[JBJ] Critical mount error:", err);
  }
} else {
  console.error("[JBJ] Root element not found");
}
