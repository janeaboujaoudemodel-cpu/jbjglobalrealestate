import * as React from "react";

/**
 * Returns true on touch-centric devices (coarse pointer / no hover).
 * We use this to decide between the mobile header (sheet menu) and the desktop header,
 * so the desktop header doesn't collapse in narrow iframes (like the Lovable preview).
 */
export function useIsTouchLayout() {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    // Fallback: treat narrow viewports as touch regardless of pointer/touchPoints
    if (window.innerWidth < 1024) return true;
    try {
      const mql = window.matchMedia("(hover: none), (pointer: coarse)");
      const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
      return mql.matches && hasTouchPoints;
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia("(hover: none), (pointer: coarse)");
    } catch {
      // ignore
    }
    if (!mql) return;

    const onChange = () => {
      const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
      setIsTouch(mql!.matches && hasTouchPoints);
    };
    onChange();

    // Safari fallback
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange);
      return () => mql?.removeEventListener("change", onChange);
    }

    // @ts-expect-error - legacy API
    mql.addListener(onChange);
    return () => {
      // @ts-expect-error - legacy API
      mql?.removeListener(onChange);
    };
  }, []);

  return isTouch;
}
