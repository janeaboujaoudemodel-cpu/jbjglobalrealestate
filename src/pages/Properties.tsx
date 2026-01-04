import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ChevronDown,
  MapPin,
  Building2,
  Home,
  DollarSign,
  Maximize2,
  Calendar,
  Bath,
  Bed,
  CheckCircle,
  ArrowUpRight,
  MessageCircle,
  Phone,
  Filter,
  ExternalLink
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import ProjectCard from "@/components/ProjectCard";
import { useProjects, useCommunities, useDevelopers } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import type { FilterState } from "@/components/ProjectFilters";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

// Currency conversion rates
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

// Extend FilterState for INR
type ExtendedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR';

interface ExtendedFilterState extends Omit<FilterState, 'currency'> {
  currency: ExtendedCurrency;
  propertyType: string | null;
  bathroomsMin: number | null;
  completionStatus: string | null;
  investmentType: string | null;
}

const defaultExtendedFilters: ExtendedFilterState = {
  ...defaultFilters,
  currency: 'AED' as ExtendedCurrency,
  propertyType: null,
  bathroomsMin: null,
  completionStatus: null,
  investmentType: null,
};

const PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "studio", label: "Studio" },
];

const COMPLETION_STATUS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Ready to Move" },
  { value: "off-plan", label: "Off-Plan" },
  { value: "under-construction", label: "Under Construction" },
];

const INVESTMENT_TYPES = [
  { value: "all", label: "All Types" },
  { value: "end-user", label: "End-User" },
  { value: "investment", label: "Investment" },
];

const BEDROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
];

const BATHROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const Properties = () => {
  const { data: projects, isLoading } = useProjects();
  const { data: communities } = useCommunities();
  const { data: developers } = useDevelopers();
  
  const [filters, setFilters] = useState<ExtendedFilterState>(defaultExtendedFilters);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  
  // Convert extended filters to standard FilterState for useFilteredProjects
  const standardFilters: FilterState = {
    ...filters,
    currency: filters.currency as FilterState['currency'],
  };
  
  const filteredProjects = useFilteredProjects(projects, standardFilters);
  
  // Sort projects
  const sortedProjects = useMemo(() => {
    let sorted = [...filteredProjects];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
        break;
      case "price-high":
        sorted.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [filteredProjects, sortBy]);

  const updateFilter = <K extends keyof ExtendedFilterState>(key: K, value: ExtendedFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(defaultExtendedFilters);
    setSortBy("newest");
  };

  // Format price with currency
  const formatPrice = (value: number) => {
    const converted = value * CURRENCY_RATES[filters.currency];
    const symbol = CURRENCY_SYMBOLS[filters.currency];
    if (converted >= 1000000000) return `${symbol} ${(converted / 1000000000).toFixed(1)}B`;
    if (converted >= 1000000) return `${symbol} ${(converted / 1000000).toFixed(0)}M`;
    if (converted >= 1000) return `${symbol} ${(converted / 1000).toFixed(0)}K`;
    return `${symbol} ${converted.toFixed(0)}`;
  };

  // Build SureForms URL with context
  const buildSureFormsUrl = () => {
    const baseUrl = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    
    if (filters.search) params.append('keyword', filters.search);
    if (filters.emirate) params.append('location', filters.emirate);
    if (filters.developerId) {
      const dev = developers?.find(d => d.id === filters.developerId);
      if (dev) params.append('developer', dev.name);
    }
    if (filters.priceMin > 0) params.append('price_min', String(filters.priceMin));
    if (filters.priceMax < 500000000) params.append('price_max', String(filters.priceMax));
    if (filters.sizeMin > 0) params.append('size_min', String(filters.sizeMin));
    if (filters.sizeMax < 50000) params.append('size_max', String(filters.sizeMax));
    params.append('size_unit', filters.sizeUnit);
    params.append('currency', filters.currency);
    if (sortBy !== 'newest') params.append('sort', sortBy);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const handleInquirySubmit = () => {
    window.open(buildSureFormsUrl(), '_blank', 'noopener,noreferrer');
    setIsRequestFormOpen(false);
  };

  const activeFilterCount = [
    filters.search,
    filters.priceMin > 0 || filters.priceMax < 500000000,
    filters.sizeMin > 0 || filters.sizeMax < 50000,
    filters.bedroomsMin !== null,
    filters.communityId !== null,
    filters.developerId !== null,
    filters.emirate !== null,
    filters.propertyType !== null,
    filters.bathroomsMin !== null,
    filters.completionStatus !== null,
    filters.investmentType !== null,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      <GlobalHeader />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-black via-zinc-950 to-[hsl(var(--premium-bg))]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Label */}
            <span className="inline-block text-[#A8925A] text-sm tracking-[0.3em] uppercase mb-4 font-medium">
              PROPERTIES
            </span>
            
            {/* Heading */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Curated Listings. Global Standard.
            </h1>
            
            {/* Subtitle */}
            <p className="text-zinc-400 text-lg md:text-xl">
              Exclusive investment-grade properties with trusted advisory.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Search Bar */}
      <section className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Keyword Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Keyword"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10 h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-[#A8925A] rounded-lg"
              />
            </div>

            {/* Location */}
            <Select
              value={filters.emirate || "all"}
              onValueChange={(value) => updateFilter("emirate", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[150px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-white hover:bg-zinc-800">All Locations</SelectItem>
                <SelectItem value="Dubai" className="text-white hover:bg-zinc-800">Dubai</SelectItem>
                <SelectItem value="Abu Dhabi" className="text-white hover:bg-zinc-800">Abu Dhabi</SelectItem>
                <SelectItem value="Sharjah" className="text-white hover:bg-zinc-800">Sharjah</SelectItem>
                <SelectItem value="Ras Al Khaimah" className="text-white hover:bg-zinc-800">Ras Al Khaimah</SelectItem>
              </SelectContent>
            </Select>

            {/* Developer */}
            <Select
              value={filters.developerId || "all"}
              onValueChange={(value) => updateFilter("developerId", value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[150px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                <Building2 className="w-4 h-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Developer" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                <SelectItem value="all" className="text-white hover:bg-zinc-800">All Developers</SelectItem>
                {developers?.map((dev) => (
                  <SelectItem key={dev.id} value={dev.id} className="text-white hover:bg-zinc-800">
                    {dev.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Select
              value={
                filters.priceMin === 0 && filters.priceMax === 500000000 
                  ? "all" 
                  : `${filters.priceMin}-${filters.priceMax}`
              }
              onValueChange={(value) => {
                if (value === "all") {
                  updateFilter("priceMin", 0);
                  updateFilter("priceMax", 500000000);
                } else {
                  const [min, max] = value.split("-").map(Number);
                  updateFilter("priceMin", min);
                  updateFilter("priceMax", max);
                }
              }}
            >
              <SelectTrigger className="w-[150px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                <DollarSign className="w-4 h-4 mr-2 text-zinc-500" />
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-white hover:bg-zinc-800">Any Price</SelectItem>
                <SelectItem value="0-1000000" className="text-white hover:bg-zinc-800">Under 1M</SelectItem>
                <SelectItem value="1000000-3000000" className="text-white hover:bg-zinc-800">1M - 3M</SelectItem>
                <SelectItem value="3000000-5000000" className="text-white hover:bg-zinc-800">3M - 5M</SelectItem>
                <SelectItem value="5000000-10000000" className="text-white hover:bg-zinc-800">5M - 10M</SelectItem>
                <SelectItem value="10000000-500000000" className="text-white hover:bg-zinc-800">10M+</SelectItem>
              </SelectContent>
            </Select>

            {/* Size Unit */}
            <Select
              value={filters.sizeUnit}
              onValueChange={(value) => updateFilter("sizeUnit", value as 'sqft' | 'sqm')}
            >
              <SelectTrigger className="w-[100px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="sqft" className="text-white hover:bg-zinc-800">sq ft</SelectItem>
                <SelectItem value="sqm" className="text-white hover:bg-zinc-800">sq m</SelectItem>
              </SelectContent>
            </Select>

            {/* Currency */}
            <Select
              value={filters.currency}
              onValueChange={(value) => updateFilter("currency", value as ExtendedCurrency)}
            >
              <SelectTrigger className="w-[100px] h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="AED" className="text-white hover:bg-zinc-800">AED</SelectItem>
                <SelectItem value="USD" className="text-white hover:bg-zinc-800">USD</SelectItem>
                <SelectItem value="EUR" className="text-white hover:bg-zinc-800">EUR</SelectItem>
                <SelectItem value="GBP" className="text-white hover:bg-zinc-800">GBP</SelectItem>
                <SelectItem value="INR" className="text-white hover:bg-zinc-800">INR</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Button */}
            <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-12 px-4 bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800 hover:text-white rounded-lg"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {activeFilterCount > 0 && (
                    <span className="mr-2 px-1.5 py-0.5 bg-[#A8925A] text-black text-xs font-bold rounded">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-white p-0">
                <DialogHeader className="p-6 border-b border-zinc-800">
                  <DialogTitle className="text-xl font-semibold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Advanced Filters
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="p-6 space-y-6">
                    {/* Property Type */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Property Type</label>
                      <Select
                        value={filters.propertyType || "all"}
                        onValueChange={(value) => updateFilter("propertyType", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-zinc-800">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bedrooms & Bathrooms */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Bedrooms</label>
                        <Select
                          value={filters.bedroomsMin === null ? "all" : filters.bedroomsMin === 0 ? "studio" : String(filters.bedroomsMin)}
                          onValueChange={(value) => {
                            if (value === "all") updateFilter("bedroomsMin", null);
                            else if (value === "studio") updateFilter("bedroomsMin", 0);
                            else updateFilter("bedroomsMin", parseInt(value));
                          }}
                        >
                          <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                            <Bed className="w-4 h-4 mr-2 text-zinc-500" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {BEDROOM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-zinc-800">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400 mb-2 block">Bathrooms</label>
                        <Select
                          value={filters.bathroomsMin === null ? "all" : String(filters.bathroomsMin)}
                          onValueChange={(value) => updateFilter("bathroomsMin", value === "all" ? null : parseInt(value))}
                        >
                          <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                            <Bath className="w-4 h-4 mr-2 text-zinc-500" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {BATHROOM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-zinc-800">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Size Range */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Size ({filters.sizeUnit})</label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.sizeMin || ""}
                          onChange={(e) => updateFilter("sizeMin", parseInt(e.target.value) || 0)}
                          className="h-12 bg-zinc-900 border-zinc-700 text-white"
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.sizeMax < 50000 ? filters.sizeMax : ""}
                          onChange={(e) => updateFilter("sizeMax", parseInt(e.target.value) || 50000)}
                          className="h-12 bg-zinc-900 border-zinc-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Price Range ({filters.currency})</label>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input
                          type="text"
                          placeholder="Min"
                          value={filters.priceMin > 0 ? filters.priceMin.toLocaleString() : ""}
                          onChange={(e) => updateFilter("priceMin", parseInt(e.target.value.replace(/,/g, '')) || 0)}
                          className="h-12 bg-zinc-900 border-zinc-700 text-white"
                        />
                        <Input
                          type="text"
                          placeholder="Max"
                          value={filters.priceMax < 500000000 ? filters.priceMax.toLocaleString() : ""}
                          onChange={(e) => updateFilter("priceMax", parseInt(e.target.value.replace(/,/g, '')) || 500000000)}
                          className="h-12 bg-zinc-900 border-zinc-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Completion Status */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Completion Status</label>
                      <Select
                        value={filters.completionStatus || "all"}
                        onValueChange={(value) => updateFilter("completionStatus", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                          <Calendar className="w-4 h-4 mr-2 text-zinc-500" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          {COMPLETION_STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value} className="text-white hover:bg-zinc-800">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Investment Type */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Investment Type</label>
                      <Select
                        value={filters.investmentType || "all"}
                        onValueChange={(value) => updateFilter("investmentType", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                          <Home className="w-4 h-4 mr-2 text-zinc-500" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700">
                          {INVESTMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-zinc-800">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Community */}
                    <div>
                      <label className="text-sm text-zinc-400 mb-2 block">Community</label>
                      <Select
                        value={filters.communityId || "all"}
                        onValueChange={(value) => updateFilter("communityId", value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-full h-12 bg-zinc-900 border-zinc-700 text-white">
                          <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
                          <SelectValue placeholder="All Communities" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                          <SelectItem value="all" className="text-white hover:bg-zinc-800">All Communities</SelectItem>
                          {communities?.map((comm) => (
                            <SelectItem key={comm.id} value={comm.id} className="text-white hover:bg-zinc-800">
                              {comm.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-6 border-t border-zinc-800 flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setIsAdvancedOpen(false)}
                    className="bg-[#A8925A] text-black hover:bg-[#C4A962] px-8"
                  >
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Search Button */}
            <Button className="h-12 px-8 bg-[#A8925A] text-black hover:bg-[#C4A962] font-semibold rounded-lg">
              SEARCH
            </Button>
          </div>

          {/* Sorting Pills */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[
              { value: "newest", label: "Newest" },
              { value: "price-low", label: "Price: Low→High" },
              { value: "price-high", label: "Price: High→Low" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                  sortBy === option.value
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Results Count */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-zinc-400">
              Showing <span className="text-white font-medium">{sortedProjects.length}</span> properties
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Clear all filters
              </Button>
            )}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-xl h-[420px] animate-pulse" />
              ))}
            </div>
          ) : sortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  currency={filters.currency}
                  sizeUnit={filters.sizeUnit}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
              <p className="text-zinc-500 mb-6">Try adjusting your filters or search criteria</p>
              <Button onClick={clearFilters} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Request Details Form Section */}
      <section className="py-16 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
            >
              <h2 className="text-2xl md:text-3xl font-semibold text-white text-center mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
                Request Details
              </h2>
              
              <div className="space-y-4">
                <Input
                  placeholder="Name"
                  className="h-14 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  className="h-14 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  className="h-14 bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg"
                />
                <Select>
                  <SelectTrigger className="h-14 bg-zinc-900/80 border-zinc-700 text-zinc-500 rounded-lg">
                    <SelectValue placeholder="I am..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="investor" className="text-white hover:bg-zinc-800">An Investor</SelectItem>
                    <SelectItem value="end-user" className="text-white hover:bg-zinc-800">Looking for a Home</SelectItem>
                    <SelectItem value="agent" className="text-white hover:bg-zinc-800">A Real Estate Agent</SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-zinc-800">Other</SelectItem>
                  </SelectContent>
                </Select>
                <textarea
                  placeholder="Message"
                  rows={4}
                  className="w-full px-4 py-3 bg-zinc-900/80 border border-zinc-700 text-white placeholder:text-zinc-500 rounded-lg resize-none focus:outline-none focus:border-[#A8925A]"
                />
                <div className="flex items-center gap-3">
                  <Checkbox id="consent" className="border-zinc-600 data-[state=checked]:bg-[#A8925A] data-[state=checked]:border-[#A8925A]" />
                  <label htmlFor="consent" className="text-zinc-400 text-sm">
                    I agree to be contacted
                  </label>
                </div>
                <Button 
                  onClick={handleInquirySubmit}
                  className="w-full h-14 bg-[#A8925A] text-black hover:bg-[#C4A962] font-semibold text-lg rounded-lg mt-4"
                >
                  SUBMIT
                </Button>
              </div>

              {/* Current Filter Summary */}
              {activeFilterCount > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <p className="text-zinc-500 text-sm mb-3">Your search includes:</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.emirate && (
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                        {filters.emirate}
                      </span>
                    )}
                    {filters.developerId && developers?.find(d => d.id === filters.developerId) && (
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                        {developers.find(d => d.id === filters.developerId)?.name}
                      </span>
                    )}
                    {(filters.priceMin > 0 || filters.priceMax < 500000000) && (
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                        {formatPrice(filters.priceMin)} - {formatPrice(filters.priceMax)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Contact CTA */}
      <section className="py-12 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href={buildSureFormsUrl()} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#A8925A] text-black hover:bg-[#C4A962] h-12 px-8 font-semibold">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Register Interest
              </Button>
            </a>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white h-12 px-8">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </a>
            <a href={`tel:${CONTACT_INFO.phoneRaw}`}>
              <Button variant="outline" className="border-[#A8925A]/50 text-[#A8925A] hover:bg-[#A8925A] hover:text-black h-12 px-8">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Properties;
