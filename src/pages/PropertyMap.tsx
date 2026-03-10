import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import { useProjects, Project, useTrendingAreas } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { MapPin, Building, Bed, Maximize, Calendar, Filter, List, X, ChevronRight, ExternalLink, Globe } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { MapNavigationControls } from "@/components/maps/MapNavigationControls";
import "leaflet/dist/leaflet.css";

// Arabic translations for the map interface
const mapTranslations = {
  en: {
    propertyMap: "Property Map",
    properties: "Properties",
    searchProjects: "Search by project, developer, or area...",
    filters: "Filters",
    list: "List",
    transactionType: "Transaction Type",
    all: "All",
    buy: "Buy",
    rent: "Rent",
    search: "Search",
    developer: "Developer",
    allDevelopers: "All Developers",
    area: "Area",
    allAreas: "All Areas",
    bedrooms: "Bedrooms",
    any: "Any",
    studio: "Studio",
    bedroom: "Bedroom",
    bedrooms_label: "Bedrooms",
    priceRange: "Price Range",
    clearAll: "Clear All Filters",
    filterProperties: "Filter Properties",
    priceOnRequest: "Price on request",
    startingFrom: "Starting from",
    viewDetails: "View Details",
    view: "View",
    by: "by",
    loading: "Loading properties...",
  },
  ar: {
    propertyMap: "خريطة العقارات",
    properties: "عقارات",
    searchProjects: "ابحث عن مشروع أو مطور أو منطقة...",
    filters: "تصفية",
    list: "قائمة",
    transactionType: "نوع المعاملة",
    all: "الكل",
    buy: "شراء",
    rent: "إيجار",
    search: "بحث",
    developer: "المطور",
    allDevelopers: "جميع المطورين",
    area: "المنطقة",
    allAreas: "جميع المناطق",
    bedrooms: "غرف النوم",
    any: "أي",
    studio: "استوديو",
    bedroom: "غرفة نوم",
    bedrooms_label: "غرف نوم",
    priceRange: "نطاق السعر",
    clearAll: "مسح جميع الفلاتر",
    filterProperties: "تصفية العقارات",
    priceOnRequest: "السعر عند الطلب",
    startingFrom: "يبدأ من",
    viewDetails: "عرض التفاصيل",
    view: "عرض",
    by: "من",
    loading: "جاري تحميل العقارات...",
  },
} as const;

type MapLang = "en" | "ar";

