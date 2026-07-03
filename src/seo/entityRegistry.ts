/**
 * Central entity registry — the single source of truth for every named
 * entity JBJ Global Real Estate wants Google Knowledge Graph, Google AI
 * Overviews, ChatGPT, Gemini, Perplexity, Claude, Microsoft Copilot, and
 * Apple Intelligence to associate with the brand.
 *
 * Each entry carries:
 *   • id            — canonical @id used across JSON-LD (never renamed)
 *   • name          — canonical display name
 *   • wikidata      — QID (used in sameAs, feeds Google Knowledge Graph)
 *   • wikipedia     — English Wikipedia URL (sameAs)
 *   • geo           — lat/lng for Place types
 *   • url           — canonical URL on jbj.ae when we host a page for it
 *
 * Adding a developer / community / place here immediately propagates it
 * across every page schema. Never hardcode QIDs elsewhere.
 */

export const CANONICAL_HOST = "https://www.jbj.ae";

export interface EntityRef {
  id: string;
  name: string;
  wikidata?: string;
  wikipedia?: string;
  url?: string;
  geo?: { lat: number; lng: number };
  containedIn?: string; // @id of parent Place
  officialSite?: string;
  aliases?: string[];
}

export const PLACES: Record<string, EntityRef> = {
  uae: {
    id: `${CANONICAL_HOST}/#place-uae`,
    name: "United Arab Emirates",
    wikidata: "Q878",
    wikipedia: "https://en.wikipedia.org/wiki/United_Arab_Emirates",
    geo: { lat: 23.4241, lng: 53.8478 },
    aliases: ["UAE", "Emirates"],
  },
  dubai: {
    id: `${CANONICAL_HOST}/#place-dubai`,
    name: "Dubai",
    wikidata: "Q612",
    wikipedia: "https://en.wikipedia.org/wiki/Dubai",
    geo: { lat: 25.2048, lng: 55.2708 },
    containedIn: `${CANONICAL_HOST}/#place-uae`,
    url: `${CANONICAL_HOST}/areas`,
  },
  abuDhabi: {
    id: `${CANONICAL_HOST}/#place-abu-dhabi`,
    name: "Abu Dhabi",
    wikidata: "Q31866",
    wikipedia: "https://en.wikipedia.org/wiki/Abu_Dhabi",
    geo: { lat: 24.4539, lng: 54.3773 },
    containedIn: `${CANONICAL_HOST}/#place-uae`,
  },
  sharjah: {
    id: `${CANONICAL_HOST}/#place-sharjah`,
    name: "Sharjah",
    wikidata: "Q45079",
    wikipedia: "https://en.wikipedia.org/wiki/Sharjah",
    containedIn: `${CANONICAL_HOST}/#place-uae`,
  },
  rak: {
    id: `${CANONICAL_HOST}/#place-ras-al-khaimah`,
    name: "Ras Al Khaimah",
    wikidata: "Q212666",
    wikipedia: "https://en.wikipedia.org/wiki/Ras_Al_Khaimah",
    containedIn: `${CANONICAL_HOST}/#place-uae`,
  },
};

