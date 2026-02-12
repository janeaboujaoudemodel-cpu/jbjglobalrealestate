import React, { useState, forwardRef } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, MapPin, Building2, Eye, Sofa, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Community, Developer, TrendingArea } from "@/hooks/useProjects";

export interface FilterState {
  search: string;
  priceMin: number;
  priceMax: number;
  sizeMin: number;
  sizeMax: number;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  communityId: string | null;
  developerId: string | null;
  handoverStatus: string | null; // 'ready' | 'off-plan' | 'close-to-handover' | year
  emirate: string | null;
  trendingArea: string | null;
  areaId: string | null; // New: database area ID for filtering
  furnishedStatus: string | null; // 'furnished' | 'semi-furnished' | 'unfurnished'
  saleStatus: string | null; // 'Announced' | 'On Sale' | 'Out of Stock' | 'Presale (EOI)' | 'Start of Sales'
  views: string[];
  amenities: string[];
  facilities: string[];
  sortBy: string | null;
  premiumOnly: boolean;
  currency: 'AED' | 'USD' | 'EUR' | 'GBP';
  sizeUnit: 'sqft' | 'sqm';
  language: 'en' | 'ar';
  transactionType: 'all' | 'buy' | 'rent'; // Transaction type filter
  hideSoldOut?: boolean; // Hide sold out projects
}

interface ProjectFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  communities?: Community[];
  developers?: Developer[];
  trendingAreas?: TrendingArea[];
  showDeveloperFilter?: boolean;
  showCommunityFilter?: boolean;
  hideQuickFilters?: boolean;
}

const PRICE_MIN = 0;
const PRICE_MAX = 500000000;
const SIZE_MIN = 0;
const SIZE_MAX = 50000; // sq ft

const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

const EMIRATES = [
  { value: "all", label: "All Emirates" },
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "All" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
  { value: "4", label: "4 BR" },
  { value: "5", label: "5 BR" },
  { value: "6", label: "6+ BR" },
];

const HANDOVER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready to Move" },
  { value: "off-plan", label: "Off-Plan" },
  { value: "close-to-handover", label: "Close to Handover" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028" },
  { value: "2029+", label: "2029+" },
];

