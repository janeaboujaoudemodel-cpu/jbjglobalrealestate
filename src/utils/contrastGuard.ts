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
    cur = cur.parentElement;
  }
  return "rgb(253, 251, 247)"; // page #FDFBF7 fallback
}

function fixIfLowContrast(el: HTMLElement) {
  if (el.closest("[data-no-contrast-guard]")) return;
  const cs = window.getComputedStyle(el);
  const fg = parseRgb(cs.color);
  const bg = parseRgb(effectiveBgColor(el));
  if (!fg || !bg) return;
  const lf = relLuminance(fg);
  const lb = relLuminance(bg);
  const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
  if (ratio < 2.5) {
    // Force inverse — pick white if bg is dark, ink otherwise.
    el.classList.add(CONTRAST_FIX_CLASS);
    if (lb < 0.4) {
      el.style.setProperty("color", "#FDFBF7", "important");
    } else {
      el.style.setProperty("color", "#1A1A1A", "important");
    }
  }
}

let scheduled = false;
function scan() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const interactives = document.querySelectorAll<HTMLElement>(
      'button, a[href], [role="button"], [role="menuitem"], [role="tab"], summary, label.cursor-pointer'
    );
    interactives.forEach(fixIfLowContrast);
  });
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
