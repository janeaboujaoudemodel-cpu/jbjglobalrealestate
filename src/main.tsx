import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hide boot fallback once React is about to mount
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
    hideBootFallback();
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err) {
    // Critical mount failure - show fallback error
    console.error("[JBJ] Critical mount error:", err);
    const fallback = document.getElementById("boot-fallback");
    if (fallback) {
      fallback.style.display = "flex";
      fallback.innerHTML = `
        <div style="text-align:center;color:#fff;padding:2rem;">
          <h1 style="color:#d4af37;margin-bottom:1rem;">JBJ Global Real Estate</h1>
          <p style="margin-bottom:1rem;">Something went wrong loading the page.</p>
          <button onclick="location.reload()" style="background:#d4af37;color:#000;border:none;padding:0.75rem 1.5rem;border-radius:6px;cursor:pointer;font-weight:600;">Refresh Page</button>
          <p style="margin-top:1.5rem;font-size:12px;color:#888;">Contact: +971 56 591 1000 | contact@jbj.ae</p>
        </div>
      `;
    }
  }
} else {
  console.error("[JBJ] Root element not found");
}
