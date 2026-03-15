import * as React from "react";

/**
 * Returns true on touch-centric devices (coarse pointer / no hover).
 * We use this to decide between the mobile header (sheet menu) and the desktop header,
 * so the desktop header doesn't collapse in narrow iframes (like the Lovable preview).
 */
export function useIsTouchLayout() {
  const [isTouch, setIsTouch] = React.useState(() => {
    if (typeof window === "undefined") return false;
    // L-frame at 768px+ (matches md breakpoint) — phone-only below 768
    if (window.innerWidth >= 768) {
      // At tablet/desktop widths, only use touch layout if device is truly touch-only phone
      try {
        const mql = window.matchMedia("(hover: none) and (pointer: coarse)");
        const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
        return mql.matches && hasTouchPoints && window.innerWidth < 768;
      } catch {
        return false;
      }
    }
    // Below 768px, always use touch/mobile layout (phones)
    return true;
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
      if (window.innerWidth >= 1024) {
        // Desktop width — only touch layout for true touch-only devices
        const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
        setIsTouch(mql!.matches && hasTouchPoints);
        return;
      }
      // Below 1024px — always mobile
      setIsTouch(true);
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
