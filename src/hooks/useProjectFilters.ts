import { useMemo } from "react";
import type { Project } from "./useProjects";
import type { FilterState } from "@/components/ProjectFilters";

export const defaultFilters: FilterState = {
  search: "",
  priceMin: 0,
  priceMax: 50000000,
  bedroomsMin: null,
  bedroomsMax: null,
  communityId: null,
  developerId: null,
  handoverYear: null,
};

export function useFilteredProjects(
  projects: Project[] | undefined,
  filters: FilterState
): Project[] {
  return useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(searchLower) ||
          project.location?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.developer?.name.toLowerCase().includes(searchLower) ||
          project.community?.name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Price range filter
      if (project.price_from) {
        if (project.price_from < filters.priceMin) return false;
        if (project.price_from > filters.priceMax) return false;
      }

      // Bedrooms filter
      if (filters.bedroomsMin !== null) {
        const projectMaxBedrooms = project.bedrooms_max || project.bedrooms_min;
        if (!projectMaxBedrooms || projectMaxBedrooms < filters.bedroomsMin) {
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

      // Handover filter
      if (filters.handoverYear) {
        const handover = project.handover_date?.toLowerCase();
        if (!handover) return false;

        if (filters.handoverYear === "ready") {
          if (!handover.includes("ready")) return false;
        } else if (filters.handoverYear === "2027") {
          // 2027+ includes 2027 and later
          const year = parseInt(handover.match(/\d{4}/)?.[0] || "0");
          if (year < 2027 && !handover.includes("ready")) return false;
        } else {
          if (!handover.includes(filters.handoverYear)) return false;
        }
      }

      return true;
    });
  }, [projects, filters]);
}
