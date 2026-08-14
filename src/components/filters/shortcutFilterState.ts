/**
 * Shared shortcut-filter state shape and defaults.
 *
 * Kept in its own module (no React, no UI imports) because global chrome such
 * as the horizontal utility bar only needs the type + defaults. Importing them
 * from FilterShortcutBar pulled that 53 kB component — and its popover/slider
 * dependency graph — into the main entry chunk on every page.
 */
export interface ShortcutFilterState {
  priceMode: 'unit' | 'sqft' | 'sqm';
  priceMin: string;
  priceMax: string;
  paymentPlanMax: number;
  afterHandover: string;
  postHandoverOnly: boolean;
  handoverFrom: { quarter: string; year: string };
  handoverTo: { quarter: string; year: string };
  propertyCategory: 'residential' | 'commercial' | null;
  propertyTypes: string[];
  bedrooms: string[];
  bathrooms: string[];
  statuses: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'alpha' | 'most_projects' | 'trending' | null;
  hideSoldOut: boolean;
  constructionStatuses: string[];
  sizeMin: string;
  sizeMax: string;
  emirates: string[];
  areas: string[];
  developers: string[];
  searchQuery: string;
  views: string[];
  amenities: string[];
  verifiedOnly: boolean;
  virtualTourOnly: boolean;
  furnishing: string[];
}

export const defaultShortcutFilters: ShortcutFilterState = {
  priceMode: 'unit',
  priceMin: '',
  priceMax: '',
  paymentPlanMax: 100,
  afterHandover: '',
  postHandoverOnly: false,
  handoverFrom: { quarter: 'Q1', year: '2025' },
  handoverTo: { quarter: 'Q4', year: '2035' },
  propertyCategory: null,
  propertyTypes: [],
  bedrooms: [],
  bathrooms: [],
  statuses: [],
  sortBy: null,
  hideSoldOut: false,
  constructionStatuses: [],
  sizeMin: '',
  sizeMax: '',
  emirates: [],
  areas: [],
  developers: [],
  searchQuery: '',
  views: [],
  amenities: [],
  verifiedOnly: false,
  virtualTourOnly: false,
  furnishing: [],
};
