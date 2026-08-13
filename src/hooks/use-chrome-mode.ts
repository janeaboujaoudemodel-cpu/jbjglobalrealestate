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

const DESKTOP_MIN_WIDTH = 1024;

const computeMode = (): ChromeMode => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isLandscape = w >= h;
  if (isLandscape && w >= DESKTOP_MIN_WIDTH) return "desktop";
  // Portrait: phone logic, no matter how wide the tablet is.
  return "phone";
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
