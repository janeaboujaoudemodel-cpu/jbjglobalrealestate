import { useEffect } from "react";
import { COMPANY_NAP } from "@/config/companyNAP";
import {
  CANONICAL_HOST,
  PLACES,
  COMMUNITIES,
  DEVELOPERS,
  LANDMARKS,
  toPlaceNode,
  toDeveloperNode,
} from "@/seo/entityRegistry";

/**
 * GlobalSEO — the single source of structured-data emission for every route.
 *
 * Emits a fully connected @graph so Google Knowledge Graph, Google AI
 * Overviews, ChatGPT, Gemini, Perplexity, Claude, Microsoft Copilot, and
 * Apple Intelligence all see one consistent entity model:
 *
 *   Organization (RealEstateAgent + LocalBusiness + ProfessionalService)
 *     ├── founder / employee → Person (Jane Bou Jaoude)
 *     ├── areaServed         → Place (Dubai, Abu Dhabi, Sharjah, RAK)
 *     ├── serviceArea        → GeoCircle (Dubai HQ, 150 km radius)
 *     ├── hasOfferCatalog    → 7 first-class Service entities
 *     ├── knowsAbout         → Communities + Landmarks (Wikidata-linked)
 *     └── memberOf           → RERA / Dubai Land Department
 *
 *   WebSite   (with SearchAction, publisher → Organization)
 *   WebPage   (SpeakableSpecification for AI voice engines)
 *   ItemList  (Main navigation)
 *   Places    (Dubai, UAE, Palm Jumeirah, Downtown, Marina, Business Bay …)
 *   Developers (Emaar, Damac, Sobha, Meraas, Nakheel, Aldar, Dubai Holding …)
 *   Landmarks (Burj Khalifa, Burj Al Arab, Atlantis)
 *
 * Every entity carries Wikidata + Wikipedia sameAs where a public entity
 * exists — this is the strongest single signal for Knowledge Graph joins.
 *
 * Per-route schemas (BreadcrumbList, FAQPage, RealEstateListing, Article,
 * Product) are still emitted by page-level components. They reference the
 * @id nodes below instead of duplicating them.
 */
