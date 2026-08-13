import * as React from "react";

/**
 * Chrome skin state, read straight off the document so every control in the
 * horizontal header follows the same skin as the vertical sidebar:
 *   - "clear"     → header floats over a hero: transparent surface, white ink
 *   - "champagne" → Sun skin: gold-champagne surface, black ink (light surface)
 *   - "emerald"   → Moon skin: emerald ombre surface, white ink (dark surface)
 */
export type ControlSkin = "clear" | "champagne" | "emerald";

export function readControlSkin(): ControlSkin {
  if (typeof document === "undefined") return "emerald";
  const root = document.documentElement;
  if (document.body?.getAttribute("data-jj-hero-chrome") === "clear") return "clear";
  const backendLocked = root.getAttribute("data-jbj-backend-lock") === "1";
  if (!backendLocked && root.getAttribute("data-jbj-theme") === "sun") return "champagne";
  return "emerald";
}

export function useControlSkin(): ControlSkin {
  const [skin, setSkin] = React.useState<ControlSkin>(readControlSkin);
  React.useEffect(() => {
    const sync = () =>
      setSkin((prev) => {
        const next = readControlSkin();
        return next === prev ? prev : next;
      });
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-jbj-theme", "data-jbj-backend-lock"],
    });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ["data-jj-hero-chrome"] });
    }
    return () => obs.disconnect();
  }, []);
  return skin;
}

/** Ink for a skin: champagne (Sun light surface) = black, everything else = white. */
export function inkForSkin(skin: ControlSkin): string {
  return skin === "champagne" ? "#1A1A1A" : "#FFFFFF";
}

/**
 * Paints text + icon ink with `!important` priority on the element and every
 * descendant. Legacy global stylesheets still force white ink with !important on
 * header controls, and an inline style alone loses that fight — this wins it
 * without adding more global CSS.
 *
 * Writes are cached per node: repainting the same ink is a no-op, so a theme
 * switch never triggers a style-recalc storm across every header control.
 */
const lastInk = new WeakMap<Element, string>();

export function paintInk(el: HTMLElement | null, ink: string) {
  if (!el) return;
  if (lastInk.get(el) === ink) return;
  const apply = (node: HTMLElement | SVGElement) => {
    if (lastInk.get(node) === ink) return;
    const s = node.style as CSSStyleDeclaration;
    s.setProperty("color", ink, "important");
    s.setProperty("-webkit-text-fill-color", ink, "important");
    if (node instanceof SVGElement && node.tagName.toLowerCase() !== "svg") {
      const current = node.getAttribute("stroke");
      if (current !== "none") s.setProperty("stroke", ink, "important");
    }
    lastInk.set(node, ink);
  };
  apply(el);
  el.querySelectorAll<HTMLElement>("*").forEach((child) => {
    if (child.hasAttribute("data-keep-ink")) return;
    apply(child as HTMLElement);
  });
}

/**
 * Ref that keeps its subtree's ink locked to the given colour.
 * `hoverInk` (optional) is used while the pointer is over the element — a clear
 * control over a hero paints its theme surface on hover, so its ink has to flip
 * with it (champagne hover in Sun ⇒ black ink, per the contrast contract).
 *
 * The paint runs synchronously on skin change plus once on the next frame (for
 * children mounted late) — never on a timer, so switching themes is instant.
 */
export function useInkLock<T extends HTMLElement>(ink: string, hoverInk?: string) {
  const ref = React.useRef<T | null>(null);
  const hovered = React.useRef(false);
  React.useEffect(() => {
    const el = ref.current;
    const run = () => paintInk(ref.current, hovered.current && hoverInk ? hoverInk : ink);
    run();
    const raf = window.requestAnimationFrame(run);
    const enter = () => {
      hovered.current = true;
      run();
    };
    const leave = () => {
      hovered.current = false;
      run();
    };
    el?.addEventListener("pointerenter", enter);
    el?.addEventListener("pointerleave", leave);
    return () => {
      window.cancelAnimationFrame(raf);
      el?.removeEventListener("pointerenter", enter);
      el?.removeEventListener("pointerleave", leave);
    };
  }, [ink, hoverInk]);
  return ref;
}



/**
 * Hover ink for a control while the chrome is clear: hovering paints the selected
 * theme surface, so Sun (champagne) needs black ink and Moon (emerald) white.
 * Returns undefined when the chrome is not clear — the rest ink already matches.
 */
export function clearHoverInk(skin: ControlSkin): string | undefined {
  if (skin !== "clear" || typeof document === "undefined") return undefined;
  const root = document.documentElement;
  const sun = root.getAttribute("data-jbj-backend-lock") !== "1" && root.getAttribute("data-jbj-theme") === "sun";
  return sun ? "#1A1A1A" : "#FFFFFF";
}
