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
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-gold/30 text-black hover:bg-black hover:text-white hover:border-black transition-all duration-300 ${
                developerValue !== "all" ? "border-gold bg-gold/10" : ""
              }`}
            >
              <Building2 className="w-4 h-4 mr-1.5 text-gold" />
              {t('listingAdmin.developer')}
              {developerValue !== "all" && <span className="ml-1 text-gold">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-white border-gray-200" align="start">
            <Select value={developerValue} onValueChange={(v) => { onDeveloperChange(v); setActiveFilter(null); }}>
              <SelectTrigger className="bg-gray-50 border-gray-300 text-black">
                <SelectValue placeholder={t('listingAdmin.selectDeveloper')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('listingAdmin.allDevelopers')}</SelectItem>
                {developers?.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id}>
                    {dev.name}
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
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-gold/30 text-black hover:bg-black hover:text-white hover:border-black transition-all duration-300 ${
                searchValue ? "border-gold bg-gold/10" : ""
              }`}
            >
              <FolderOpen className="w-4 h-4 mr-1.5 text-gold" />
              {t('listingAdmin.project')}
              {searchValue && <span className="ml-1 text-gold">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-white border-gray-200" align="start">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('listingAdmin.searchProjects')}
                className="pl-10 bg-gray-50 border-gray-300 text-black"
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
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-gold/30 text-black hover:bg-black hover:text-white hover:border-black transition-all duration-300 ${
                emirateValue !== "all" ? "border-gold bg-gold/10" : ""
              }`}
            >
              <MapPin className="w-4 h-4 mr-1.5 text-gold" />
              {t('listingAdmin.emirate')}
              {emirateValue !== "all" && <span className="ml-1 text-gold">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-white border-gray-200" align="start">
            <Select value={emirateValue} onValueChange={(v) => { onEmirateChange(v); setActiveFilter(null); }}>
              <SelectTrigger className="bg-gray-50 border-gray-300 text-black">
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
              className={`bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-gold/30 text-black hover:bg-black hover:text-white hover:border-black transition-all duration-300 ${
                locationValue ? "border-gold bg-gold/10" : ""
              }`}
            >
              <Filter className="w-4 h-4 mr-1.5 text-gold" />
              {t('listingAdmin.area')}
              {locationValue && <span className="ml-1 text-gold">•</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-white border-gray-200" align="start">
            <Input
              value={locationValue}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder={t('listingAdmin.searchByArea')}
              className="bg-gray-50 border-gray-300 text-black"
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
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs text-black">
              Project: {searchValue}
              <button onClick={() => onSearchChange("")} className="hover:text-gold">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {developerValue !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs text-black">
              Developer: {developers.find((d) => d.id === developerValue)?.name}
              <button onClick={() => onDeveloperChange("all")} className="hover:text-gold">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {emirateValue !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs text-black">
              Emirate: {emirateValue}
              <button onClick={() => onEmirateChange("all")} className="hover:text-gold">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {locationValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs text-black">
              Area: {locationValue}
              <button onClick={() => onLocationChange("")} className="hover:text-gold">
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
