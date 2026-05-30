/**
 * contrastGuard — Universal runtime contrast engine.
 *
 * Replaces "patch one button at a time" with a real architectural fix.
 *
 * For every visible element in the DOM:
 *  1. Walks the ancestor chain and composites alpha-aware background colors
 *     over the canonical page base (#FDFBF7). Includes gradient-stop averaging
 *     when an ancestor uses a CSS gradient or image. This yields the element's
 *     ACTUAL rendered surface color — not a guess from class names.
 *  2. Reads the element's own computed foreground color.
 *  3. If the foreground/background contrast ratio is < the WCAG floor, the
 *     engine forces the element's `color` (and `stroke` for icons/SVGs) to
 *     whichever canonical foreground has the stronger real contrast: white
 *     on navy/dark/black, ink on champagne/gold/cream/light. Backgrounds are
 *     NEVER changed.
 *  4. Re-runs after route changes, DOM mutations, hover, focus, and tab
 *     visibility, so hover/active/focus/disabled/loading states all stay
 *     readable.
 *
 * Only decorative media/effects are skipped. Author opt-outs such as
 * `.allow-white`, `.allow-ink`, `[data-on-dark]`, and
 * `[data-no-contrast-guard]` are intentionally NOT honored for readable text:
 * live contrast wins over class intent.
 */

const PAGE_BASE: RGB = [253, 251, 247]; // #FDFBF7 — the global painted baseline
const INK = '#1A1A1A';
const WHITE = '#FFFFFF';
const MIN_RATIO_TEXT = 4.5;
const MIN_RATIO_LARGE = 3.0;
const RESCAN_INTERVAL_MS = 350;
const FIX_ATTR = 'data-jbj-contrast-fixed';
const SKIP_ATTR = 'data-jbj-contrast-skip';

type RGB = [number, number, number];

const SKIP_SELECTOR = [
  '[data-decorative="true"]',
  // Sign-out is forced red site-wide; never touch it.
  '[data-signout-action]',
  '.jj-signout-icon',
  // Price-orange brand token.
  '.text-price-orange',
  '[class*="text-price-orange"]',
  // Decorative glyphs and gradient text effects.
  '[class*="bg-clip-text"]',
].join(',');

const TAGS_SKIP = new Set([
  'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CANVAS', 'VIDEO', 'AUDIO',
  'IMG', 'PICTURE', 'SOURCE', 'TRACK', 'OBJECT', 'EMBED',
  'BR', 'HR', 'META', 'LINK', 'HEAD', 'TITLE',
]);

// ---------- color math ----------

function parseColor(input: string): { rgb: RGB; a: number } | null {
  if (!input) return null;
  const m = input.match(/rgba?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)(?:\s*,\s*(-?\d+(?:\.\d+)?))?\s*\)/i);
  if (!m) return null;
  const r = Math.max(0, Math.min(255, +m[1]));
  const g = Math.max(0, Math.min(255, +m[2]));
  const b = Math.max(0, Math.min(255, +m[3]));
  const a = m[4] === undefined ? 1 : Math.max(0, Math.min(1, +m[4]));
  return { rgb: [r, g, b], a };
}

function composite(src: RGB, srcA: number, dst: RGB): RGB {
  if (srcA >= 1) return src;
  if (srcA <= 0) return dst;
  return [
    src[0] * srcA + dst[0] * (1 - srcA),
    src[1] * srcA + dst[1] * (1 - srcA),
    src[2] * srcA + dst[2] * (1 - srcA),
  ];
}

function averageGradient(bgImage: string): RGB | null {
  const stops = [...bgImage.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g)];
  if (!stops.length) return null;
  let r = 0, g = 0, b = 0, w = 0;
  for (const s of stops) {
    const a = s[4] === undefined ? 1 : +s[4];
    r += +s[1] * a;
    g += +s[2] * a;
    b += +s[3] * a;
    w += a;
  }
  if (w === 0) return null;
  return [r / w, g / w, b / w];
}

function relLuminance([r, g, b]: RGB): number {
  const norm = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
}

