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

const MAX_INSET = 340;

/**
 * PASS 375 — measure the LIVE content column instead of the rail element.
 * The rail wrapper is `position: fixed`, so probing it told us nothing about
 * how much of the viewport the user can actually see. `main.jj-main-shell` is
 * the docked content column, so its left edge IS the visible content origin in
 * every rail state (collapsed 59px, expanded 264px) and on every viewport
 * (phone chrome resolves to 0).
 */
function measureInset(): number {
  if (typeof document === "undefined") return 0;

  const shell = document.querySelector<HTMLElement>(
    "main.jj-main-shell:not(.jj-main-shell--standalone), .jc-app .jc-content, main[data-owner-content]",
  );
  if (shell) {
    const rect = shell.getBoundingClientRect();
    if (rect.width > 0) return Math.round(Math.min(Math.max(rect.left, 0), MAX_INSET));
  }

  // Fallback: the shell engine variable published on <body>.
  const raw = window
    .getComputedStyle(document.body)
    .getPropertyValue("--jj-shell-sidebar-w")
    .trim();
  const parsed = Number.parseFloat(raw);
  if (Number.isFinite(parsed)) return Math.round(Math.min(Math.max(parsed, 0), MAX_INSET));
  return 0;
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
