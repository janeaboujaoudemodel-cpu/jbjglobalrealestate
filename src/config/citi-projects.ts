/**
 * Catalogue of City Developer projects available for brokerage outreach.
 * AMRA = current sales focus. Allura = tactical 2x1BR resale promo.
 */

export type CitiProjectKey = "amra" | "allura" | "aveline" | "agua" | "arya";

export interface CitiProject {
  key: CitiProjectKey;
  name: string;
  url: string;
  tagline: string;
  offerHtml?: string;
  isFocus?: boolean;
}

export const CITI_PROJECTS: Record<CitiProjectKey, CitiProject> = {
  amra: {
    key: "amra",
    name: "AMRA",
    url: "https://citideveloper.com/e-catalogue/amra",
    tagline:
      "Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.",
    offerHtml: `
      <p style="margin:0 0 8px"><strong>AMRA</strong> is the project we are actively focused on. Brochures, floor plans, payment plans and amenity videos are all in the e-catalogue.</p>
      <p style="margin:0">Marketing freedom: no QR required for AMRA marketing assets — videos are pre-branded and ready to use.</p>
    `.trim(),
    isFocus: true,
  },
  allura: {
    key: "allura",
    name: "Allura Residences",
    url: "https://citideveloper.com/e-catalogue/allura",
    tagline:
      "Allura Residences — current resale opportunity for serious end-users and investors.",
    offerHtml: `
      <p style="margin:0 0 8px"><strong>Two 1-bedroom units</strong> available in Allura Residences.</p>
      <p style="margin:0"><strong>15% discount</strong> · <strong>100% upfront payment only</strong>. First-come, first-served.</p>
    `.trim(),
  },
  aveline: {
    key: "aveline",
    name: "Aveline",
    url: "https://citideveloper.com/e-catalogue/aveline",
    tagline: "Aveline — full project materials available in the e-catalogue.",
  },
  agua: {
    key: "agua",
    name: "Agua",
    url: "https://citideveloper.com/e-catalogue/agua",
    tagline: "Agua — full project materials available in the e-catalogue.",
  },
  arya: {
    key: "arya",
    name: "Arya",
    url: "https://citideveloper.com/e-catalogue/arya",
    tagline: "Arya — full project materials available in the e-catalogue.",
  },
};

export const CITI_PROJECT_LIST: CitiProject[] = [
  CITI_PROJECTS.amra,
  CITI_PROJECTS.allura,
  CITI_PROJECTS.aveline,
  CITI_PROJECTS.agua,
  CITI_PROJECTS.arya,
];

export const DEFAULT_FEATURED_PROJECT: CitiProjectKey = "amra";

export const getCitiProject = (key?: string | null): CitiProject => {
  const k = (key || DEFAULT_FEATURED_PROJECT) as CitiProjectKey;
  return CITI_PROJECTS[k] || CITI_PROJECTS[DEFAULT_FEATURED_PROJECT];
};
