import { useEffect } from "react";

/**
 * Global scroll-lock safety net.
 *
 * Releases any inline overflow / position / pointer-events / touch-action
 * lock left behind by a modal, dialog, drawer, splash, or carousel whose
 * cleanup failed to run (route change mid-animation, error boundary catch,
 * StrictMode double-invoke, etc.).
 *
 * Safe by design — never releases while a real modal is open. A real modal
 * is detected via `[aria-modal="true"]`, `[data-state="open"][role="dialog"]`,
 * `[data-state="open"][role="alertdialog"]`, or `[data-jbj-modal-open="true"]`.
 *
 * Mount once at the top of MainLayoutWrapper so every public route benefits.
 */
export function useScrollUnlocker(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    const html = document.documentElement;

    const hasOpenModal = (): boolean => {
      return !!document.querySelector(
        '[aria-modal="true"],' +
          '[data-state="open"][role="dialog"],' +
          '[data-state="open"][role="alertdialog"],' +
          '[data-jbj-modal-open="true"],' +
          '[data-jbj-fullscreen-open="true"]',
      );
    };

    const release = () => {
      if (hasOpenModal()) return;
      // Inline style locks
      if (body.style.overflow) body.style.overflow = "";
      if (body.style.overflowY === "hidden") body.style.overflowY = "";
      if (body.style.position === "fixed") {
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
      }
      if (body.style.pointerEvents === "none") body.style.pointerEvents = "";
      if (body.style.touchAction === "none") body.style.touchAction = "";
      if (body.style.height && body.style.height !== "auto") body.style.height = "";
      if (html.style.overflow) html.style.overflow = "";
      if (html.style.overflowY === "hidden") html.style.overflowY = "";
      if (html.style.touchAction === "none") html.style.touchAction = "";
      if (html.style.height && html.style.height !== "auto") html.style.height = "";

      // Class-based locks (Tailwind / vendor libs)
      const classLocks = [
        "overflow-hidden",
        "overflow-y-hidden",
        "no-scroll",
        "scroll-lock",
        "modal-open",
      ];
      for (const cls of classLocks) {
        if (body.classList.contains(cls)) body.classList.remove(cls);
        if (html.classList.contains(cls)) html.classList.remove(cls);
      }
    };

    release();

    const onFocus = () => release();
    const onVis = () => { if (document.visibilityState === "visible") release(); };
    const onPointer = () => release();
    const onPop = () => release();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("popstate", onPop);

    const obs = new MutationObserver(release);
    obs.observe(body, { attributes: true, attributeFilter: ["style", "class"] });
    obs.observe(html, { attributes: true, attributeFilter: ["style", "class"] });

    // Safety belt — re-check every 1.5s in case a vendor lib locks scroll via
    // a path we don't observe (eg. shadow DOM event handlers).
    const interval = window.setInterval(release, 1500);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("popstate", onPop);
      obs.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}

export default useScrollUnlocker;
