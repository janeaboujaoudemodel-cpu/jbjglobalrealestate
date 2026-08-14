import * as React from "react";
import { useLocation } from "react-router-dom";

/**
 * HERO CHROME WATCHER — single source of truth for `body[data-jj-hero-chrome]`.
 *
 * THE RULE (owner-locked, no other case):
 *   hero section HAS a photo/video background  → chrome is "clear" (sidebar +
 *                                                horizontal nav fully transparent,
 *                                                in BOTH Sun and Moon)
 *   hero section has NO photo/video            → chrome is "solid" (sidebar filled
 *                                                with the normal theme colour)
 *
 * Why the old logic was wrong: it only looked for the hand-authored marker
 * `[data-hero-dark]`, which is a *dark surface* flag (also used by dozens of
 * contrast rules) — not a media flag. So a photographic hero without that marker
 * stayed filled, and an emerald gradient hero carrying that marker went
 * transparent. It also only re-evaluated on scroll/resize plus a 400ms poll and
 * never on route change or on media load, so the state got stuck across
 * navigation, and it lived inside the public utility bar so back-office routes
 * never evaluated at all.
 */

const HERO_SELECTOR = [
  "[data-layout-hero]",
  "[data-hero-media]",
  "[data-hero-dark]",
  ".jj-hero-fullscreen",
  "[data-mi-hero]",
  "[data-guide-hero]",
  "[data-faq-hero]",
  "[data-premium-emerald-hero]",
].join(", ");

function hasRenderedMedia(hero: HTMLElement): boolean {
  // Explicit opt-out / opt-in escape hatches for genuinely odd heroes.
  if (hero.hasAttribute("data-hero-media")) {
    return hero.getAttribute("data-hero-media") !== "none";
  }

  const media = hero.querySelectorAll<HTMLElement>("video, img, picture img, canvas");
  for (const el of Array.from(media)) {
    const r = el.getBoundingClientRect();
    // Must be a real, hero-sized surface — not a small logo or icon.
    // NOTE: `visibility`/`opacity` are intentionally NOT checked. Hero videos and
    // photos fade in after load, so a strict visibility test made a photographic
    // hero read as "no media" for the first frames — which is exactly the
    // "sometimes filled instead of transparent" bug.
    if (r.width >= 200 && r.height >= 160 && getComputedStyle(el).display !== "none") return true;
  }



  // Photographic background-image (CSS hero), including on inner layers.
  const layers: HTMLElement[] = [hero, ...Array.from(hero.querySelectorAll<HTMLElement>(":scope > *, :scope > * > *"))];
  for (const el of layers) {
    const r = el.getBoundingClientRect();
    if (r.width < 200 || r.height < 160) continue;
    const bg = getComputedStyle(el).backgroundImage;
    // `url(...)` = real artwork. A pure `linear-gradient(...)` is NOT media.
    if (bg && bg.includes("url(")) return true;
  }
  return false;
}

export function evaluateHeroChrome(): "clear" | "solid" {
  if (typeof document === "undefined") return "solid";
  const heroes = Array.from(document.querySelectorAll<HTMLElement>(HERO_SELECTOR));
  let clear = false;
  for (const hero of heroes) {
    const r = hero.getBoundingClientRect();
    // Only the hero the chrome is currently sitting on top of counts.
    const underChrome = r.top <= 140 && r.bottom > 140 && r.height > 240;
    if (!underChrome) continue;
    if (hasRenderedMedia(hero)) {
      clear = true;
      break;
    }
  }
  const next = clear ? "clear" : "solid";
  if (document.body.getAttribute("data-jj-hero-chrome") !== next) {
    document.body.setAttribute("data-jj-hero-chrome", next);
  }
  return next;
}

/**
 * Mount ONCE, globally (MainLayout + OwnerDashboardShell). Re-evaluates on route
 * change, scroll, resize, DOM mutations (lazy hero mount) and media load events —
 * so the state can never get stuck.
 */
export function useHeroChromeWatcher(): void {
  const { pathname } = useLocation();

  React.useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        evaluateHeroChrome();
      });
    };

    // Route change: clear the previous verdict immediately so a stale "clear"
    // never survives a navigation, then re-evaluate for the new page.
    document.body.setAttribute("data-jj-hero-chrome", "solid");
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Hero photo/video finishing load (capture — these events don't bubble).
    window.addEventListener("load", schedule, true);
    document.addEventListener("loadeddata", schedule, true);
    document.addEventListener("transitionend", schedule, true);

    const root = document.getElementById("root") ?? document.body;
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "src", "data-hero-media"] });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule, true);
      document.removeEventListener("loadeddata", schedule, true);
      document.removeEventListener("transitionend", schedule, true);
    };
  }, [pathname]);
}

export default useHeroChromeWatcher;
