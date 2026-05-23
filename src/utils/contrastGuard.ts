/**
 * contrastGuard — Runtime same-tone guard.
 *
 * Walks every interactive element after each route change and forces an inverse
 * color when the computed text color is too close to its background.
 *
 * Companion to the static CSS guard in `index.css` (PASS 5 — UNIVERSAL SAME-TONE).
 * The CSS pass catches class-based combos; this runtime pass catches inline styles,
 * cascaded variables, and dynamic third-party content.
 */

const CONTRAST_FIX_CLASS = "jbj-contrast-fix";

function parseRgb(input: string): [number, number, number] | null {
  const m = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function averageGradientRgb(input: string): string | null {
  const matches = [...input.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/gi)];
  if (!matches.length) return null;
  const totals = matches.reduce(
    (acc, m) => {
      acc[0] += Number(m[1]);
      acc[1] += Number(m[2]);
      acc[2] += Number(m[3]);
      return acc;
    },
    [0, 0, 0],
  );
  const count = matches.length;
  return `rgb(${Math.round(totals[0] / count)}, ${Math.round(totals[1] / count)}, ${Math.round(totals[2] / count)})`;
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const norm = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}

function effectiveBgColor(el: Element): string {
  let cur: Element | null = el;
  while (cur && cur instanceof HTMLElement) {
    const style = window.getComputedStyle(cur);
    const bg = style.backgroundColor;
    if (bg && !bg.includes("rgba(0, 0, 0, 0)") && bg !== "transparent") {
      return bg;
    }
    // Element has a gradient or image background (no flat color but rendered surface).
    // Trust the explicit data-surface contract instead of falling through to page.
    const surface = cur.getAttribute("data-surface");
    if (surface) {
      if (surface === "dark" || surface === "ink") return "rgb(26, 26, 26)";
      if (surface === "gold") return "rgb(184, 149, 85)";
      // page / champagne / light
      return "rgb(253, 251, 247)";
    }
    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== "none") {
      const average = averageGradientRgb(bgImage);
      if (average) return average;
      // Unknown image surface — bail out of guarding rather than guessing.
      return "__unknown__";
    }
    cur = cur.parentElement;
  }
  return "rgb(253, 251, 247)"; // page #FDFBF7 fallback
}

function fixIfLowContrast(el: HTMLElement, minRatio: number) {
  if (el.closest("[data-no-contrast-guard]")) return;
  // Skip nodes with no rendered text content (decorative wrappers)
  if (!el.textContent || !el.textContent.trim()) return;
  const cs = window.getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return;
  const fg = parseRgb(cs.color);
  const bgStr = effectiveBgColor(el);
  if (bgStr === "__unknown__") return; // unknown gradient/image surface — leave authored color alone
  const bg = parseRgb(bgStr);
  if (!fg || !bg) return;
  const lf = relLuminance(fg);
  const lb = relLuminance(bg);
  const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
  if (ratio < minRatio) {
    el.classList.add(CONTRAST_FIX_CLASS);
    if (lb < 0.4) {
      el.style.setProperty("color", "#FDFBF7", "important");
    } else {
      el.style.setProperty("color", "#1A1A1A", "important");
    }
  }
}

function fixWhiteOnBright(el: Element) {
  if (el.closest("[data-no-contrast-guard], [data-surface='dark'], .allow-white")) return;
  if (el.closest(".bg-black, [class~='bg-[#1A1A1A]'], [class*='bg-gray-9'], [class*='bg-neutral-9'], [class*='bg-zinc-9']")) return;
  const cs = window.getComputedStyle(el);
  if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return;
  const fg = parseRgb(cs.color);
  const bgStr = effectiveBgColor(el);
  if (bgStr === "__unknown__") return;
  const bg = parseRgb(bgStr);
  if (!fg || !bg) return;
  const isWhiteForeground = fg[0] > 235 && fg[1] > 235 && fg[2] > 235;
  const isBrightSurface = relLuminance(bg) > 0.52;
  if (isWhiteForeground && isBrightSurface) {
    el.classList.add(CONTRAST_FIX_CLASS);
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      el.style.setProperty("color", "#1A1A1A", "important");
      el.style.setProperty("stroke", "currentColor", "important");
    }
  }
}

let scheduled = false;
let lastRun = 0;
const MIN_INTERVAL_MS = 250; // throttle: max 4 scans/sec
function scan() {
  if (scheduled) return;
  const now = Date.now();
  const wait = Math.max(0, MIN_INTERVAL_MS - (now - lastRun));
  scheduled = true;
  const run = () => {
    scheduled = false;
    lastRun = Date.now();
    requestAnimationFrame(() => {
      // Interactive elements — UI contrast floor (~3:1)
      const interactives = document.querySelectorAll<HTMLElement>(
        'button, a[href], [role="button"], [role="menuitem"], [role="tab"], summary, label.cursor-pointer'
      );
      interactives.forEach((el) => fixIfLowContrast(el, 2.5));
      // Text-bearing nodes — body-text floor (tolerant 3.5; AA is 4.5)
      const textNodes = document.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, span, small, strong, em, [data-card], .card"
      );
      textNodes.forEach((el) => fixIfLowContrast(el, 3.5));
      const whiteForegroundNodes = document.querySelectorAll<HTMLElement>(
        ".text-white, [class*='text-white/'], svg.text-white, svg[class*='text-white/']"
      );
      whiteForegroundNodes.forEach(fixWhiteOnBright);
    });
  };
  if (wait > 0) setTimeout(run, wait);
  else run();
}

let installed = false;

export function installContrastGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Initial pass after layout settles
  setTimeout(scan, 250);
  setTimeout(scan, 1000);

  // After every route change (URL update)
  window.addEventListener("popstate", scan);
  // pushState/replaceState patches
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args as Parameters<typeof origPush>);
    setTimeout(scan, 200);
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
    setTimeout(scan, 200);
    return r;
  };

  // DOM mutations (modals, dialogs, async content)
  const mo = new MutationObserver(() => scan());
  mo.observe(document.body, { childList: true, subtree: true, attributes: false });
}