const FURNISHED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "furnished", label: "Furnished" },
  { value: "semi-furnished", label: "Semi-Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

const VIEW_OPTIONS = [
  "Sea View",
  "Partial Sea View",
  "Full Sea View",
  "Golf View",
  "City View",
  "Marina View",
  "Garden View",
  "Boulevard View",
  "Pool View",
  "Skyline View",
  "Creek View",
  "Burj Khalifa View",
  "Palm View",
  "Lagoon View",
  "Mountain View",
  "Canal View",
  "Community View",
  "Park View",
  "Beach View",
  "Desert View",
  "Courtyard View",
];

const AMENITY_OPTIONS = [
  "Swimming Pool",
  "Gym",
  "Kids Play Area",
  "Spa",
  "Sauna",
  "Steam Room",
  "Jacuzzi",
  "Tennis Court",
  "Basketball Court",
  "Squash Court",
  "Jogging Track",
  "Cycling Track",
  "BBQ Area",
  "Rooftop Terrace",
  "Sky Lounge",
  "Business Center",
  "Concierge",
  "Valet Parking",
  "24/7 Security",
  "CCTV",
  "Private Beach",
  "Beach Access",
  "Marina Access",
  "Pet Friendly",
  "EV Charging",
];

const FACILITY_OPTIONS = [
  "Retail",
  "Restaurants",
  "Cafes",
  "Supermarket",
  "Pharmacy",
  "Schools",
  "Nursery",
  "Mosque",
  "Healthcare",
  "Metro Access",
  "Bus Stop",
  "Parking",
  "Covered Parking",
  "Storage",
  "Maid's Room",
  "Driver's Room",
  "Private Elevator",
  "Smart Home",
  "Central AC",
  "Built-in Wardrobes",
];

const formatPrice = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
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
  trendingAreas,
  showDeveloperFilter = true,
  showCommunityFilter = true,
  hideQuickFilters = false,
}: ProjectFiltersProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (key: "views" | "amenities" | "facilities", value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      priceMin: PRICE_MIN,
      priceMax: PRICE_MAX,
      sizeMin: SIZE_MIN,
      sizeMax: SIZE_MAX,
      bedroomsMin: null,
      bedroomsMax: null,
      communityId: null,
      developerId: null,
      handoverStatus: null,
      emirate: null,
      trendingArea: null,
      areaId: null,
      furnishedStatus: null,
      saleStatus: null,
      views: [],
      amenities: [],
      facilities: [],
      sortBy: null,
      premiumOnly: false,
      currency: filters.currency,
      sizeUnit: filters.sizeUnit,
      language: filters.language,
      transactionType: 'all',
    });
  };

  // Convert size based on unit
  const convertSize = (sqft: number, toUnit: 'sqft' | 'sqm'): number => {
    return toUnit === 'sqm' ? Math.round(sqft * 0.0929) : sqft;
  };

  // Format price with currency
  const formatPriceWithCurrency = (value: number) => {
    const converted = value * CURRENCY_RATES[filters.currency];
    const symbol = CURRENCY_SYMBOLS[filters.currency];
    if (converted >= 1000000000) {
      return `${symbol} ${(converted / 1000000000).toFixed(1)}B`;
    }
    if (converted >= 1000000) {
      return `${symbol} ${(converted / 1000000).toFixed(0)}M`;
    }
    if (converted >= 1000) {
      return `${symbol} ${(converted / 1000).toFixed(0)}K`;
    }
    return `${symbol} ${converted.toFixed(0)}`;
  };

  const activeFilterCount = [
    filters.search,
    filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX,
    filters.bedroomsMin !== null,
    filters.communityId !== null,
    filters.developerId !== null,
    filters.handoverStatus !== null,
    filters.emirate !== null,
    filters.trendingArea !== null,
    filters.furnishedStatus !== null,
    filters.views.length > 0,
    filters.amenities.length > 0,
    filters.facilities.length > 0,
    filters.premiumOnly,
  ].filter(Boolean).length;

  // Filter developers by selected emirate
  const filteredTrendingAreas = trendingAreas?.filter(
    (area) => !filters.emirate || area.emirate === filters.emirate
  );

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search projects, developers, locations..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-12 h-14 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#D4A017] text-base rounded-xl"
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

        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="h-14 px-6 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/60 text-black hover:border-gold hover:bg-[#F5F0E6] rounded-xl"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white text-black text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0d0d0d] border-[#2a2a2a] p-0">
            <SheetHeader className="p-6 border-b border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-white text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Filters
                </SheetTitle>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-200px)] pb-20">
              <div className="p-6 space-y-8">
                {/* Premium Properties */}
                <FilterSection title="Premium Properties" icon={<Star className="w-5 h-5" />}>
                  <button
                    onClick={() => updateFilter("premiumOnly", !filters.premiumOnly)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
                      filters.premiumOnly
                        ? "bg-white text-black"
                        : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a] border border-zinc-800"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${filters.premiumOnly ? "fill-black text-black" : "text-gold"}`} />
                    <span>Show Exclusive Residences Only</span>
                    <span className="ml-auto text-xs opacity-70">Penthouses, Villas & Mansions</span>
                  </button>
                </FilterSection>

                {/* Currency & Display Options */}
                <FilterSection title="Display Settings" icon={<span className="text-lg">⚙️</span>}>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Currency</label>
                      <Select
                        value={filters.currency}
                        onValueChange={(value) => updateFilter("currency", value as FilterState['currency'])}
                      >
                        <SelectTriggerDark className="h-10">
                          <SelectValue />
                        </SelectTriggerDark>
                        <SelectContentDark>
                          <SelectItemDark value="AED">AED</SelectItemDark>
                          <SelectItemDark value="USD">USD</SelectItemDark>
                          <SelectItemDark value="EUR">EUR</SelectItemDark>
                          <SelectItemDark value="GBP">GBP</SelectItemDark>
                        </SelectContentDark>
                      </Select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Size Unit</label>
                      <Select
                        value={filters.sizeUnit}
                        onValueChange={(value) => updateFilter("sizeUnit", value as FilterState['sizeUnit'])}
                      >
                        <SelectTriggerDark className="h-10">
                          <SelectValue />
                        </SelectTriggerDark>
                        <SelectContentDark>
                          <SelectItemDark value="sqft">sq ft</SelectItemDark>
                          <SelectItemDark value="sqm">sq m</SelectItemDark>
                        </SelectContentDark>
                      </Select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Language</label>
                      <Select
                        value={filters.language}
                        onValueChange={(value) => updateFilter("language", value as FilterState['language'])}
                      >
                        <SelectTriggerDark className="h-10">
                          <SelectValue />
                        </SelectTriggerDark>
                        <SelectContentDark>
                          <SelectItemDark value="en">English</SelectItemDark>
                          <SelectItemDark value="ar">العربية</SelectItemDark>
                        </SelectContentDark>
                      </Select>
                    </div>
                  </div>
                </FilterSection>

                {/* Price Range */}
                <FilterSection title="Price Range" icon={<span className="text-lg">💰</span>}>
                  <div className="px-2 pt-2">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">From</label>
                        <Input
                          type="text"
                          value={Math.round(filters.priceMin * CURRENCY_RATES[filters.currency]).toLocaleString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
                            updateFilter("priceMin", Math.round(value / CURRENCY_RATES[filters.currency]));
                          }}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10"
                          placeholder="Min"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">To</label>
                        <Input
                          type="text"
                          value={Math.round(filters.priceMax * CURRENCY_RATES[filters.currency]).toLocaleString()}
                          onChange={(e) => {
                            const value = parseInt(e.target.value.replace(/,/g, '')) || PRICE_MAX;
                            updateFilter("priceMax", Math.round(value / CURRENCY_RATES[filters.currency]));
                          }}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[filters.priceMin, filters.priceMax]}
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={1000000}
                      onValueChange={([min, max]) => {
                        onFiltersChange({
                          ...filters,
                          priceMin: min,
                          priceMax: max,
                        });
                      }}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-gray-400 text-sm">
                      <span>{formatPriceWithCurrency(filters.priceMin)}</span>
                      <span>{formatPriceWithCurrency(filters.priceMax)}</span>
                    </div>
                  </div>
                </FilterSection>

                {/* Size Range */}
                <FilterSection title={`Size Range (${filters.sizeUnit})`} icon={<span className="text-lg">📐</span>}>
                  <div className="px-2 pt-2">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">From</label>
                        <Input
                          type="number"
                          value={convertSize(filters.sizeMin, filters.sizeUnit)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const sqft = filters.sizeUnit === 'sqm' ? Math.round(value / 0.0929) : value;
                            updateFilter("sizeMin", sqft);
                          }}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10"
                          placeholder="Min"
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">To</label>
                        <Input
                          type="number"
                          value={convertSize(filters.sizeMax, filters.sizeUnit)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || SIZE_MAX;
                            const sqft = filters.sizeUnit === 'sqm' ? Math.round(value / 0.0929) : value;
                            updateFilter("sizeMax", sqft);
                          }}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-10"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[filters.sizeMin, filters.sizeMax]}
                      min={SIZE_MIN}
                      max={SIZE_MAX}
                      step={100}
                      onValueChange={([min, max]) => {
                        onFiltersChange({
                          ...filters,
                          sizeMin: min,
                          sizeMax: max,
                        });
                      }}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-gray-400 text-sm">
                      <span>{convertSize(filters.sizeMin, filters.sizeUnit).toLocaleString()} {filters.sizeUnit}</span>
                      <span>{convertSize(filters.sizeMax, filters.sizeUnit).toLocaleString()} {filters.sizeUnit}</span>
                    </div>
                  </div>
                </FilterSection>

                {/* Handover Status - Quick Chips */}
                <FilterSection title="Handover Status" icon={<span className="text-lg">📅</span>}>
                  <div className="flex flex-wrap gap-2">
                    {HANDOVER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateFilter(
                            "handoverStatus",
                            option.value === "all" ? null : 
                            filters.handoverStatus === option.value ? null : option.value
                          )
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          (option.value === "all" && filters.handoverStatus === null) ||
                          filters.handoverStatus === option.value
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Bedrooms */}
                <FilterSection title="Bedrooms" icon={<span className="text-lg">🛏️</span>}>
                  <div className="flex flex-wrap gap-2">
                    {BEDROOM_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateFilter(
                            "bedroomsMin",
                            option.value === "all" ? null :
                            option.value === "studio" ? 0 :
                            parseInt(option.value)
                          )
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          (option.value === "all" && filters.bedroomsMin === null) ||
                          (option.value === "studio" && filters.bedroomsMin === 0) ||
                          filters.bedroomsMin === parseInt(option.value)
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Emirates */}
                <FilterSection title="Emirate" icon={<MapPin className="w-5 h-5" />}>
                  <div className="flex flex-wrap gap-2">
                    {EMIRATES.map((emirate) => (
                      <button
                        key={emirate.value}
                        onClick={() =>
                          updateFilter(
                            "emirate",
                            emirate.value === "all" ? null :
                            filters.emirate === emirate.value ? null : emirate.value
                          )
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          (emirate.value === "all" && filters.emirate === null) ||
                          filters.emirate === emirate.value
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {emirate.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Trending Areas */}
                {filteredTrendingAreas && filteredTrendingAreas.length > 0 && (
                  <FilterSection title="Trending Areas" icon={<Sparkles className="w-5 h-5" />}>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateFilter("trendingArea", null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filters.trendingArea === null
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        All Areas
                      </button>
                      {filteredTrendingAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() =>
                            updateFilter(
                              "trendingArea",
                              filters.trendingArea === area.slug ? null : area.slug
                            )
                          }
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            filters.trendingArea === area.slug
                              ? "bg-white text-black"
                              : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                          }`}
                        >
                          {area.name}
                        </button>
                      ))}
                    </div>
                  </FilterSection>
                )}

                {/* Developer */}
                {showDeveloperFilter && developers && developers.length > 0 && (
                  <FilterSection title="Developer" icon={<Building2 className="w-5 h-5" />}>
                    <Select
                      value={filters.developerId || "all"}
                      onValueChange={(value) =>
                        updateFilter("developerId", value === "all" ? null : value)
                      }
                    >
                      <SelectTriggerDark className="h-12">
                        <SelectValue placeholder="All Developers" />
                      </SelectTriggerDark>
                      <SelectContentDark className="max-h-60">
                        <SelectItemDark value="all">All Developers</SelectItemDark>
                        {developers.map((developer) => (
                          <SelectItemDark key={developer.id} value={developer.id}>
                            {developer.name}
                          </SelectItemDark>
                        ))}
                      </SelectContentDark>
                    </Select>
                  </FilterSection>
                )}

                {/* Community */}
                {showCommunityFilter && communities && communities.length > 0 && (
                  <FilterSection title="Community" icon={<MapPin className="w-5 h-5" />}>
                    <Select
                      value={filters.communityId || "all"}
                      onValueChange={(value) =>
                        updateFilter("communityId", value === "all" ? null : value)
                      }
                    >
                      <SelectTriggerDark className="h-12">
                        <SelectValue placeholder="All Communities" />
                      </SelectTriggerDark>
                      <SelectContentDark className="max-h-60">
                        <SelectItemDark value="all">All Communities</SelectItemDark>
                        {communities.map((community) => (
                          <SelectItemDark key={community.id} value={community.id}>
                            {community.name}
                          </SelectItemDark>
                        ))}
                      </SelectContentDark>
                    </Select>
                  </FilterSection>
                )}

                {/* Furnished Status */}
                <FilterSection title="Furnishing" icon={<Sofa className="w-5 h-5" />}>
                  <div className="flex flex-wrap gap-2">
                    {FURNISHED_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          updateFilter(
                            "furnishedStatus",
                            option.value === "all" ? null :
                            filters.furnishedStatus === option.value ? null : option.value
                          )
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          (option.value === "all" && filters.furnishedStatus === null) ||
                          filters.furnishedStatus === option.value
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Views */}
                <FilterSection title="Views" icon={<Eye className="w-5 h-5" />}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter("views", [])}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.views.length === 0
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                      }`}
                    >
                      All
                    </button>
                    {VIEW_OPTIONS.map((view) => (
                      <button
                        key={view}
                        onClick={() => toggleArrayFilter("views", view)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filters.views.includes(view)
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Amenities */}
                <FilterSection title="Amenities" icon={<span className="text-lg">🏊</span>}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter("amenities", [])}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.amenities.length === 0
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                      }`}
                    >
                      All
                    </button>
                    {AMENITY_OPTIONS.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleArrayFilter("amenities", amenity)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filters.amenities.includes(amenity)
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                {/* Facilities */}
                <FilterSection title="Facilities" icon={<span className="text-lg">🏢</span>}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFilter("facilities", [])}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.facilities.length === 0
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                      }`}
                    >
                      All
                    </button>
                    {FACILITY_OPTIONS.map((facility) => (
                      <button
                        key={facility}
                        onClick={() => toggleArrayFilter("facilities", facility)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          filters.facilities.includes(facility)
                            ? "bg-white text-black"
                            : "bg-[#1a1a1a] text-gray-300 hover:bg-[#2a2a2a]"
                        }`}
                      >
                        {facility}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </ScrollArea>

            {/* Apply Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
              <Button
                onClick={() => setIsFiltersOpen(false)}
                className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark text-gold-foreground hover:from-gold-light hover:to-gold font-semibold text-base shadow-lg shadow-gold/20"
              >
                Show Results
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Filter Chips - Only show if not hidden */}
      {!hideQuickFilters && (
        <div className="flex flex-wrap gap-2">
          <QuickFilterChip
            label="Ready to Move"
            active={filters.handoverStatus === "ready"}
            onClick={() =>
              updateFilter(
                "handoverStatus",
                filters.handoverStatus === "ready" ? null : "ready"
              )
            }
          />
          <QuickFilterChip
            label="Off-Plan"
            active={filters.handoverStatus === "off-plan"}
            onClick={() =>
              updateFilter(
                "handoverStatus",
                filters.handoverStatus === "off-plan" ? null : "off-plan"
              )
            }
          />
          <QuickFilterChip
            label="Close to Handover"
            active={filters.handoverStatus === "close-to-handover"}
            onClick={() =>
              updateFilter(
                "handoverStatus",
                filters.handoverStatus === "close-to-handover" ? null : "close-to-handover"
              )
            }
          />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  filters.priceMin > 0 || filters.priceMax < PRICE_MAX
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold shadow-sm"
                    : "bg-white/90 text-zinc-700 border border-gold/30 hover:border-gold/50 hover:bg-white"
                }`}
              >
                Price
                <ChevronDown className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40" align="start">
              <div className="space-y-4">
                <p className="text-black font-medium">Price Range</p>
                <Slider
                  value={[filters.priceMin, filters.priceMax]}
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={1000000}
                  onValueChange={([min, max]) => {
                    onFiltersChange({
                      ...filters,
                      priceMin: min,
                      priceMax: max,
                    });
                  }}
                  className="mb-2"
                />
                <div className="flex justify-between text-zinc-600 text-sm">
                  <span>AED {formatPrice(filters.priceMin)}</span>
                  <span>AED {formatPrice(filters.priceMax)}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  filters.bedroomsMin !== null
                    ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold shadow-sm"
                    : "bg-white/90 text-zinc-700 border border-gold/30 hover:border-gold/50 hover:bg-white"
                }`}
              >
                Beds
                <ChevronDown className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40" align="start">
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      updateFilter(
                        "bedroomsMin",
                        option.value === "all" ? null :
                        option.value === "studio" ? 0 :
                        parseInt(option.value)
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      (option.value === "all" && filters.bedroomsMin === null) ||
                      (option.value === "studio" && filters.bedroomsMin === 0) ||
                      filters.bedroomsMin === parseInt(option.value)
                        ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold shadow-sm"
                        : "bg-white/90 text-zinc-700 border border-gold/20 hover:border-gold/40"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {EMIRATES.slice(1, 5).map((emirate) => (
            <QuickFilterChip
              key={emirate.value}
              label={emirate.label}
              active={filters.emirate === emirate.value}
              onClick={() =>
                updateFilter(
                  "emirate",
                  filters.emirate === emirate.value ? null : emirate.value
                )
              }
            />
          ))}
        </div>
      )}

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 text-sm">Active:</span>
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
              label={filters.bedroomsMin === 0 ? "Studio" : `${filters.bedroomsMin}+ BR`}
              onRemove={() => updateFilter("bedroomsMin", null)}
            />
          )}
          {filters.handoverStatus && (
            <FilterPill
              label={HANDOVER_OPTIONS.find((o) => o.value === filters.handoverStatus)?.label || filters.handoverStatus}
              onRemove={() => updateFilter("handoverStatus", null)}
            />
          )}
          {filters.emirate && (
            <FilterPill
              label={filters.emirate}
              onRemove={() => updateFilter("emirate", null)}
            />
          )}
          {filters.trendingArea && (
            <FilterPill
              label={trendingAreas?.find((a) => a.slug === filters.trendingArea)?.name || filters.trendingArea}
              onRemove={() => updateFilter("trendingArea", null)}
            />
          )}
          {filters.furnishedStatus && (
            <FilterPill
              label={FURNISHED_OPTIONS.find((o) => o.value === filters.furnishedStatus)?.label || filters.furnishedStatus}
              onRemove={() => updateFilter("furnishedStatus", null)}
            />
          )}
          {filters.communityId && communities && (
            <FilterPill
              label={communities.find((c) => c.id === filters.communityId)?.name || "Community"}
              onRemove={() => updateFilter("communityId", null)}
            />
          )}
          {filters.developerId && developers && (
            <FilterPill
              label={developers.find((d) => d.id === filters.developerId)?.name || "Developer"}
              onRemove={() => updateFilter("developerId", null)}
            />
          )}
          {filters.views.map((view) => (
            <FilterPill
              key={view}
              label={view}
              onRemove={() => toggleArrayFilter("views", view)}
            />
          ))}
          {filters.amenities.length > 0 && filters.amenities.length <= 2 && 
            filters.amenities.map((amenity) => (
              <FilterPill
                key={amenity}
                label={amenity}
                onRemove={() => toggleArrayFilter("amenities", amenity)}
              />
            ))
          }
          {filters.amenities.length > 2 && (
            <FilterPill
              label={`${filters.amenities.length} amenities`}
              onRemove={() => updateFilter("amenities", [])}
            />
          )}
          {filters.facilities.length > 0 && filters.facilities.length <= 2 && 
            filters.facilities.map((facility) => (
              <FilterPill
                key={facility}
                label={facility}
                onRemove={() => toggleArrayFilter("facilities", facility)}
              />
            ))
          }
          {filters.facilities.length > 2 && (
            <FilterPill
              label={`${filters.facilities.length} facilities`}
              onRemove={() => updateFilter("facilities", [])}
            />
          )}
          <button
            onClick={clearFilters}
            className="text-zinc-400 text-sm hover:text-white hover:underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

const FilterSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center gap-2 text-white mb-3">
      <span className="text-zinc-400">{icon}</span>
      <h3 className="font-medium">{title}</h3>
    </div>
    {children}
  </div>
);

const QuickFilterChip = forwardRef<HTMLButtonElement, {
  label: string;
  active: boolean;
  onClick: () => void;
}>(({ label, active, onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
      active
        ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border-2 border-gold shadow-sm"
        : "bg-white/90 text-zinc-700 border border-gold/30 hover:border-gold/50 hover:bg-white"
    }`}
  >
    {label}
  </button>
));

QuickFilterChip.displayName = "QuickFilterChip";

const FilterPill = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-white text-sm">
    {label}
    <button
      onClick={onRemove}
      className="ml-1 hover:bg-zinc-700 rounded-full p-0.5"
    >
      <X className="w-3 h-3" />
    </button>
  </span>
);

export default ProjectFilters;
