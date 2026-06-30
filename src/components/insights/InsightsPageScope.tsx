import { ReactNode } from "react";

/**
 * InsightsPageScope
 *
 * Single wrapper that tags any page in the Insights / Guides / FAQ branch
 * of the vertical sidebar with `data-insights-page`. PASS 133 in index.css
 * binds to that attribute and enforces the brand contract:
 *   - champagne page surface
 *   - ink (#1A1A1A) headings + body on champagne
 *   - white foreground on every emerald CTA / pill at every state
 *   - white text inside any [data-hero-dark] surface
 *   - raw grays auto-flatten to champagne / soft ink
 *   - emerald icon tiles keep white glyphs
 *
 * Pages opt out of an individual rule with [data-no-contrast-guard] on the
 * offending node (e.g. WHITE text on a video hero already does this).
 *
 * Adding a page to the branch is now a one-line change in the router —
 * wrap the route's element with <InsightsPageScope>…</InsightsPageScope>.
 */
export function InsightsPageScope({ children }: { children: ReactNode }) {
  return (
    <div data-insights-page className="contents">
      {children}
    </div>
  );
}

export default InsightsPageScope;
