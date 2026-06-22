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

const TILE_SELECTOR = [
  ".jj-icon-tile-emerald",
  '[data-icon-tile-tone="emerald"]',
  '[data-icon-tile][data-surface="emerald"]',
].join(",");

const GLYPH_SELECTOR = "svg, [class*='lucide']";

function paint(svg: SVGElement | HTMLElement) {
  svg.style.setProperty("color", "#FFFFFF", "important");
  svg.style.setProperty("stroke", "#FFFFFF", "important");
  // Lucide icons use stroke; explicit `fill: none` keeps line icons crisp.
  if (!svg.hasAttribute("data-filled")) {
    svg.style.setProperty("fill", "none", "important");
  }
}

function enforceWithin(root: ParentNode | Element) {
  const tiles =
    "querySelectorAll" in root
      ? (root as ParentNode).querySelectorAll(TILE_SELECTOR)
      : [];
  tiles.forEach((tile) => {
    tile
      .querySelectorAll(GLYPH_SELECTOR)
      .forEach((g) => paint(g as SVGElement | HTMLElement));
  });
  // Also handle the case where `root` itself is a tile.
  if (
    "matches" in root &&
    typeof (root as Element).matches === "function" &&
    (root as Element).matches(TILE_SELECTOR)
  ) {
    (root as Element)
      .querySelectorAll(GLYPH_SELECTOR)
      .forEach((g) => paint(g as SVGElement | HTMLElement));
  }
}

let installed = false;

export function installEmeraldIconEnforcer() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const run = () => enforceWithin(document.body);
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
        if (el.matches?.(TILE_SELECTOR)) {
          el.querySelectorAll(GLYPH_SELECTOR).forEach((g) =>
            paint(g as SVGElement | HTMLElement),
          );
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-icon-tile-tone", "data-surface"],
  });
}
