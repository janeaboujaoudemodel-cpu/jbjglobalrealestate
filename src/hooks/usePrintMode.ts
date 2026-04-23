import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Detects ?print=1 or ?baseline=1 in the URL and toggles
 * data-print-mode="1" on <html> so global CSS + components
 * can hide chrome (header, sidebar, footer, popups, cookie banner).
 */
export function usePrintMode(): boolean {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const isPrintMode =
    params.get("print") === "1" || params.get("baseline") === "1";

  useEffect(() => {
    const root = document.documentElement;
    if (isPrintMode) {
      root.setAttribute("data-print-mode", "1");
    } else {
      root.removeAttribute("data-print-mode");
    }
    return () => {
      root.removeAttribute("data-print-mode");
    };
  }, [isPrintMode]);

  return isPrintMode;
}

export default usePrintMode;
