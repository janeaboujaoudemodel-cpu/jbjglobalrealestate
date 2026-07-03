/**
 * lazyImageEnforcer — global performance guard.
 *
 * For every <img> in the DOM that does NOT explicitly opt into eager loading
 * (loading="eager", fetchpriority="high", or data-eager), ensure:
 *   • loading="lazy"
 *   • decoding="async"
 *
 * Runs once on mount + observes future mutations. Zero visual change,
 * meaningful savings on image-heavy pages by keeping below-the-fold images
 * off the critical path.
 */

const EAGER_ATTR = "data-eager";

function tune(img: HTMLImageElement) {
  if (img.hasAttribute(EAGER_ATTR)) return;
  const explicitLoading = img.getAttribute("loading");
  const fp = img.getAttribute("fetchpriority");
  if (explicitLoading === "eager" || fp === "high") return;
  if (!explicitLoading) img.setAttribute("loading", "lazy");
  if (!img.getAttribute("decoding")) img.setAttribute("decoding", "async");
}

let installed = false;

export function installLazyImageEnforcer(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

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
