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
 * PASS 341 — ONE CHROME ON EVERY DEVICE (LOCKED)
 *
 * Phone, iPad (portrait and landscape), laptop and desktop all run the SAME
 * navigation chrome: the emerald/champagne vertical rail pinned left plus the
 * horizontal utility bar. There is no separate phone shell any more, so the
 * structure, logic and skin (Sun / Moon, collapsed / expanded) are identical
 * everywhere. Below 1024px the expanded rail overlays the page instead of
 * squeezing it — the permanently reserved column stays the 59px rail width.
 */
const computeMode = (): ChromeMode => "desktop";

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
