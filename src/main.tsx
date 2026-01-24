import "./index.css";

const BOOT_TIMEOUT_MS = 8000;

const getBootFallbackEl = () => document.getElementById("boot-fallback");

// Hide the boot fallback once React has successfully mounted.
const hideBootFallback = () => {
  try {
    const fallback = getBootFallbackEl();
    if (fallback) fallback.style.display = "none";
    if ((window as any).__jbjBootTimeout) {
      clearTimeout((window as any).__jbjBootTimeout);
    }
  } catch {
    // ignore
  }
};

const showBootError = (details?: unknown) => {
  try {
    const fallback = getBootFallbackEl();
    if (!fallback) return;

    const msg =
      details instanceof Error
        ? details.message
        : typeof details === "string"
          ? details
          : "The site is taking too long to load.";

    fallback.style.display = "flex";
    fallback.innerHTML = `
      <div style="max-width:760px;width:100%;text-align:center;padding:2rem;font-family:Poppins,sans-serif;">
        <p style="color:#d4af37;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;margin:0 0 0.75rem;">JBJ Global Real Estate</p>
        <h1 style="color:#fff;font-size:28px;line-height:1.2;margin:0 0 0.75rem;">Loading issue</h1>
        <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:0 0 1rem;">${msg}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button id="jbj-reload" style="display:inline-block;background:#d4af37;color:#000;padding:0.85rem 1.2rem;border-radius:10px;border:none;font-weight:700;cursor:pointer;">
            Reload
          </button>
          <a href="/auth" style="display:inline-block;background:transparent;color:#d4af37;padding:0.85rem 1.2rem;border-radius:10px;text-decoration:none;font-weight:700;border:1px solid rgba(212,175,55,0.45);">
            Team Login
          </a>
        </div>
        <p style="margin:1rem 0 0;color:#9ca3af;font-size:12px;">Tip: try a hard refresh (Ctrl/Cmd+Shift+R).</p>
      </div>
    `;

    const btn = document.getElementById("jbj-reload");
    btn?.addEventListener("click", () => {
      try {
        window.location.reload();
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
};

// Best-effort: remove any legacy service worker + caches that could trap users on an old build.
const tryClearLegacyCaching = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignore
  }

  try {
    if (typeof caches !== "undefined" && typeof caches.keys === "function") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // ignore
  }
};

// If React doesn't mount within a few seconds, show a clear error instead of an endless spinner.
(window as any).__jbjBootTimeout = window.setTimeout(() => {
  showBootError();
}, BOOT_TIMEOUT_MS);

(async () => {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("[JBJ] Root element not found");
    showBootError("Root element not found.");
    return;
  }

  // Don’t block boot on this; it’s best-effort.
  void tryClearLegacyCaching();

  try {
    const [{ StrictMode }, { createRoot }, { default: App }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("./App.tsx"),
    ]);

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    hideBootFallback();
  } catch (err) {
    console.error("[JBJ] Critical boot error:", err);
    showBootError(err);
  }
})();