// Hook to fetch areas for filter
function useAreas() {
  return useQuery({
    queryKey: ["areas-for-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("id, name, slug, emirate")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

// Dubai community coordinates (approximate locations)
const COMMUNITY_COORDINATES: Record<string, [number, number]> = {
  // Downtown & Business Bay
  "downtown-dubai": [25.1972, 55.2744],
  "business-bay": [25.1850, 55.2650],
  "difc": [25.2120, 55.2800],
  
  // Marina & JBR
  "dubai-marina": [25.0800, 55.1400],
  "jbr": [25.0780, 55.1350],
  "bluewaters": [25.0810, 55.1250],
  
  // Palm & Emirates Hills
  "palm-jumeirah": [25.1124, 55.1390],
  "emirates-hills": [25.0600, 55.1600],
  
  // Creek & Festival
  "dubai-creek-harbour": [25.2050, 55.3450],
  "festival-city": [25.2200, 55.3550],
  
  // MBR City & Meydan
  "mbr-city": [25.1700, 55.3100],
  "meydan": [25.1600, 55.3000],
  "sobha-hartland": [25.1850, 55.3200],
  
  // JVC & JVT
  "jvc": [25.0550, 55.2100],
  "jvt": [25.0650, 55.2000],
  
  // Dubai Hills
  "dubai-hills": [25.1050, 55.2400],
  "dubai-hills-estate": [25.1050, 55.2400],
  
  // Arabian Ranches
  "arabian-ranches": [25.0300, 55.2700],
  "arabian-ranches-3": [25.0250, 55.2800],
  
  // Dubai South
  "dubai-south": [24.9000, 55.1700],
  "expo-city": [24.9600, 55.1500],
  
  // Damac Hills & Lagoons
  "damac-hills": [25.0200, 55.2300],
  "damac-lagoons": [25.0100, 55.2400],
  
  // Al Marjan Island (RAK)
  "al-marjan-island": [25.7300, 55.7900],
  
  // Default Dubai center
  "default": [25.2048, 55.2708],
};

// Get coordinates for a project - prefer real lat/lng from database
const getProjectCoordinates = (project: Project): [number, number] => {
  // Use real coordinates if available
  if (project.latitude && project.longitude) {
    return [project.latitude, project.longitude];
  }
  
  // Fallback to community coordinates
  const communitySlug = project.community?.slug?.toLowerCase() || "";
  const location = project.location?.toLowerCase() || "";
  
  // Check community slug first
  if (COMMUNITY_COORDINATES[communitySlug]) {
    // Add small random offset to prevent markers stacking
    const offset = () => (Math.random() - 0.5) * 0.008;
    const coords = COMMUNITY_COORDINATES[communitySlug];
    return [coords[0] + offset(), coords[1] + offset()];
  }
  
  // Check location keywords
  for (const [key, coords] of Object.entries(COMMUNITY_COORDINATES)) {
    if (location.includes(key.replace(/-/g, " ")) || location.includes(key)) {
      const offset = () => (Math.random() - 0.5) * 0.008;
      return [coords[0] + offset(), coords[1] + offset()];
    }
  }
  
  // Default to Dubai center with offset
  const offset = () => (Math.random() - 0.5) * 0.05;
  return [25.2048 + offset(), 55.2708 + offset()];
};

// Custom marker icon
const createCustomIcon = (price: number | null) => {
  const priceText = price ? `${(price / 1000000).toFixed(1)}M` : "Ask";
  
  return new DivIcon({
    className: "custom-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%);
        color: #1a1a2e;
        padding: 6px 10px;
        border-radius: 20px;
        font-weight: bold;
        font-size: 12px;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 2px solid #fff;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        ${priceText}
      </div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });
};

// Format price
const formatPrice = (price: number | null) => {
  if (!price) return "Price on request";
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
  return `AED ${(price / 1000).toFixed(0)}K`;
};

// Map bounds fitter component
const MapBoundsFitter = ({ projects }: { projects: Project[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (projects.length > 0) {
      const coords = projects.map(p => getProjectCoordinates(p));
      const bounds = coords.reduce(
        (acc, coord) => ({
          minLat: Math.min(acc.minLat, coord[0]),
          maxLat: Math.max(acc.maxLat, coord[0]),
          minLng: Math.min(acc.minLng, coord[1]),
          maxLng: Math.max(acc.maxLng, coord[1]),
        }),
        { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
      );
      
      map.fitBounds([
        [bounds.minLat - 0.02, bounds.minLng - 0.02],
        [bounds.maxLat + 0.02, bounds.maxLng + 0.02],
      ]);
    }
  }, [projects, map]);
  
  return null;
};

const PropertyMap = () => {
  const { data: allProjects = [], isLoading } = useProjects();
  const { data: areas = [] } = useAreas();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showList, setShowList] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapLang, setMapLang] = useState<MapLang>("en");
  const t = mapTranslations[mapLang];
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [transactionType, setTransactionType] = useState<'all' | 'buy' | 'rent'>('all');
  
  // Get transaction type from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txn = params.get('transaction');
    if (txn === 'buy' || txn === 'rent') {
      setTransactionType(txn);
    }
  }, []);
  
  // Get unique developers
  const developers = useMemo(() => {
    const devSet = new Set<string>();
    allProjects.forEach(p => {
      if (p.developer?.name) devSet.add(p.developer.name);
    });
    return Array.from(devSet).sort();
  }, [allProjects]);
  
  // Filter projects
  const filteredProjects = useMemo(() => {
    return allProjects.filter(project => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = project.name.toLowerCase().includes(search);
        const matchesLocation = project.location?.toLowerCase().includes(search);
        const matchesDeveloper = project.developer?.name.toLowerCase().includes(search);
        const matchesCommunity = project.community?.name.toLowerCase().includes(search);
        if (!matchesName && !matchesLocation && !matchesDeveloper && !matchesCommunity) {
          return false;
        }
      }
      
      // Developer filter
      if (selectedDeveloper !== "all" && project.developer?.name !== selectedDeveloper) {
        return false;
      }
      
      // Area filter
      if (selectedArea !== "all") {
        const areaMatch = project.area_name?.toLowerCase() === selectedArea.toLowerCase() ||
                          project.location?.toLowerCase().includes(selectedArea.toLowerCase()) ||
                          project.community?.name?.toLowerCase() === selectedArea.toLowerCase();
        if (!areaMatch) return false;
      }
      
      // Bedrooms filter
      if (selectedBedrooms !== "all") {
        const beds = parseInt(selectedBedrooms);
        if (project.bedrooms_min && project.bedrooms_min > beds) return false;
        if (project.bedrooms_max && project.bedrooms_max < beds) return false;
      }
      
      // Price filter
      if (project.price_from && project.price_from > priceRange[1]) return false;
      if (project.price_to && project.price_to < priceRange[0]) return false;
      
      return true;
    });
  }, [allProjects, searchTerm, selectedDeveloper, selectedArea, selectedBedrooms, priceRange]);
  
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDeveloper("all");
    setSelectedArea("all");
    setSelectedBedrooms("all");
    setPriceRange([0, 50000000]);
    setTransactionType('all');
  };
  
  const hasActiveFilters = searchTerm || selectedDeveloper !== "all" || selectedArea !== "all" || selectedBedrooms !== "all" || priceRange[0] > 0 || priceRange[1] < 50000000 || transactionType !== 'all';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background relative ${mapLang === 'ar' ? 'direction-rtl' : ''}`} dir={mapLang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold hidden sm:block">{t.propertyMap}</h1>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {filteredProjects.length} {t.properties}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative hidden md:block">
              <Input
                placeholder={t.searchProjects}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-72 pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapLang(mapLang === 'en' ? 'ar' : 'en')}
              className="gap-1.5 shrink-0"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{mapLang === 'en' ? 'عربي' : 'EN'}</span>
            </Button>
            
            {/* Filters Sheet */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {t.filters}
                  {hasActiveFilters && (
                    <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{t.filterProperties}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.transactionType}</label>
                    <div className="flex gap-2">
                      {(['all', 'buy', 'rent'] as const).map((type) => (
                        <Button
                          key={type}
                          variant={transactionType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTransactionType(type)}
                          className="flex-1"
                        >
                          {type === 'all' ? t.all : type === 'buy' ? t.buy : t.rent}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Mobile Search */}
                  <div className="md:hidden space-y-2">
                    <label className="text-sm font-medium">{t.search}</label>
                    <Input
                      placeholder={t.searchProjects}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Developer */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.developer}</label>
                    <Select value={selectedDeveloper} onValueChange={setSelectedDeveloper}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.allDevelopers} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allDevelopers}</SelectItem>
                        {developers.map(dev => (
                          <SelectItem key={dev} value={dev}>{dev}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Area */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.area}</label>
                    <Select value={selectedArea} onValueChange={setSelectedArea}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.allAreas} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allAreas}</SelectItem>
                        {areas.map(area => (
                          <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Bedrooms */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t.bedrooms}</label>
                    <Select value={selectedBedrooms} onValueChange={setSelectedBedrooms}>
                      <SelectTrigger>
                        <SelectValue placeholder={t.any} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.any}</SelectItem>
                        <SelectItem value="0">{t.studio}</SelectItem>
                        <SelectItem value="1">1 {t.bedroom}</SelectItem>
                        <SelectItem value="2">2 {t.bedrooms_label}</SelectItem>
                        <SelectItem value="3">3 {t.bedrooms_label}</SelectItem>
                        <SelectItem value="4">4+ {t.bedrooms_label}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Price Range */}
                  <div className="space-y-4">
                    <label className="text-sm font-medium">{t.priceRange}</label>
                    <Slider
                      value={priceRange}
                      min={0}
                      max={50000000}
                      step={500000}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                  
                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      {t.clearAll}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* List Toggle */}
            <Button
              variant={showList ? "default" : "outline"}
              size="sm"
              onClick={() => setShowList(!showList)}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">{t.list}</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Map Container */}
      <div className="pt-14 h-screen">
        <MapContainer
          center={[25.2048, 55.2708]}
          zoom={11}
          scrollWheelZoom={true}
          touchZoom={true}
          dragging={true}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapNavigationControls latitude={25.2048} longitude={55.2708} />
          <MapBoundsFitter projects={filteredProjects} />
          
          {filteredProjects.map((project) => {
            const coords = getProjectCoordinates(project);
            return (
              <Marker
                key={project.id}
                position={coords}
                icon={createCustomIcon(project.price_from)}
                eventHandlers={{
                  click: () => setSelectedProject(project),
                }}
              >
                <Popup>
                  <div className="w-64 p-0">
                    {project.images?.[0] && (
                      <div className="relative h-32">
                        <SafeImage
                          src={project.images[0].image_url}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {project.developer?.name} • {project.community?.name || project.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">
                        {formatPrice(project.price_from)}
                      </span>
                      <Link to={`/project/${project.slug}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          {t.view} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      {/* List Panel */}
      {showList && (
        <div className="absolute top-14 right-0 bottom-0 w-full sm:w-96 bg-background/95 backdrop-blur-sm border-l z-[999] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">{filteredProjects.length} {t.properties}</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowList(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {project.images?.[0] && (
                      <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                        <SafeImage
                          src={project.images[0].image_url}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{project.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.developer?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.community?.name || project.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-primary">
                          {formatPrice(project.price_from)}
                        </span>
                        {project.bedrooms_min && (
                          <Badge variant="secondary" className="text-xs">
                            {project.bedrooms_min}-{project.bedrooms_max} BR
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Selected Project Detail Card */}
      {selectedProject && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-96 z-[1000]">
          <Card className="shadow-xl border-2">
            <CardContent className="p-0">
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
              
              {selectedProject.images?.[0] && (
                <div className="relative h-40">
                  <SafeImage
                    src={selectedProject.images[0].image_url}
                    alt={selectedProject.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                    {selectedProject.status || "Off-Plan"}
                  </Badge>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{selectedProject.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t.by} {selectedProject.developer?.name} • {selectedProject.community?.name || selectedProject.location}
                </p>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Bed className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      {selectedProject.bedrooms_min || "—"}-{selectedProject.bedrooms_max || "—"} BR
                    </p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Maximize className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      {selectedProject.size_min || "—"} sqft
                    </p>
                  </div>
                  <div className="text-center p-2 bg-muted rounded-lg">
                    <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">
                      {selectedProject.handover_date || "TBA"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t.startingFrom}</p>
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(selectedProject.price_from)}
                    </p>
                  </div>
                  <Link to={`/project/${selectedProject.slug}`}>
                    <Button className="gap-2">
                      {t.viewDetails}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;
