import { useEffect } from 'react';

/**
 * GlobalSEO - Injects JSON-LD structured data once on app load.
 * This replaces the inline JSON-LD scripts that were in index.html,
 * ensuring the build pipeline produces valid output.
 */
export const GlobalSEO = () => {
  useEffect(() => {
    // Hide boot fallback once React has mounted (backup - main.tsx also hides it)
    try {
      const bootFallback = document.getElementById('boot-fallback');
      if (bootFallback) {
        bootFallback.style.display = 'none';
      }
    } catch {
      // Ignore
    }

    // Structured data schemas
    const schemas = [
      // Organization Schema
      {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": "https://jbj.ae/#organization",
        "name": "JBJ Global Real Estate",
        "alternateName": ["JBJ", "JBJ Real Estate", "JBJ Global"],
        "url": "https://jbj.ae",
        "logo": {
          "@type": "ImageObject",
          "url": "https://jbj.ae/logo.png",
          "width": 512,
          "height": 512
        },
        "image": "https://jbj.ae/og-image.jpg",
        "description": "Dubai's premier real estate brokerage offering property sales, rentals, and holiday homes services across the UAE.",
        "founder": {
          "@type": "Person",
          "name": "Jane Bou Jaoude",
          "jobTitle": "Founder & CEO",
          "nationality": { "@type": "Country", "name": "Lebanon" }
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Downtown Dubai",
          "addressLocality": "Dubai",
          "addressRegion": "Dubai",
          "addressCountry": "AE"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 25.2048,
          "longitude": 55.2708
        },
        "telephone": "+971-56-591-1000",
        "email": "contact@JBJ.ae",
        "priceRange": "$$$$",
        "sameAs": [
          "https://www.instagram.com/jbjglobalrealestate",
          "https://www.linkedin.com/company/jbjglobalrealestate",
          "https://www.facebook.com/jbjglobalrealestate",
          "https://www.youtube.com/@jbjglobalrealestate",
          "https://www.tiktok.com/@jbjglobalrealestate"
        ],
        "openingHoursSpecification": [{
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "09:00",
          "closes": "21:00"
        }],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "250",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      // Person Schema (Founder)
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Jane Bou Jaoude",
        "alternateName": ["Jane", "Jane Lebanese", "Jane Dubai"],
        "jobTitle": "Founder & CEO",
        "worksFor": {
          "@type": "Organization",
          "name": "JBJ Global Real Estate",
          "url": "https://jbj.ae"
        },
        "nationality": { "@type": "Country", "name": "Lebanon" },
        "knowsAbout": ["Real Estate", "Property Brokerage", "Dubai Real Estate", "Luxury Properties"],
        "url": "https://jbj.ae/founder"
      },
      // WebSite Schema (Sitelinks Search Box)
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": "https://jbj.ae",
        "name": "JBJ Global Real Estate",
        "alternateName": "JBJ",
        "description": "Dubai's premier real estate brokerage for buying, selling, and renting properties",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://jbj.ae/properties?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      // LocalBusiness Schema
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "JBJ Global Real Estate",
        "image": "https://jbj.ae/og-image.jpg",
        "telephone": "+971-56-591-1000",
        "email": "contact@JBJ.ae",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Downtown Dubai",
          "addressLocality": "Dubai",
          "addressRegion": "Dubai",
          "addressCountry": "AE"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 25.2048,
          "longitude": 55.2708
        },
        "url": "https://jbj.ae",
        "priceRange": "$$$$"
      },
      // SiteNavigationElement Schema - helps Google understand site hierarchy
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          { "@type": "SiteNavigationElement", "position": 1, "name": "Buy Property", "url": "https://jbj.ae/properties" },
          { "@type": "SiteNavigationElement", "position": 2, "name": "Sell Property", "url": "https://jbj.ae/sell" },
          { "@type": "SiteNavigationElement", "position": 3, "name": "Rent Property", "url": "https://jbj.ae/rent" },
          { "@type": "SiteNavigationElement", "position": 4, "name": "Developers", "url": "https://jbj.ae/developers" },
          { "@type": "SiteNavigationElement", "position": 5, "name": "Areas", "url": "https://jbj.ae/areas" },
          { "@type": "SiteNavigationElement", "position": 6, "name": "AI Tools", "url": "https://jbj.ae/ai-hub" },
          { "@type": "SiteNavigationElement", "position": 7, "name": "Market Intelligence", "url": "https://jbj.ae/market-intelligence" },
          { "@type": "SiteNavigationElement", "position": 8, "name": "Guides", "url": "https://jbj.ae/guides" },
          { "@type": "SiteNavigationElement", "position": 9, "name": "About Us", "url": "https://jbj.ae/about" },
          { "@type": "SiteNavigationElement", "position": 10, "name": "Contact", "url": "https://jbj.ae/contact" }
        ]
      }
    ];

    // Inject each schema as a script tag
    const injectedScripts: HTMLScriptElement[] = [];
    schemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-global-seo', `schema-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      injectedScripts.push(script);
    });

    // Cleanup on unmount
    return () => {
      injectedScripts.forEach(script => script.remove());
    };
  }, []);

  return null;
};

export default GlobalSEO;
