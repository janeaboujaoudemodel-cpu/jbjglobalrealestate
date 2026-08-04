/**
 * JBJ Global geography registry — the single source of truth for the
 * Country → (Region) → Area cascade used by the hero filter bar, the portal
 * developer/inventory filters, and any future search surface.
 *
 * DESIGN RULE (extensible for all future countries):
 *   A country declares either
 *     - `regions`: a two-level cascade (Country → Region → Area), used where an
 *       intermediate administrative tier matters (UAE → Emirate → Area), or
 *     - `areas`: a single-level cascade (Country → City/Area), used for markets
 *       where the city IS the meaningful unit (Lebanon, Greece, Cyprus, Georgia).
 *
 *   Consumers must NOT hardcode "Emirate" anywhere. Read `regionLabel` from the
 *   country record and render the extra step only when `regions` exists. Adding
 *   a new country = appending one object below; no UI change required.
 */

export interface GeoArea {
  slug: string;
  name: string;
}

export interface GeoRegion {
  slug: string;
  name: string;
  areas: GeoArea[];
}

export interface GeoCountry {
  slug: string;
  name: string;
  /** ISO-3166 alpha-2, used for flags / analytics. */
  code: string;
  /** Label for the middle step ("Emirate", "Governorate", …). */
  regionLabel?: string;
  /** Label for the leaf step. Defaults to "Area". */
  areaLabel?: string;
  /** Three-level markets. Mutually exclusive with `areas`. */
  regions?: GeoRegion[];
  /** Two-level markets. Mutually exclusive with `regions`. */
  areas?: GeoArea[];
  /** False for markets we are still onboarding — shown with a soft badge. */
  live?: boolean;
}

const a = (name: string): GeoArea => ({
  name,
  slug: name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
});

const region = (name: string, areas: string[]): GeoRegion => ({
  name,
  slug: a(name).slug,
  areas: areas.map(a),
});

export const GEO_COUNTRIES: GeoCountry[] = [
  {
    slug: "uae",
    name: "United Arab Emirates",
    code: "AE",
    regionLabel: "Emirate",
    areaLabel: "Area",
    live: true,
    regions: [
      region("Dubai", [
        "Downtown Dubai",
        "Dubai Marina",
        "Palm Jumeirah",
        "Business Bay",
        "Jumeirah Village Circle",
        "Dubai Hills Estate",
        "Dubai Creek Harbour",
        "Bur Dubai",
        "Deira",
        "Al Jaddaf",
        "Jumeirah Lake Towers",
        "Arabian Ranches",
        "Emirates Hills",
        "Meydan",
        "Dubai South",
        "Dubai Islands",
        "Al Barsha",
        "Mirdif",
        "Damac Hills",
        "Sobha Hartland",
        "Jumeirah Beach Residence",
        "City Walk",
        "Dubai Silicon Oasis",
        "Dubailand",
        "Al Furjan",
        "Discovery Gardens",
        "The Valley",
        "Tilal Al Ghaf",
        "Expo City",
      ]),
      region("Abu Dhabi", [
        "Saadiyat Island",
        "Yas Island",
        "Al Reem Island",
        "Al Raha Beach",
        "Al Maryah Island",
        "Al Reef",
        "Khalifa City",
        "Masdar City",
        "Corniche",
        "Al Ghadeer",
        "Zayed City",
        "Hudayriyat Island",
        "Jubail Island",
        "Al Shamkha",
      ]),
      region("Sharjah", [
        "Al Majaz",
        "Al Khan",
        "Aljada",
        "Muwaileh",
        "Tilal City",
        "Maryam Island",
        "Al Nahda",
        "Sharjah Waterfront City",
      ]),
      region("Ajman", ["Al Nuaimiya", "Ajman Corniche", "Al Rashidiya", "Al Zorah", "Emirates City"]),
      region("Ras Al Khaimah", ["Al Marjan Island", "Mina Al Arab", "Al Hamra Village", "Al Nakheel", "Hayat Island"]),
      region("Fujairah", ["Fujairah City", "Dibba", "Al Aqah", "Sharm"]),
      region("Umm Al Quwain", ["Al Salamah", "UAQ Marina", "Al Raas", "Al Humrah"]),
    ],
  },
  {
    slug: "lebanon",
    name: "Lebanon",
    code: "LB",
    regionLabel: "Governorate",
    areaLabel: "Area",
    live: false,
    regions: [
      region("Beirut", [
        "Achrafieh",
        "Downtown Beirut",
        "Hamra",
        "Verdun",
        "Ras Beirut",
        "Gemmayzeh",
        "Mar Mikhael",
        "Badaro",
        "Manara",
        "Sodeco",
      ]),
      region("Mount Lebanon", [
        "Jounieh",
        "Broummana",
        "Beit Mery",
        "Baabda",
        "Dbayeh",
        "Antelias",
        "Bikfaya",
        "Faraya",
        "Aley",
        "Damour",
      ]),
      region("North Lebanon", ["Tripoli", "Batroun", "Chekka", "Zgharta", "Koura", "Bcharre"]),
      region("South Lebanon", ["Sidon", "Tyre", "Jezzine", "Nabatieh"]),
      region("Bekaa", ["Zahle", "Baalbek", "Chtaura", "Rayak"]),
    ],
  },
  {
    slug: "cyprus",
    name: "Cyprus",
    code: "CY",
    areaLabel: "City / Area",
    live: false,
    areas: [
      a("Limassol"),
      a("Larnaca"),
      a("Nicosia"),
      a("Paphos"),
      a("Ayia Napa"),
      a("Protaras"),
      a("Famagusta"),
      a("Kyrenia"),
      a("Polis"),
      a("Pissouri"),
    ],
  },
  {
    slug: "greece",
    name: "Greece",
    code: "GR",
    areaLabel: "City / Area",
    live: false,
    areas: [
      a("Athens"),
      a("Glyfada"),
      a("Kifissia"),
      a("Piraeus"),
      a("Thessaloniki"),
      a("Mykonos"),
      a("Santorini"),
      a("Crete"),
      a("Rhodes"),
      a("Corfu"),
      a("Halkidiki"),
      a("Paros"),
    ],
  },
  {
    slug: "georgia",
    name: "Georgia",
    code: "GE",
    areaLabel: "City / Area",
    live: false,
    areas: [
      a("Tbilisi"),
      a("Batumi"),
      a("Kutaisi"),
      a("Gudauri"),
      a("Bakuriani"),
      a("Kobuleti"),
      a("Mtskheta"),
      a("Rustavi"),
      a("Anaklia"),
      a("Kvariati"),
    ],
  },
];

