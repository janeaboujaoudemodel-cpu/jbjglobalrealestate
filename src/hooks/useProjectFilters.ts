import { useMemo } from "react";
import type { Project } from "./useProjects";
import type { FilterState } from "@/components/ProjectFilters";

export const defaultFilters: FilterState = {
  search: "",
  priceMin: 0,
  priceMax: 500000000,
  sizeMin: 0,
  sizeMax: 50000,
  bedroomsMin: null,
  bedroomsMax: null,
  communityId: null,
  developerId: null,
  handoverStatus: null,
  emirate: null,
  trendingArea: null,
  furnishedStatus: null,
  views: [],
  amenities: [],
  facilities: [],
  sortBy: null,
  premiumOnly: false,
  currency: 'AED',
  sizeUnit: 'sqft',
  language: 'en',
  transactionType: 'all',
};

// Check if a project is premium based on is_premium flag or keywords in name/description
const PREMIUM_KEYWORDS = [
  'villa', 'penthouse', 'mansion', 'duplex', 'townhouse', 
  'premium', 'luxury', 'exclusive', 'sky villa', 'garden villa',
  'beach villa', 'palace', 'estate', 'signature'
];

const isPremiumProperty = (project: Project): boolean => {
  // First check the is_premium flag from the database
  if (project.is_premium) return true;
  // Fallback to keyword matching
  const searchText = `${project.name} ${project.description || ''}`.toLowerCase();
  return PREMIUM_KEYWORDS.some(keyword => searchText.includes(keyword));
};

// Get handover year from string
const getHandoverYear = (handoverDate: string | null): number | null => {
  if (!handoverDate) return null;
  const match = handoverDate.match(/\d{4}/);
  if (match) return parseInt(match[0]);
  if (handoverDate.toLowerCase().includes("ready")) return 2024;
  return null;
};

// Check if project is close to handover (2026-2027)
const isCloseToHandover = (handoverDate: string | null): boolean => {
  const year = getHandoverYear(handoverDate);
  if (!year) return false;
  return year >= 2026 && year <= 2027;
};

export function useFilteredProjects(
  projects: Project[] | undefined,
  filters: FilterState
): Project[] {
  return useMemo(() => {
    if (!projects) return [];

    let filtered = projects.filter((project) => {
      // Transaction type filter (buy vs rent)
      // For now, we use handover_date to determine if it's for sale (off-plan/ready)
      // "rent" properties would typically be marked differently
      // Until we have a transaction_type column, we'll filter based on naming conventions
      if (filters.transactionType && filters.transactionType !== 'all') {
        const projectName = project.name.toLowerCase();
        const projectDesc = (project.description || '').toLowerCase();
        const isRentalProperty = projectName.includes('rent') || 
                                  projectDesc.includes('for rent') ||
                                  projectDesc.includes('rental');
        
        if (filters.transactionType === 'rent' && !isRentalProperty) {
          return false;
        }
        if (filters.transactionType === 'buy' && isRentalProperty) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(searchLower) ||
          project.location?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.developer?.name.toLowerCase().includes(searchLower) ||
          project.community?.name.toLowerCase().includes(searchLower) ||
          project.emirate?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Price range filter
      if (project.price_from) {
        if (project.price_from < filters.priceMin) return false;
        if (project.price_from > filters.priceMax) return false;
      }

      // Size range filter
      if (filters.sizeMin > 0 || filters.sizeMax < 50000) {
        const projectSize = project.size_min || project.size_max;
        if (projectSize) {
          if (projectSize < filters.sizeMin) return false;
          if (projectSize > filters.sizeMax) return false;
        }
      }

      // Bedrooms filter
      if (filters.bedroomsMin !== null) {
        const projectMaxBedrooms = project.bedrooms_max || project.bedrooms_min;
        if (filters.bedroomsMin === 0) {
          // Studio filter - look for projects with 0 or null bedrooms
          // For now, include all if looking for studio
        } else if (!projectMaxBedrooms || projectMaxBedrooms < filters.bedroomsMin) {
          return false;
        }
      }

      // Community filter
      if (filters.communityId && project.community?.id !== filters.communityId) {
        return false;
      }

      // Developer filter
      if (filters.developerId && project.developer?.id !== filters.developerId) {
        return false;
      }

      // Emirate filter
      if (filters.emirate && project.emirate !== filters.emirate) {
        return false;
      }

      // Trending area filter (matches location)
      if (filters.trendingArea) {
        const areaName = filters.trendingArea.replace(/-/g, " ").toLowerCase();
        const matchesArea =
          project.location?.toLowerCase().includes(areaName) ||
          project.community?.name.toLowerCase().includes(areaName);
        if (!matchesArea) return false;
      }

      // Handover status filter
      if (filters.handoverStatus) {
        const handover = project.handover_date?.toLowerCase();
        if (!handover) return false;

        switch (filters.handoverStatus) {
          case "ready":
            if (!handover.includes("ready")) return false;
            break;
          case "off-plan":
            if (handover.includes("ready")) return false;
            break;
          case "close-to-handover":
            if (!isCloseToHandover(project.handover_date)) return false;
            break;
          case "2029+":
            const year = getHandoverYear(project.handover_date);
            if (!year || year < 2029) return false;
            break;
          default:
            if (!handover.includes(filters.handoverStatus)) return false;
        }
      }

      // Furnished status filter
      if (filters.furnishedStatus && project.furnished_status !== filters.furnishedStatus) {
        return false;
      }

      // Views filter (any match)
      if (filters.views.length > 0) {
        const projectViews = project.views || [];
        const hasMatchingView = filters.views.some((view) =>
          projectViews.some((pv) => pv.toLowerCase().includes(view.toLowerCase()))
        );
        if (!hasMatchingView) return false;
      }

      // Amenities filter (all must match)
      if (filters.amenities.length > 0) {
        const projectAmenities = project.amenities || [];
        const hasAllAmenities = filters.amenities.every((amenity) =>
          projectAmenities.some((pa) => pa.toLowerCase().includes(amenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      // Facilities filter (all must match)
      if (filters.facilities.length > 0) {
        const projectFacilities = project.facilities || [];
        const hasAllFacilities = filters.facilities.every((facility) =>
          projectFacilities.some((pf) => pf.toLowerCase().includes(facility.toLowerCase()))
        );
        if (!hasAllFacilities) return false;
      }

      // Premium filter - checks for keywords in name/description
      if (filters.premiumOnly) {
        if (!isPremiumProperty(project)) {
          return false;
        }
      }

      return true;
    });

    // Sort by handover date if "close to handover" is selected
    if (filters.handoverStatus === "close-to-handover") {
      filtered = filtered.sort((a, b) => {
        const yearA = getHandoverYear(a.handover_date) || 9999;
        const yearB = getHandoverYear(b.handover_date) || 9999;
        return yearA - yearB;
      });
    }

    // Sort by price if needed
    if (filters.sortBy === "price-low") {
      filtered = filtered.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
    } else if (filters.sortBy === "price-high") {
      filtered = filtered.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
    }

    return filtered;
  }, [projects, filters]);
}
