import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Sets `data-ai-tools-scope="true"` on <body> when the user is on any AI tool
 * or tool-workspace page. The global CSS PASS 221 opts these routes OUT of the
 * champagne dropdown surface and paints every Radix popper with the emerald
 * account-menu skin instead (per JBJ standard — AI tools are 100% emerald, no
 * champagne). Canonical list mirrors scripts/tool-emerald-audit/routes.json
 * plus a few first-party aliases.
 */
const AI_TOOL_PATH_PREFIXES = [
  // AI tools (catches every /ai-* route)
  "/ai-",
  "/ai-hub",
  "/my-ai-history",
  "/meeting-center",
  "/voice-settings",
  // Workspace / toolkit / suites / studio
  "/toolkit",
  "/suites",
  "/business-suite",
  "/studio",
  "/virtual-staging-ai",
  "/e-signature",
  // Individual tools
  "/rental-index",
  "/property-evaluator",
  "/property-measurement",
  "/interior-design-ai",
  "/business-card-scanner",
  "/mortgage-calculator",
  "/compare",
  "/home-finder",
  // Listing tools + first-party aliases
  "/list-property",
  "/listing-portal",
  "/list-your-property",
  "/sell-your-property",
  "/rent-your-property",
];

const isAiToolPath = (pathname: string) =>
  AI_TOOL_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p));

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
