import { useState } from "react";
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
import { Building2, FolderOpen, MapPin, Search, Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ListingSearchFiltersProps {
  developers: Array<{ id: string; name: string }>;
  onSearchChange: (value: string) => void;
  onDeveloperChange: (value: string) => void;
  onEmirateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  searchValue: string;
  developerValue: string;
  emirateValue: string;
  locationValue: string;
  horizontal?: boolean;
}

const EMIRATES = [
  { value: "all", label: "All Locations" },
  { value: "Dubai", label: "Dubai" },
  { value: "Abu Dhabi", label: "Abu Dhabi" },
  { value: "Sharjah", label: "Sharjah" },
  { value: "Ajman", label: "Ajman" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
  { value: "Fujairah", label: "Fujairah" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain" },
  // International priority countries
  { value: "Cyprus", label: "Cyprus" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Oman", label: "Oman" },
  { value: "Thailand", label: "Thailand" },
];

// Sale status options from Reelly API
const SALE_STATUSES = [
  { value: "all", label: "All Sale Statuses" },
  { value: "Announced", label: "Announced" },
  { value: "On Sale", label: "On Sale" },
  { value: "Sold Out", label: "Sold Out" },
  { value: "Presale (EOI)", label: "Presale (EOI)" },
  { value: "Start of Sales", label: "Start of Sales" },
];

const ListingSearchFilters = ({
  developers,
  onSearchChange,
  onDeveloperChange,
  onEmirateChange,
  onLocationChange,
  searchValue,
  developerValue,
  emirateValue,
  locationValue,
  horizontal,
}: ListingSearchFiltersProps) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const hasActiveFilters =
    searchValue ||
    developerValue !== "all" ||
    emirateValue !== "all" ||
    locationValue;

  const clearAllFilters = () => {
    onSearchChange("");
    onDeveloperChange("all");
    onEmirateChange("all");
    onLocationChange("");
    setActiveFilter(null);
  };

  return (
    <div className="space-y-3">
      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Popover open={activeFilter === "developer"} onOpenChange={(open) => setActiveFilter(open ? "developer" : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-300 ${
                developerValue !== "all" ? "border-[#B89555] bg-[#EFE6D6]/10" : ""
              }`}
            >
              <Building2 className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
              {t('listingAdmin.developer')}
              {developerValue !== "all" && <span className="ml-1 text-[#1A1A1A]">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-[#FDFBF7] border-[#B89555]/30" align="start">
            <Select value={developerValue} onValueChange={(v) => { onDeveloperChange(v); setActiveFilter(null); }}>
              <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]">
                <SelectValue placeholder={t('listingAdmin.selectDeveloper')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('listingAdmin.allDevelopers')}</SelectItem>
                {developers?.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    <span data-developer-name className="block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                      {dev.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Popover open={activeFilter === "project"} onOpenChange={(open) => setActiveFilter(open ? "project" : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-300 ${
                searchValue ? "border-[#B89555] bg-[#EFE6D6]/10" : ""
              }`}
            >
              <FolderOpen className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
              {t('listingAdmin.project')}
              {searchValue && <span className="ml-1 text-[#1A1A1A]">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-[#FDFBF7] border-[#B89555]/30" align="start">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('listingAdmin.searchProjects')}
                className="pl-10 bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]"
                autoFocus
              />
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={activeFilter === "emirate"} onOpenChange={(open) => setActiveFilter(open ? "emirate" : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-300 ${
                emirateValue !== "all" ? "border-[#B89555] bg-[#EFE6D6]/10" : ""
              }`}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
              {t('listingAdmin.emirate')}
              {emirateValue !== "all" && <span className="ml-1 text-[#1A1A1A]">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-[#FDFBF7] border-[#B89555]/30" align="start">
            <Select value={emirateValue} onValueChange={(v) => { onEmirateChange(v); setActiveFilter(null); }}>
              <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]">
                <SelectValue placeholder={t('listingAdmin.emirate')} />
              </SelectTrigger>
              <SelectContent>
                {EMIRATES.map((emirate) => (
                  <SelectItem key={emirate.value} value={emirate.value}>
                    {emirate.value === "all" ? t('listingAdmin.allEmirates') : emirate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>

        <Popover open={activeFilter === "location"} onOpenChange={(open) => setActiveFilter(open ? "location" : null)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all duration-300 ${
                locationValue ? "border-[#B89555] bg-[#EFE6D6]/10" : ""
              }`}
            >
              <Filter className="w-4 h-4 mr-1.5 text-[#1A1A1A]" />
              {t('listingAdmin.area')}
              {locationValue && <span className="ml-1 text-[#1A1A1A]">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-[#FDFBF7] border-[#B89555]/30" align="start">
            <Input
              value={locationValue}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t('listingAdmin.searchByArea')}
              className="bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]"
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            {t('listingAdmin.clearAll')}
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full text-xs text-[#1A1A1A]">
              Project: {searchValue}
              <button onClick={() => onSearchChange("")} className="hover:text-[#1A1A1A]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {developerValue !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full text-xs text-[#1A1A1A]">
              Developer: {developers.find((d) => d.id === developerValue)?.name}
              <button onClick={() => onDeveloperChange("all")} className="hover:text-[#1A1A1A]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {emirateValue !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full text-xs text-[#1A1A1A]">
              Emirate: {emirateValue}
              <button onClick={() => onEmirateChange("all")} className="hover:text-[#1A1A1A]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {locationValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full text-xs text-[#1A1A1A]">
              Area: {locationValue}
              <button onClick={() => onLocationChange("")} className="hover:text-[#1A1A1A]">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ListingSearchFilters;
