import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  FileText,
  Home,
  Image as ImageIcon,
  Layers,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Calculator,
  Building2,
  Bed,
  Maximize,
  Calendar,
  CreditCard,
  Star,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  UserPlus,
  Share2,
  HardHat,
  Video,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MortgageCalculator from "@/components/MortgageCalculator";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import ImageCarousel from "@/components/ImageCarousel";
import ConsultationRequestForm from "@/components/ConsultationRequestForm";
import { ProjectAIAnalyzer } from "@/components/project-detail/ProjectAIAnalyzer";
import PremiumBrochureCard from "@/components/project-detail/PremiumBrochureCard";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";
import ProjectBreadcrumb from "@/components/project-detail/ProjectBreadcrumb";
import CallToActionSection from "@/components/project-detail/CallToActionSection";
import FloorPlanGallery from "@/components/project-detail/FloorPlanGallery";
import UnitInventorySection from "@/components/project-detail/UnitInventorySection";
import ConstructionTimelineSection from "@/components/project-detail/ConstructionTimelineSection";
import ProjectMediaSection from "@/components/project-detail/ProjectMediaSection";
import InvestmentMetricsSection from "@/components/project-detail/InvestmentMetricsSection";
import DeveloperInfoCard from "@/components/project-detail/DeveloperInfoCard";
import QuickFactsBar from "@/components/project-detail/QuickFactsBar";
import PaymentPlanVisualization from "@/components/project-detail/PaymentPlanVisualization";
// DirectContactCTA is now rendered globally in MainLayout - do not import here
import MasterPlanSection from "@/components/project-detail/MasterPlanSection";
import HouseDetailsSection from "@/components/project-detail/HouseDetailsSection";
import DataFreshnessIndicator from "@/components/project-detail/DataFreshnessIndicator";
import RecommendedProjects from "@/components/project-detail/RecommendedProjects";
import ReportIssueButton from "@/components/project-detail/ReportIssueButton";
import AmenitiesWithPhotos from "@/components/project-detail/AmenitiesWithPhotos";
import PointsOfInterest from "@/components/project-detail/PointsOfInterest";
import ProjectLocationMap from "@/components/project-detail/ProjectLocationMap";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import { SectionDivider } from "@/components/ui/section-divider";
// Footer is now rendered globally in MainLayout - do not import here
import { CONTACT_INFO, getCallUrl, getEmailUrl, getWhatsAppUrl } from "@/constants/stats";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { SafeImage } from "@/components/SafeImage";
import { filterValidImages, getFirstValidImageUrl, getHighResImageUrl } from "@/lib/imageUtils";
import { formatPrice as formatPriceUtil } from "@/utils/formatNumber";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { formatDisplayDate } from "@/utils/formatDate";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type ProjectDetailData = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  location?: string | null;
  developer?: { 
    name: string; 
    slug?: string | null;
    logo_url?: string | null;
    founded_year?: number | null;
    completed_projects?: number | null;
    offplan_projects?: number | null;
    description?: string | null;
    headquarters?: string | null;
  } | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  size_min?: number | null;
  size_max?: number | null;
  floors?: number | null;
  handover_date?: string | null;
  payment_plan?: string | null;
  property_type_label?: string | null;
  status_label?: string | null;
  amenities?: string[] | null;
  images: { id: string; url: string; alt?: string | null }[];
  documents: { id: string; type: string; url: string; name?: string | null }[];
  // Mirroring fields
  usp_headline?: string | null;
  usp_bullets?: string[] | null;
  usp_image_url?: string | null;
  location_headline?: string | null;
  location_description?: string | null;
  location_distances?: Array<{ label: string; time: string }> | null;
  location_image_url?: string | null;
  floor_plan_types?: Array<{ label: string; pdfUrl?: string }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  payment_breakdown?: { down_payment?: string; during_construction?: string; on_completion?: string } | null;
  // Reelly-compatible fields
  unit_types?: Array<{
    type: string;
    size_from?: number;
    size_to?: number;
    price_from?: number;
    price_to?: number;
    available_units?: number;
    total_units?: number;
    status?: "available" | "limited" | "sold_out";
  }> | null;
  construction_progress?: number | null;
  construction_start_date?: string | null;
  expected_completion?: string | null;
  availability_status?: string | null;
  total_units?: number | null;
  available_units?: number | null;
  down_payment_percent?: number | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  roi_estimate?: number | null;
  rental_yield_estimate?: number | null;
  // House details
  service_charge?: string | null;
  finishing_standard?: string | null;
  ceiling_height?: string | null;
  // Master plan
  master_plan_image_url?: string | null;
  community_highlights?: string[] | null;
  // Data freshness
  updated_at?: string | null;
  import_source?: string | null;
  cover_image_url?: string | null;
  external_id?: string | null;
  area_name?: string | null;
};

