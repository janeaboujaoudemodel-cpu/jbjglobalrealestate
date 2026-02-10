 import { useState, useMemo, useEffect, Fragment } from "react";
 import { Switch } from "@/components/ui/switch";
 import { Link, useSearchParams } from "react-router-dom";
 import { motion } from "framer-motion";
 import { 
   Search, 
   SlidersHorizontal, 
   X, 
   MapPin,
   Building2,
   Home,
   Calendar,
   CheckCircle,
   MessageCircle,
   Loader2
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
 import { useLanguage } from "@/contexts/LanguageContext";
 
 import ReellyProjectCard from "@/components/ReellyProjectCard";
 import { ProjectGridSkeleton } from "@/components/ProjectCardSkeleton";
 import { useReellyProjects, flattenReellyProjects, getReellyProjectsTotal } from "@/hooks/useReellyProjects";
 import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
 import { SEOHead } from "@/components/SEOHead";
 import { FeaturedProjectAd, FEATURED_ADS } from "@/components/FeaturedProjectAd";
 import { blueprintPagesSEO } from "@/types/blueprint";
import PropertiesHeroVideo from "@/components/PropertiesHeroVideo";
import { CurrencyTooltip } from "@/components/CurrencyTooltip";
// Currency conversion rates - 10 unified currencies
const CURRENCY_RATES: Record<string, number> = {
  AED: 1,
  USD: 0.27,
  EUR: 0.25,
  GBP: 0.21,
  INR: 22.5,
  SAR: 1.02,
  CNY: 1.98,
  RUB: 24.5,
  CAD: 0.37,
  AUD: 0.42,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: 'SAR',
  CNY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
};

type ExtendedCurrency = 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';
 
 interface FilterState {
   search: string;
   emirate: string | null;
   saleStatus: string | null;
   constructionStatus: string | null;
   currency: ExtendedCurrency;
   sizeUnit: 'sqft' | 'sqm';
   hideSoldOut: boolean;
 }
 
 const defaultFilters: FilterState = {
   search: '',
   emirate: null,
   saleStatus: null,
   constructionStatus: null,
   currency: 'AED',
   sizeUnit: 'sqft',
   hideSoldOut: false,
 };
 
 const EMIRATES = [
   { value: "all", label: "All Emirates" },
   { value: "Dubai", label: "Dubai" },
   { value: "Abu Dhabi", label: "Abu Dhabi" },
   { value: "Sharjah", label: "Sharjah" },
   { value: "Ajman", label: "Ajman" },
   { value: "Ras Al Khaimah", label: "Ras Al Khaimah" },
 ];
 
  const SALE_STATUS = [
    { value: "all", label: "All Sale Statuses", dotClass: "" },
    { value: "Announced", label: "Announced", dotClass: "bg-gold" },
    { value: "Presale (EOI)", label: "Presale (EOI)", dotClass: "bg-amber-500" },
    { value: "Start of Sales", label: "Start of Sales", dotClass: "bg-blue-500" },
    { value: "On Sale", label: "On Sale", dotClass: "bg-emerald-500" },
    { value: "Sold Out", label: "Sold Out", dotClass: "bg-red-500" },
  ];
 
 const CONSTRUCTION_STATUS = [
   { value: "all", label: "All Statuses" },
   { value: "Completed", label: "Completed" },
   { value: "Under Construction", label: "Under Construction" },
   { value: "Presale", label: "Presale" },
 ];
 
 const PropertiesReelly = () => {
   const [searchParams] = useSearchParams();
   const { t } = useLanguage();
   
   const [filters, setFilters] = useState<FilterState>(defaultFilters);
   const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
   const [sortBy, setSortBy] = useState<string>("newest");
   const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
   
   // Fetch projects from Reelly API with pagination
   const {
     data,
     isLoading,
     isError,
     error,
     fetchNextPage,
     hasNextPage,
     isFetchingNextPage,
   } = useReellyProjects({
     search: appliedFilters.search,
     emirate: appliedFilters.emirate || undefined,
     saleStatus: appliedFilters.saleStatus || undefined,
     constructionStatus: appliedFilters.constructionStatus || undefined,
   });
 
   // Flatten paginated data
   const projects = flattenReellyProjects(data);
   const totalCount = getReellyProjectsTotal(data);
 
    // Apply URL params on mount - support both HeroSearchBar and direct params
    useEffect(() => {
      const keywordParam = searchParams.get('q') || searchParams.get('keyword') || searchParams.get('search');
      const emirateParam = searchParams.get('emirate') || searchParams.get('location');
      const areaParam = searchParams.get('area');
      // Support both 'status' and 'saleStatus' from HeroSearchBar
      const statusParam = searchParams.get('saleStatus') || searchParams.get('status');
      // Support 'constructionStatus' from HeroSearchBar
      const constructionParam = searchParams.get('constructionStatus');
      
      // Convert area slug to search term (e.g. "palm-jumeirah" → "Palm Jumeirah")
      const areaSearch = areaParam
        ? areaParam.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : null;
      
      if (keywordParam || emirateParam || statusParam || constructionParam || areaSearch) {
        const updated: FilterState = {
          ...defaultFilters,
          search: keywordParam ?? areaSearch ?? '',
          emirate: emirateParam,
          saleStatus: statusParam,
          constructionStatus: constructionParam,
        };
        setFilters(updated);
        setAppliedFilters(updated);
      }
    }, [searchParams]);
 
   // Sort and filter projects client-side
   const sortedProjects = useMemo(() => {
     let sorted = [...projects];
     
     // Hide sold out filter
     if (appliedFilters.hideSoldOut) {
       sorted = sorted.filter(p => {
         const status = (p.sale_status || p.status_label || '').toLowerCase();
         return !status.includes('sold') && !status.includes('out of stock');
       });
     }
     
     switch (sortBy) {
       case "price-low":
         sorted.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
         break;
       case "price-high":
         sorted.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
         break;
       case "name":
         sorted.sort((a, b) => a.name.localeCompare(b.name));
         break;
       case "newest":
       default:
         break;
     }
     return sorted;
   }, [projects, sortBy, appliedFilters.hideSoldOut]);
 
   const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
     setFilters(prev => ({ ...prev, [key]: value }));
   };
 
   const handleSearch = () => {
     setAppliedFilters({ ...filters });
   };
 
   const clearFilters = () => {
     setFilters(defaultFilters);
     setAppliedFilters(defaultFilters);
     setSortBy("newest");
   };
 
   const activeFilterCount = [
     filters.search,
     filters.emirate !== null,
     filters.saleStatus !== null,
     filters.constructionStatus !== null,
   ].filter(Boolean).length;
 
   const dynamicSEO = blueprintPagesSEO.buyListings;
 
   return (
     <>
       <SEOHead 
         title={dynamicSEO.title}
         description={dynamicSEO.metaDescription}
       />
       <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
       
       {/* Hero Section */}
       <PropertiesHeroVideo>
         <div className="relative z-10 container mx-auto px-4">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="text-center max-w-4xl mx-auto"
           >
            <div 
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(200,167,102,0.6)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Premium Curated Listings</span>
              </div>
             
             <h1 
               className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]"
               style={{ fontFamily: "Poppins, sans-serif" }}
             >
               Curated Listings. Global Standard.
             </h1>
             
             <p className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
               {totalCount > 0 ? `${totalCount.toLocaleString()} properties available` : 'Loading properties...'}
             </p>
           </motion.div>
         </div>
       </PropertiesHeroVideo>
 
       {/* Filters Section */}
       <section className="sticky top-24 lg:top-20 z-40 bg-black py-4 border-b border-gold/30">
         <div className="container mx-auto px-3 sm:px-4">
           <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5 shadow-lg">
             
             {/* Search Row */}
             <div className="flex flex-wrap items-center gap-3">
               {/* Search Input */}
               <div className="relative flex-1 min-w-[200px]">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/70" />
                 <Input
                   type="text"
                   placeholder="Search projects, developers, areas..."
                   value={filters.search}
                   onChange={(e) => updateFilter("search", e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                   className="pl-10 h-10 bg-[#F5F0E6] border-gold/30 text-black placeholder:text-zinc-500"
                 />
               </div>
 
               {/* Emirate Select */}
               <Select
                 value={filters.emirate || "all"}
                 onValueChange={(value) => updateFilter("emirate", value === "all" ? null : value)}
               >
                 <SelectTrigger className="w-[160px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                   <MapPin className="w-4 h-4 mr-2 text-gold" />
                   <SelectValue placeholder="Emirate" />
                 </SelectTrigger>
                 <SelectContent>
                   {EMIRATES.map((e) => (
                     <SelectItem key={e.value} value={e.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                       {e.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
 
               {/* Sale Status Select */}
               <Select
                 value={filters.saleStatus || "all"}
                 onValueChange={(value) => updateFilter("saleStatus", value === "all" ? null : value)}
               >
                 <SelectTrigger className="w-[180px] h-10 bg-[#F5F0E6] border-gold/30 text-black">
                   <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                   <SelectValue placeholder="Sale Status" />
                 </SelectTrigger>
                  <SelectContent>
                    {SALE_STATUS.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                        <span className="flex items-center gap-2">
                          {s.dotClass && <span className={`w-2.5 h-2.5 rounded-full ${s.dotClass} flex-shrink-0`} />}
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
               </Select>
 
               {/* Advanced Filters Dialog */}
               <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                 <DialogTrigger asChild>
                   <Button 
                     variant="secondary" 
                     className="h-10 px-4 gap-2"
                   >
                     <SlidersHorizontal className="w-4 h-4" />
                     Filters
                     {activeFilterCount > 0 && (
                       <span className="ml-1 px-2 py-0.5 text-xs bg-gold text-black rounded-full font-bold">
                         {activeFilterCount}
                       </span>
                     )}
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30">
                   <DialogHeader>
                     <DialogTitle className="text-black flex items-center gap-2">
                       <SlidersHorizontal className="w-5 h-5 text-gold" />
                       Advanced Filters
                     </DialogTitle>
                   </DialogHeader>
                   <ScrollArea className="max-h-[60vh]">
                     <div className="grid gap-6 p-4">
                       {/* Construction Status */}
                       <div>
                         <label className="text-sm text-gold font-medium mb-2 block">Construction Status</label>
                         <Select
                           value={filters.constructionStatus || "all"}
                           onValueChange={(value) => updateFilter("constructionStatus", value === "all" ? null : value)}
                         >
                           <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                             <Building2 className="w-4 h-4 mr-2 text-gold" />
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {CONSTRUCTION_STATUS.map((status) => (
                               <SelectItem key={status.value} value={status.value} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                                 {status.label}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
 
                       {/* Currency */}
                       <div>
                         <label className="text-sm text-gold font-medium mb-2 block">Currency</label>
                         <Select
                           value={filters.currency}
                           onValueChange={(value) => updateFilter("currency", value as ExtendedCurrency)}
                         >
                           <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                             <SelectValue />
                           </SelectTrigger>
                            <SelectContent>
                             {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                               <SelectItem key={curr} value={curr} className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                                 {CURRENCY_SYMBOLS[curr]} ({curr})
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
 
                       {/* Size Unit */}
                       <div>
                         <label className="text-sm text-gold font-medium mb-2 block">Size Unit</label>
                         <Select
                           value={filters.sizeUnit}
                           onValueChange={(value) => updateFilter("sizeUnit", value as 'sqft' | 'sqm')}
                         >
                           <SelectTrigger className="w-full h-12 bg-[#F5F0E6] border-gold/30 text-black">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="sqft" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                               Square Feet (sqft)
                             </SelectItem>
                             <SelectItem value="sqm" className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black">
                               Square Meters (sqm)
                             </SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                   </ScrollArea>
                   <div className="p-6 border-t border-gold/20 flex justify-between bg-gradient-to-r from-[#F5F0E6] to-[#FBF8F3]">
                     <Button
                       variant="ghost"
                       onClick={clearFilters}
                       className="text-zinc-600 hover:text-black"
                     >
                       Clear All
                     </Button>
                     <Button
                       onClick={() => {
                         setAppliedFilters({ ...filters });
                         setIsAdvancedOpen(false);
                       }}
                       variant="primary"
                       className="px-8"
                     >
                       Apply Filters
                     </Button>
                   </div>
                 </DialogContent>
               </Dialog>
 
               {/* Search Button */}
               <button 
                 onClick={handleSearch}
                 className="relative h-10 px-6 rounded-lg text-sm flex-shrink-0 font-bold transition-all duration-300 group overflow-hidden"
                 style={{
                   background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                   boxShadow: `
                     0 6px 20px rgba(200,167,102,0.4),
                     0 4px 10px rgba(0,0,0,0.15),
                     inset 0 2px 3px rgba(255,255,255,0.9),
                     inset 0 -2px 3px rgba(200,167,102,0.2),
                     0 0 15px rgba(200,167,102,0.3)
                   `,
                 }}
               >
                 <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                 <span className="relative text-gold font-semibold">SEARCH</span>
               </button>
             </div>
 
             {/* Sort Options + Hide Sold Out */}
             <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
               {[
                 { value: "newest", label: "Newest" },
                 { value: "price-low", label: "Low → High" },
                 { value: "price-high", label: "High → Low" },
                 { value: "name", label: "A-Z" },
               ].map((option) => (
                 <button
                   key={option.value}
                   onClick={() => setSortBy(option.value)}
                   className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border-2 ${
                     sortBy === option.value
                       ? "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border-gold shadow-[0_0_18px_rgba(200,167,102,0.25)]"
                       : "bg-transparent text-black border-gold/30 hover:border-gold"
                   }`}
                 >
                   {option.label}
                 </button>
               ))}

               <div className="w-px h-6 bg-gold/30 mx-1" />

               {/* Hide Sold Out Toggle */}
               <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full cursor-pointer hover:border-gold transition-all">
                 <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                 <span className="text-xs text-black font-semibold whitespace-nowrap">Hide Sold Out</span>
                 <Switch
                   checked={appliedFilters.hideSoldOut}
                   onCheckedChange={(checked) => {
                     updateFilter("hideSoldOut", checked);
                     setAppliedFilters(prev => ({ ...prev, hideSoldOut: checked }));
                   }}
                   className="scale-75"
                 />
               </label>
             </div>
           </div>
         </div>
       </section>
 
       {/* Divider */}
       <div className="h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
 
       {/* Results Section */}
       <section className="py-12 bg-black">
         <div className="container mx-auto px-3 sm:px-4">
           <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-5">
             
             {/* Results Count */}
             <div className="mb-6 flex items-center justify-between px-4 pt-4">
               <p className="text-black/70">
                 Showing <span className="text-gold font-medium">{sortedProjects.length}</span> of{' '}
                 <span className="text-gold font-medium">{totalCount.toLocaleString()}</span> properties
               </p>
               {activeFilterCount > 0 && (
                 <Button
                   variant="ghost"
                   onClick={clearFilters}
                   className="text-zinc-600 hover:text-black"
                 >
                   <X className="w-4 h-4 mr-2" />
                   Clear all filters
                 </Button>
               )}
             </div>
 
             {/* Projects Grid */}
             {isLoading ? (
               <ProjectGridSkeleton count={6} />
             ) : isError ? (
               <div className="text-center py-20 px-4">
                 <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
                   <X className="w-10 h-10 text-red-500" />
                 </div>
                 <h3 className="text-xl font-semibold text-black mb-2">Failed to Load Properties</h3>
                 <p className="text-zinc-600 mb-4">{error?.message || 'Something went wrong. Please try again.'}</p>
                 <Button onClick={() => window.location.reload()} variant="primary">
                   Retry
                 </Button>
               </div>
             ) : sortedProjects.length > 0 ? (
               <>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
                   {sortedProjects.map((project, index) => {
                     // Insert featured ads after specific positions
                     const adAfterIndex = [5, 11, 17];
                     const adIndex = adAfterIndex.indexOf(index);
                     const featuredAd = adIndex !== -1 && FEATURED_ADS[adIndex] ? FEATURED_ADS[adIndex] : null;
                     
                     return (
                       <Fragment key={project.id}>
                         <ReellyProjectCard 
                           project={project} 
                           currency={filters.currency}
                           sizeUnit={filters.sizeUnit}
                         />
                         {featuredAd && (
                           <FeaturedProjectAd
                             key={`ad-${featuredAd.id}`}
                             title={featuredAd.title}
                             subtitle={featuredAd.subtitle}
                             description={featuredAd.description}
                             imageUrl={featuredAd.imageUrl}
                             projectSlug={featuredAd.projectSlug}
                             ctaText={featuredAd.ctaText}
                           />
                         )}
                       </Fragment>
                     );
                   })}
                 </div>
 
                 {/* Load More Button */}
                 {hasNextPage && (
                   <div className="flex justify-center py-8">
                     <Button
                       onClick={() => fetchNextPage()}
                       disabled={isFetchingNextPage}
                       variant="primary"
                       className="h-12 px-8 gap-2"
                     >
                       {isFetchingNextPage ? (
                         <>
                           <Loader2 className="w-4 h-4 animate-spin" />
                           Loading more...
                         </>
                       ) : (
                         <>
                           Load More Projects
                           <span className="text-xs opacity-70">
                             ({totalCount - sortedProjects.length} remaining)
                           </span>
                         </>
                       )}
                     </Button>
                   </div>
                 )}
 
                 {/* Loading skeletons while fetching next page */}
                 {isFetchingNextPage && <ProjectGridSkeleton count={3} />}
               </>
             ) : (
               <div className="text-center py-20 px-4">
                 <div className="w-20 h-20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30 shadow-[0_0_30px_rgba(200,167,102,0.3)]">
                   <Search className="w-10 h-10 text-gold drop-shadow-[0_0_8px_rgba(200,167,102,0.5)]" />
                 </div>
                 <h3 className="text-xl font-semibold text-black mb-2">No Properties Found</h3>
                 <p className="text-zinc-600 mb-4">Try adjusting your search filters or browse all properties.</p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                   <Button onClick={clearFilters} variant="primary" className="h-12 px-8">
                     Browse All Properties
                   </Button>
                   <Button asChild variant="outline" className="border-zinc-300 text-black hover:bg-zinc-100 h-12 px-6">
                     <a 
                       href={getWhatsAppUrl("Hi, I'm looking for properties but couldn't find what I need. Can you help?")}
                       target="_blank" 
                       rel="noopener noreferrer"
                     >
                       <MessageCircle className="w-4 h-4 mr-2" />
                       Contact Us
                     </a>
                   </Button>
                 </div>
               </div>
             )}
           </div>
         </div>
       </section>
        <CurrencyTooltip />
        </div>
      </>
    );
 };
 
 export default PropertiesReelly;