function contrastRatio(a: RGB, b: RGB): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ---------- background resolution ----------

function effectiveBg(el: Element): RGB {
  // Build ancestor chain (root → leaf) then composite alpha back-to-front.
  const chain: Element[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1) {
    chain.push(cur);
    cur = cur.parentElement;
  }
  let bg: RGB = [...PAGE_BASE] as RGB;
  for (let i = chain.length - 1; i >= 0; i--) {
    const node = chain[i];
    const cs = getComputedStyle(node);

    // Honor explicit surface declarations.
    const surface = (node as HTMLElement).dataset?.surface;
    if (surface) {
      if (surface === 'dark' || surface === 'ink') bg = [26, 26, 26];
      else if (surface === 'gold') bg = [184, 149, 85];
      else if (surface === 'navy') bg = [16, 37, 64];
      else if (surface === 'champagne') bg = [247, 242, 234];
      else if (surface === 'cream' || surface === 'raised') bg = [239, 230, 214];
      else if (surface === 'light' || surface === 'page') bg = [253, 251, 247];
    }

    // Composite solid bg color.
    const parsed = parseColor(cs.backgroundColor);
    if (parsed && parsed.a > 0) {
      bg = composite(parsed.rgb, parsed.a, bg);
    }

    // Gradients/images contribute an averaged stop color.
    const bgImage = cs.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const avg = averageGradient(bgImage);
      if (avg) {
        // Assume image/gradient is fully opaque for the visible region.
        bg = avg;
      }
    }
  }
  return bg;
}

// ---------- per-element fix ----------

function shouldSkip(el: Element): boolean {
  if (TAGS_SKIP.has(el.tagName)) return true;
  if (el.hasAttribute(SKIP_ATTR)) return true;
  // Walk up once to honor inherited opt-outs.
  if (el.closest(SKIP_SELECTOR)) return true;
  return false;
}

function isVisible(el: Element, cs: CSSStyleDeclaration): boolean {
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  if (parseFloat(cs.opacity) === 0) return false;
  const r = (el as HTMLElement).getBoundingClientRect?.();
  if (!r) return true;
  return r.width > 0 && r.height > 0;
}

function isLargeText(cs: CSSStyleDeclaration): boolean {
  const px = parseFloat(cs.fontSize) || 16;
  const w = parseInt(cs.fontWeight, 10) || 400;
  return px >= 24 || (px >= 18.66 && w >= 600);
}

function hasOwnText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 3 && (node.textContent || '').trim().length > 0) return true;
  }
  return false;
}

function fixElement(el: Element) {
  if (shouldSkip(el)) return;
  const cs = getComputedStyle(el);
  if (!isVisible(el, cs)) return;

  const isSvg = el instanceof SVGElement;
  const hasText = hasOwnText(el);
  if (!isSvg && !hasText) return;

  const bg = effectiveBg(el);
  const bgLum = relLuminance(bg);

  // Foreground: for SVGs prefer fill, else color; fall back to color.
  const fgSource = isSvg ? (cs.fill && cs.fill !== 'none' ? cs.fill : cs.color) : cs.color;
  const fg = parseColor(fgSource);
  if (!fg) return;

  // Skip if foreground is fully transparent (likely intentional).
  if (fg.a === 0) return;

  // Effective foreground composited over bg for the ratio test.
  const effFg = composite(fg.rgb, fg.a, bg);
  const ratio = contrastRatio(effFg, bg);

  const floor = isLargeText(cs) ? MIN_RATIO_LARGE : MIN_RATIO_TEXT;
  if (ratio >= floor) {
    // Already passes — clear any prior fix.
    if ((el as HTMLElement).hasAttribute(FIX_ATTR)) {
      (el as HTMLElement).style.removeProperty('color');
      (el as HTMLElement).style.removeProperty('-webkit-text-fill-color');
      (el as HTMLElement).style.removeProperty('stroke');
      (el as HTMLElement).style.removeProperty('opacity');
      (el as HTMLElement).removeAttribute(FIX_ATTR);
    }
    return;
  }

  // Force opposite pole. Light bg → ink. Dark bg → white.
  const target = bgLum > 0.5 ? INK : WHITE;
  const html = el as HTMLElement;
  html.style.setProperty('color', target, 'important');
  html.style.setProperty('-webkit-text-fill-color', target, 'important');
  if (isSvg || el.querySelector?.('svg, [class*="lucide"]')) {
    html.style.setProperty('stroke', 'currentColor', 'important');
  }
  if (parseFloat(cs.opacity) < 1) {
    html.style.setProperty('opacity', '1', 'important');
  }
  html.setAttribute(FIX_ATTR, target === INK ? 'ink' : 'on-dark');
}

