// JBJ pricing catalog — mirrors Stripe products created via batch_create_product.
// Price IDs are stable across sandbox and live.

export type BillingInterval = "one_time" | "monthly" | "yearly";

export interface PriceOption {
  priceId: string;
  interval: BillingInterval;
  amountAed: number;
  label: string;
  savingsNote?: string;
}

export interface PricingTier {
  key: string;
  name: string;
  tagline: string;
  headline: string;
  description: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  prices: PriceOption[];
}

// Investor Memberships
export const INVESTOR_TIERS: PricingTier[] = [
  {
    key: "starter",
    name: "Investor Starter",
    tagline: "Try the JBJ advisory experience",
    headline: "One 30-minute strategy call",
    description:
      "Ideal for first-time buyers exploring Dubai. One-off consultation plus 30-day access to Insights and Library.",
    features: [
      "30-minute one-off consultation",
      "30-day access to Insights",
      "30-day Library downloads",
      "Personalized shortlist (up to 5 units)",
    ],
    prices: [
      { priceId: "jbj_investor_starter_onetime", interval: "one_time", amountAed: 499, label: "One-time" },
    ],
  },
  {
    key: "professional",
    name: "Investor Professional",
    tagline: "Monthly advisory & priority access",
    headline: "1 x 60-min call every month",
    description:
      "For active investors building a Dubai portfolio. Priority off-market access + full ecosystem entitlement.",
    features: [
      "1 x 60-min consultation / month",
      "Priority off-market listings",
      "Quarterly market reports",
      "Full Insights & Library access",
      "Personal WhatsApp advisor",
    ],
    featured: true,
    badge: "Most popular",
    prices: [
      { priceId: "jbj_investor_professional_monthly", interval: "monthly", amountAed: 1499, label: "per month" },
      {
        priceId: "jbj_investor_professional_yearly",
        interval: "yearly",
        amountAed: 14990,
        label: "per year",
        savingsNote: "Save AED 2,998 vs monthly",
      },
    ],
  },
  {
    key: "executive",
    name: "Investor Executive",
    tagline: "Dedicated portfolio management",
    headline: "2 x 60-min strategy sessions monthly",
    description:
      "For HNW investors and family offices. Dedicated portfolio manager, AI tooling, and concierge tours.",
    features: [
      "2 x 60-min strategy sessions / month",
      "Dedicated portfolio manager",
      "AI Market Analyzer access",
      "Exclusive off-market opportunities",
      "Concierge property tours (up to 4 / month)",
      "Priority Golden Visa support",
    ],
    prices: [
      { priceId: "jbj_investor_executive_monthly", interval: "monthly", amountAed: 3999, label: "per month" },
      {
        priceId: "jbj_investor_executive_yearly",
        interval: "yearly",
        amountAed: 39990,
        label: "per year",
        savingsNote: "Save AED 7,998 vs monthly",
      },
    ],
  },
  {
    key: "founder",
    name: "Founder Experience",
    tagline: "Direct access to the JBJ Founder",
    headline: "Unlimited advisory hours",
    description:
      "White-glove concierge for principal investors and institutions. Private events, off-market Golden Visa portfolios, direct founder line.",
    features: [
      "Unlimited advisory hours",
      "Direct WhatsApp to JBJ Founder",
      "Invitations to private events",
      "Off-market Golden Visa portfolios",
      "White-glove concierge across UAE",
      "Legal, banking & structuring intros",
    ],
    badge: "Invitation only",
    prices: [
      { priceId: "jbj_investor_founder_monthly", interval: "monthly", amountAed: 9999, label: "per month" },
      {
        priceId: "jbj_investor_founder_yearly",
        interval: "yearly",
        amountAed: 99990,
        label: "per year",
        savingsNote: "Save AED 19,998 vs monthly",
      },
    ],
  },
];

