import { useEffect } from "react";
import { COMPANY_NAP } from "@/config/companyNAP";

/**
 * GlobalSEO — single source of structured-data emission.
 *
 * Emits ONE consolidated Organization graph (RealEstateAgent + LocalBusiness
 * merged via @type array on one @id node), plus Founder Person, WebSite
 * with SearchAction, and SiteNavigation ItemList.
 *
 * Per-page schemas (BreadcrumbList, FAQPage, RealEstateListing) are emitted
 * by the route-level components — never duplicated here.
 *
 * All NAP values are consumed from src/config/companyNAP.ts so the entire
 * Google identity for the business is centrally consistent.
 */
export const GlobalSEO = () => {
  useEffect(() => {
    // Hide boot fallback once React mounts (backup — main.tsx also hides it)
    try {
      const bootFallback = document.getElementById("boot-fallback");
      if (bootFallback) bootFallback.style.display = "none";
    } catch {
      /* ignore */
    }

    const host = COMPANY_NAP.canonicalHost;
    const orgId = `${host}/#organization`;

    const organization = {
      "@context": "https://schema.org",
      "@type": ["RealEstateAgent", "LocalBusiness"],
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
      areaServed: COMPANY_NAP.areaServed.map((name) => ({
        "@type": "City",
        name,
      })),
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: COMPANY_NAP.openingHours.weekdays,
          opens: COMPANY_NAP.openingHours.opens,
          closes: COMPANY_NAP.openingHours.closes,
        },
      ],
      sameAs: COMPANY_NAP.sameAs,
      founder: {
        "@type": "Person",
        name: COMPANY_NAP.founder.name,
        jobTitle: COMPANY_NAP.founder.jobTitle,
        nationality: { "@type": "Country", name: COMPANY_NAP.founder.nationality },
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: COMPANY_NAP.phoneE164,
          contactType: "customer service",
          email: COMPANY_NAP.email,
          areaServed: "AE",
          availableLanguage: ["English", "Arabic", "French"],
        },
      ],
    };

    const founderPerson = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${host}/founder#person`,
      name: COMPANY_NAP.founder.name,
      alternateName: ["Jane", "Jane Lebanese", "Jane Dubai"],
      jobTitle: COMPANY_NAP.founder.jobTitle,
      worksFor: { "@id": orgId },
      nationality: { "@type": "Country", name: COMPANY_NAP.founder.nationality },
      knowsAbout: [
        "Dubai Real Estate",
        "Luxury Properties",
        "Property Brokerage",
        "Off-plan Investment",
        "UAE Property Market",
      ],
      url: `${host}/founder`,
    };

    const website = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${host}/#website`,
      url: host,
      name: COMPANY_NAP.name,
      alternateName: "JBJ",
      description: COMPANY_NAP.shortDescription,
      publisher: { "@id": orgId },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${host}/properties?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
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

    const schemas = [organization, founderPerson, website, siteNavigation];

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
