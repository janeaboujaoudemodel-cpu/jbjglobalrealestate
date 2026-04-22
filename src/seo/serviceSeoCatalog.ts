/**
 * Centralized SEO catalog for /services/* routes.
 *
 * Single source of truth for: slug, file, title, description, canonicalPath.
 * The hreflang targets are computed from this catalog + SUPPORTED_LANGUAGES
 * by `computeServiceSeoEntries()` below, mirroring the runtime behaviour of
 * <CanonicalAndHreflang />: every locale points at the SAME canonical URL
 * because the site is single-URL across languages.
 *
 * Keeping this file in sync with the per-page <SEOHead /> calls is enforced
 * visually on the owner-only review page at /owner/seo-review.
 */
import { SUPPORTED_LANGUAGES, type Language } from "@/translations";

export const CANONICAL_ORIGIN = "https://www.jbj.ae";

export interface ServiceSeoSource {
  slug: string;
  file: string;
  title: string;
  description: string;
  canonicalPath: string;
}

/**
 * Mirrors the SEOHead props declared in src/pages/services/*.tsx.
 * Order = alphabetical by file for easy diffing.
 */
export const SERVICE_SEO_CATALOG: ServiceSeoSource[] = [
  {
    slug: "ai-tools",
    file: "AITools.tsx",
    title: "AI Tools & Calculators | JBJ Global Real Estate",
    description:
      "Clarity-first tools that support decision-making through structured inputs, transparent outputs, and consistent formatting.",
    canonicalPath: "/services/ai-tools",
  },
  {
    slug: "architecture",
    file: "Architecture.tsx",
    title:
      "Architecture Services Dubai | Design & Build | JBJ GLOBAL REAL ESTATE",
    description:
      "Visionary architecture services in Dubai. Concept design, technical drawings, project management, and sustainable building solutions. Partner with licensed architects.",
    canonicalPath: "/services/architecture",
  },
  {
    slug: "broker-certification",
    file: "BrokerCertification.tsx",
    title: "Broker Certification — Internal Program | JBJ Global Real Estate",
    description:
      "A structured internal standards program created by JBJ Global Real Estate for our broker partner network. Built for consistency, quality, and client experience alignment.",
    canonicalPath: "/services/broker-certification",
  },
  {
    slug: "buying-advisory",
    file: "BuyingAdvisory.tsx",
    title: "Buying Advisory Services | JBJ Global Real Estate",
    description:
      "Professional buying advisory and representation for property purchases in Dubai. Expert guidance from market analysis to transaction completion.",
    canonicalPath: "/services/buying-advisory",
  },
  {
    slug: "company-setup",
    file: "CompanySetup.tsx",
    title: "Company Setup Support | JBJ Global Real Estate",
    description:
      "Structured coordination for company setup through licensed specialists—clear steps, document readiness, and progress tracking.",
    canonicalPath: "/services/company-setup",
  },
  {
    slug: "complaint-procedures",
    file: "ComplaintProcedures.tsx",
    title: "Complaint Procedures | JBJ Global Real Estate",
    description:
      "A structured pathway to raise concerns, track outcomes, and escalate responsibly—without noise or confusion.",
    canonicalPath: "/services/complaint-procedures",
  },
  {
    slug: "concierge",
    file: "Concierge.tsx",
    title: "Concierge Convenience Services | JBJ Global Real Estate",
    description:
      "Time-saving operational support around your property journey—appointments, coordination, and structured follow-through.",
    canonicalPath: "/services/concierge",
  },
  {
    slug: "currency-exchange",
    file: "CurrencyExchange.tsx",
    title: "Currency Exchange Support | JBJ Global Real Estate",
    description:
      "Coordination support for cross-border buyers transferring funds—structured documentation, clean routing, and partner introductions when needed.",
    canonicalPath: "/services/currency-exchange",
  },
  {
    slug: "customer-happiness-center",
    file: "CustomerHappinessCenter.tsx",
    title: "Customer Happiness Center | JBJ Global Real Estate",
    description:
      "Fast routing, clear answers, and structured support—built around ticket tracking and professional resolution.",
    canonicalPath: "/services/customer-happiness-center",
  },
  {
    slug: "fit-out",
    file: "FitOut.tsx",
    title:
      "Fit-Out & Renovation Dubai | Commercial & Residential | JBJ GLOBAL REAL ESTATE",
    description:
      "Professional fit-out and renovation services in Dubai. Full fit-out, renovations, commercial spaces, and fast-track projects. Licensed contractors with quality guarantee.",
    canonicalPath: "/services/fit-out",
  },
  {
    slug: "interior-design",
    file: "InteriorDesign.tsx",
    title:
      "Interior Design Services Dubai | Luxury Interiors | JBJ GLOBAL REAL ESTATE",
    description:
      "Premium interior design services in Dubai. Concept development, space planning, lighting design, and FF&E selection. Transform your space with expert designers.",
    canonicalPath: "/services/interior-design",
  },
  {
    slug: "investment-advisory",
    file: "InvestmentAdvisory.tsx",
    title: "Investment Advisory Services | JBJ Global Real Estate",
    description:
      "Strategic real estate investment advisory in the UAE. Data-driven guidance for individuals, family offices, and institutional investors.",
    canonicalPath: "/services/investment-advisory",
  },
  {
    slug: "legal",
    file: "LawFirm.tsx",
    title: "Legal Services Dubai | Real Estate Law | JBJ GLOBAL REAL ESTATE",
    description:
      "Expert legal services for Dubai real estate. Property transactions, contract law, dispute resolution, and regulatory compliance. Licensed legal professionals.",
    canonicalPath: "/services/legal",
  },
  {
    slug: "property-management",
    file: "PropertyManagement.tsx",
    title:
      "Property Management & Asset Stewardship | JBJ Global Real Estate",
    description:
      "Comprehensive property management for residential, commercial and investment properties in the UAE. Structured oversight, financial accountability, and regulatory compliance.",
    canonicalPath: "/services/property-management",
  },
  {
    slug: "rental-advisory",
    file: "RentalAdvisory.tsx",
    title: "Rental Advisory Services | JBJ Global Real Estate",
    description:
      "Professional rental advisory for landlords and property investors in Dubai. Expert guidance from pricing strategy to tenant placement.",
    canonicalPath: "/services/rental-advisory",
  },
  {
    slug: "selling-advisory",
    file: "SellingAdvisory.tsx",
    title: "Selling Advisory Services | JBJ Global Real Estate",
    description:
      "Professional selling advisory and representation for property sales in Dubai. Expert guidance from pricing strategy to transaction completion.",
    canonicalPath: "/services/selling-advisory",
  },
  {
    slug: "short-term-rentals",
    file: "ShortTermRentals.tsx",
    title:
      "Short-Term Rental & Holiday Home Management | JBJ Global Real Estate",
    description:
      "Maximize yield, maintain standards, and operate in full compliance with our luxury short-term rental and holiday home management services.",
    canonicalPath: "/services/short-term-rentals",
  },
  {
    slug: "signature-collection",
    file: "SignatureCollection.tsx",
    title: "Signature Collection | JBJ Global Real Estate",
    description:
      "A controlled internal signature request workflow—tracked, timestamped, and audit-ready.",
    canonicalPath: "/services/signature-collection",
  },
  {
    slug: "snagging",
    file: "Snagging.tsx",
    title:
      "Snagging & Property Inspection Services | JBJ Global Real Estate",
    description:
      "Protect your investment before handover with professional property snagging and inspection services. Structured defect documentation, severity grading, and developer follow-up support.",
    canonicalPath: "/services/snagging",
  },
  {
    slug: "testimonials",
    file: "Testimonials.tsx",
    title: "Testimonials | JBJ Global Real Estate",
    description:
      "Real feedback, presented with premium formatting and privacy respect—because trust is built with receipts, not hype.",
    canonicalPath: "/services/testimonials",
  },
];