interface ProjectDetailLayoutProps {
  project: ProjectDetailData;
  adminBar?: React.ReactNode;
  onRequestReport?: () => void;
  // showFooter is deprecated - footer is now rendered globally in MainLayout
  showFooter?: boolean;
}

const MIN_REASONABLE_PRICE_AED = 50_000;

// Google Maps API key removed - now using Leaflet with open tiles

// Sticky sub-nav tabs config - Reelly-style sections added
const SUB_NAV_TABS = [
  { id: "details", label: "Details", icon: FileText },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "units", label: "Units", icon: Bed },
  { id: "construction", label: "Progress", icon: HardHat },
  { id: "developer", label: "Developer", icon: Building2 },
  { id: "usp", label: "Highlights", icon: Star },
  { id: "floor-plans", label: "Floor Plans", icon: Layers },
  { id: "house-details", label: "Specs", icon: Home },
  { id: "amenities", label: "Amenities", icon: Building2 },
  { id: "media", label: "Media", icon: Video },
  { id: "location", label: "Location", icon: MapPin },
  { id: "master-plan", label: "Master Plan", icon: MapIcon },
  { id: "brochure", label: "Brochure", icon: Download },
  { id: "payment", label: "Payment Plan", icon: CreditCard },
  { id: "investment", label: "Investment", icon: TrendingUp },
  { id: "faq", label: "Useful info", icon: HelpCircle },
  { id: "ai", label: "AI Analyzer", icon: Sparkles },
  { id: "mortgage", label: "Mortgage", icon: Calculator },
] as const;

const normalizeDocType = (value: string) => value.toLowerCase().trim().replace(/[\s-]+/g, "_");

