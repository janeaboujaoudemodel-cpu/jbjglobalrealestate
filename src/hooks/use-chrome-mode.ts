import * as React from "react";

/**
 * PASS 333 — ORIENTATION-DRIVEN CHROME MODE (LOCKED)
 *
 * One rule for every device:
 *  • Landscape / "rectangular" screens with room (≥ 1024 CSS px) use the DESKTOP
 *    chrome — vertical sidebar + horizontal utility bar. That covers laptops,
 *    desktops and iPads held sideways.
 *  • Portrait screens (and anything narrow) use the PHONE chrome — floating
 *    hamburger + mobile drawer. That covers phones and iPads held upright.
 *
 * The mode is also mirrored onto <body data-jj-chrome-mode> so CSS can react
 * without duplicating the media-query maths.
 */
export type ChromeMode = "desktop" | "phone";

/**
 * PASS 350 — PHONE = HEADER + HAMBURGER ONLY (LOCKED)
 *
 * Phones (narrow screens, < 768px) never show the collapsed vertical rail or
 * the horizontal utility bar — the screen is too small. They run the compact
 * global header with the hamburger only; tapping it opens the full sidebar as
 * a drawer sliding in from the RIGHT (next to the hamburger) in both skins.
 *
 * iPad and above (portrait AND landscape) plus laptops/desktops keep the
 * unified desktop chrome: vertical rail + utility bar.
 */
const PHONE_MAX = 768;
const computeMode = (): ChromeMode => {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < PHONE_MAX ? "phone" : "desktop";
};


export function useChromeMode(): ChromeMode {
  const [mode, setMode] = React.useState<ChromeMode>(computeMode);

  React.useEffect(() => {
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setMode((prev) => {
          const next = computeMode();
          return prev === next ? prev : next;
        });
      });
    };
    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("orientationchange", recompute);
    };
  }, []);

  React.useEffect(() => {
    document.body.dataset.jjChromeMode = mode;
  }, [mode]);

  return mode;
}

export function useIsPhoneChrome(): boolean {
  return useChromeMode() === "phone";
}
