import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Building2, DollarSign, Filter, BedDouble } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { useDevelopers } from "@/hooks/useProjects";

interface PropertySearchBarProps {
  className?: string;
  compact?: boolean;
}

const PropertySearchBar = ({ className = "", compact = false }: PropertySearchBarProps) => {
  const navigate = useNavigate();
  const { data: developers } = useDevelopers();

  // Premium developers first by rank, then rest
  const allDevelopersSorted = useMemo(() => {
    if (!developers) return [];
    return [...developers].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [developers]);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [beds, setBeds] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.append("q", keyword);
    if (location) params.append("emirate", location);
    if (developerId) params.append("developer", developerId);
    if (beds) params.append("beds", beds);
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.append("priceMin", min);
      if (max && max !== "500000000") params.append("priceMax", max);
    }
    navigate(`/properties?${params.toString()}`);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search properties..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-10 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
          />
        </div>
        <Button onClick={handleSearch} variant="primary" className="h-10 px-4 rounded-lg">
          Search
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`bg-zinc-950/90 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 md:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3 w-full">
        {/* Keyword Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
          />
        </div>

        {/* Emirates / Location */}
        <Select value={location || "all"} onValueChange={(value) => setLocation(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[140px] h-12 rounded-lg">
            <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Emirates" />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="all">All Emirates</SelectItemDark>
            <SelectItemDark value="Dubai">Dubai</SelectItemDark>
            <SelectItemDark value="Abu Dhabi">Abu Dhabi</SelectItemDark>
            <SelectItemDark value="Sharjah">Sharjah</SelectItemDark>
            <SelectItemDark value="Ras Al Khaimah">Ras Al Khaimah</SelectItemDark>
            <SelectItemDark value="Ajman">Ajman</SelectItemDark>
            <SelectItemDark value="Fujairah">Fujairah</SelectItemDark>
            <SelectItemDark value="Umm Al Quwain">Umm Al Quwain</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Developer */}
        <Select value={developerId || "all"} onValueChange={(value) => setDeveloperId(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[160px] h-12 rounded-lg">
            <Building2 className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Developer" />
          </SelectTriggerDark>
          <SelectContentDark className="max-h-72">
            <SelectItemDark value="all">All Developers</SelectItemDark>
            {allDevelopersSorted.map((dev) => (
              <SelectItemDark key={dev.id} value={dev.id}>
                <span className="flex items-center gap-2">
                  {dev.logo_url ? (
                    <img
                      src={dev.logo_url}
                      alt={dev.name}
                      className="w-5 h-5 object-contain rounded-sm flex-shrink-0 bg-white"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-sm bg-gold/20 flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-gold">
                      {dev.name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate max-w-[120px]">{dev.name}</span>
                </span>
              </SelectItemDark>
            ))}
          </SelectContentDark>
        </Select>

        {/* Divider between Developer and Beds */}
        <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />

        {/* Beds */}
        <Select value={beds || "all"} onValueChange={(value) => setBeds(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[110px] h-12 rounded-lg">
            <BedDouble className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Beds" />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="all">Any Beds</SelectItemDark>
            <SelectItemDark value="studio">Studio</SelectItemDark>
            <SelectItemDark value="1">1 Bed</SelectItemDark>
            <SelectItemDark value="2">2 Beds</SelectItemDark>
            <SelectItemDark value="3">3 Beds</SelectItemDark>
            <SelectItemDark value="4">4 Beds</SelectItemDark>
            <SelectItemDark value="5">5+ Beds</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Price Range */}
        <Select value={priceRange || "all"} onValueChange={(value) => setPriceRange(value === "all" ? null : value)}>
          <SelectTriggerDark className="w-[140px] h-12 rounded-lg">
            <DollarSign className="w-4 h-4 mr-2 text-zinc-500" />
            <SelectValue placeholder="Price Range" />
          </SelectTriggerDark>
          <SelectContentDark>
            <SelectItemDark value="all">Any Price</SelectItemDark>
            <SelectItemDark value="0-1000000">Under 1M</SelectItemDark>
            <SelectItemDark value="1000000-3000000">1M – 3M</SelectItemDark>
            <SelectItemDark value="3000000-5000000">3M – 5M</SelectItemDark>
            <SelectItemDark value="5000000-10000000">5M – 10M</SelectItemDark>
            <SelectItemDark value="10000000-500000000">10M+</SelectItemDark>
          </SelectContentDark>
        </Select>

        {/* Advanced Filters Link */}
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="h-12 px-4 bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800 hover:text-white rounded-lg"
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="h-12 px-8 rounded-lg bg-gradient-to-r from-gold to-gold-dark text-black font-bold hover:brightness-110 hover:shadow-[0_0_25px_rgba(200,167,102,0.6)] transition-all duration-300 shadow-[0_0_15px_rgba(200,167,102,0.4)] cursor-pointer"
        >
          SEARCH
        </Button>
      </div>
    </div>
  );
};

export default PropertySearchBar;
