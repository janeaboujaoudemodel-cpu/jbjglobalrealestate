import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import type { Community, Developer } from "@/hooks/useProjects";

export interface FilterState {
  search: string;
  priceMin: number;
  priceMax: number;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  communityId: string | null;
  developerId: string | null;
  handoverYear: string | null;
}

interface ProjectFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  communities?: Community[];
  developers?: Developer[];
  showDeveloperFilter?: boolean;
  showCommunityFilter?: boolean;
}

const PRICE_MIN = 0;
const PRICE_MAX = 50000000;
const BEDROOM_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
  { value: "4", label: "4 BR" },
  { value: "5", label: "5+ BR" },
];

const HANDOVER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "ready", label: "Ready" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027+" },
];

const formatPrice = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

const ProjectFilters = ({
  filters,
  onFiltersChange,
  communities,
  developers,
  showDeveloperFilter = true,
  showCommunityFilter = true,
}: ProjectFiltersProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      priceMin: PRICE_MIN,
      priceMax: PRICE_MAX,
      bedroomsMin: null,
      bedroomsMax: null,
      communityId: null,
      developerId: null,
      handoverYear: null,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.priceMin > PRICE_MIN ||
    filters.priceMax < PRICE_MAX ||
    filters.bedroomsMin !== null ||
    filters.communityId !== null ||
    filters.developerId !== null ||
    filters.handoverYear !== null;

  const activeFilterCount = [
    filters.search,
    filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX,
    filters.bedroomsMin !== null,
    filters.communityId !== null,
    filters.developerId !== null,
    filters.handoverYear !== null,
  ].filter(Boolean).length;

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search projects by name, location..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-12 h-12 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#D4A017]"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-12 px-4 bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:text-white"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-[#D4A017] text-black text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4 bg-[#1a1a1a] border-[#2a2a2a]"
            align="end"
          >
            <div className="space-y-5">
              {/* Price Range */}
              <div>
                <label className="text-white text-sm font-medium mb-3 block">
                  Price Range
                </label>
                <div className="px-2">
                  <Slider
                    value={[filters.priceMin, filters.priceMax]}
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={500000}
                    onValueChange={([min, max]) => {
                      onFiltersChange({
                        ...filters,
                        priceMin: min,
                        priceMax: max,
                      });
                    }}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>AED {formatPrice(filters.priceMin)}</span>
                    <span>AED {formatPrice(filters.priceMax)}</span>
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Bedrooms
                </label>
                <Select
                  value={filters.bedroomsMin?.toString() || "any"}
                  onValueChange={(value) =>
                    updateFilter(
                      "bedroomsMin",
                      value === "any" ? null : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {BEDROOM_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Community */}
              {showCommunityFilter && communities && communities.length > 0 && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Community
                  </label>
                  <Select
                    value={filters.communityId || "any"}
                    onValueChange={(value) =>
                      updateFilter("communityId", value === "any" ? null : value)
                    }
                  >
                    <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] max-h-60">
                      <SelectItem
                        value="any"
                        className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                      >
                        Any Community
                      </SelectItem>
                      {communities.map((community) => (
                        <SelectItem
                          key={community.id}
                          value={community.id}
                          className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                        >
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Developer */}
              {showDeveloperFilter && developers && developers.length > 0 && (
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Developer
                  </label>
                  <Select
                    value={filters.developerId || "any"}
                    onValueChange={(value) =>
                      updateFilter("developerId", value === "any" ? null : value)
                    }
                  >
                    <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] max-h-60">
                      <SelectItem
                        value="any"
                        className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                      >
                        Any Developer
                      </SelectItem>
                      {developers.map((developer) => (
                        <SelectItem
                          key={developer.id}
                          value={developer.id}
                          className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                        >
                          {developer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Handover */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Handover
                </label>
                <Select
                  value={filters.handoverYear || "any"}
                  onValueChange={(value) =>
                    updateFilter("handoverYear", value === "any" ? null : value)
                  }
                >
                  <SelectTrigger className="bg-[#0d0d0d] border-[#2a2a2a] text-white">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    {HANDOVER_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-white hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full text-[#D4A017] hover:text-[#D4A017] hover:bg-[#D4A017]/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <FilterPill
              label={`"${filters.search}"`}
              onRemove={() => updateFilter("search", "")}
            />
          )}
          {(filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) && (
            <FilterPill
              label={`AED ${formatPrice(filters.priceMin)} - ${formatPrice(filters.priceMax)}`}
              onRemove={() =>
                onFiltersChange({
                  ...filters,
                  priceMin: PRICE_MIN,
                  priceMax: PRICE_MAX,
                })
              }
            />
          )}
          {filters.bedroomsMin !== null && (
            <FilterPill
              label={`${filters.bedroomsMin}+ BR`}
              onRemove={() => updateFilter("bedroomsMin", null)}
            />
          )}
          {filters.communityId && communities && (
            <FilterPill
              label={
                communities.find((c) => c.id === filters.communityId)?.name ||
                "Community"
              }
              onRemove={() => updateFilter("communityId", null)}
            />
          )}
          {filters.developerId && developers && (
            <FilterPill
              label={
                developers.find((d) => d.id === filters.developerId)?.name ||
                "Developer"
              }
              onRemove={() => updateFilter("developerId", null)}
            />
          )}
          {filters.handoverYear && (
            <FilterPill
              label={
                filters.handoverYear === "ready"
                  ? "Ready"
                  : `Handover ${filters.handoverYear}`
              }
              onRemove={() => updateFilter("handoverYear", null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

const FilterPill = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-full text-[#D4A017] text-sm">
    {label}
    <button
      onClick={onRemove}
      className="ml-1 hover:bg-[#D4A017]/20 rounded-full p-0.5"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default ProjectFilters;