// ---------- scheduler ----------

let scheduled = false;
let lastScan = 0;

function scanAll(root: ParentNode = document.body) {
  // Cover anything text- or icon-bearing. Keep selectors broad but bounded.
  const sel =
    'h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote, ' +
    'span, small, strong, em, b, i, u, code, label, ' +
    'a, button, summary, ' +
    '[role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="status"], [role="switch"], ' +
    'th, td, caption, legend, figcaption, ' +
    'svg, [class*="lucide"]';
  const nodes = root.querySelectorAll(sel);
  // Cap per-pass workload to keep main thread responsive.
  const MAX = 3000;
  const limit = Math.min(nodes.length, MAX);
  for (let i = 0; i < limit; i++) {
    try { fixElement(nodes[i]); } catch { /* swallow */ }
  }
}

function schedule(root: ParentNode = document.body) {
  if (scheduled) return;
  const now = performance.now();
  const wait = Math.max(0, RESCAN_INTERVAL_MS - (now - lastScan));
  scheduled = true;
  const run = () => {
    scheduled = false;
    lastScan = performance.now();
    requestAnimationFrame(() => {
      try { scanAll(root); } catch { /* swallow */ }
    });
  };
  if (wait > 0) setTimeout(run, wait); else run();
}

// Local subtree fix for hover/focus/active — runs immediately, no throttle.
function fixSubtree(root: Element | null) {
  if (!root) return;
  requestAnimationFrame(() => {
    try {
      fixElement(root);
      const sel =
        'h1,h2,h3,h4,h5,h6,p,li,span,small,strong,em,b,i,label,' +
        'a,button,summary,svg,[class*="lucide"],' +
        '[role="button"],[role="link"],[role="tab"],[role="menuitem"]';
      const inner = root.querySelectorAll(sel);
      for (let i = 0; i < inner.length; i++) {
        try { fixElement(inner[i]); } catch { /* swallow */ }
      }
    } catch { /* swallow */ }
  });
}

// ---------- public API ----------

let installed = false;

export function installContrastGuard() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // Initial passes after layout and after late hydration.
  setTimeout(() => schedule(), 200);
  setTimeout(() => schedule(), 800);
  setTimeout(() => schedule(), 1800);

  // Route changes — patch history APIs.
  const trigger = () => setTimeout(() => schedule(), 150);
  window.addEventListener('popstate', trigger);
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    const r = origPush.apply(this, args as Parameters<typeof origPush>);
    trigger();
    return r;
  };
  history.replaceState = function (...args) {
    const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
    trigger();
    return r;
  };

  // DOM mutations — async/lazy content, modals, popovers.
  const mo = new MutationObserver(() => schedule());
  mo.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'data-state', 'aria-pressed', 'aria-current', 'aria-expanded', 'data-active'],
  });

  // Hover / focus / active — re-fix the affected subtree immediately so state
  // changes (hover bg swap, active fill swap) never expose unreadable text.
  const delegate = (e: Event) => {
    const t = e.target as Element | null;
    if (!t || t.nodeType !== 1) return;
    const root = (t.closest('a, button, [role="button"], [role="tab"], [role="menuitem"], summary, label') || t) as Element;
    fixSubtree(root);
  };
  document.addEventListener('mouseover', delegate, true);
  document.addEventListener('focusin', delegate, true);
  document.addEventListener('pointerdown', delegate, true);

  // Tab visibility — re-scan on return.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') schedule();
  });
}