export default function ProjectDetailLayout({
  project,
  adminBar,
  onRequestReport,
  showFooter = true,
}: ProjectDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [captureDocType, setCaptureDocType] = useState<"brochure" | "floor_plan" | "payment_plan" | "images">("brochure");
  const [captureDocUrl, setCaptureDocUrl] = useState<string | undefined>();
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  
  const inquiryRef = useRef<HTMLDivElement>(null);
  const mortgageRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const brochureRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const floorPlansRef = useRef<HTMLDivElement>(null);
  const amenitiesRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const uspRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  // New Reelly-style section refs
  const unitsRef = useRef<HTMLDivElement>(null);
  const constructionRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const investmentRef = useRef<HTMLDivElement>(null);
  const developerRef = useRef<HTMLDivElement>(null);
  const houseDetailsRef = useRef<HTMLDivElement>(null);
  const masterPlanRef = useRef<HTMLDivElement>(null);

  const { isLeadCaptured } = useLeadCapture();

  // Show sticky nav after scrolling past hero
  useEffect(() => {
    const onScroll = () => {
      const heroHeight = window.innerHeight;
      setShowStickyNav(window.scrollY > heroHeight - 150);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Signal GlobalHeader to hide when sticky sub-nav is active
  useEffect(() => {
    if (showStickyNav) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [showStickyNav]);

  // Filter and normalize images (remove broken/placeholder URLs)
  const images = useMemo(() => {
    const raw = project.images?.filter((i) => i.url) || [];
    return filterValidImages(raw);
  }, [project.images]);
  // Fallback chain: project_images → cover_image_url → placeholder
  const heroImage = useMemo(() => {
    if (images[0]?.url) return { ...images[0], url: getHighResImageUrl(images[0].url!), alt: images[0].alt || project.name };
    if (project.cover_image_url) return { url: getHighResImageUrl(project.cover_image_url), alt: project.name };
    return undefined;
  }, [images, project.cover_image_url, project.name]);

  const brochureDocs = useMemo(
    () =>
      project.documents.filter((d) => {
        const t = normalizeDocType(d.type || "");
        return t === "brochure" || t.includes("brochure");
      }),
    [project.documents],
  );
  const paymentPlanDocs = useMemo(
    () =>
      project.documents.filter((d) => {
        const t = normalizeDocType(d.type || "");
        return t === "payment_plan" || t === "paymentplan" || (t.includes("payment") && t.includes("plan"));
      }),
    [project.documents],
  );
  const floorPlanDocs = useMemo(
    () =>
      project.documents.filter((d) => {
        const t = normalizeDocType(d.type || "");
        return t === "floor_plan" || t === "floorplan" || (t.includes("floor") && t.includes("plan"));
      }),
    [project.documents],
  );

  const visibleTabs = useMemo(() => {
    const hasGallery = images.length > 0;
    const hasUsp = (project.usp_bullets?.length ?? 0) > 0;
    const hasFloorPlans = floorPlanDocs.length > 0 || (project.floor_plan_types?.length ?? 0) > 0;
    const hasAmenities = (project.amenities?.length ?? 0) > 0;
    const hasPayment = !!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown || !!project.down_payment_percent;
    const hasUsefulInfo = (project.faqs?.length ?? 0) > 0;
    const hasBrochure = brochureDocs.length > 0;
    // Reelly-style sections
    const hasUnits = (project.unit_types?.length ?? 0) > 0;
    const hasConstruction = project.construction_progress !== null && project.construction_progress !== undefined;
    const hasMedia = !!project.video_url || !!project.virtual_tour_url;
    const hasInvestment = !!project.roi_estimate || !!project.rental_yield_estimate;
    const hasDeveloper = !!project.developer;
    const hasHouseDetails = !!project.floors || !!project.total_units || !!project.service_charge || !!project.finishing_standard;
    const hasMasterPlan = !!project.master_plan_image_url || (project.community_highlights?.length ?? 0) > 0;

    return SUB_NAV_TABS.filter((t) => {
      if (t.id === "gallery") return hasGallery;
      if (t.id === "usp") return hasUsp;
      if (t.id === "floor-plans") return hasFloorPlans;
      if (t.id === "amenities") return hasAmenities;
      if (t.id === "payment") return hasPayment;
      if (t.id === "faq") return hasUsefulInfo;
      if (t.id === "brochure") return true; // Always show brochure section
      if (t.id === "units") return hasUnits;
      if (t.id === "construction") return hasConstruction;
      if (t.id === "media") return hasMedia;
      if (t.id === "investment") return hasInvestment;
      if (t.id === "developer") return hasDeveloper;
      if (t.id === "house-details") return hasHouseDetails;
      if (t.id === "master-plan") return hasMasterPlan;
      return true;
    });
  }, [brochureDocs.length, floorPlanDocs.length, images.length, paymentPlanDocs.length, project.amenities, project.faqs, project.payment_breakdown, project.payment_plan, project.floor_plan_types, project.usp_bullets, project.unit_types, project.construction_progress, project.video_url, project.virtual_tour_url, project.roi_estimate, project.rental_yield_estimate, project.developer, project.floors, project.total_units, project.service_charge, project.finishing_standard, project.master_plan_image_url, project.community_highlights]);

  const whatsappMessage = `Hi, I'm interested in ${project.name}${project.location ? ` at ${project.location}` : ""}. Please share more details.`;

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToInquiry = () => scrollToRef(inquiryRef);
  const scrollToMortgage = () => scrollToRef(mortgageRef);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      details: detailsRef,
      gallery: galleryRef,
      usp: uspRef,
      "floor-plans": floorPlansRef,
      amenities: amenitiesRef,
      location: locationRef,
      brochure: brochureRef,
      payment: paymentRef,
      faq: faqRef,
      ai: aiRef,
      mortgage: mortgageRef,
      // Reelly-style sections
      units: unitsRef,
      construction: constructionRef,
      media: mediaRef,
      investment: investmentRef,
      developer: developerRef,
      "house-details": houseDetailsRef,
      "master-plan": masterPlanRef,
    };
    const targetRef = refMap[tabId];
    if (targetRef) scrollToRef(targetRef);
  };

  const handleDocumentDownload = (
    type: "brochure" | "floor_plan" | "payment_plan" | "images",
    url?: string,
    filename?: string,
  ) => {
    const resolvedUrl = url
      ? type === "images"
        ? url
        : maybeProxyStorageUrl(
            url,
            filename || `${project.name.replace(/\s+/g, "-")}-${type.replace(/_/g, "-")}.pdf`,
          )
      : undefined;

    if (isLeadCaptured && resolvedUrl) {
      // Force download via hidden <a> tag instead of opening in new tab
      const link = document.createElement("a");
      link.href = resolvedUrl;
      link.download = filename || "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setCaptureDocType(type);
    setCaptureDocUrl(resolvedUrl);
    setLeadCaptureOpen(true);
  };

  const mapQuery = `${project.name}${project.location ? `, ${project.location}` : ""}, Dubai, UAE`;
  const brochurePrimary = brochureDocs[0];
  const heroImageUrl = images[0]?.url;

  const paymentPlanBenefitHeadline = useMemo(() => {
    const raw = (project.payment_plan || "").trim();
    if (!raw) return null;
    // Only reframe when copy looks explicitly negative ("until YYYY handover")
    const hasUntilYear = /until\s*20\d{2}/i.test(raw);
    const hasHandover = /handover/i.test(raw);
    if (!hasUntilYear || !hasHandover) return null;

    const year = raw.match(/(20\d{2})/)?.[1] || project.handover_date?.match(/(20\d{2})/)?.[1];
    return year
      ? `Benefit from extended payment terms until ${year} handover`
      : "Benefit from extended payment terms";
  }, [project.handover_date, project.payment_plan]);

  // Helper: Derive bedroom range from unit_types array when min/max are null
  const deriveBedroomsFromUnitTypes = (unitTypes: ProjectDetailData['unit_types']): string | null => {
    if (!unitTypes || unitTypes.length === 0) return null;
    
    const types = unitTypes.map(u => u.type?.toLowerCase() || '');
    const hasStudio = types.some(t => t.includes('studio'));
    const brMatches = types.flatMap(t => {
      const match = t.match(/(\d+)\s*(?:br|bed|bedroom)/i);
      return match ? [parseInt(match[1])] : [];
    });
    
    if (brMatches.length === 0 && hasStudio) return 'Studio';
    if (brMatches.length === 0) return null;
    
    const minBr = Math.min(...brMatches);
    const maxBr = Math.max(...brMatches);
    
    if (hasStudio) return `Studio - ${maxBr} BR`;
    if (minBr === maxBr) return `${minBr} BR`;
    return `${minBr} - ${maxBr} BR`;
  };

  // Helper: Derive size range from unit_types array when min/max are null
  const deriveSizeFromUnitTypes = (unitTypes: ProjectDetailData['unit_types']): string | null => {
    if (!unitTypes || unitTypes.length === 0) return null;
    
    const sizes = unitTypes.flatMap(u => [u.size_from, u.size_to].filter(Boolean)) as number[];
    if (sizes.length === 0) return null;
    
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    if (minSize === maxSize) return `${minSize.toLocaleString()} sqft`;
    return `${minSize.toLocaleString()} - ${maxSize.toLocaleString()} sqft`;
  };

  // Format bedrooms text - prefer bedroom_types array if available
  const bedroomsText = useMemo(() => {
    // If bedroom_types array exists with labels, show those
    const bedroomTypes = (project as any).bedroom_types;
    if (bedroomTypes && Array.isArray(bedroomTypes) && bedroomTypes.length > 0) {
      return bedroomTypes.join(', ');
    }
    // Fallback to min/max
    if (!project.bedrooms_min) return null;
    if (project.bedrooms_min === project.bedrooms_max) return `${project.bedrooms_min} BR`;
    return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
  }, [project.bedrooms_min, project.bedrooms_max, (project as any).bedroom_types]);

  // Format size text
  const sizeText = useMemo(() => {
    if (!project.size_min) return null;
    if (project.size_min === project.size_max) return `${project.size_min.toLocaleString()} sqft`;
    return `${project.size_min.toLocaleString()} - ${project.size_max?.toLocaleString()} sqft`;
  }, [project.size_min, project.size_max]);

  return (
    <>
      {/* HERO SECTION - Full Screen */}
      <section className="relative w-full h-screen min-h-[700px] -mt-24 xl:-mt-28">
        <div className="absolute inset-0">
          {heroImage?.url ? (
            <SafeImage
              src={heroImage.url}
              alt={heroImage.alt || project.name}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              fallbackSrc="/placeholder.svg"
            />
          ) : (
            <div className="w-full h-full bg-premium-bg" />
          )}
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Sold Out Badge - Top Right */}
        {(project.status_label?.toLowerCase().includes('sold') || 
          project.availability_status?.toLowerCase().includes('sold')) && (
          <div className="absolute top-36 right-4 md:right-8 z-30">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg text-lg font-bold uppercase shadow-2xl border-2 border-red-400 animate-pulse">
              SOLD OUT
            </div>
          </div>
        )}

        {/* Hero content - Bottom aligned */}
        <div className="relative z-20 container mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-8">
          {/* Starting Price - Above title */}
          {typeof project.price_from === "number" && (
            <p className="text-lg md:text-xl text-white/80 mb-2">
              Starting from <span className="text-gold font-bold text-2xl md:text-3xl">{formatPriceUtil(project.price_from)}</span>
            </p>
          )}

          {/* Project Title - BIGGER */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-4">
            {project.name}
          </h1>

          {/* Developer */}
          {project.developer?.name && (
            <p className="text-lg text-white/70 mb-6">
              by{" "}
              {project.developer?.slug ? (
                <Link to={`/developer/${project.developer.slug}`} className="text-gold hover:underline font-medium">
                  {project.developer.name}
                </Link>
              ) : (
                <span className="text-gold font-medium">{project.developer.name}</span>
              )}
            </p>
          )}

          {/* USPs Row - Location, Bedrooms, Size, Handover, Payment Plan */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8">
            {project.location && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-5 h-5 text-gold" />
                <span className="text-sm md:text-base">{project.location}</span>
              </div>
            )}
            {bedroomsText && (
              <div className="flex items-center gap-2 text-white/90">
                <Bed className="w-5 h-5 text-gold" />
                <span className="text-sm md:text-base">{bedroomsText}</span>
              </div>
            )}
            {sizeText && (
              <div className="flex items-center gap-2 text-white/90">
                <Maximize className="w-5 h-5 text-gold" />
                <span className="text-sm md:text-base">{sizeText}</span>
              </div>
            )}
            {project.handover_date && (
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-5 h-5 text-gold" />
                <span className="text-sm md:text-base">{formatDisplayDate(project.handover_date)}</span>
              </div>
            )}
          </div>

          {/* Hero CTAs - Download Brochure + Register Interest */}
          <div className="flex flex-wrap gap-4">
            {brochurePrimary && (
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => handleDocumentDownload("brochure", brochurePrimary.url)}
                className="hover:shadow-[0_14px_45px_rgba(200,167,102,0.35)] hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-5 h-5" />
                Download Brochure
              </Button>
            )}
            <Button 
              variant="primary" 
              size="lg"
              onClick={scrollToInquiry}
            >
              Register Interest
            </Button>
          </div>

          {/* Breadcrumb Navigation */}
          <ProjectBreadcrumb projectName={project.name} location={project.location} />
        </div>
      </section>

      {adminBar}

      {/* STICKY SUB-NAVIGATION - Two rows: Search + Shortcuts */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
          showStickyNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Row 1: Filter Shortcut Bar */}
        <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-2 px-4">
          <div className="container mx-auto">
            <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
          </div>
        </div>

        {/* Row 2: Curated Shortcuts */}
        <div className="bg-gradient-to-r from-[#EDE0C8] via-[#E2D4B8] to-[#D4C4A8] border-b border-gold/30 shadow-md">
          <div className="container mx-auto px-4">
            <div className="overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-y', overscrollBehaviorX: 'contain' }}>
              <div className="flex items-center gap-1 py-1.5">
                {[
                  { id: "details", label: "Details", icon: FileText },
                  { id: "gallery", label: "Gallery", icon: ImageIcon },
                  { id: "developer", label: "Developer", icon: Building2 },
                  { id: "location", label: "Location", icon: MapPin },
                  { id: "brochure", label: "Brochure", icon: Download },
                  { id: "ai", label: "AI Analyzer", icon: Sparkles },
                  { id: "mortgage", label: "Mortgage", icon: Calculator },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap min-w-fit transition-all ${
                      activeTab === tab.id
                        ? "bg-gold/20 text-gold border border-gold/40"
                        : "text-black/70 hover:text-gold hover:bg-gold/10"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
                {/* Register Interest - Highlighted Gold CTA */}
                <button
                  onClick={scrollToInquiry}
                  className="flex items-center gap-1.5 ml-auto px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap min-w-fit transition-all bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#D4C4A8] text-black border-2 border-gold/50 hover:brightness-105"
                  style={{ boxShadow: '0 0 15px rgba(200,167,102,0.3)' }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Interest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="jj-section-champagne" style={{ background: 'linear-gradient(135deg, #EDE0C8 0%, #E2D4B8 50%, #D4C4A8 100%)' }}>
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16" style={{ margin: '0 auto', border: 'none', borderRadius: 0, background: 'transparent' }}>
          {/* Quick Stats Grid - Premium gold border visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Starting Price</p>
              <p className="mt-2 text-xl font-bold text-gold">
                {typeof project.price_from === "number" && project.price_from > 0 
                  ? formatPriceUtil(project.price_from) 
                  : "Price TBA"}
              </p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Handover</p>
              <p className="mt-2 text-xl font-bold text-foreground">{formatDisplayDate(project.handover_date) || "TBA"}</p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Bedrooms</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {bedroomsText || deriveBedroomsFromUnitTypes(project.unit_types) || "TBA"}
              </p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Size</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {sizeText || deriveSizeFromUnitTypes(project.unit_types) || "TBA"}
              </p>
            </div>
          </div>

          {/* QUICK FACTS BAR - Reelly-style horizontal bar */}
          <div className="mb-12">
            <QuickFactsBar
              propertyType={project.property_type_label}
              totalUnits={project.total_units}
              floors={project.floors && project.floors > 3 ? project.floors : undefined}
              availabilityStatus={project.availability_status}
              statusLabel={project.status_label}
              handoverDate={project.handover_date}
              updatedAt={project.updated_at}
            />
          </div>

          {/* DATA FRESHNESS INDICATOR */}
          {(project.updated_at || project.import_source) && (
            <div className="mb-8 flex justify-end">
              <DataFreshnessIndicator
                updatedAt={project.updated_at}
                importSource={project.import_source}
                externalId={project.external_id}
              />
            </div>
          )}

          {/* DETAILS SECTION */}
          <div ref={detailsRef} id="details" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <h2 className="text-h3 font-medium text-foreground">About {project.name}</h2>
              {project.description ? (
                <>
                  <div className={`mt-4 relative ${!isDescriptionExpanded && (project.description?.length ?? 0) > 500 ? 'max-h-48 overflow-hidden' : ''}`}>
                    <div 
                      className="text-body text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(formatReellyDescription(project.description || '')) 
                      }}
                    />
                    {!isDescriptionExpanded && (project.description?.length ?? 0) > 500 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                    )}
                  </div>
                  {(project.description?.length ?? 0) > 500 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="flex items-center gap-1 text-gold text-sm font-medium mt-3 hover:underline"
                    >
                      {isDescriptionExpanded ? (
                        <><ChevronUp className="w-4 h-4" /> Show Less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Read More</>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="mt-4 text-body text-muted-foreground">
                  Details will be provided by our team.
                </p>
              )}
            </div>
          </div>

           {/* GALLERY SECTION */}
           {images.length > 0 && (
             <div ref={galleryRef} id="gallery" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-h3-sm font-medium text-foreground">Project Gallery</h3>
                   <Button
                     variant="primary"
                     size="sm"
                     onClick={() => handleDocumentDownload("images", images[0]?.url)}
                   >
                     <Download className="w-4 h-4" />
                     Download Images
                   </Button>
                 </div>
                 <ImageCarousel
                   images={images.map((img) => ({
                     id: img.id,
                     image_url: img.url,
                     alt_text: img.alt ?? null,
                   }))}
                   projectName={project.name}
                 />
               </div>
             </div>
           )}

           {/* UNIT TYPES & INVENTORY SECTION (Reelly-style) */}
           {(project.unit_types?.length ?? 0) > 0 && (
             <div ref={unitsRef} id="units" className="mb-12 scroll-mt-40">
               <UnitInventorySection
                 unitTypes={project.unit_types || []}
                 totalUnits={project.total_units}
                 availableUnits={project.available_units}
                 projectName={project.name}
               />
             </div>
           )}

           {/* CONSTRUCTION TIMELINE SECTION (Reelly-style) */}
           {(project.construction_progress !== null && project.construction_progress !== undefined) && (
             <div ref={constructionRef} id="construction" className="mb-12 scroll-mt-40">
               <ConstructionTimelineSection
                 constructionProgress={project.construction_progress}
                 constructionStartDate={project.construction_start_date}
                 expectedCompletion={project.expected_completion}
                 handoverDate={project.handover_date}
                 projectName={project.name}
               />
             </div>
           )}

           {/* DEVELOPER INFO SECTION (Reelly-style) */}
           {project.developer && (
             <div ref={developerRef} id="developer" className="mb-12 scroll-mt-40">
               <DeveloperInfoCard
                 developer={project.developer}
                 projectName={project.name}
               />
             </div>
           )}

           {/* UNIQUE SELLING POINTS (USP/Highlights) SECTION */}
           {(project.usp_bullets?.length ?? 0) > 0 && (
             <div ref={uspRef} id="usp" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                  <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-gold" />
                    Unique Selling Points
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* USP Image - fallback to first gallery image if no USP image */}
                  {(project.usp_image_url || images[0]?.url) && (
                    <div className="rounded-xl overflow-hidden border border-gold/30">
                      <SafeImage 
                        src={project.usp_image_url || images[0]?.url || ""} 
                        alt={`${project.name} Highlights`} 
                        className="w-full h-[300px] object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                    </div>
                  )}
                  <div className={(project.usp_image_url || images[0]?.url) ? "" : "lg:col-span-2"}>
                    {project.usp_headline && (
                      <h4 className="text-lg font-semibold text-foreground mb-4">{project.usp_headline}</h4>
                    )}
                    <ul className="space-y-3">
                      {project.usp_bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Star className="w-3.5 h-3.5 text-gold" />
                          </span>
                          <span className="text-foreground">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="mt-6"
                      onClick={scrollToInquiry}
                    >
                      <ArrowRight className="w-4 h-4" />
                      Find Out More
                    </Button>
                  </div>
                  </div>
                </div>
              </div>
           )}

           {/* HOUSE DETAILS SECTION (Reelly-style) */}
           {(project.floors || project.total_units || project.service_charge || project.finishing_standard) && (
             <div ref={houseDetailsRef} id="house-details" className="mb-12 scroll-mt-40">
               <HouseDetailsSection
                 floors={project.floors}
                 totalUnits={project.total_units}
                 buildingType={project.property_type_label}
                 ceilingHeight={project.ceiling_height}
                 finishingStandard={project.finishing_standard}
                 serviceCharge={project.service_charge}
                 projectName={project.name}
               />
             </div>
           )}

           {/* FLOOR PLANS SECTION */}
           {(floorPlanDocs.length > 0 || (project.floor_plan_types?.length ?? 0) > 0) && (
             <div ref={floorPlansRef} id="floor-plans" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                 <h3 className="text-h3-sm font-medium text-foreground">Floor Plans</h3>
                 <div className="mt-6">
                   <FloorPlanGallery
                     floorPlanTypes={project.floor_plan_types ?? null}
                     floorPlanDocs={floorPlanDocs}
                     projectName={project.name}
                     onDownload={(_, url) => handleDocumentDownload("floor_plan", url)}
                     brochureUrl={brochurePrimary?.url}
                     onDownloadBrochure={(url) => handleDocumentDownload("brochure", url)}
                   />
                 </div>
               </div>
             </div>
           )}

           {/* AMENITIES SECTION - Premium with Icons */}
           {(project.amenities?.length ?? 0) > 0 && (
              <div ref={amenitiesRef} id="amenities" className="mb-12 scroll-mt-40">
                <div className="jj-card-inner">
                   <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                     <Building2 className="w-5 h-5 text-gold" />
                     Amenities & Features
                   </h3>
                   <AmenitiesWithPhotos amenities={project.amenities!} />
                 </div>
               </div>
              )}

           {/* PROJECT MEDIA SECTION (Reelly-style) */}
           {(project.video_url || project.virtual_tour_url) && (
             <div ref={mediaRef} id="media" className="mb-12 scroll-mt-40">
               <ProjectMediaSection
                 videoUrl={project.video_url}
                 virtualTourUrl={project.virtual_tour_url}
                 projectName={project.name}
               />
             </div>
           )}

          {/* LOCATION MAP - Full Width */}
          <div ref={locationRef} id="location" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-gold" />
                  Project Location
                </h3>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-4 h-4" />
                    Open in Maps
                  </Button>
                </a>
              </div>

              {/* Location Headline & Description */}
              {(project.location_headline || project.location_description) && (
                <div className="mb-6">
                  {project.location_headline && (
                    <h4 className="text-lg font-semibold text-foreground mb-2">{project.location_headline}</h4>
                  )}
                  {project.location_description && (
                    <div 
                      className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(project.location_description) 
                      }}
                    />
                  )}
                </div>
              )}

              {/* Location Image */}
              {project.location_image_url && (
                <div className="mb-6 rounded-xl overflow-hidden border border-gold/30">
                  <SafeImage 
                    src={project.location_image_url} 
                    alt={`${project.name} Location`} 
                    className="w-full h-[250px] object-cover"
                    fallbackSrc="/placeholder.svg"
                  />
                </div>
              )}

              {/* Leaflet Map with satellite view, navigation, and view toggle */}
              <ProjectLocationMap
                projectName={project.name}
                location={project.location}
                latitude={null}
                longitude={null}
              />

              {/* Nearby Points of Interest - Below Map */}
              {project.location_distances && project.location_distances.length > 0 && (
                <div className="mt-6">
                  <PointsOfInterest points={project.location_distances} />
                </div>
              )}
            </div>
          </div>

          {/* MASTER PLAN SECTION (Reelly-style) */}
          {(project.master_plan_image_url || (project.community_highlights?.length ?? 0) > 0) && (
            <div ref={masterPlanRef} id="master-plan" className="mb-12 scroll-mt-40">
              <MasterPlanSection
                masterPlanImageUrl={project.master_plan_image_url}
                communityHighlights={project.community_highlights}
                projectName={project.name}
              />
            </div>
          )}

          {/* AI ANALYZER SECTION */}
          <div ref={aiRef} id="ai" className="mb-12 scroll-mt-40">
            <ProjectAIAnalyzer
              projectName={project.name}
              areaName={project.area_name || project.location || "Dubai"}
              developer={project.developer?.name}
              developerSlug={project.developer?.slug}
              priceFrom={project.price_from ?? undefined}
              handoverDate={project.handover_date ?? undefined}
              amenities={project.amenities ?? undefined}
            />
          </div>

          {/* DLD MARKET INTELLIGENCE */}
          <SectionDivider variant="champagne" />
          <DLDMarketWidget />

          {/* BROCHURE - Full width two-column layout - Always visible */}
          <div ref={brochureRef} id="brochure" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Left: Description */}
                <div>
                  <h3 className="text-h3-sm font-medium text-foreground mb-4">Project Brochure</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {brochurePrimary 
                      ? `Download the complete brochure for ${project.name} to explore detailed floor plans, pricing, payment options, and lifestyle amenities. Perfect for offline viewing and sharing.`
                      : `Request the exclusive brochure for ${project.name} with detailed floor plans, pricing, and lifestyle amenities. Our team will share it with you directly.`
                    }
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold" /> Full floor plan layouts
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold" /> Detailed specifications
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gold" /> Payment plan breakdown
                    </li>
                  </ul>
                  {/* Request Brochure button removed - only Unlock Brochure on the card */}
                </div>
                {/* Right: Brochure card */}
                <div className="flex justify-center">
                  <PremiumBrochureCard
                    projectName={project.name}
                    brochureUrl={brochurePrimary?.url}
                    projectImageUrl={project.images?.[0]?.url || undefined}
                    onDownloadClick={() => brochurePrimary 
                      ? handleDocumentDownload("brochure", brochurePrimary?.url)
                      : setLeadCaptureOpen(true)
                    }
                    isLocked={!brochurePrimary || (!isLeadCaptured && !!brochurePrimary)}
                    location={project.area_name ? `${project.area_name} • Dubai` : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

           {/* PAYMENT PLAN VISUALIZATION (Reelly-style enhanced) */}
           {(!!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown) && (
           <div ref={paymentRef} id="payment" className="mb-16 scroll-mt-40">
             <PaymentPlanVisualization
               paymentPlan={project.payment_plan}
               paymentBreakdown={project.payment_breakdown}
               handoverDate={project.handover_date}
               downPaymentPercent={project.down_payment_percent}
               projectName={project.name}
             />
             
             {/* Payment Plan Documents - still show if available */}
             {paymentPlanDocs.length > 0 && (
               <div className="mt-6 space-y-3">
                 {paymentPlanDocs.map((doc) => (
                   <button
                     key={doc.id}
                     onClick={() => handleDocumentDownload("payment_plan", doc.url)}
                     className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-card p-4 hover:border-gold/60 transition-colors w-full text-left"
                   >
                     <div className="min-w-0">
                       <p className="text-sm font-semibold text-foreground truncate">{doc.name || "Payment Plan"}</p>
                       <p className="text-xs text-muted-foreground truncate">Click to download</p>
                     </div>
                     <Download className="w-5 h-5 text-gold flex-shrink-0" />
                   </button>
                 ))}
               </div>
             )}
            </div>
            )}

           {/* REPORT AN ISSUE BANNER */}
           <div className="mb-12">
             <ReportIssueButton
               projectName={project.name}
               projectId={project.id}
               projectSlug={project.slug || undefined}
             />
           </div>

           {/* INVESTMENT METRICS SECTION (Reelly-style) */}
           {(project.roi_estimate || project.rental_yield_estimate) && (
             <div ref={investmentRef} id="investment" className="mb-12 scroll-mt-40">
               <InvestmentMetricsSection
                 roiEstimate={project.roi_estimate}
                 rentalYieldEstimate={project.rental_yield_estimate}
                 priceFrom={project.price_from}
                 projectName={project.name}
                 onContactClick={scrollToInquiry}
               />
             </div>
           )}

           {/* USEFUL INFO SECTION */}
           {(project.faqs?.length ?? 0) > 0 && (
             <div ref={faqRef} id="faq" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                 <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                   <HelpCircle className="w-5 h-5 text-gold" />
                   Useful information about {project.name}
                 </h3>
                 <Accordion type="single" collapsible className="w-full">
                   {project.faqs!.map((faq, idx) => (
                     <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-border">
                       <AccordionTrigger className="text-left text-foreground py-4">
                         {faq.question}
                       </AccordionTrigger>
                       <AccordionContent className="text-muted-foreground pb-4">
                         {faq.answer}
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
               </div>
             </div>
           )}

          {/* MORTGAGE CALCULATOR - Full Width with more spacing */}
          <div ref={mortgageRef} className="mb-20 scroll-mt-32">
            <div className="jj-card-inner p-0 overflow-hidden">
              <MortgageCalculator
                defaultPrice={project.price_from ?? 2000000}
                compact={false}
                context={{ projectName: project.name, location: project.location || undefined }}
                showAssistant
              />
            </div>
          </div>

          {/* INQUIRY FORM - Full Width with premium styling - Uses Contact Page Form */}
          <div ref={inquiryRef} className="scroll-mt-32 mb-8">
            <div className="jj-card-inner p-8 md:p-10 border-2 border-gold/40 bg-gradient-to-br from-champagne/50 via-champagne-light/30 to-champagne/50">
              <ConsultationRequestForm
                title={`Register Interest in ${project.name}`}
                subtitle={`Get expert guidance on ${project.name}${project.location ? ` at ${project.location}` : ''}. Our specialists are ready to assist you.`}
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          </div>


          {/* CallToAction removed - consolidated into ConsultationRequestForm above */}
        </div>
      </section>

      {/* Recommended Projects */}
      <RecommendedProjects
        currentProjectId={project.id}
        currentDeveloperId={(project.developer as any)?.id || null}
        currentLocation={project.location}
        currentEmirate={(project as any).emirate || null}
      />

      {/* DirectContactCTA is now rendered globally in MainLayout - removed duplicate */}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadCaptureOpen}
        onOpenChange={setLeadCaptureOpen}
        projectId={project.id}
        projectName={project.name}
        documentType={captureDocType}
        documentUrl={captureDocUrl}
      />

      {/* Footer is now rendered globally in MainLayout - removed duplicate */}
    </>
  );
}
