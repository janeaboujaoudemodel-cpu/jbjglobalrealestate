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

    const isTextEntryTarget = (target: EventTarget | null): boolean => {
      const element = target instanceof Element ? target : null;
      if (!element) return false;
      return !!element.closest(
        'input, textarea, select, [contenteditable="true"], [role="textbox"]',
      );
    };

    const shouldKeepWheelLocal = (target: EventTarget | null, deltaY: number): boolean => {
      const element = target instanceof Element ? target : null;
      if (!element) return false;

      if (element.closest('[data-document-studio-overlay], [data-map], .mapboxgl-map, .leaflet-container, [data-no-page-wheel]')) {
        return true;
      }

      const editable = element.closest('textarea, select, [contenteditable="true"], [role="textbox"]');
      if (!(editable instanceof HTMLElement)) return false;
      const styles = window.getComputedStyle(editable);
      const canScrollY = /(auto|scroll)/.test(styles.overflowY) && editable.scrollHeight > editable.clientHeight + 2;
      if (!canScrollY) return false;
      const maxTop = editable.scrollHeight - editable.clientHeight;
      return (deltaY > 0 && editable.scrollTop < maxTop - 1) || (deltaY < 0 && editable.scrollTop > 1);
    };

    const isWheelSafeSurface = (target: EventTarget | null): boolean => {
      const element = target instanceof Element ? target : null;
      if (!element) return true;
      return !element.closest(
        '[data-document-studio-overlay], [data-map], .mapboxgl-map, .leaflet-container, [data-no-page-wheel]',
      );
    };

    const findScrollableAncestor = (target: EventTarget | null, deltaY: number): HTMLElement | null => {
      const start = target instanceof Element ? target : null;
      if (!start) return null;
      let node: Element | null = start;
      while (node && node !== body && node !== html) {
        if (node instanceof HTMLElement) {
          const styles = window.getComputedStyle(node);
          const canScrollY = /(auto|scroll)/.test(styles.overflowY) && node.scrollHeight > node.clientHeight + 2;
          if (canScrollY) {
            const maxTop = node.scrollHeight - node.clientHeight;
            const canMoveDown = deltaY > 0 && node.scrollTop < maxTop - 1;
            const canMoveUp = deltaY < 0 && node.scrollTop > 1;
            if (canMoveDown || canMoveUp) return node;
          }
        }
        node = node.parentElement;
      }
      return null;
    };

    const canPageMove = (deltaY: number): boolean => {
      const maxTop = Math.max(html.scrollHeight, body.scrollHeight) - window.innerHeight;
      const top = window.scrollY || html.scrollTop || body.scrollTop || 0;
      if (deltaY > 0) return top < maxTop - 1;
      if (deltaY < 0) return top > 1;
      return false;
    };

    const forcePageScroll = (deltaY: number) => {
      if (!deltaY || hasOpenModal() || !canPageMove(deltaY)) return;
      const scroller = (document.scrollingElement || html) as HTMLElement;
      if (window.getComputedStyle(scroller).overflowY === "hidden") {
        scroller.style.overflowY = "auto";
      }
      window.scrollBy({ top: deltaY, left: 0, behavior: "auto" });
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

    const onWheel = (event: WheelEvent) => {
      if (hasOpenModal()) return;
      const deltaY = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : 0;
      if (!deltaY || shouldKeepWheelLocal(event.target, deltaY) || findScrollableAncestor(event.target, deltaY) || !canPageMove(deltaY)) return;

      const before = window.scrollY || html.scrollTop || body.scrollTop || 0;
      const correctIfTrapped = () => {
        const after = window.scrollY || html.scrollTop || body.scrollTop || 0;
        const moved = after - before;
        const expected = Math.abs(deltaY);
        // Some desktop overlays/security listeners do not fully freeze the page,
        // but they swallow enough wheel delta that the site feels blocked. If the
        // browser moved less than half of the intended vertical delta, apply the
        // missing amount once. Native scroll remains untouched when it works.
        if (Math.sign(moved || deltaY) === Math.sign(deltaY) && Math.abs(moved) >= expected * 0.75) return;
        const missing = deltaY - moved;
        const boostedMissing = expected >= 120
          ? Math.sign(deltaY) * Math.max(Math.abs(missing), Math.min(window.innerHeight * 0.72, 680))
          : missing;
        forcePageScroll(boostedMissing);
      };

      window.requestAnimationFrame(() => window.setTimeout(correctIfTrapped, 0));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || hasOpenModal()) return;
      const viewportStep = Math.max(window.innerHeight * 0.82, 320);
      const lineStep = 90;
      let deltaY = 0;
      if (event.key === "PageDown") deltaY = viewportStep;
      if (event.key === " " && !isTextEntryTarget(event.target)) deltaY = viewportStep;
      if (event.key === "PageUp") deltaY = -viewportStep;
      if (event.key === "ArrowDown" && !isTextEntryTarget(event.target)) deltaY = lineStep;
      if (event.key === "ArrowUp" && !isTextEntryTarget(event.target)) deltaY = -lineStep;
      if (event.key === "Home") deltaY = -Number.MAX_SAFE_INTEGER;
      if (event.key === "End") deltaY = Number.MAX_SAFE_INTEGER;
      if (!deltaY || !canPageMove(deltaY)) return;
      const before = window.scrollY || html.scrollTop || body.scrollTop || 0;
      window.requestAnimationFrame(() => {
        const after = window.scrollY || html.scrollTop || body.scrollTop || 0;
        if (Math.abs(after - before) < 1) forcePageScroll(deltaY);
      });
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", onPointer, { passive: true });
    window.addEventListener("popstate", onPop);
    window.addEventListener("wheel", onWheel, { capture: true, passive: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });

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
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      obs.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}

export default useScrollUnlocker;
