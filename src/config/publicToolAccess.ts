export const APPROVED_PUBLIC_TOOLS = [
  { id: "ai-home-finder", label: "AI Home Finder", href: "/ai-home-finder" },
  { id: "mortgage-calculator", label: "Mortgage Calculator", href: "/mortgage-calculator" },
  { id: "rental-index", label: "Rental Index", href: "/rental-index" },
  { id: "property-evaluator", label: "Property Evaluator", href: "/property-evaluator" },
  { id: "list-property-sale", label: "List Property for Sale", href: "/listing-portal?type=sale" },
  { id: "list-property-rent", label: "List Property for Rent", href: "/listing-portal?type=rent" },
  { id: "interior-design", label: "AI Interior Design", href: "/interior-design-ai" },
] as const;

export const APPROVED_PUBLIC_TOOL_IDS: ReadonlySet<string> = new Set(APPROVED_PUBLIC_TOOLS.map((tool) => tool.id));

export const APPROVED_PUBLIC_TOOL_HREFS: ReadonlySet<string> = new Set(APPROVED_PUBLIC_TOOLS.map((tool) => tool.href));

export const isApprovedPublicToolId = (toolId: string) => APPROVED_PUBLIC_TOOL_IDS.has(toolId);

export const isApprovedPublicToolHref = (href: string) => APPROVED_PUBLIC_TOOL_HREFS.has(href);