export interface HreflangTarget {
  hreflang: Language | "x-default";
  href: string;
}

export interface ServiceSeoEntry extends ServiceSeoSource {
  /** Fully-qualified canonical URL (origin + canonicalPath). */
  canonicalUrl: string;
  /** One alternate per supported language + x-default — all point at canonicalUrl. */
  hreflangTargets: HreflangTarget[];
}

/**
 * Compute the full SEO surface for every service slug, exactly as
 * <CanonicalAndHreflang /> would emit it at runtime.
 */
export function computeServiceSeoEntries(): ServiceSeoEntry[] {
  return SERVICE_SEO_CATALOG.map((entry) => {
    const canonicalUrl = `${CANONICAL_ORIGIN}${entry.canonicalPath}`;
    const hreflangTargets: HreflangTarget[] = [
      ...SUPPORTED_LANGUAGES.map((lang) => ({
        hreflang: lang.code,
        href: canonicalUrl,
      })),
      { hreflang: "x-default" as const, href: canonicalUrl },
    ];
    return { ...entry, canonicalUrl, hreflangTargets };
  });
}

/**
 * Console-friendly report. Call from DevTools or on page mount.
 * Logs one collapsed group per slug with title/description/canonicalPath +
 * a flat console.table of hreflang → href mappings.
 */
export function logServiceSeoReport(): void {
  const entries = computeServiceSeoEntries();
  // eslint-disable-next-line no-console
  console.log(
    `%c[JBJ SEO] Service catalog — ${entries.length} slugs · ${SUPPORTED_LANGUAGES.length} languages + x-default`,
    "color:#B8943E;font-weight:bold",
  );
  entries.forEach((e) => {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`/${e.slug}  →  ${e.canonicalUrl}`);
    // eslint-disable-next-line no-console
    console.log("title       :", e.title);
    // eslint-disable-next-line no-console
    console.log("description :", e.description);
    // eslint-disable-next-line no-console
    console.log("file        :", e.file);
    // eslint-disable-next-line no-console
    console.table(
      e.hreflangTargets.map((t) => ({ hreflang: t.hreflang, href: t.href })),
    );
    // eslint-disable-next-line no-console
    console.groupEnd();
  });
}
