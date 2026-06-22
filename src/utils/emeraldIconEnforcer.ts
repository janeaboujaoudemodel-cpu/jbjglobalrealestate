/**
 * Emerald Icon Enforcer — system-level guarantee that every SVG glyph inside
 * an Emerald-filled icon tile renders in pure white at every state, on every
 * page, regardless of ancestor surface or competing CSS sweeps.
 *
 * Why this exists: the JBJ stylesheet contains very long `:not()` descendant
 * repaint chains that win specificity battles against any reasonable selector.
 * The only reliable cross-cutting win is an inline style with `!important`,
 * which beats every CSS rule in the cascade. This module applies that style
 * once at mount and again on any future DOM mutation, so manual ad-hoc tiles
 * (legacy code) inherit the contract without being refactored individually.
 */

const EMERALD_SURFACE_SELECTOR = [
  ".jj-icon-tile-emerald",
  '[data-icon-tile-tone="emerald"]',
  '[data-icon-tile][data-surface="emerald"]',
  ".jj-emerald-solid",
  ".jj-cta-primary",
  ".jj-badge-dark",
  ".jj-pill-active",
  ".jj-card-emerald",
  ".jj-sidebar-item-active",
  ".jj-tab-pill[data-active='true']",
  '[data-surface="emerald"]',
  '[data-cta="primary"]',
  '[data-emerald-filled]',
  '[data-ink-emerald]',
  '[data-filter-chip][data-active="true"]',
  '[data-pill][data-active="true"]',
  '[role="tab"][data-state="active"]',
  '[data-jj-segmented-trigger][data-state="active"]',
  '[role="checkbox"][data-state="checked"]',
  '[role="radio"][data-state="checked"]',
  'button[role="switch"][data-state="checked"]',
  '[class*="bg-emerald-"]',
  '[class*="bg-green-"]',
  '[style*="#064e3b" i]',
  '[style*="#047857" i]',
  '[style*="#022c22" i]',
].join(",");

const GLYPH_SELECTOR = "svg, [class*='lucide']";
const FOREGROUND_SELECTOR = "span, p, strong, small, em, b, a, button, label, h1, h2, h3, h4, h5, h6, svg, [class*='lucide']";
const SVG_PART_SELECTOR = "path, circle, rect, line, polyline, polygon, ellipse, use, g";

function paintText(el: SVGElement | HTMLElement) {
  el.style.setProperty("color", "#FFFFFF", "important");
  el.style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
  el.style.setProperty("opacity", "1", "important");
  el.style.setProperty("text-shadow", "none", "important");
  el.style.setProperty("mix-blend-mode", "normal", "important");
}

function isEmeraldFilledSurface(el: Element) {
  if (
    el.matches(
      [
        ".jj-icon-tile-emerald",
        '[data-icon-tile-tone="emerald"]',
        ".jj-emerald-solid",
        ".jj-cta-primary",
        ".jj-badge-dark",
        ".jj-pill-active",
        ".jj-card-emerald",
        ".jj-sidebar-item-active",
        '[data-surface="emerald"]',
        '[data-cta="primary"]',
        '[data-emerald-filled]',
        '[data-ink-emerald]',
        '[data-filter-chip][data-active="true"]',
        '[data-pill][data-active="true"]',
        '[role="tab"][data-state="active"]',
        '[data-jj-segmented-trigger][data-state="active"]',
      ].join(","),
    )
  ) {
    return true;
  }

  const html = el as HTMLElement;
  const cls = ` ${html.className || ""} `;
  if (/(\sbg-(emerald|green)-(500|600|700|800|900)\s)/.test(cls)) return true;
  const styles = window.getComputedStyle(html);
  const bg = `${styles.backgroundColor} ${styles.backgroundImage}`.toLowerCase();
  return (
    bg.includes("rgb(6, 78, 59)") ||
    bg.includes("rgb(4, 120, 87)") ||
    bg.includes("rgb(2, 44, 34)") ||
    bg.includes("#064e3b") ||
    bg.includes("#047857") ||
    bg.includes("#022c22")
  );
}

