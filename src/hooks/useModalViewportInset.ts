import * as React from "react";
import { useLocation } from "react-router-dom";

/**
 * PASS 374 — MODAL CENTERING FROM THE VISIBLE CONTENT VIEWPORT.
 *
 * Every dialog on the site is `position: fixed; left: 50%`, i.e. centred on the
 * FULL window. On any route that docks the vertical rail in the layout flow
 * (public shell + back office) the user's visible content area starts *after*
 * the rail, so a window-centred modal always reads as pushed left — and the
 * amount it is off changes with the rail state (collapsed 59px, expanded 264px).
 *
 * This watcher measures the live docked rail and publishes its right edge as
 * `--jj-modal-inset-left` on <html>. `DialogContent` centres inside
 * `calc(100vw - inset)`, so the modal is optically centred in the area the user
 * actually sees in every rail state. On mobile/tablet the rail overlays the page
 * instead of docking, so the inset resolves to 0 and centring stays full-window.
 */

const RAIL_SELECTOR = "[data-rail-state], [data-owner-rail], aside[data-sidebar-emerald]";
const MAX_INSET = 340;

function measureInset(): number {
  if (typeof document === "undefined") return 0;
  // Rail overlays (does not reduce the content viewport) below the lg breakpoint.
  if (window.innerWidth < 1024) return 0;

  let inset = 0;
  document.querySelectorAll<HTMLElement>(RAIL_SELECTOR).forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height < 200) return;
    // Only a rail pinned to the left edge shifts the visible content viewport.
    if (rect.left > 2) return;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    // A floating/overlay rail does not consume layout width.
    if (style.position === "fixed" || style.position === "absolute") return;
    inset = Math.max(inset, Math.min(rect.right, MAX_INSET));
  });
  return Math.round(inset);
}

export function useModalViewportInset(): void {
  const location = useLocation();

  React.useEffect(() => {
    let raf = 0;
    let last = -1;

    const apply = () => {
      raf = 0;
      const next = measureInset();
      if (next === last) return;
      last = next;
      document.documentElement.style.setProperty("--jj-modal-inset-left", `${next}px`);
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    schedule();

    window.addEventListener("resize", schedule);
    window.addEventListener("transitionend", schedule, true);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-rail-state", "data-rail-pinned", "class", "style"],
    });
    const poll = window.setInterval(schedule, 600);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("transitionend", schedule, true);
      observer.disconnect();
      window.clearInterval(poll);
    };
  }, [location.pathname]);
}

export default useModalViewportInset;
