import { useEffect } from "react";
import { COMPANY_NAP } from "@/config/companyNAP";

/**
 * GlobalSEO — single source of structured-data emission.
 *
 * Emits ONE consolidated Organization graph (RealEstateAgent + LocalBusiness
 * + ProfessionalService merged via @type array on one @id node), a Founder
 * Person entity, WebSite with SearchAction, a SiteNavigation ItemList, a
 * Service catalog (buy/sell/rent/off-plan/mortgage/golden-visa), and a
 * SpeakableSpecification so AI voice/answer engines can quote the brand
 * consistently.
 *
 * Per-page schemas (BreadcrumbList, FAQPage, RealEstateListing, Article) are
 * emitted by the route-level components — never duplicated here.
 *
 * All NAP values are consumed from src/config/companyNAP.ts so the entire
 * Google + AI-search identity for the business is centrally consistent.
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

    const organization = {
      "@context": "https://schema.org",
      "@type": ["RealEstateAgent", "LocalBusiness", "ProfessionalService"],
      "@id": orgId,
      name: COMPANY_NAP.name,
      legalName: COMPANY_NAP.legalName,
      alternateName: COMPANY_NAP.alternateNames,
      url: host,
      logo: {
        "@type": "ImageObject",
        url: COMPANY_NAP.logoUrl,
        width: 512,
        height: 512,
      },
      image: COMPANY_NAP.ogImageUrl,
      description: COMPANY_NAP.description,
      slogan: "Dubai's premier RERA-licensed luxury real estate brokerage.",
      foundingDate: "2016",
      knowsLanguage: ["en", "ar", "fr"],
      knowsAbout: [
        "Dubai real estate",
        "Luxury properties",
        "Off-plan investment",
        "Golden Visa property investment",
        "Palm Jumeirah villas",
        "Downtown Dubai apartments",
        "Dubai Marina penthouses",
        "Business Bay properties",
        "UAE property market",
        "RERA brokerage",
        "Property management Dubai",
        "Mortgage advisory UAE",
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
      areaServed: COMPANY_NAP.areaServed.map((name) => ({
        "@type": "City",
        name,
        containedInPlace: { "@type": "Country", name: "United Arab Emirates" },
      })),
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
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Real Estate Services",
        itemListElement: serviceCatalog.map((s, i) => ({
          "@type": "Offer",
          position: i + 1,
          itemOffered: {
            "@type": "Service",
            name: s.name,
            description: s.desc,
            url: `${host}${s.url}`,
            provider: { "@id": orgId },
            areaServed: { "@type": "Country", name: "United Arab Emirates" },
          },
        })),
      },
    };

    const founderPerson = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": founderId,
      name: COMPANY_NAP.founder.name,
      alternateName: ["Jane", "Jane Bou Jaoude"],
      jobTitle: COMPANY_NAP.founder.jobTitle,
      worksFor: { "@id": orgId },
      affiliation: { "@id": orgId },
      nationality: { "@type": "Country", name: COMPANY_NAP.founder.nationality },
      knowsAbout: [
        "Dubai real estate",
        "Luxury property investment",
        "Off-plan development",
        "UAE property market",
        "Golden Visa strategy",
        "High-net-worth advisory",
      ],
      knowsLanguage: ["en", "ar", "fr"],
      url: `${host}/founder`,
      image: `${host}/og-image.webp`,
      sameAs: COMPANY_NAP.sameAs,
    };

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${host}/#website`,
      url: host,
      name: COMPANY_NAP.name,
      alternateName: "JBJ",
      description: COMPANY_NAP.shortDescription,
      inLanguage: ["en", "ar"],
      publisher: { "@id": orgId },
      copyrightHolder: { "@id": orgId },
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
      "@context": "https://schema.org",
      "@type": "ItemList",
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

    // Speakable — helps AI voice/answer engines quote consistent brand facts.
    const speakable = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${host}/#speakable`,
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["h1", "h2", "[data-speakable]", "meta[name='description']"],
      },
      isPartOf: { "@id": `${host}/#website` },
      about: { "@id": orgId },
    };

    const schemas = [organization, founderPerson, website, siteNavigation, speakable];

    const injected: HTMLScriptElement[] = [];
    schemas.forEach((schema, i) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-global-seo", `schema-${i}`);
      s.textContent = JSON.stringify(schema);
      document.head.appendChild(s);
      injected.push(s);
    });

    return () => {
      injected.forEach((s) => s.remove());
    };
  }, []);

  return null;
};

export default GlobalSEO;