export const COMMUNITIES: Record<string, EntityRef> = {
  palmJumeirah: {
    id: `${CANONICAL_HOST}/#community-palm-jumeirah`,
    name: "Palm Jumeirah",
    wikidata: "Q334515",
    wikipedia: "https://en.wikipedia.org/wiki/Palm_Jumeirah",
    geo: { lat: 25.1124, lng: 55.139 },
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/palm-jumeirah`,
  },
  downtownDubai: {
    id: `${CANONICAL_HOST}/#community-downtown-dubai`,
    name: "Downtown Dubai",
    wikidata: "Q1245187",
    wikipedia: "https://en.wikipedia.org/wiki/Downtown_Dubai",
    geo: { lat: 25.1972, lng: 55.2744 },
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/downtown-dubai`,
  },
  dubaiMarina: {
    id: `${CANONICAL_HOST}/#community-dubai-marina`,
    name: "Dubai Marina",
    wikidata: "Q1093254",
    wikipedia: "https://en.wikipedia.org/wiki/Dubai_Marina",
    geo: { lat: 25.0805, lng: 55.1403 },
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/dubai-marina`,
  },
  businessBay: {
    id: `${CANONICAL_HOST}/#community-business-bay`,
    name: "Business Bay",
    wikidata: "Q2937847",
    wikipedia: "https://en.wikipedia.org/wiki/Business_Bay",
    geo: { lat: 25.1857, lng: 55.2766 },
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/business-bay`,
  },
  dubaiHills: {
    id: `${CANONICAL_HOST}/#community-dubai-hills-estate`,
    name: "Dubai Hills Estate",
    wikidata: "Q108874663",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/dubai-hills-estate`,
  },
  jbr: {
    id: `${CANONICAL_HOST}/#community-jbr`,
    name: "Jumeirah Beach Residence",
    aliases: ["JBR"],
    wikidata: "Q6307030",
    wikipedia: "https://en.wikipedia.org/wiki/Jumeirah_Beach_Residence",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/jbr`,
  },
  emiratesHills: {
    id: `${CANONICAL_HOST}/#community-emirates-hills`,
    name: "Emirates Hills",
    wikidata: "Q5371555",
    wikipedia: "https://en.wikipedia.org/wiki/Emirates_Hills",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/emirates-hills`,
  },
  jumeirahGolfEstates: {
    id: `${CANONICAL_HOST}/#community-jge`,
    name: "Jumeirah Golf Estates",
    wikidata: "Q6307084",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/jumeirah-golf-estates`,
  },
  arabianRanches: {
    id: `${CANONICAL_HOST}/#community-arabian-ranches`,
    name: "Arabian Ranches",
    wikidata: "Q4784550",
    wikipedia: "https://en.wikipedia.org/wiki/Arabian_Ranches",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/arabian-ranches`,
  },
  mbrCity: {
    id: `${CANONICAL_HOST}/#community-mbr-city`,
    name: "Mohammed Bin Rashid City",
    aliases: ["MBR City"],
    wikidata: "Q16903093",
    containedIn: PLACES.dubai.id,
    url: `${CANONICAL_HOST}/areas/mbr-city`,
  },
};

export const DEVELOPERS: Record<string, EntityRef> = {
  emaar: {
    id: `${CANONICAL_HOST}/#developer-emaar`,
    name: "Emaar Properties",
    wikidata: "Q727373",
    wikipedia: "https://en.wikipedia.org/wiki/Emaar_Properties",
    officialSite: "https://www.emaar.com",
    url: `${CANONICAL_HOST}/developers/emaar`,
  },
  damac: {
    id: `${CANONICAL_HOST}/#developer-damac`,
    name: "DAMAC Properties",
    wikidata: "Q5205420",
    wikipedia: "https://en.wikipedia.org/wiki/DAMAC_Properties",
    officialSite: "https://www.damacproperties.com",
    url: `${CANONICAL_HOST}/developers/damac`,
  },
  sobha: {
    id: `${CANONICAL_HOST}/#developer-sobha`,
    name: "Sobha Realty",
    wikidata: "Q26722193",
    wikipedia: "https://en.wikipedia.org/wiki/Sobha_Limited",
    officialSite: "https://www.sobharealty.com",
    url: `${CANONICAL_HOST}/developers/sobha`,
  },
  meraas: {
    id: `${CANONICAL_HOST}/#developer-meraas`,
    name: "Meraas",
    wikidata: "Q18401378",
    wikipedia: "https://en.wikipedia.org/wiki/Meraas",
    officialSite: "https://www.meraas.com",
    url: `${CANONICAL_HOST}/developers/meraas`,
  },
  nakheel: {
    id: `${CANONICAL_HOST}/#developer-nakheel`,
    name: "Nakheel Properties",
    wikidata: "Q911837",
    wikipedia: "https://en.wikipedia.org/wiki/Nakheel_Properties",
    officialSite: "https://www.nakheel.com",
    url: `${CANONICAL_HOST}/developers/nakheel`,
  },
  aldar: {
    id: `${CANONICAL_HOST}/#developer-aldar`,
    name: "Aldar Properties",
    wikidata: "Q4726645",
    wikipedia: "https://en.wikipedia.org/wiki/Aldar_Properties",
    officialSite: "https://www.aldar.com",
    url: `${CANONICAL_HOST}/developers/aldar`,
  },
  dubaiHolding: {
    id: `${CANONICAL_HOST}/#developer-dubai-holding`,
    name: "Dubai Holding",
    wikidata: "Q1264320",
    wikipedia: "https://en.wikipedia.org/wiki/Dubai_Holding",
    officialSite: "https://www.dubaiholding.com",
    url: `${CANONICAL_HOST}/developers/dubai-holding`,
  },
  ellington: {
    id: `${CANONICAL_HOST}/#developer-ellington`,
    name: "Ellington Properties",
    officialSite: "https://ellingtonproperties.ae",
    url: `${CANONICAL_HOST}/developers/ellington`,
  },
  select: {
    id: `${CANONICAL_HOST}/#developer-select`,
    name: "Select Group",
    officialSite: "https://www.select-group.ae",
    url: `${CANONICAL_HOST}/developers/select-group`,
  },
  omniyat: {
    id: `${CANONICAL_HOST}/#developer-omniyat`,
    name: "Omniyat",
    wikidata: "Q17071018",
    officialSite: "https://www.omniyat.com",
    url: `${CANONICAL_HOST}/developers/omniyat`,
  },
  binghatti: {
    id: `${CANONICAL_HOST}/#developer-binghatti`,
    name: "Binghatti Developers",
    officialSite: "https://www.binghatti.com",
    url: `${CANONICAL_HOST}/developers/binghatti`,
  },
  danube: {
    id: `${CANONICAL_HOST}/#developer-danube`,
    name: "Danube Properties",
    officialSite: "https://www.danubeproperties.com",
    url: `${CANONICAL_HOST}/developers/danube`,
  },
  azizi: {
    id: `${CANONICAL_HOST}/#developer-azizi`,
    name: "Azizi Developments",
    officialSite: "https://www.azizidevelopments.com",
    url: `${CANONICAL_HOST}/developers/azizi`,
  },
  meydan: {
    id: `${CANONICAL_HOST}/#developer-meydan`,
    name: "Meydan Group",
    wikidata: "Q6825144",
    officialSite: "https://www.meydan.ae",
    url: `${CANONICAL_HOST}/developers/meydan`,
  },
  tigerGroup: {
    id: `${CANONICAL_HOST}/#developer-tiger`,
    name: "Tiger Group",
    officialSite: "https://www.tigeruae.com",
    url: `${CANONICAL_HOST}/developers/tiger-group`,
  },
};