export const GlobalSEO = () => {
  useEffect(() => {
    try {
      const bootFallback = document.getElementById("boot-fallback");
      if (bootFallback) bootFallback.style.display = "none";
    } catch {
      /* ignore */
    }

    const host = COMPANY_NAP.canonicalHost;
    const orgId = `${host}/#organization`;
    const founderId = `${host}/founder#person`;

    const serviceCatalog = [
      { name: "Buy Property in Dubai", url: "/properties", desc: "Ready and off-plan apartments, villas, penthouses across the UAE." },
      { name: "Sell Property in Dubai", url: "/sell", desc: "RERA-licensed brokerage services for UAE property owners." },
      { name: "Rent Property in Dubai", url: "/rent", desc: "Long-term residential and commercial leasing across Dubai." },
      { name: "Off-Plan Investment", url: "/off-plan", desc: "Curated off-plan launches from Emaar, Damac, Sobha, Meraas and more." },
      { name: "Golden Visa Consultancy", url: "/golden-visa-guide", desc: "UAE Golden Visa qualification through property investment." },
      { name: "Mortgage Advisory", url: "/mortgage-calculator", desc: "Bank-partnered mortgage structuring for residents and non-residents." },
      { name: "Property Management", url: "/services/property-management", desc: "Institutional-grade property management and facility services." },
    ];

    // ── Place nodes ─────────────────────────────────────────────────────
    const placeNodes = [
      toPlaceNode(PLACES.uae, "Country"),
      toPlaceNode(PLACES.dubai, "City"),
      toPlaceNode(PLACES.abuDhabi, "City"),
      toPlaceNode(PLACES.sharjah, "City"),
      toPlaceNode(PLACES.rak, "City"),
    ];
    const communityNodes = Object.values(COMMUNITIES).map((c) =>
      toPlaceNode(c, "AdministrativeArea"),
    );
    const landmarkNodes = Object.values(LANDMARKS).map((l) =>
      toPlaceNode(l, "LandmarksOrHistoricalBuildings"),
    );

    // ── Developer Organization nodes ────────────────────────────────────
    const developerNodes = Object.values(DEVELOPERS).map((d) => toDeveloperNode(d));

    // ── Core Organization ───────────────────────────────────────────────
    const organization = {
      "@type": ["RealEstateAgent", "LocalBusiness", "ProfessionalService"],
      "@id": orgId,
      name: COMPANY_NAP.name,
      legalName: COMPANY_NAP.legalName,
      alternateName: COMPANY_NAP.alternateNames,
      url: host,
      logo: { "@type": "ImageObject", url: COMPANY_NAP.logoUrl, width: 512, height: 512 },
      image: COMPANY_NAP.ogImageUrl,
      description: COMPANY_NAP.description,
      slogan: "Dubai's premier RERA-licensed luxury real estate brokerage.",
      foundingDate: "2016",
      foundingLocation: { "@id": PLACES.dubai.id },
      knowsLanguage: ["en", "ar", "fr"],
      knowsAbout: [
        // Topical entities
        "Dubai real estate",
        "Luxury property investment",
        "Off-plan property Dubai",
        "Golden Visa property investment",
        "UAE property market",
        "RERA brokerage",
        "Property management Dubai",
        "Mortgage advisory UAE",
        // Community entity references (@id joins for KG traversal)
        ...Object.values(COMMUNITIES).map((c) => ({ "@id": c.id })),
        ...Object.values(LANDMARKS).map((l) => ({ "@id": l.id })),
      ],
      telephone: COMPANY_NAP.phoneE164,
      email: COMPANY_NAP.email,
      priceRange: COMPANY_NAP.priceRange,
      currenciesAccepted: COMPANY_NAP.currenciesAccepted,
      paymentAccepted: COMPANY_NAP.paymentAccepted,
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY_NAP.address.streetAddress,
        addressLocality: COMPANY_NAP.address.addressLocality,
        addressRegion: COMPANY_NAP.address.addressRegion,
        postalCode: COMPANY_NAP.address.postalCode,
        addressCountry: COMPANY_NAP.address.addressCountry,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: COMPANY_NAP.geo.latitude,
        longitude: COMPANY_NAP.geo.longitude,
      },
      hasMap: `https://www.google.com/maps?q=${COMPANY_NAP.geo.latitude},${COMPANY_NAP.geo.longitude}`,
      areaServed: [
        { "@id": PLACES.dubai.id },
        { "@id": PLACES.abuDhabi.id },
        { "@id": PLACES.sharjah.id },
        { "@id": PLACES.rak.id },
        { "@id": PLACES.uae.id },
      ],
      serviceArea: {
        "@type": "GeoCircle",
        geoMidpoint: {
          "@type": "GeoCoordinates",
          latitude: COMPANY_NAP.geo.latitude,
          longitude: COMPANY_NAP.geo.longitude,
        },
        geoRadius: 150000,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: COMPANY_NAP.openingHours.weekdays,
          opens: COMPANY_NAP.openingHours.opens,
          closes: COMPANY_NAP.openingHours.closes,
        },
      ],
      sameAs: COMPANY_NAP.sameAs,
      founder: { "@id": founderId },
      employee: { "@id": founderId },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: COMPANY_NAP.phoneE164,
          contactType: "customer service",
          email: COMPANY_NAP.email,
          areaServed: "AE",
          availableLanguage: ["English", "Arabic", "French"],
        },
        {
          "@type": "ContactPoint",
          telephone: COMPANY_NAP.phoneE164,
          contactType: "sales",
          areaServed: ["AE", "SA", "KW", "QA", "BH", "OM", "GB", "US", "FR", "DE"],
          availableLanguage: ["English", "Arabic", "French"],
        },
      ],
      // Regulator + industry affiliations — Knowledge Graph loves these.
      memberOf: [
        {
          "@type": "Organization",
          name: "Real Estate Regulatory Agency (RERA) — Dubai Land Department",
          url: "https://dubailand.gov.ae/en/eservices/rera-services/",
          sameAs: ["https://en.wikipedia.org/wiki/Dubai_Land_Department"],
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Real Estate Services",
        itemListElement: serviceCatalog.map((s, i) => ({
          "@type": "Offer",
          position: i + 1,
          itemOffered: {
            "@type": "Service",
            "@id": `${host}${s.url}#service`,
            name: s.name,
            description: s.desc,
            url: `${host}${s.url}`,
            provider: { "@id": orgId },
            areaServed: [
              { "@id": PLACES.dubai.id },
              { "@id": PLACES.uae.id },
            ],
          },
        })),
      },
      // Explicit graph joins so AI engines can enumerate JBJ's operating context.
      subjectOf: [
        { "@id": `${host}/#website` },
        { "@id": `${host}/about#webpage` },
        { "@id": `${host}/founder#webpage` },
      ],
    };

    const founderPerson = {
      "@type": "Person",
      "@id": founderId,
      name: COMPANY_NAP.founder.name,
      alternateName: ["Jane", "Jane Bou Jaoude"],
      jobTitle: COMPANY_NAP.founder.jobTitle,
      worksFor: { "@id": orgId },
      affiliation: { "@id": orgId },
      nationality: { "@type": "Country", name: COMPANY_NAP.founder.nationality },
      birthPlace: { "@type": "Country", name: COMPANY_NAP.founder.nationality },
      homeLocation: { "@id": PLACES.dubai.id },
      workLocation: { "@id": PLACES.dubai.id },
      knowsAbout: [
        "Dubai real estate",
        "Luxury property investment",
        "Off-plan development",
        "UAE property market",
        "Golden Visa strategy",
        "High-net-worth advisory",
        ...Object.values(COMMUNITIES).map((c) => ({ "@id": c.id })),
      ],
      knowsLanguage: ["en", "ar", "fr"],
      url: `${host}/founder`,
      image: `${host}/og-image.webp`,
      sameAs: COMPANY_NAP.sameAs,
    };

    const website = {
      "@type": "WebSite",
      "@id": `${host}/#website`,
      url: host,
      name: COMPANY_NAP.name,
      alternateName: "JBJ",
      description: COMPANY_NAP.shortDescription,
      inLanguage: ["en", "ar"],
      publisher: { "@id": orgId },
      copyrightHolder: { "@id": orgId },
      about: { "@id": orgId },
      mentions: [
        ...Object.values(COMMUNITIES).map((c) => ({ "@id": c.id })),
        ...Object.values(DEVELOPERS).map((d) => ({ "@id": d.id })),
      ],
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${host}/properties?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      ],
    };

    const siteNavigation = {
      "@type": "ItemList",
      "@id": `${host}/#site-navigation`,
      name: "Main Navigation",
      itemListElement: [
        { "@type": "SiteNavigationElement", position: 1, name: "Buy Property", url: `${host}/properties` },
        { "@type": "SiteNavigationElement", position: 2, name: "Sell Property", url: `${host}/sell` },
        { "@type": "SiteNavigationElement", position: 3, name: "Rent Property", url: `${host}/rent` },
        { "@type": "SiteNavigationElement", position: 4, name: "Developers", url: `${host}/developers` },
        { "@type": "SiteNavigationElement", position: 5, name: "Areas", url: `${host}/areas` },
        { "@type": "SiteNavigationElement", position: 6, name: "Services", url: `${host}/services` },
        { "@type": "SiteNavigationElement", position: 7, name: "Market Intelligence", url: `${host}/market-intelligence` },
        { "@type": "SiteNavigationElement", position: 8, name: "Guides", url: `${host}/guides` },
        { "@type": "SiteNavigationElement", position: 9, name: "About Us", url: `${host}/about` },
        { "@type": "SiteNavigationElement", position: 10, name: "Contact", url: `${host}/contact` },
      ],
    };

    const speakable = {
      "@type": "WebPage",
      "@id": `${host}/#speakable`,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", "[data-speakable]", "meta[name='description']"],
      },
      isPartOf: { "@id": `${host}/#website` },
      about: { "@id": orgId },
    };

    // Everything ships as ONE @graph so KG parsers can traverse @id joins.
    const graph = {
      "@context": "https://schema.org",
      "@graph": [
        organization,
        founderPerson,
        website,
        siteNavigation,
        speakable,
        ...placeNodes,
        ...communityNodes,
        ...landmarkNodes,
        ...developerNodes,
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-global-seo", "graph");
    script.textContent = JSON.stringify(graph);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default GlobalSEO;

// Silences unused-import warnings when tree-shaking is aggressive; the
// entity registry is intentionally re-exported so route-level pages can
// pull individual @id nodes when they need to reference them.
export { PLACES, COMMUNITIES, DEVELOPERS, LANDMARKS, CANONICAL_HOST };
