/**
 * Company NAP (Name, Address, Phone) — single source of truth.
 *
 * Every SEO / JSON-LD / footer / contact / Google Business signal MUST
 * import from this file. Mismatched NAP is the #1 local-SEO killer.
 *
 * If you change anything here, also update GBP_ALIGNMENT_CHECKLIST.md
 * and reconcile with the live Google Business Profile.
 */

export const COMPANY_NAP = {
  // Identity
  name: "JBJ Global Real Estate",
  legalName: "JBJ GLOBAL REAL ESTATE",
  alternateNames: ["JBJ", "JBJ Real Estate", "JBJ Global"],
  description:
    "Dubai's premier RERA-licensed real estate brokerage. Buy, sell, or rent luxury apartments, villas, penthouses, and off-plan properties across the UAE.",
  shortDescription:
    "Dubai's premier real estate brokerage. Buy, sell, or rent luxury properties across UAE.",

  // Canonical web identity
  canonicalHost: "https://www.jbj.ae",
  logoUrl: "https://www.jbj.ae/logo.png",
  ogImageUrl: "https://www.jbj.ae/og-image.jpg",

  // Contact
  phoneE164: "+971547167107", // Display / tel: links
  phoneDisplay: "+971 54 716 7107",
  whatsappE164: "+971547167107",
  email: "contact@jbj.ae", // lowercase only

  // Address
  address: {
    streetAddress: "Business Bay",
    addressLocality: "Dubai",
    addressRegion: "Dubai",
    postalCode: "00000",
    addressCountry: "AE",
  },

  // Geo (Business Bay, Dubai)
  geo: {
    latitude: 25.1857,
    longitude: 55.2766,
  },

  // Service area
  areaServed: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],

  // Opening hours (Mo–Sa 09:00–21:00; closed Sunday)
  openingHours: {
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "09:00",
    closes: "21:00",
  },

  // Pricing tier
  priceRange: "$$$$",
  currenciesAccepted: "AED, USD, EUR, GBP",
  paymentAccepted: "Cash, Bank Transfer, Cheque, Cryptocurrency",

  // Founder
  founder: {
    name: "Jane Bou Jaoude",
    jobTitle: "Founder & CEO",
    nationality: "Lebanon",
  },

  // Social profiles (sameAs)
  sameAs: [
    "https://www.instagram.com/jbjglobalrealestate",
    "https://www.linkedin.com/company/jbjglobalrealestate",
    "https://www.facebook.com/jbjglobalrealestate",
    "https://www.youtube.com/@jbjglobalrealestate",
    "https://www.tiktok.com/@jbjglobalrealestate",
  ],

  // Reviews (must mirror verified GBP — leave undefined if no public source)
  // aggregateRating: { ratingValue: "4.9", reviewCount: "250" },
} as const;

export type CompanyNAP = typeof COMPANY_NAP;
