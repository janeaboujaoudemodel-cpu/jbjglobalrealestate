import { useEffect } from "react";

/**
 * Site-wide runtime enforcement: every champagne CTA primitive
 * (`.jj-cta-champagne`, `.mi-hero-cta`, `.jj-cta-outline`, `.jj-pill-active`)
 * MUST render ink (#1A1A1A) text + icons + stroke regardless of what dark
 * parent (data-hero-dark / surface-dark) tries to inherit. CSS rules with
 * !important sometimes lose to inherited -webkit-text-fill-color from a
 * dark ancestor; this guard sets the property via DOM `setProperty` with
 * `important`, which beats any stylesheet origin.
 *
 * Zero opt-outs: there is no legitimate reason for any champagne CTA on
 * this site to render white-on-champagne. Mounted once at the App root.
 */
const SELECTOR =
  ".jj-cta-champagne, .mi-hero-cta, .jj-cta-outline, .jj-pill-active";

const apply = (root: ParentNode = document) => {
  const nodes = root.querySelectorAll<HTMLElement>(SELECTOR);
  nodes.forEach((el) => {
    el.style.setProperty("color", "#1A1A1A", "important");
    el.style.setProperty("-webkit-text-fill-color", "#1A1A1A", "important");
    el.style.setProperty("text-shadow", "none", "important");
    el.querySelectorAll<HTMLElement>("span, svg, p, b, strong, em, i, [class*='lucide']").forEach(
      (child) => {
        child.style.setProperty("color", "#1A1A1A", "important");
        child.style.setProperty("-webkit-text-fill-color", "#1A1A1A", "important");
        child.style.setProperty("stroke", "#1A1A1A", "important");
        child.style.setProperty("text-shadow", "none", "important");
      }
    );
  });
};

export default function ChampagneCtaInkGuard() {
  useEffect(() => {
    apply();

    const obs = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            const el = n as HTMLElement;
            if (el.matches?.(SELECTOR)) apply(el.parentNode || document);
            else apply(el);
          }
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Re-apply on route changes / popstate just in case.
    const onNav = () => apply();
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);

    return () => {
      obs.disconnect();
      window.removeEventListener("popstate", onNav);
      window.removeEventListener("hashchange", onNav);
    };
  }, []);

  return null;
}