// Broker Academy
export const ACADEMY_BUNDLES: PricingTier[] = [
  {
    key: "single",
    name: "Single Session",
    tagline: "Try before you commit",
    headline: "1 x 90-min live session",
    description: "One live session with a senior JBJ broker. Pick a topic that matters to you.",
    features: [
      "1 x 90-min live session",
      "Session recording",
      "Workbook & templates",
    ],
    prices: [{ priceId: "jbj_academy_single_onetime", interval: "one_time", amountAed: 499, label: "One-time" }],
  },
  {
    key: "bundle5",
    name: "5-Session Bundle",
    tagline: "Core Dubai brokerage",
    headline: "5 x 90-min sessions",
    description: "Market fundamentals, RERA/DLD, sales conversations, off-plan strategy, CRM.",
    features: [
      "Dubai market fundamentals",
      "RERA & DLD compliance",
      "Sales conversations & objections",
      "Off-plan strategy",
      "CRM workflow setup",
    ],
    prices: [{ priceId: "jbj_academy_5_onetime", interval: "one_time", amountAed: 1999, label: "One-time" }],
  },
  {
    key: "bundle10",
    name: "10-Session Program",
    tagline: "Full Academy curriculum",
    headline: "10 x 90-min sessions",
    description: "Complete Broker Academy program. Includes Certificate of Completion.",
    features: [
      "Everything in 5-session bundle",
      "AI tools for brokers",
      "Prospecting & lead-gen playbooks",
      "Certificate of Completion",
      "JBJ interview funnel eligibility",
    ],
    featured: true,
    badge: "Most popular",
    prices: [{ priceId: "jbj_academy_10_onetime", interval: "one_time", amountAed: 3499, label: "One-time" }],
  },
  {
    key: "bundle20",
    name: "20-Session Mastery",
    tagline: "Mentorship & live deals",
    headline: "20 x 90-min sessions",
    description: "Extended mentorship, live deal shadowing, priority JBJ interview funnel.",
    features: [
      "Everything in 10-session program",
      "1:1 mentorship hours",
      "Sales role-play labs",
      "Live deal shadowing",
      "Priority JBJ interview funnel",
    ],
    prices: [{ priceId: "jbj_academy_20_onetime", interval: "one_time", amountAed: 5999, label: "One-time" }],
  },
];

// Agency Packages
export const AGENCY_PACKAGES: PricingTier[] = [
  {
    key: "seats20",
    name: "Agency Pack - 20 Users",
    tagline: "Boutique brokerages",
    headline: "Up to 20 users",
    description: "Full JBJ ecosystem for growing teams. CRM, AI, Matchmaker, Academy, Library.",
    features: [
      "20 user seats",
      "CRM & AI Toolkit",
      "Client Matchmaker",
      "Broker Academy access",
      "Full Library",
      "Reporting & automations",
    ],
    prices: [
      { priceId: "jbj_agency_20_monthly", interval: "monthly", amountAed: 4999, label: "per month" },
      {
        priceId: "jbj_agency_20_yearly",
        interval: "yearly",
        amountAed: 49990,
        label: "per year",
        savingsNote: "Save AED 9,998 vs monthly",
      },
    ],
  },
  {
    key: "seats50",
    name: "Agency Pack - 50 Users",
    tagline: "Mid-market brokerages",
    headline: "Up to 50 users",
    description: "Scaled ecosystem with priority support and quarterly onsite training.",
    features: [
      "50 user seats",
      "Everything in 20-user pack",
      "Priority support (24h SLA)",
      "Quarterly onsite training",
      "Dedicated account manager",
    ],
    featured: true,
    badge: "Most popular",
    prices: [
      { priceId: "jbj_agency_50_monthly", interval: "monthly", amountAed: 9999, label: "per month" },
      {
        priceId: "jbj_agency_50_yearly",
        interval: "yearly",
        amountAed: 99990,
        label: "per year",
        savingsNote: "Save AED 19,998 vs monthly",
      },
    ],
  },
  {
    key: "seats100",
    name: "Agency Pack - 100 Users",
    tagline: "Enterprise brokerages",
    headline: "Up to 100 users",
    description: "Enterprise deployment with custom AI training and white-labeled Library.",
    features: [
      "100 user seats",
      "Everything in 50-user pack",
      "Dedicated success manager",
      "Custom AI training",
      "White-labeled Library",
      "Custom integrations",
    ],
    prices: [
      { priceId: "jbj_agency_100_monthly", interval: "monthly", amountAed: 17999, label: "per month" },
      {
        priceId: "jbj_agency_100_yearly",
        interval: "yearly",
        amountAed: 179990,
        label: "per year",
        savingsNote: "Save AED 35,998 vs monthly",
      },
    ],
  },
];

export function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString("en-AE")}`;
}
