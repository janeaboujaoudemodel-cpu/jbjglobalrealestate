import { useEffect } from "react";

interface MarketIntelligenceSchemaProps {
  type: "overview" | "area" | "reports" | "methodology" | "area-detail";
  areaName?: string;
  areaSlug?: string;
  lastUpdated?: string;
  description?: string;
}

// JBJ GLOBAL REAL ESTATE organization schema
const organizationSchema = {
  "@type": "Organization",
  "@id": "https://jbjglobalrealestate.lovable.app/#organization",
  name: "JBJ GLOBAL REAL ESTATE",
  url: "https://jbjglobalrealestate.lovable.app",
  logo: "https://jbjglobalrealestate.lovable.app/lovable-uploads/c6c68c7f-b5b7-4e7a-9f66-3ff7e08fd37f.png",
  founder: {
    "@type": "Person",
    name: "Jane Bou Jaoude"
  },
  sameAs: [
    "https://www.instagram.com/jbjglobalrealestate",
    "https://www.linkedin.com/company/jbjglobalrealestate"
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "contact@JBJ.ae"
  }
};

// BreadcrumbList generator
const generateBreadcrumbs = (
  type: MarketIntelligenceSchemaProps["type"],
  areaName?: string,
  areaSlug?: string
) => {
  const baseUrl = "https://jbjglobalrealestate.lovable.app";
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Market Intelligence",
      item: `${baseUrl}/market-intelligence`
    }
  ];

  switch (type) {
    case "overview":
      items.push({
        "@type": "ListItem",
        position: 3,
        name: "Market Overview",
        item: `${baseUrl}/market-intelligence/overview`
      });
      break;
    case "area":
      items.push({
        "@type": "ListItem",
        position: 3,
        name: "Area Intelligence",
        item: `${baseUrl}/market-intelligence/areas`
      });
      break;
    case "area-detail":
      items.push({
        "@type": "ListItem",
        position: 3,
        name: "Area Intelligence",
        item: `${baseUrl}/market-intelligence/areas`
      });
      if (areaName && areaSlug) {
        items.push({
          "@type": "ListItem",
          position: 4,
          name: areaName,
          item: `${baseUrl}/market-intelligence/areas/${areaSlug}`
        });
      }
      break;
    case "reports":
      items.push({
        "@type": "ListItem",
        position: 3,
        name: "Market Reports",
        item: `${baseUrl}/market-intelligence/reports`
      });
      break;
    case "methodology":
      items.push({
        "@type": "ListItem",
        position: 3,
        name: "Methodology & Data Sources",
        item: `${baseUrl}/market-intelligence/methodology`
      });
      break;
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
  };
};

// Dataset schema for Open Data references
const generateDatasetSchema = (type: MarketIntelligenceSchemaProps["type"], lastUpdated?: string) => {
  const baseUrl = "https://jbjglobalrealestate.lovable.app";
  
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Dubai Real Estate Market Intelligence",
    description: "Aggregated market insights derived from official UAE government Open Data sources for BUY · SELL · RENT analysis.",
    url: `${baseUrl}/market-intelligence/${type === "area" ? "areas" : type}`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: organizationSchema,
    dateModified: lastUpdated || new Date().toISOString().split("T")[0],
    spatialCoverage: {
      "@type": "Place",
      name: "Dubai, United Arab Emirates"
    },
    temporalCoverage: "2020/..",
    distribution: {
      "@type": "DataDownload",
      contentUrl: `${baseUrl}/market-intelligence/reports`,
      encodingFormat: "application/pdf"
    },
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "Dubai Government Open Data"
    }
  };
};

// Article schema for reports
const generateArticleSchema = (
  title: string,
  description: string,
  url: string,
  lastUpdated?: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: organizationSchema,
    publisher: organizationSchema,
    datePublished: lastUpdated || new Date().toISOString().split("T")[0],
    dateModified: lastUpdated || new Date().toISOString().split("T")[0],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url
    },
    about: {
      "@type": "Thing",
      name: "Dubai Real Estate Market"
    }
  };
};

// WebPage schema
const generateWebPageSchema = (
  title: string,
  description: string,
  url: string
) => {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: description,
    url: url,
    isPartOf: {
      "@type": "WebSite",
      name: "JBJ GLOBAL REAL ESTATE",
      url: "https://jbjglobalrealestate.lovable.app"
    },
    publisher: organizationSchema,
    about: {
      "@type": "Thing",
      name: "Dubai Real Estate Market Intelligence"
    }
  };
};

export const MarketIntelligenceSchema = ({
  type,
  areaName,
  areaSlug,
  lastUpdated,
  description
}: MarketIntelligenceSchemaProps) => {
  useEffect(() => {
    const baseUrl = "https://jbjglobalrealestate.lovable.app";
    const schemas: object[] = [];

    // Always add breadcrumbs
    schemas.push(generateBreadcrumbs(type, areaName, areaSlug));

    // Add Organization schema
    schemas.push({
      "@context": "https://schema.org",
      ...organizationSchema
    });

    // Type-specific schemas
    switch (type) {
      case "overview":
        schemas.push(
          generateWebPageSchema(
            "Dubai Real Estate Market Overview | BUY · SELL · RENT Trends",
            description || "UAE & Dubai real estate macro snapshot with transaction trends, price movements, and rent analysis powered by official Open Data.",
            `${baseUrl}/market-intelligence/overview`
          )
        );
        schemas.push(generateDatasetSchema(type, lastUpdated));
        break;

      case "area":
        schemas.push(
          generateWebPageSchema(
            "Dubai Area Intelligence | Neighborhood Market Analysis",
            description || "Deep dive into Dubai neighborhoods with historical price trends, rent analysis, and demand indicators.",
            `${baseUrl}/market-intelligence/areas`
          )
        );
        break;

      case "area-detail":
        if (areaName) {
          schemas.push(
            generateWebPageSchema(
              `${areaName} Market Intelligence | Property Prices & Rent Trends`,
              description || `${areaName} real estate market analysis with historical price trends, rent analysis, and demand indicators.`,
              `${baseUrl}/market-intelligence/areas/${areaSlug}`
            )
          );
          schemas.push(generateDatasetSchema(type, lastUpdated));
        }
        break;

      case "reports":
        schemas.push(
          generateArticleSchema(
            "Dubai Real Estate Market Reports | BUY · SELL · RENT Analysis",
            description || "Monthly, quarterly, and annual Dubai real estate market reports powered by official government Open Data.",
            `${baseUrl}/market-intelligence/reports`,
            lastUpdated
          )
        );
        schemas.push(generateDatasetSchema(type, lastUpdated));
        break;

      case "methodology":
        schemas.push(
          generateWebPageSchema(
            "Data Methodology & Sources | Real Estate Market Intelligence",
            description || "Full transparency on data sources, update frequency, and aggregation methodology for Dubai real estate market intelligence.",
            `${baseUrl}/market-intelligence/methodology`
          )
        );
        break;
    }

    // Remove existing schema scripts
    const existingScripts = document.querySelectorAll('script[data-schema="market-intelligence"]');
    existingScripts.forEach(script => script.remove());

    // Add new schema scripts
    schemas.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-schema", "market-intelligence");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[data-schema="market-intelligence"]');
      scripts.forEach(script => script.remove());
    };
  }, [type, areaName, areaSlug, lastUpdated, description]);

  return null;
};

export default MarketIntelligenceSchema;
