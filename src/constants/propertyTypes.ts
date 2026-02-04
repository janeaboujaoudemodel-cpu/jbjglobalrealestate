/**
 * Property Type Constants - Used for API sync and filtering
 * These are the official property types from the Reelly API
 */

export const PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "apartments", label: "Apartments" },
  { value: "villa", label: "Villa" },
  { value: "duplex", label: "Duplex" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
] as const;

// Extended property types including commercial
export const EXTENDED_PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "apartments", label: "Apartments" },
  { value: "villa", label: "Villa" },
  { value: "duplex", label: "Duplex" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "mansion", label: "Mansion" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
  { value: "plot", label: "Plot" },
  { value: "retail", label: "Retail" },
  { value: "offices", label: "Offices" },
] as const;

// Mapping from API values to display labels
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  "apartments": "Apartments",
  "villa": "Villa",
  "duplex": "Duplex",
  "townhouse": "Townhouse",
  "penthouse": "Penthouse",
  "mansion": "Mansion",
  "commercial": "Commercial",
  "land": "Land",
  "plot": "Plot",
  "retail": "Retail",
  "offices": "Offices",
  // Alternative API formats
  "Apartments": "Apartments",
  "Villa": "Villa",
  "Duplex": "Duplex",
  "Townhouse": "Townhouse",
  "Penthouse": "Penthouse",
  "Mansion": "Mansion",
  "Commercial": "Commercial",
  "Land": "Land",
  "Plot": "Plot",
  "Retail": "Retail",
  "Offices": "Offices",
};

// Convert API property type to normalized database value
export function normalizePropertyType(apiType: string | null | undefined): string | null {
  if (!apiType) return null;
  
  const normalizedMap: Record<string, string> = {
    // Exact matches from API
    "Apartments": "Apartments",
    "Villa": "Villa",
    "Duplex": "Duplex",
    "Townhouse": "Townhouse",
    "Penthouse": "Penthouse",
    // Lowercase variants
    "apartments": "Apartments",
    "villa": "Villa",
    "duplex": "Duplex",
    "townhouse": "Townhouse",
    "penthouse": "Penthouse",
    "mansion": "Mansion",
    "commercial": "Commercial",
    "land": "Land",
    "plot": "Plot",
    "retail": "Retail",
    "offices": "Offices",
    // Legacy/alternative mappings
    "apartment": "Apartments",
    "flat": "Apartments",
    "house": "Villa",
    "home": "Villa",
    "office": "Offices",
    "shop": "Retail",
  };
  
  return normalizedMap[apiType.toLowerCase()] || apiType;
}

// Get icon name for property type
export function getPropertyTypeIcon(type: string | null | undefined): string {
  const normalizedType = normalizePropertyType(type);
  
  switch (normalizedType) {
    case "Apartments":
      return "Building2";
    case "Villa":
    case "Mansion":
      return "Home";
    case "Duplex":
    case "Townhouse":
      return "Building";
    case "Penthouse":
      return "Crown";
    case "Commercial":
    case "Offices":
      return "Briefcase";
    case "Land":
    case "Plot":
      return "Map";
    case "Retail":
      return "Store";
    default:
      return "Building2";
  }
}

export type PropertyTypeValue = typeof PROPERTY_TYPE_OPTIONS[number]['value'];
export type ExtendedPropertyTypeValue = typeof EXTENDED_PROPERTY_TYPE_OPTIONS[number]['value'];