/** Landmarks — supply Google KG with unambiguous brand adjacency. */
export const LANDMARKS: Record<string, EntityRef> = {
  burjKhalifa: {
    id: `${CANONICAL_HOST}/#landmark-burj-khalifa`,
    name: "Burj Khalifa",
    wikidata: "Q12495",
    wikipedia: "https://en.wikipedia.org/wiki/Burj_Khalifa",
    containedIn: COMMUNITIES.downtownDubai.id,
  },
  burjAlArab: {
    id: `${CANONICAL_HOST}/#landmark-burj-al-arab`,
    name: "Burj Al Arab",
    wikidata: "Q83125",
    wikipedia: "https://en.wikipedia.org/wiki/Burj_Al_Arab",
    containedIn: PLACES.dubai.id,
  },
  atlantis: {
    id: `${CANONICAL_HOST}/#landmark-atlantis`,
    name: "Atlantis, The Palm",
    wikidata: "Q799770",
    wikipedia: "https://en.wikipedia.org/wiki/Atlantis,_The_Palm",
    containedIn: COMMUNITIES.palmJumeirah.id,
  },
};

/** Build a Schema.org Place node from an EntityRef. */
export function toPlaceNode(e: EntityRef, extraType?: string) {
  const sameAs = [e.wikipedia, e.wikidata && `https://www.wikidata.org/wiki/${e.wikidata}`, e.officialSite]
    .filter(Boolean) as string[];
  return {
    "@type": extraType ? [extraType, "Place"] : "Place",
    "@id": e.id,
    name: e.name,
    ...(e.aliases?.length ? { alternateName: e.aliases } : {}),
    ...(e.url ? { url: e.url } : {}),
    ...(e.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: e.geo.lat,
            longitude: e.geo.lng,
          },
        }
      : {}),
    ...(e.containedIn ? { containedInPlace: { "@id": e.containedIn } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Build a Schema.org Organization node from a developer EntityRef. */
export function toDeveloperNode(e: EntityRef) {
  const sameAs = [e.wikipedia, e.wikidata && `https://www.wikidata.org/wiki/${e.wikidata}`, e.officialSite]
    .filter(Boolean) as string[];
  return {
    "@type": "Organization",
    "@id": e.id,
    name: e.name,
    ...(e.aliases?.length ? { alternateName: e.aliases } : {}),
    ...(e.url ? { url: e.url } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}
