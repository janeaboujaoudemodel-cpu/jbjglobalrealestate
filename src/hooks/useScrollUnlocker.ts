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

    const normalizeWheelDelta = (event: WheelEvent): number => {
      if (event.deltaMode === 1) return event.deltaY * 16;
      if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    const canAncestorScroll = (target: EventTarget | null, deltaY: number): boolean => {
      if (!(target instanceof Element)) return false;

      if (
        target.closest(
          'input[type="range"],' +
            'input,' +
            'textarea,' +
            'select,' +
            '[contenteditable="true"],' +
            '[role="slider"],' +
            '[aria-modal="true"],' +
            '[role="dialog"],' +
            '[data-jbj-modal-open="true"],' +
            '[data-no-page-wheel],' +
            '[data-no-page-touch],' +
            '[data-scroll-x]',
        )
      ) {
        return true;
      }

      let node: Element | null = target;
      while (node && node !== body && node !== html) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        const isScrollable = /(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > node.clientHeight + 2;
        if (isScrollable) {
          const atTop = node.scrollTop <= 0;
          const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 2;
          if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const scrollPageBy = (deltaY: number, fromY = window.scrollY) => {
      const maxScroll = Math.max(0, html.scrollHeight - window.innerHeight);
      const next = Math.min(maxScroll, Math.max(0, fromY + deltaY));
      if (Math.abs(next - window.scrollY) < 1) return;
      window.scrollTo({ top: next, left: 0, behavior: "auto" });
    };

    const onWheel = (event: WheelEvent) => {
      if (hasOpenModal() || event.ctrlKey || event.metaKey) return;
      if (Math.abs(event.deltaY) < 1 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const deltaY = normalizeWheelDelta(event);
      if (canAncestorScroll(event.target, deltaY)) return;

      const before = window.scrollY;
      const maxScroll = Math.max(0, html.scrollHeight - window.innerHeight);
      if ((deltaY < 0 && before <= 0) || (deltaY > 0 && before >= maxScroll - 1)) return;

      // Deterministic root scrolling: handle page wheel input before any child
      // React/native listener can stop propagation or before Chromium drops a
      // wheel delta while lazy sections/images resize during paint.
      if (event.cancelable) event.preventDefault();
      scrollPageBy(deltaY, before);

      requestAnimationFrame(() => {
        if (!hasOpenModal() && Math.abs(window.scrollY - before) < 1) scrollPageBy(deltaY, before);
      });
    };

    let lastTouchY: number | null = null;
    let lastTouchX: number | null = null;

    const onTouchStart = (event: TouchEvent) => {
      if (hasOpenModal() || event.touches.length !== 1) {
        lastTouchY = null;
        lastTouchX = null;
        return;
      }
      lastTouchY = event.touches[0].clientY;
      lastTouchX = event.touches[0].clientX;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (hasOpenModal() || event.touches.length !== 1 || lastTouchY === null || lastTouchX === null) return;
      const touch = event.touches[0];
      const deltaY = lastTouchY - touch.clientY;
      const deltaX = lastTouchX - touch.clientX;
      lastTouchY = touch.clientY;
      lastTouchX = touch.clientX;
      if (Math.abs(deltaY) < 1 || Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (canAncestorScroll(event.target, deltaY)) return;

      const before = window.scrollY;
      const maxScroll = Math.max(0, html.scrollHeight - window.innerHeight);
      if ((deltaY < 0 && before <= 0) || (deltaY > 0 && before >= maxScroll - 1)) return;

      if (event.cancelable) event.preventDefault();
      scrollPageBy(deltaY, before);
    };

    const clearTouch = () => {
      lastTouchY = null;
      lastTouchX = null;
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("popstate", onPop);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", clearTouch, { passive: true, capture: true });
    window.addEventListener("touchcancel", clearTouch, { passive: true, capture: true });

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
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", clearTouch, { capture: true });
      window.removeEventListener("touchcancel", clearTouch, { capture: true });
      obs.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}

export default useScrollUnlocker;