function paint(svg: SVGElement | HTMLElement) {
  paintText(svg);
  svg.style.setProperty("color", "#FFFFFF", "important");
  svg.style.setProperty("stroke", "#FFFFFF", "important");
  svg.style.setProperty("opacity", "1", "important");
  svg.style.setProperty("stroke-opacity", "1", "important");
  svg.style.setProperty("fill-opacity", "1", "important");
  svg.style.setProperty("mix-blend-mode", "normal", "important");
  // Visual guarantee: regardless of inherited SVG color, filters, or utility
  // classes, all non-transparent rendered icon pixels become pure white.
  svg.style.setProperty("filter", "brightness(0) invert(1)", "important");
  // Lucide icons use stroke; explicit `fill: none` keeps line icons crisp.
  if (!svg.hasAttribute("data-filled")) {
    svg.style.setProperty("fill", "none", "important");
  } else {
    svg.style.setProperty("fill", "#FFFFFF", "important");
  }

  svg.querySelectorAll?.(SVG_PART_SELECTOR).forEach((part) => {
    const el = part as SVGElement;
    el.style.setProperty("color", "#FFFFFF", "important");
    el.style.setProperty("stroke", "#FFFFFF", "important");
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("stroke-opacity", "1", "important");
    el.style.setProperty("fill-opacity", "1", "important");
    el.style.setProperty("mix-blend-mode", "normal", "important");
    el.style.setProperty("filter", "none", "important");
    const fillAttr = el.getAttribute("fill");
    if (svg.hasAttribute("data-filled") || (fillAttr && fillAttr !== "none")) {
      el.style.setProperty("fill", "#FFFFFF", "important");
    } else {
      el.style.setProperty("fill", "none", "important");
    }
  });
}

function enforceWithin(root: ParentNode | Element) {
  const tiles =
    "querySelectorAll" in root
      ? (root as ParentNode).querySelectorAll(EMERALD_SURFACE_SELECTOR)
      : [];
  tiles.forEach((tile) => {
    if (!isEmeraldFilledSurface(tile)) return;
    (tile as HTMLElement).style.setProperty("color", "#FFFFFF", "important");
    (tile as HTMLElement).style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
    (tile as HTMLElement).style.setProperty("opacity", "1", "important");
    (tile as HTMLElement).style.setProperty("mix-blend-mode", "normal", "important");
    tile
      .querySelectorAll(FOREGROUND_SELECTOR)
      .forEach((g) => paintText(g as SVGElement | HTMLElement));
    tile
      .querySelectorAll(GLYPH_SELECTOR)
      .forEach((g) => paint(g as SVGElement | HTMLElement));
  });
  // Also handle the case where `root` itself is a tile.
  if (
    "matches" in root &&
    typeof (root as Element).matches === "function" &&
    (root as Element).matches(EMERALD_SURFACE_SELECTOR)
  ) {
    if (!isEmeraldFilledSurface(root as Element)) return;
    const el = root as HTMLElement;
    el.style.setProperty("color", "#FFFFFF", "important");
    el.style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
    el.style.setProperty("opacity", "1", "important");
    (root as Element)
      .querySelectorAll(FOREGROUND_SELECTOR)
      .forEach((g) => paintText(g as SVGElement | HTMLElement));
    (root as Element)
      .querySelectorAll(GLYPH_SELECTOR)
      .forEach((g) => paint(g as SVGElement | HTMLElement));
  }
}

let installed = false;

export function installEmeraldIconEnforcer() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const run = () => {
    if (!document.body) return;
    enforceWithin(document.body);
  };
  // Initial pass once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  // Observe additions so route changes, dialogs, and lazy chunks inherit.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        enforceWithin(node as Element);
      });
      // Class/attribute changes can flip a tile in/out of Emerald.
      if (m.type === "attributes" && m.target.nodeType === 1) {
        const el = m.target as Element;
        if (el.matches?.(EMERALD_SURFACE_SELECTOR)) {
          (el as HTMLElement).style.setProperty("color", "#FFFFFF", "important");
          (el as HTMLElement).style.setProperty("-webkit-text-fill-color", "#FFFFFF", "important");
          el.querySelectorAll(FOREGROUND_SELECTOR).forEach((g) =>
            paintText(g as SVGElement | HTMLElement),
          );
          el.querySelectorAll(GLYPH_SELECTOR).forEach((g) =>
            paint(g as SVGElement | HTMLElement),
          );
        }
      }
    }
  });

  const observe = () => {
    if (!document.body) return;
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "data-icon-tile-tone", "data-surface"],
    });
  };

  if (document.body) observe();
  else document.addEventListener("DOMContentLoaded", observe, { once: true });
}
