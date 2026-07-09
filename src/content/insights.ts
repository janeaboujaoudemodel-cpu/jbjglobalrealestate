/** Placeholder Insights hub content — replace via CMS in Batch B. */
export type InsightItem = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readMinutes: number;
  cover: string;
  date: string;
};

export const INSIGHT_ITEMS: InsightItem[] = [
  {
    slug: "dubai-market-report-q4-2025",
    category: "Market Reports",
    title: "Dubai Market Report — Q4 2025 Deep Dive",
    excerpt:
      "Transaction volumes, price-per-sqft movement across 34 communities, and where institutional capital is flowing next.",
    readMinutes: 14,
    cover: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&q=80",
    date: "Dec 2025",
  },
  {
    slug: "golden-visa-2026",
    category: "Golden Visa",
    title: "Golden Visa 2026 — the definitive guide",
    excerpt: "Every eligibility route, updated thresholds, and the paperwork that trips 8 out of 10 applicants.",
    readMinutes: 11,
    cover: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&auto=format&q=80",
    date: "Nov 2025",
  },
  {
    slug: "off-plan-vs-ready-2026",
    category: "Investment",
    title: "Off-plan vs. Ready — how to choose in 2026",
    excerpt: "A framework for cash-flow, capital appreciation, and handover risk across Dubai's top developer launches.",
    readMinutes: 9,
    cover: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&q=80",
    date: "Nov 2025",
  },
  {
    slug: "palm-jumeirah-area-guide",
    category: "Area Guides",
    title: "Palm Jumeirah — the collector's area guide",
    excerpt: "Prime villa vs. apartment plays, hidden supply data, and the two crescents most likely to outperform.",
    readMinutes: 8,
    cover: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&q=80",
    date: "Oct 2025",
  },
  {
    slug: "buying-guide-non-resident",
    category: "Buying Guides",
    title: "The non-resident buyer's playbook",
    excerpt: "From reserving an off-plan unit remotely to signing DLD paperwork in 72 hours.",
    readMinutes: 12,
    cover: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&q=80",
    date: "Oct 2025",
  },
  {
    slug: "selling-guide-2026",
    category: "Selling Guides",
    title: "Sell smart — pricing, staging, buyer targeting",
    excerpt: "Data-backed playbook for maximising exit value on secondary-market Dubai apartments and villas.",
    readMinutes: 7,
    cover: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&q=80",
    date: "Sep 2025",
  },
  {
    slug: "rental-yield-guide-2026",
    category: "Rental Guides",
    title: "The 2026 rental yield map",
    excerpt: "Where the highest gross yields sit today — and the neighbourhoods where they're compressing fastest.",
    readMinutes: 6,
    cover: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&auto=format&q=80",
    date: "Sep 2025",
  },
  {
    slug: "tax-guide-uae",
    category: "Tax Guides",
    title: "UAE tax playbook for global investors",
    excerpt: "Corporate tax, VAT on real estate, and how structures interact with source-country obligations.",
    readMinutes: 10,
    cover: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&auto=format&q=80",
    date: "Aug 2025",
  },
  {
    slug: "off-plan-launch-radar",
    category: "Off-Plan",
    title: "Off-plan launch radar — Q1 2026",
    excerpt: "The nine launches worth queueing for, ranked by developer track record and unit economics.",
    readMinutes: 8,
    cover: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&auto=format&q=80",
    date: "Aug 2025",
  },
];

export const INSIGHT_CATEGORIES = [
  "All",
  "Market Reports",
  "Investment",
  "Area Guides",
  "Buying Guides",
  "Selling Guides",
  "Golden Visa",
  "Tax Guides",
  "Rental Guides",
  "Off-Plan",
];
