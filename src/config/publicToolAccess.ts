export const APPROVED_PUBLIC_TOOL_IDS = new Set([
  "ai-home-finder",
  "property-comparison",
  "mortgage-calculator",
  "rental-index",
  "property-evaluator",
  "list-property-sale",
  "list-property-rent",
]);

export const APPROVED_PUBLIC_TOOL_HREFS = new Set([
  "/quiz",
  "/compare",
  "/mortgage-calculator",
  "/rental-index",
  "/property-evaluator",
  "/listing-portal?type=sale",
  "/listing-portal?type=rent",
]);

export const isApprovedPublicToolId = (toolId: string) => APPROVED_PUBLIC_TOOL_IDS.has(toolId);

export const isApprovedPublicToolHref = (href: string) => APPROVED_PUBLIC_TOOL_HREFS.has(href);