export const getCountry = (slug?: string | null) =>
  GEO_COUNTRIES.find((c) => c.slug === slug) ?? null;

export const getRegions = (countrySlug?: string | null): GeoRegion[] =>
  getCountry(countrySlug)?.regions ?? [];

export const getRegion = (countrySlug?: string | null, regionSlug?: string | null) =>
  getRegions(countrySlug).find((r) => r.slug === regionSlug) ?? null;

/**
 * Leaf areas for the current selection. Works for both cascade depths:
 *  - three-level country: areas of the chosen region (or all of them flattened
 *    when no region is picked yet)
 *  - two-level country: the country's own areas
 */
export const getAreas = (
  countrySlug?: string | null,
  regionSlug?: string | null,
): GeoArea[] => {
  const country = getCountry(countrySlug);
  if (!country) return [];
  if (country.areas) return country.areas;
  if (!country.regions) return [];
  if (regionSlug) return getRegion(countrySlug, regionSlug)?.areas ?? [];
  return country.regions.flatMap((r) => r.areas);
};

export const hasRegionStep = (countrySlug?: string | null) =>
  (getCountry(countrySlug)?.regions?.length ?? 0) > 0;

/* ---------------------------------------------------------------- taxonomy */

export const LISTING_INTENTS = [
  { slug: "buy", label: "Buy" },
  { slug: "rent", label: "Rent" },
  { slug: "off-plan", label: "Off-plan" },
  { slug: "sell", label: "Sell" },
] as const;
export type ListingIntent = (typeof LISTING_INTENTS)[number]["slug"];

export const PROPERTY_CATEGORIES = [
  {
    slug: "residential",
    label: "Residential",
    types: ["Apartment", "Villa", "Townhouse", "Penthouse", "Duplex", "Studio", "Land"],
  },
  {
    slug: "commercial",
    label: "Commercial",
    types: ["Office", "Retail", "Shop", "Warehouse", "Showroom", "Full Building", "Plot"],
  },
] as const;
export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number]["slug"];

export const BED_OPTIONS = ["Studio", "1", "2", "3", "4", "5", "6", "7+"] as const;
export const BATH_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;

export const COMPLETION_OPTIONS = [
  { slug: "ready", label: "Ready" },
  { slug: "off-plan", label: "Off-plan" },
  { slug: "2026", label: "Handover 2026" },
  { slug: "2027", label: "Handover 2027" },
  { slug: "2028+", label: "Handover 2028+" },
] as const;

export const FURNISHING_OPTIONS = [
  { slug: "any", label: "Any" },
  { slug: "furnished", label: "Furnished" },
  { slug: "unfurnished", label: "Unfurnished" },
] as const;

/** Currency shown next to the price step, per country. */
export const COUNTRY_CURRENCY: Record<string, string> = {
  uae: "AED",
  lebanon: "USD",
  cyprus: "EUR",
  greece: "EUR",
  georgia: "USD",
};
