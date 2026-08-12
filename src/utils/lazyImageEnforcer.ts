/**
 * lazyImageEnforcer — global performance guard.
 *
 * For every <img> in the DOM that does NOT explicitly opt into eager loading
 * (loading="eager", fetchpriority="high", or data-eager), ensure:
 *   • loading="lazy"
 *   • decoding="async"
 *
 * PLUS (perf pass): a bounded "first viewport" promotion. Cards render before
 * their photo request even starts, which is what produced the visible
 * "empty card → photo pops in" flash on first paint. Any image that is
 * already inside (or just below) the first viewport during the initial paint
 * window is promoted back to eager loading so the photo arrives with the
 * card instead of after it. Below-the-fold images stay lazy.
 *
 * Runs once on mount + observes future mutations.
 */

const EAGER_ATTR = "data-eager";

/** How long after boot we still promote in-viewport images. */
const PROMOTION_WINDOW_MS = 6000;
/** Cap only near-viewport prefetches; actually visible images are never capped. */
const MAX_NEAR_VIEWPORT_PROMOTIONS = 28;

let promotions = 0;
let promotionDeadline = 0;
let pending: HTMLImageElement[] = [];
let flushScheduled = false;

function tune(img: HTMLImageElement) {
  if (img.hasAttribute(EAGER_ATTR)) return;
  const explicitLoading = img.getAttribute("loading");
  const fp = img.getAttribute("fetchpriority");
  if (!img.getAttribute("decoding")) img.setAttribute("decoding", "async");
  if (explicitLoading === "eager" || fp === "high") return;
  if (!explicitLoading) img.setAttribute("loading", "lazy");
  queuePromotionCheck(img);
}

function queuePromotionCheck(img: HTMLImageElement) {
  if (Date.now() > promotionDeadline) return;
  pending.push(img);
  if (flushScheduled) return;
  flushScheduled = true;
  // Batch every layout read into a single frame to avoid layout thrash.
  requestAnimationFrame(flushPromotions);
}

function flushPromotions() {
  flushScheduled = false;
  const batch = pending;
  pending = [];
  if (!batch.length) return;
  const limit = window.innerHeight * 1.15;
  for (const img of batch) {
    if (!img.isConnected) continue;
    if (img.getAttribute("loading") !== "lazy") continue;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (rect.bottom < -80 || rect.top > limit) continue;
    const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;
    if (!isVisibleNow && promotions >= MAX_NEAR_VIEWPORT_PROMOTIONS) continue;
    img.setAttribute("loading", "eager");
    if (isVisibleNow) {
      img.setAttribute("fetchpriority", "high");
    } else {
      promotions += 1;
    }
  }
}

let installed = false;

export function installLazyImageEnforcer(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  promotionDeadline = Date.now() + PROMOTION_WINDOW_MS;

  const scan = (root: ParentNode) => {
    root.querySelectorAll?.("img").forEach((img) => tune(img as HTMLImageElement));
  };

  const start = () => {
    scan(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const el = n as Element;
          if (el.tagName === "IMG") tune(el as HTMLImageElement);
          else scan(el);
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}
