import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Sets `data-ai-tools-scope="true"` on <body> when the user is on any AI tool
 * page. The global CSS PASS 221 opts these routes OUT of the champagne
 * dropdown surface and paints Radix poppers with the emerald account-menu skin
 * instead (per JBJ standard — AI tools are 100% emerald, no champagne).
 */
const AI_TOOL_PATH_PREFIXES = [
  "/ai-",
  "/rental-index",
  "/my-ai-history",
  "/meeting-center",
  "/voice-settings",
  "/toolkit",
  "/ai-hub",
];

const isAiToolPath = (pathname: string) =>
  AI_TOOL_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));

const AIToolsScopeMarker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const on = isAiToolPath(pathname);
    if (on) {
      document.body.setAttribute("data-ai-tools-scope", "true");
    } else {
      document.body.removeAttribute("data-ai-tools-scope");
    }
    return () => {
      document.body.removeAttribute("data-ai-tools-scope");
    };
  }, [pathname]);
  return null;
};

export default AIToolsScopeMarker;
