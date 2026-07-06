import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";

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
  Check,
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
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import PremiumBrochureCard from "@/components/project-detail/PremiumBrochureCard";
import GeneratePresentationCard from "@/components/project-detail/GeneratePresentationCard";
import BookStyleDocuments from "@/components/project-detail/BookStyleDocuments";
import InlineEditable from "@/components/project-detail/owner/InlineEditable";
import OwnerDocDropzone from "@/components/project-detail/owner/OwnerDocDropzone";
import OwnerImageManager from "@/components/project-detail/owner/OwnerImageManager";
import HeroImagePicker from "@/components/project-detail/owner/HeroImagePicker";

import OwnerSectionEditor from "@/components/project-detail/owner/OwnerSectionEditor";
import { ProjectEditModeProvider, useProjectEditMode } from "@/contexts/ProjectEditModeContext";
import { Pencil as PencilIcon, PencilOff } from "lucide-react";
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
import PaymentPlanVerificationToggle from "@/components/project-detail/PaymentPlanVerificationToggle";

// DirectContactCTA is now rendered globally in MainLayout - do not import here
import MasterPlanSection from "@/components/project-detail/MasterPlanSection";
import HouseDetailsSection from "@/components/project-detail/HouseDetailsSection";
import DataFreshnessIndicator from "@/components/project-detail/DataFreshnessIndicator";
import OwnerProvenanceCard from "@/components/project-detail/owner/OwnerProvenanceCard";
import AIEnrichDialog from "@/components/project-detail/owner/AIEnrichDialog";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import RecommendedProjects from "@/components/project-detail/RecommendedProjects";
import ReportIssueButton from "@/components/project-detail/ReportIssueButton";
import AmenitiesWithPhotos from "@/components/project-detail/AmenitiesWithPhotos";
import PointsOfInterest from "@/components/project-detail/PointsOfInterest";
import ProjectLocationMap from "@/components/project-detail/ProjectLocationMap";

import MoreFromDeveloperStrip from "@/components/project-detail/MoreFromDeveloperStrip";
import DLDMarketWidget from "@/components/shared/DLDMarketWidget";
import BuyerNationalityInsights from "@/components/project-detail/BuyerNationalityInsights";
import { SectionDivider } from "@/components/ui/section-divider";
import { SectionDividerGoldFullBleed } from "@/components/ui/section-divider-gold-fullbleed";

import { recordProjectView, peekBackStack, popBackStack, type BackStackEntry } from "@/lib/browsingHistory";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// Footer is now rendered globally in MainLayout - do not import here
import { CONTACT_INFO, getCallUrl, getEmailUrl, getWhatsAppUrl } from "@/constants/stats";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { SafeImage } from "@/components/SafeImage";
import { filterValidImages, getFirstValidImageUrl, getHighResImageUrl } from "@/lib/imageUtils";
import { useCurrency } from "@/hooks/useCurrency";
import { useAreaUnit } from "@/hooks/useAreaUnit";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { formatDisplayDate } from "@/utils/formatDate";
import { getProjectStatus } from "@/utils/projectStatus";
// OwnerVisitorToggle removed — Mode switcher drives Owner/Visitor view
// BrokerBrandedMaterialsCard removed — replaced by inline branded-presentation download
import { useUserMode } from "@/hooks/useUserMode";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { deriveHandover, HANDOVER_FALLBACK } from "@/utils/handoverDerivation";
import BrandedDeckCaptureDialog from "@/components/project-detail/BrandedDeckCaptureDialog";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ProjectNearbyPropertiesMap = lazy(() => import("@/components/project-detail/ProjectNearbyPropertiesMap"));

export type ProjectDetailData = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  location?: string | null;
  developer?: { 
    id?: string | null;
    name: string; 
    slug?: string | null;
    logo_url?: string | null;
    founded_year?: number | null;
    completed_projects?: number | null;
    offplan_projects?: number | null;
    description?: string | null;
    headquarters?: string | null;
    website_url?: string | null;
    ceo_name?: string | null;
    total_units_delivered?: number | null;
    notable_projects?: string | null;
    specialization?: string | null;
  } | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  bedroom_types?: string[] | null;
  size_min?: number | null;
  size_max?: number | null;
  built_up_area?: string | null;
  floors?: number | null;
  handover_date?: string | null;
  payment_plan?: string | null;
  property_type_label?: string | null;
  status_label?: string | null;
  amenities?: string[] | null;
  amenity_images?: Record<string, string> | null;
  images: { id: string; url: string; alt?: string | null }[];
  documents: { id: string; type: string; url: string; name?: string | null; display_title?: string | null; cover_image_url?: string | null; is_visible?: boolean | null; allow_download?: boolean | null }[];
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
  payment_breakdown?: { down_payment?: string; during_construction?: string; on_completion?: string } | Array<{ milestone: string; percentage: number; timing?: string; amount?: number | null; stage_type?: string }> | null;
  payment_plan_verified?: boolean | null;
  payment_plan_verified_at?: string | null;

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
  // Coordinates
  latitude?: number | null;
  longitude?: number | null;
  // Sale status
  sale_status?: string | null;
  emirate?: string | null;
  construction_status?: string | null;
  availability_visible?: boolean | null;
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

export default function ProjectDetailLayout(props: ProjectDetailLayoutProps) {
  return (
    <ProjectEditModeProvider>
      <ProjectDetailLayoutInner {...props} />
    </ProjectEditModeProvider>
  );
}

function ProjectDetailLayoutInner({
  project,
  adminBar,
  onRequestReport,
  showFooter = true,
}: ProjectDetailLayoutProps) {
  const { editMode: projectEditMode, toggle: toggleProjectEditMode } = useProjectEditMode();
  const { formatPrice: formatPriceUtil } = useCurrency();
  const { formatSize, convertSize, unitLabel } = useAreaUnit();
  const [activeTab, setActiveTab] = useState("details");
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [brandedDeckBusy, setBrandedDeckBusy] = useState(false);
  const [brandCaptureOpen, setBrandCaptureOpen] = useState(false);
  const [captureDocType, setCaptureDocType] = useState<"brochure" | "floor_plan" | "payment_plan" | "images">("brochure");
  const [captureDocUrl, setCaptureDocUrl] = useState<string | undefined>();
  const [showStickyNav, setShowStickyNav] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const { isOwner } = useIsAppOwner();
  const [paymentEnrichOpen, setPaymentEnrichOpen] = useState(false);
  const { isBrokerMode } = useUserMode();
  const { user } = useAuth();
  const [brokerHasBrand, setBrokerHasBrand] = useState(false);
  useEffect(() => {
    if (!isBrokerMode || !user?.id) {
      setBrokerHasBrand(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("crm_brokers")
        .select("logo_url, headshot_url, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        setBrokerHasBrand(Boolean(data?.logo_url || data?.headshot_url));
      }
    })();
    return () => { cancelled = true; };
  }, [isBrokerMode, user?.id]);
  
  
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

  // Scroll-spy: track which section is in view and update activeTab
  // Uses a deterministic "highest ratio + closest to top" approach to prevent stuck tabs
  const tabNavRef = useRef<HTMLDivElement>(null);
  const sectionRatios = useRef<Map<string, { ratio: number; top: number }>>(new Map());
  useEffect(() => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      details: detailsRef, gallery: galleryRef, usp: uspRef,
      "floor-plans": floorPlansRef, amenities: amenitiesRef,
      location: locationRef, brochure: brochureRef, payment: paymentRef,
      faq: faqRef, ai: aiRef, mortgage: mortgageRef,
      units: unitsRef, construction: constructionRef, media: mediaRef,
      investment: investmentRef, developer: developerRef,
      "house-details": houseDetailsRef, "master-plan": masterPlanRef,
    };
    const entries = Object.entries(refMap);
    const observer = new IntersectionObserver(
      (observed) => {
        // Update ratios map for every entry change
        for (const entry of observed) {
          const match = entries.find(([, ref]) => ref.current === entry.target);
          if (match) {
            if (entry.isIntersecting && entry.intersectionRatio > 0) {
              sectionRatios.current.set(match[0], {
                ratio: entry.intersectionRatio,
                top: entry.boundingClientRect.top,
              });
            } else {
              sectionRatios.current.delete(match[0]);
            }
          }
        }
        // Pick the best: highest ratio, then closest to top of viewport as tiebreaker
        let bestId: string | null = null;
        let bestRatio = -1;
        let bestTop = Infinity;
        sectionRatios.current.forEach((val, id) => {
          if (val.ratio > bestRatio || (val.ratio === bestRatio && Math.abs(val.top) < Math.abs(bestTop))) {
            bestRatio = val.ratio;
            bestTop = val.top;
            bestId = id;
          }
        });
        if (bestId) {
          setActiveTab(bestId);
          const btn = tabNavRef.current?.querySelector(`[data-tab="${bestId}"]`) as HTMLElement;
          btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.1, 0.25, 0.4, 0.6, 0.8] }
    );
    entries.forEach(([, ref]) => { if (ref.current) observer.observe(ref.current); });
    return () => observer.disconnect();
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

  // Persist this view to browsing history (localStorage + per-user table when signed in)
  useEffect(() => {
    if (!project?.id) return;
    recordProjectView({
      id: project.id,
      slug: project.slug ?? undefined,
      name: project.name,
      developer_name: project.developer?.name ?? undefined,
      area_name: project.area_name ?? null,
      cover_image_url: project.cover_image_url ?? null,
    });
    // Feed the recommendation engine: developer + area weighting (item #11).
    try {
      (window as any).__jbjTrackBrowsing?.(
        project.area_name ?? undefined,
        "offplan",
        project.developer?.name ?? undefined,
      );
    } catch { /* noop */ }
  }, [project.id, project.slug, project.name]);

  // "Return to previous project" chip — only when arrived from another project's nearby map
  const navigateBackTo = useNavigate();
  const [previousProject, setPreviousProject] = useState<BackStackEntry | null>(null);
  useEffect(() => {
    setPreviousProject(peekBackStack(project.slug ?? null));
  }, [project.slug]);
  const handleReturnToPrevious = () => {
    const prev = popBackStack();
    if (prev?.slug) navigateBackTo(`/project/${prev.slug}`);
    setPreviousProject(null);
  };

  // Filter and normalize images (remove broken/placeholder URLs)
  const images = useMemo(() => {
    const raw = project.images?.filter((i) => i.url) || [];
    // Dedup + validate, then upgrade every URL to its highest-res variant
    // so the gallery never renders a low-res thumbnail next to its hi-res twin.
    return filterValidImages(raw).map((img) => ({
      ...img,
      url: getHighResImageUrl(img.url!),
    }));
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
        const n = normalizeDocType(d.name || "");
        return t === "brochure" || t === "factsheet" || t === "fact_sheet" || t.includes("brochure") || n.includes("brochure") || n.includes("fact_sheet") || n.includes("factsheet");
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
    const hasConstruction = true; // Always show construction section
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
    if (!ref.current) return;
    // Use offset-aware scrolling to avoid content hiding under sticky headers
    const headerOffset = 160; // 48px utility bar + 48px filter bar + 64px breathing room
    const elementTop = ref.current.getBoundingClientRect().top + window.scrollY;
    const targetTop = Math.max(0, elementTop - headerOffset);
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    window.scrollTo({ top: targetTop, behavior: prefersReduced ? "auto" : "smooth" });
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

  const handleDocumentDownload = async (
    type: "brochure" | "floor_plan" | "payment_plan" | "images",
    url?: string,
    filename?: string,
  ) => {
    const niceName =
      filename ||
      `${project.name.replace(/\s+/g, "-")}-${type.replace(/_/g, "-")}.${type === "images" ? "jpg" : "pdf"}`;

    // Force ANY external/CDN/storage doc through our backend download-file
    // proxy so Chrome never shows the cross-origin "download blocked" page.
    // (Images keep their direct CDN URL for fast inline use.)
    const { proxyAnyDownloadUrl } = await import("@/utils/downloadProxy");
    const resolvedUrl = url
      ? type === "images"
        ? url
        : proxyAnyDownloadUrl(url, { filename: niceName, disposition: "attachment" })
      : undefined;

    if (isLeadCaptured && resolvedUrl) {
      // Stream as blob → same-tab anchor click. This is the ONLY pattern that
      // works for all browsers without triggering the popup blocker.
      try {
        const res = await fetch(resolvedUrl);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = niceName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 4000);
        return;
      } catch (err) {
        console.warn("Blob download failed, falling back to anchor:", err);
        const link = document.createElement("a");
        link.href = resolvedUrl;
        link.download = niceName;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
    }

    setCaptureDocType(type);
    setCaptureDocUrl(resolvedUrl);
    setLeadCaptureOpen(true);
  };

  const mapQuery = `${project.name}${project.location ? `, ${project.location}` : ""}, Dubai, UAE`;
  const brochurePrimary = brochureDocs[0];
  const heroImageUrl = images[0]?.url;

  const documentCoverFor = (doc: ProjectDetailData["documents"][number], index: number) => {
    if (doc.cover_image_url) return doc.cover_image_url;
    const lower = `${doc.name || ""} ${doc.display_title || ""}`.toLowerCase();
    const cityBuddy = images.find((img) => /city\s*buddy|citybuddy|robot|buddy/i.test(`${img.alt || ""} ${img.url || ""}`));
    if (/city\s*buddy|citybuddy|robot|buddy/.test(lower) && cityBuddy?.url) return cityBuddy.url;
    if (images.length > 1) return images[(index + 1) % images.length]?.url || images[0]?.url;
    return images[0]?.url || project.cover_image_url || undefined;
  };

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
    
    if (minSize === maxSize) return formatSize(minSize);
    return `${formatSize(minSize).split(' ')[0]} - ${formatSize(maxSize)}`;
  };

  // Format bedrooms text - prefer bedroom_types array if available
  const bedroomsText = useMemo(() => {
    // If bedroom_types array exists with labels, show those
    const bedroomTypes = (project as any).bedroom_types;
    if (bedroomTypes && Array.isArray(bedroomTypes) && bedroomTypes.length > 0) {
      return bedroomTypes.join(', ');
    }
    // Fallback to min/max
    if (project.bedrooms_min === 0 && project.bedrooms_max === 0) return "Studio";
    if (project.bedrooms_min === 0 && project.bedrooms_max && project.bedrooms_max > 0) return `Studio - ${project.bedrooms_max} BR`;
    if (!project.bedrooms_min) return null;
    if (project.bedrooms_min === project.bedrooms_max) return `${project.bedrooms_min} BR`;
    return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
  }, [project.bedrooms_min, project.bedrooms_max, (project as any).bedroom_types]);

  // Format size text
  const sizeText = useMemo(() => {
    if (!project.size_min && project.built_up_area) return project.built_up_area;
    if (!project.size_min) return null;
    if (project.size_min === project.size_max) return formatSize(project.size_min);
    return `${convertSize(project.size_min).toLocaleString()} - ${formatSize(project.size_max || 0)}`;
  }, [project.size_min, project.size_max, formatSize, convertSize]);

  return (
    <div data-project-detail-page className="contents">
      {/* HERO SECTION - Full Screen */}
      <section data-hero-dark data-on-dark data-no-contrast-guard data-ink-emerald-opt-out className="jj-project-hero jj-fullbleed-band allow-white relative w-full h-screen min-h-[700px]">
        {/* Owner-only: Edit hero / pick from gallery → set as Cover or Profile */}
        <HeroImagePicker
          projectId={project.id}
          coverImageUrl={project.cover_image_url}
          cardImageUrl={(project as any).card_image_url}
        />

        {/* Owner-only master edit toggle. Off → all pencils hidden site-wide
            on this project page. On → every pencil reappears in its original
            spot. This button itself stays visible in both states. */}
        {isOwner && (
          <div className="absolute top-[176px] right-4 md:right-8 z-30">
            <button
              type="button"
              onClick={toggleProjectEditMode}
              data-no-contrast-guard
              aria-pressed={projectEditMode}
              title={projectEditMode ? "Exit edit mode" : "Edit this page"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.2em] shadow-lg border backdrop-blur-sm transition-colors ${
                projectEditMode
                  ? "bg-[#1E5F3F] text-white border-[#B89555]/60 hover:bg-[#194f35]"
                  : "bg-[#F7F2EA]/95 text-[#1A1A1A] border-[#B89555]/60 hover:bg-[#EFE6D6]"
              }`}
            >
              {projectEditMode ? <PencilOff className="w-3.5 h-3.5" /> : <PencilIcon className="w-3.5 h-3.5" />}
              {projectEditMode ? "Done editing" : "Edit page"}
            </button>
          </div>
        )}

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
            <div className="w-full h-full bg-gradient-to-br from-[#18130F] via-[#0d0b08] to-black flex items-center justify-center">
              <BrandedLoader text="Loading project..." />
            </div>
          )}
          {/* Lighter overlay — only enough darken at the bottom to guarantee WHITE hero copy readability.
              Side vignette removed so the photo itself stays bright and crisp. */}
          <div className="absolute inset-x-0 bottom-0 h-[54%] bg-gradient-to-t from-black/78 via-black/42 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[24%] bg-black/22 pointer-events-none" />
        </div>

        {/* Sold Out Badge - Top Right */}
        {(project.status_label?.toLowerCase().includes('sold') || 
          project.availability_status?.toLowerCase().includes('sold')) && (
          <div className="absolute top-[112px] xl:top-[120px] right-4 md:right-8 z-30">
            <div className="bg-red-600/95 text-white px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.2em] shadow-lg border border-red-300/60 backdrop-blur-sm">
              SOLD OUT
            </div>
          </div>
        )}

        {/* Hero content - Bottom aligned */}
        <div data-surface="dark" data-on-dark data-ink-emerald-opt-out data-no-contrast-guard className="jj-content-track relative z-20 h-full flex flex-col justify-end pb-8">
          {/* Starting Price - Above title */}
          {typeof project.price_from === "number" && (
            <p className="text-lg md:text-xl mb-2 text-white/85 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" data-no-contrast-guard>
              Starting from{" "}
              <InlineEditable projectId={project.id} field="price_from" value={project.price_from} type="number" surface="dark">
                <span className="font-bold text-2xl md:text-3xl drop-shadow-[0_0_12px_rgba(234,88,12,0.4)]" style={{ color: '#FB923C' }}>{formatPriceUtil(project.price_from)}</span>
              </InlineEditable>
            </p>
          )}

          {/* Project Title - BIGGER */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            data-no-contrast-guard
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            <InlineEditable projectId={project.id} field="name" value={project.name} surface="dark">
              <span className="text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{project.name}</span>
            </InlineEditable>
          </h1>

          {/* Developer */}
          {project.developer?.name && (
            <p
              className="text-lg mb-6 text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
              data-no-contrast-guard
              style={{ color: 'rgba(255,255,255,0.92)', WebkitTextFillColor: 'rgba(255,255,255,0.92)' }}
            >
              by{" "}
              {project.developer?.slug ? (
                <Link
                  to={`/developer/${project.developer.slug}`}
                  className="hover:underline font-semibold transition-colors text-white"
                  data-no-contrast-guard
                  style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                >
                  {project.developer.name}
                </Link>
              ) : (
                <span className="font-semibold text-white" data-no-contrast-guard style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{project.developer.name}</span>
              )}
            </p>
          )}

          {/* USPs Row - Location, Bedrooms, Size, Handover, Payment Plan */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8" data-no-contrast-guard>
            {project.location && (
              <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                <MapPin className="w-5 h-5 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <InlineEditable projectId={project.id} field="location" value={project.location} surface="dark">
                  <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{project.location}</span>
                </InlineEditable>
              </div>
            )}
            {bedroomsText && (
              <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                <Bed className="w-5 h-5 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{bedroomsText}</span>
              </div>
            )}
            {sizeText && (
              <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                <Maximize className="w-5 h-5 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{sizeText}</span>
              </div>
            )}
            {(() => {
              const synced = getProjectStatus(project);
              return synced.label !== "TBA" ? (
                <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                  <Calendar className="w-5 h-5 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  <InlineEditable projectId={project.id} field="handover_date" value={project.handover_date} type="date" surface="dark" scope="quick_facts" label="Edit handover date">
                    <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{synced.label}</span>
                  </InlineEditable>
                </div>
              ) : null;
            })()}
          </div>

          {/* Hero CTAs - Download Brochure + Register Interest (ghost outlined, white on photo) */}
          <div className="flex flex-wrap gap-4" data-no-contrast-guard>
            {brochurePrimary ? (
              <button
                type="button"
                onClick={() => handleDocumentDownload("brochure", brochurePrimary.url)}
                className="jj-hero-ghost-cta inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold hover:-translate-y-0.5"
                data-no-contrast-guard
              >
                <Download className="w-5 h-5" />
                <span>Download Brochure</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCaptureDocType("brochure");
                  setCaptureDocUrl(undefined);
                  setLeadCaptureOpen(true);
                }}
                className="jj-hero-ghost-cta inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold hover:-translate-y-0.5"
                data-no-contrast-guard
              >
                <FileText className="w-5 h-5" />
                <span>Request Brochure</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCaptureDocType("brochure");
                setCaptureDocUrl(undefined);
                setLeadCaptureOpen(true);
              }}
              className="jj-hero-ghost-cta inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold hover:-translate-y-0.5"
              data-no-contrast-guard
            >
              <span>Register Interest</span>
            </button>
          </div>


          {/* Broker/Developer: one-click branded presentation. If brand assets are missing,
              clicking opens an in-page capture dialog (logo, photo, name, email, phone, company). */}
          {isBrokerMode && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={brandedDeckBusy}
                onClick={async () => {
                  if (brandedDeckBusy) return;
                  if (!brokerHasBrand) {
                    setBrandCaptureOpen(true);
                    return;
                  }
                  setBrandedDeckBusy(true);
                  const { toast } = await import("sonner");
                  const tId = toast.loading("Generating your branded presentation…");
                  try {
                    const { generateBrandedProjectDeck } = await import("@/utils/generateBrandedProjectDeck");
                    const { data: brokerRow } = await supabase
                      .from("crm_brokers")
                      .select("full_name, personal_email, personal_phone, phone_e164, logo_url, headshot_url, current_company")
                      .eq("user_id", user?.id || "")
                      .maybeSingle();
                    await generateBrandedProjectDeck({
                      projectName: project.name,
                      developerName: project.developer?.name || null,
                      location: project.location || null,
                      priceFrom: project.price_from ?? null,
                      bedroomsText: bedroomsText || null,
                      sizeText: sizeText || null,
                      handoverText: getProjectStatus(project).label,
                      description: project.description || null,
                      heroImageUrl: heroImage?.url || null,
                      broker: brokerRow
                        ? {
                            fullName: (brokerRow as any).full_name,
                            email: (brokerRow as any).personal_email,
                            phone: (brokerRow as any).personal_phone || (brokerRow as any).phone_e164,
                            logoUrl: (brokerRow as any).logo_url,
                            headshotUrl: (brokerRow as any).headshot_url,
                            agencyName: (brokerRow as any).current_company,
                          }
                        : null,
                    });
                    toast.success("Presentation downloaded", { id: tId });
                  } catch (err: any) {
                    console.error("[branded-deck] failed", err);
                    toast.error(err?.message || "Could not generate presentation", { id: tId });
                  } finally {
                    setBrandedDeckBusy(false);
                  }
                }}
                className="jj-hero-ghost-cta inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70 disabled:cursor-wait"
                data-no-contrast-guard
                title={brokerHasBrand ? "Download a co-branded presentation for this project" : "Add your logo & photo, then generate a fully co-branded presentation"}
              >
                <Download className="w-4 h-4" />
                <span>{brandedDeckBusy ? "Generating…" : "Generate branded presentation"}</span>
              </button>
            </div>
          )}

          <BrandedDeckCaptureDialog
            open={brandCaptureOpen}
            onOpenChange={setBrandCaptureOpen}
            onSubmit={async (broker) => {
              setBrandedDeckBusy(true);
              const { toast } = await import("sonner");
              const tId = toast.loading("Generating your branded presentation…");
              try {
                const { generateBrandedProjectDeck } = await import("@/utils/generateBrandedProjectDeck");
                await generateBrandedProjectDeck({
                  projectName: project.name,
                  developerName: project.developer?.name || null,
                  location: project.location || null,
                  priceFrom: project.price_from ?? null,
                  bedroomsText: bedroomsText || null,
                  sizeText: sizeText || null,
                  handoverText: getProjectStatus(project).label,
                  description: project.description || null,
                  heroImageUrl: heroImage?.url || null,
                  broker,
                });
                toast.success("Presentation downloaded", { id: tId });
              } catch (err: any) {
                console.error("[branded-deck] failed", err);
                toast.error(err?.message || "Could not generate presentation", { id: tId });
              } finally {
                setBrandedDeckBusy(false);
              }
            }}
          />


          {/* Breadcrumb Navigation */}
          <ProjectBreadcrumb projectName={project.name} location={project.location} surface="dark" />
        </div>
      </section>

      {adminBar}

      {previousProject && (
        <div className="sticky top-[88px] z-30 w-full bg-[#FDFBF7]/95 backdrop-blur border-b border-[#B89555]/30">
          <div className="jj-content-track py-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReturnToPrevious}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] text-sm font-medium hover:bg-[#EFE6D6] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to {previousProject.name}
            </button>
            <span className="text-[11px] text-[#1A1A1A]/60 hidden sm:inline">
              You came from a nearby project map
            </span>
          </div>
        </div>
      )}


      {/* STICKY SUB-NAVIGATION - Two rows: Search + Shortcuts */}
      <div 
        className={`jj-utility-shell fixed top-[88px] [body.jj-vertical-nav-collapsed_&]:top-[48px] right-0 z-[9990] backdrop-blur-md transition-all duration-300 ${
          showStickyNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Row 1: Filter Shortcut Bar */}
        <div data-filter-clean="true" data-filter-bar-gold="project-detail" data-project-detail-filterbar="true" className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20 py-3 px-2 transition-all duration-300">
          <div className="max-w-full overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
            <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
          </div>
        </div>

        {/* Row 2: Curated Shortcuts — gold bottom border for visibility */}
        <div className="bg-gradient-to-r from-[#EDE0C8] via-[#E2D4B8] to-[#D8C7A6] border-b-2 border-[#B89555] shadow-[0_4px_12px_rgba(200,167,102,0.25)]">
          <div className="jj-content-track">
            <div ref={tabNavRef} className="overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              <div className="flex items-center gap-1 py-2.5">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    data-tab={tab.id}
                    data-filter-selected={activeTab === tab.id ? "true" : undefined}
                    data-surface={activeTab === tab.id ? "emerald" : undefined}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap shrink-0 min-w-fit transition-all relative ${
                      activeTab === tab.id
                        ? "allow-white jj-pill-emerald-metallic text-white border-0 font-bold shadow-[0_10px_24px_-12px_rgba(4,44,28,0.86)]"
                        : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 border border-transparent"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
                {/* Register Interest - Highlighted Gold CTA
                    NOTE: inline (no `ml-auto`) so it participates in horizontal scroll
                    on narrow viewports instead of being clipped at the right edge. */}
                <button
                  onClick={() => {
                    setCaptureDocType("brochure");
                    setCaptureDocUrl(undefined);
                    setLeadCaptureOpen(true);
                  }}
                  data-surface="emerald"
                  data-emerald-action="true"
                  data-no-contrast-guard
                  className="allow-white flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap min-w-fit shrink-0 transition-all border border-black/25 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)', color: '#FFFFFF', boxShadow: '0 10px 24px -12px rgba(4,44,28,0.86)' }}
                >
                  <UserPlus className="w-3.5 h-3.5" style={{ color: '#FFFFFF' }} />
                  <span style={{ color: '#FFFFFF' }}>Register Interest</span>
                </button>


              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="jj-section-champagne jj-project-band jj-fullbleed-band" style={{ background: 'linear-gradient(135deg, #EDE0C8 0%, #E2D4B8 50%, #D8C7A6 100%)' }}>
        <div className="jj-project-shell py-10 md:py-14" style={{ margin: '0 auto', border: 'none', borderRadius: 0, background: 'transparent' }}>


          {/* Quick Stats Grid - Premium gold border visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Starting Price</p>
              <InlineEditable projectId={project.id} field="price_from" value={project.price_from} type="number" scope="quick_facts" label="Edit starting price">
                <p className="mt-2 text-xl font-bold text-price-orange">
                  {typeof project.price_from === "number" && project.price_from > 0
                    ? formatPriceUtil(project.price_from)
                    : "Price TBA"}
                </p>
              </InlineEditable>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Handover</p>
              <InlineEditable projectId={project.id} field="handover_date" value={project.handover_date} type="date" scope="quick_facts" label="Edit handover date">
                <p className="mt-2 text-xl font-bold text-foreground">{getProjectStatus(project).label}</p>
              </InlineEditable>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Bedrooms</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {bedroomsText || deriveBedroomsFromUnitTypes(project.unit_types) || "TBA"}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
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
               totalUnits={project.availability_visible ? project.total_units : null}
               floors={project.floors && project.floors > 3 ? project.floors : undefined}
               availabilityStatus={project.availability_visible ? project.availability_status : null}
               statusLabel={project.status_label}
               handoverDate={project.handover_date}
               updatedAt={project.updated_at}
             />
          </div>

          {/* OWNER PROVENANCE CARD — owner/admin only, replaces the old public "Updated X ago" chip */}
          {isOwner && (
            <div className="mb-8 flex justify-end">
              <div className="w-full max-w-md">
                <OwnerProvenanceCard
                  projectId={project.id}
                  projectName={project.name}
                  createdAt={(project as any).created_at}
                  updatedAt={project.updated_at}
                  importSource={project.import_source}
                  createdSource={(project as any).created_source}
                />
              </div>
            </div>
          )}


          {/* DETAILS SECTION */}
          <div ref={detailsRef} id="details" className="mb-14 scroll-mt-40">
            <div className="jj-card-inner">
              <div className="flex items-start gap-2">
                <h2 className="text-h3 font-medium text-foreground">About {project.name}</h2>
                <InlineEditable projectId={project.id} field="description" value={project.description ?? ""} type="textarea" placeholder="Describe this project (markdown supported)…">
                  <span className="sr-only">Edit description</span>
                </InlineEditable>
                <div className="ml-auto"><OwnerSectionEditor projectId={project.id} section="details" initial={project as any} /></div>
              </div>
              {project.description ? (
                <>
                  <div className={`mt-4 relative ${!isDescriptionExpanded && (project.description?.length ?? 0) > 500 ? 'max-h-48 overflow-hidden' : ''}`}>
                    <div 
                      className="text-body text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none [&>p]:mb-4 [&>h2]:mt-8 [&>h2]:mb-3 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:mb-4"
                      dangerouslySetInnerHTML={{ 
                        __html: renderMarkdownToHtml(formatReellyDescription(project.description || '')) 
                      }}
                    />
                    {!isDescriptionExpanded && (project.description?.length ?? 0) > 500 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[hsl(var(--premium-bg))] to-transparent pointer-events-none" />
                    )}
                  </div>
                  {(project.description?.length ?? 0) > 500 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium mt-3 hover:underline"
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
             <div ref={galleryRef} id="gallery" className="mb-14 scroll-mt-40">
               <div className="jj-card-inner">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-h3-sm font-medium text-foreground">Project Gallery</h3>
                   <div className="flex items-center gap-2">
                     <OwnerSectionEditor projectId={project.id} coverImageUrl={project.cover_image_url} section="gallery" initial={project as any} label="Manage photos" />
                       <button
                         type="button"
                         onClick={() => handleDocumentDownload("images", images[0]?.url)}
                         data-emerald-action="true"
                         className="jj-emerald-action inline-flex items-center gap-2 h-9 rounded-md px-4 text-sm font-semibold transition-colors shadow-sm"
                       >
                          <Download className="w-4 h-4" />
                          <span>Download Images</span>
                       </button>
                   </div>
                 </div>
                  <ImageCarousel
                    images={images.map((img) => ({
                      id: img.id,
                      image_url: img.url,
                      alt_text: img.alt ?? null,
                    }))}
                    projectName={project.name}
                  />
                  <OwnerImageManager projectId={project.id} coverImageUrl={project.cover_image_url} />

               </div>
             </div>
           )}

           {/* UNIT TYPES & INVENTORY SECTION (Reelly-style) */}
           {(project.unit_types?.length ?? 0) > 0 && (
              <div ref={unitsRef} id="units" className="mb-14 scroll-mt-40 relative">
                <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="units" initial={project as any} /></div>
                <UnitInventorySection
                  unitTypes={project.unit_types || []}
                  totalUnits={project.availability_visible ? project.total_units : null}
                  availableUnits={project.availability_visible ? project.available_units : null}
                  projectName={project.name}
                  availabilityVisible={project.availability_visible ?? false}
                />
              </div>
            )}

           {/* CONSTRUCTION TIMELINE SECTION (Reelly-style) */}
           {(project.construction_progress !== null && project.construction_progress !== undefined) && (
             <div ref={constructionRef} id="construction" className="mb-14 scroll-mt-40 relative">
               <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="construction" initial={project as any} /></div>
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
             <div ref={developerRef} id="developer" className="mb-14 scroll-mt-40 relative">
               <div className="absolute right-0 -top-2 z-10">
                 <OwnerSectionEditor
                   projectId={project.id}
                   developerId={project.developer.id ?? null}
                   section="developer"
                   initial={{
                     dev_name: project.developer.name,
                     dev_logo_url: project.developer.logo_url,
                     dev_headquarters: project.developer.headquarters,
                     dev_founded_year: project.developer.founded_year,
                     dev_completed_projects: project.developer.completed_projects,
                     dev_offplan_projects: project.developer.offplan_projects,
                     dev_total_units_delivered: project.developer.total_units_delivered,
                     dev_specialization: project.developer.specialization,
                     dev_ceo_name: project.developer.ceo_name,
                     dev_website_url: project.developer.website_url,
                     dev_description: project.developer.description,
                     dev_notable_projects: project.developer.notable_projects,
                   }}
                 />
               </div>
               <DeveloperInfoCard
                 developer={project.developer}
                 projectName={project.name}
                 editable
               />
             </div>
           )}


           {/* UNIQUE SELLING POINTS (USP/Highlights) SECTION */}
           {(project.usp_bullets?.length ?? 0) > 0 && (
             <div ref={uspRef} id="usp" className="mb-14 scroll-mt-40">
               <div className="jj-card-inner">
                  <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-[#1A1A1A]" />
                    Unique Selling Points
                    <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="usp" initial={project as any} /></span>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* USP Image - fallback to first gallery image if no USP image */}
                  {(project.usp_image_url || images[0]?.url) && (
                    <div className="rounded-xl overflow-hidden border border-[#B89555]/30">
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
                          <span className="w-6 h-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Star className="w-3.5 h-3.5 text-[#1A1A1A]" />
                          </span>
                          <span className="text-foreground">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="mt-6"
                      onClick={() => { setCaptureDocType("brochure"); setCaptureDocUrl(undefined); setLeadCaptureOpen(true); }}
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
             <div ref={houseDetailsRef} id="house-details" className="mb-14 scroll-mt-40 relative">
                <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="house-details" initial={project as any} /></div>
                <HouseDetailsSection
                  floors={project.floors}
                  totalUnits={project.availability_visible ? project.total_units : null}
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
             <div ref={floorPlansRef} id="floor-plans" className="mb-14 scroll-mt-40">
               <div className="jj-card-inner">
                 <div className="flex items-center gap-2 mb-2">
                   <h3 className="text-h3-sm font-medium text-foreground">Floor Plans</h3>
                   <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="floor-plans" initial={project as any} label="Upload floor plans" /></span>
                 </div>
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
              <div ref={amenitiesRef} id="amenities" className="mb-14 scroll-mt-40">
                <div className="jj-card-inner">
                   <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                     <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                     Amenities & Features
                     <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="amenities" initial={project as any} /></span>
                   </h3>
                   <AmenitiesWithPhotos amenities={project.amenities!} amenityImages={project.amenity_images} />
                 </div>
               </div>
              )}

           {/* PROJECT MEDIA SECTION (Reelly-style) */}
           {(project.video_url || project.virtual_tour_url) && (
             <div ref={mediaRef} id="media" className="mb-14 scroll-mt-40 relative">
               <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="media" initial={project as any} /></div>
               <ProjectMediaSection
                 videoUrl={project.video_url}
                 virtualTourUrl={project.virtual_tour_url}
                 projectName={project.name}
               />
             </div>
           )}

          {/* LOCATION MAP - Full Width */}
          <div ref={locationRef} id="location" className="mb-14 scroll-mt-40">
            <div className="jj-card-inner">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-[#1A1A1A]" />
                  Project Location
                  <span className="ml-2"><OwnerSectionEditor projectId={project.id} section="location" initial={project as any} /></span>
                </h3>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-emerald-action="true"
                  className="jj-emerald-action inline-flex items-center gap-2 h-9 rounded-md px-4 text-sm font-semibold transition-colors shadow-sm"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Open in Maps</span>
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
                <div className="mb-6 rounded-xl overflow-hidden border border-[#B89555]/30">
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
                latitude={project.latitude ?? null}
                longitude={project.longitude ?? null}
               />

              {/* Nearby Properties Map — ALWAYS rendered so visitors can see
                  other developer projects in the same area, regardless of
                  whether this project has coords or an area_name. */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Other projects in {project.area_name || project.emirate || 'this area'}
                </h3>
                <Suspense fallback={<div className="h-[420px] rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA]" aria-hidden />}>
                  <ProjectNearbyPropertiesMap
                    currentProjectId={project.id}
                    currentProjectName={project.name}
                    currentProjectSlug={project.slug ?? null}
                    currentDeveloperId={project.developer?.id ?? (project as any).developer_id ?? null}
                    currentDeveloperName={project.developer?.name ?? null}
                    latitude={typeof project.latitude === 'number' ? project.latitude : null}
                    longitude={typeof project.longitude === 'number' ? project.longitude : null}
                    areaName={project.area_name || project.emirate || null}
                  />
                </Suspense>
                <p className="mt-2 text-xs text-[#1A1A1A]/70">
                  {typeof project.latitude === 'number' && typeof project.longitude === 'number'
                    ? 'Red pin = this project · Champagne pins = other developers nearby. Click a pin to open that project — you can always return here using the chip at the top.'
                    : `Champagne pins = other developers in ${project.area_name || project.emirate || 'this area'}. Click a pin to open that project — you can always return here using the chip at the top.`}
                </p>
              </div>


              {/* Nearby Points of Interest - Below Map */}
              {project.location_distances && project.location_distances.length > 0 && (
                <div className="mt-6">
                  <PointsOfInterest points={project.location_distances} />
                </div>
              )}
            </div>
          </div>

          {/* MoreFromDeveloperStrip moved to the bottom of the page so that the
              "Other projects in this area" map above is not visually replaced
              by sibling developer inventory. See render at end of layout. */}

          {/* MASTER PLAN SECTION (Reelly-style) */}
          {(project.master_plan_image_url || (project.community_highlights?.length ?? 0) > 0) && (
            <div ref={masterPlanRef} id="master-plan" className="mb-14 scroll-mt-40 relative">
              <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="master-plan" initial={project as any} /></div>
              <MasterPlanSection
                masterPlanImageUrl={project.master_plan_image_url}
                communityHighlights={project.community_highlights}
                projectName={project.name}
              />
            </div>
          )}

           {/* PAYMENT PLAN VISUALIZATION (Order B: Payment first) */}
           {(true) && (
           <div ref={paymentRef} id="payment" data-section="payment" className="mb-14 scroll-mt-40 relative pt-10">
              <div className="absolute right-0 top-0 z-10 flex items-center gap-1.5">
                <OwnerSectionEditor projectId={project.id} section="payment" initial={project as any} />
              </div>
              <PaymentPlanVisualization
                paymentPlan={project.payment_plan}
                paymentBreakdown={project.payment_breakdown}
                handoverDate={project.handover_date}
                downPaymentPercent={project.down_payment_percent}
                projectName={project.name}
                paymentPlanVerified={(project as any).payment_plan_verified}
                paymentPlanVerifiedAt={(project as any).payment_plan_verified_at}
                onRegisterInterest={() => {
                  setCaptureDocType("payment_plan");
                  setCaptureDocUrl(undefined);
                  setLeadCaptureOpen(true);
                }}
              />
              {isOwner && (
                <PaymentPlanVerificationToggle
                  projectId={project.id}
                  verified={!!(project as any).payment_plan_verified}
                />
              )}
            </div>
            )}


            {/* Owner-only AI enrichment dialog for the Payment Plan section */}
            {isOwner && (
              <AIEnrichDialog
                open={paymentEnrichOpen}
                onOpenChange={setPaymentEnrichOpen}
                projectId={project.id}
                projectName={project.name}
                section="payment"
              />
            )}


          {/* BROCHURE - Full width two-column layout */}
          <div ref={brochureRef} id="brochure" className="mb-14 scroll-mt-40">
            <div className="jj-card-inner">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold">The Document</p>
                    <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="brochure" initial={project as any} label="Manage brochure" /></span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight tracking-tight">
                    Project Brochure
                  </h3>
                  <div className="w-16 h-px bg-[#B89555] mb-5" />
                  <p className="text-[#1A1A1A]/85 mb-6 leading-relaxed text-[15px]">
                    {brochurePrimary
                      ? `Download the complete brochure for ${project.name} to explore detailed floor plans, pricing, payment options, and lifestyle amenities. Perfect for offline viewing and sharing.`
                      : `Request the exclusive brochure for ${project.name} with detailed floor plans, pricing, and lifestyle amenities. Our team will share it with you directly.`
                    }
                  </p>
                  <ul className="space-y-3 text-[15px] text-[#1A1A1A] mb-6">
                    {[
                      "Full floor plan layouts",
                      "Detailed specifications",
                      "Payment plan breakdown",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span
                          data-emerald-action="true"
                          data-icon-circle="true"
                          className="jj-emerald-action inline-grid w-8 h-8 min-w-8 min-h-8 aspect-square rounded-full place-items-center shrink-0 p-0 overflow-hidden"
                          aria-hidden="true"
                        >
                          <FileText className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
                        </span>
                        <span className="text-[#1A1A1A]/90">{item}</span>
                      </li>
                    ))}
                  </ul>

                </div>
                <div className="flex justify-center">
                  <PremiumBrochureCard
                    projectName={project.name}
                    projectId={project.id}
                    projectSlug={project.slug}
                    brochureUrl={brochurePrimary?.url}
                    projectImageUrl={project.cover_image_url || project.images?.[0]?.url || undefined}
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

          {/* GENERATE PRESENTATION — broker / owner / developer modes only */}
          <div className="mb-14">
            <GeneratePresentationCard project={project as any} />
          </div>



          {/* BOOK-STYLE ALL DOCUMENTS STRIP + OWNER DROPZONE */}
          <div className="mb-14">
            {project.documents.length > 0 ? (
              <BookStyleDocuments
                documents={project.documents.map(d => ({
                  id: d.id,
                  type: d.type,
                  url: d.url,
                  name: d.name,
                  display_title: d.display_title,
                  cover_image_url: documentCoverFor(d, project.documents.findIndex((doc) => doc.id === d.id)),
                  is_visible: d.is_visible ?? true,
                  allow_download: d.allow_download ?? true,
                }))}
                projectName={project.name}
                projectImageUrl={project.images?.[0]?.url || undefined}
                onDownload={(url, filename) => handleDocumentDownload("brochure", url, filename)}
              />
            ) : (
              <div className="relative">
                <div className="mb-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-1">The Library</p>
                  <h3 className="text-[#1A1A1A] text-2xl md:text-3xl font-semibold tracking-tight">Project Documents</h3>
                  <div className="w-16 h-px bg-[#B89555] mt-3" />
                  <p className="text-[14px] text-[#1A1A1A]/75 mt-3 max-w-2xl">
                    Request the brochure, fact sheet and floor plans for {project.name}. Our team will share them with you directly.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {([
                    { key: "brochure", label: "Brochure", desc: "Full project booklet" },
                    { key: "fact_sheet", label: "Fact Sheet", desc: "Specs at a glance" },
                    { key: "floor_plan", label: "Floor Plans", desc: "Layouts & sizes" },
                  ] as const).map((slot) => (
                    <button
                      key={slot.key}
                      type="button"
                      onClick={() => {
                        setCaptureDocType(slot.key as any);
                        setCaptureDocUrl(undefined);
                        setLeadCaptureOpen(true);
                      }}
                      className="group text-left rounded-xl bg-[#F7F2EA] border border-[#B89555]/40 hover:border-[#B89555] p-5 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="inline-flex w-9 h-9 items-center justify-center rounded-lg ring-1 ring-[#B89555]/50"
                          style={{ background: "linear-gradient(135deg,#F7ECD0 0%,#EFE6D6 100%)" }}
                        >
                          <FileText className="w-4 h-4 text-[#1A1A1A]" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/60 font-bold">{slot.desc}</p>
                          <p className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">{slot.label}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1A1A]">
                        Request {slot.label.toLowerCase()}
                        <span aria-hidden>→</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <OwnerDocDropzone projectId={project.id} />
          </div>

           {/* MORTGAGE CALCULATOR (Order B: after brochure) */}
           <div ref={mortgageRef} className="mb-14 scroll-mt-32">
              <div className="jj-card-inner p-0 overflow-hidden">
                <MortgageCalculator
                  defaultPrice={project.price_from ?? 2000000}
                  compact={false}
                  context={{ projectName: project.name, location: project.location || undefined }}
                  showAssistant
                />
              </div>
            </div>

           {/* JBJ AI ANALYZER (Order B: after mortgage) */}
           <div ref={aiRef} id="ai" className="mb-10 md:mb-12 scroll-mt-40">
              <ProjectAIAnalyzer
                projectName={project.name}
                areaName={project.area_name || project.location || "UAE"}
                developer={project.developer?.name}
                developerSlug={project.developer?.slug}
                priceFrom={project.price_from ?? undefined}
                handoverDate={project.handover_date ?? undefined}
                amenities={project.amenities ?? undefined}
                emirate={project.emirate}
              />
            </div>

           {/* DLD MARKET WIDGET — full-bleed band (escapes outer max-w container) */}
           <div className="jj-project-nested-band mb-10 md:mb-12">
             <SectionDividerGoldFullBleed />
             <DLDMarketWidget />
             <SectionDividerGoldFullBleed />
           </div>

           {/* BUYER NATIONALITY INSIGHTS — project + area */}
           <BuyerNationalityInsights
             projectName={project.name}
             areaName={project.area_name || project.location || null}
           />

           {/* MORE FROM THIS DEVELOPER — moved to bottom so it doesn't replace the area map */}
           <MoreFromDeveloperStrip
             currentProjectId={project.id}
             developerId={project.developer?.id ?? (project as any).developer_id ?? null}
             developerName={project.developer?.name ?? (project as any).developer_name ?? null}
             developerSlug={project.developer?.slug ?? null}
           />




           {/* INVESTMENT METRICS SECTION */}
           {(project.roi_estimate || project.rental_yield_estimate) && (
             <div ref={investmentRef} id="investment" className="mb-10 md:mb-12 scroll-mt-40 relative">
               <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="investment" initial={project as any} /></div>
               <InvestmentMetricsSection
                 roiEstimate={project.roi_estimate}
                 rentalYieldEstimate={project.rental_yield_estimate}
                 priceFrom={project.price_from}
                 projectName={project.name}
                 onContactClick={() => { setCaptureDocType("brochure"); setCaptureDocUrl(undefined); setLeadCaptureOpen(true); }}
               />
             </div>
           )}

           {/* USEFUL INFO SECTION */}
           {(project.faqs?.length ?? 0) > 0 && (
             <div ref={faqRef} id="faq" className="mb-10 md:mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                 <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                   <HelpCircle className="w-5 h-5 text-[#1A1A1A]" />
                   Useful information about {project.name}
                   <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="faq" initial={project as any} /></span>
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

           {/* REPORT AN ISSUE BANNER */}
           <div className="mb-10 md:mb-12">
             <ReportIssueButton
               projectName={project.name}
               projectId={project.id}
               projectSlug={project.slug || undefined}
             />
           </div>

          {/* INQUIRY FORM - Full-bleed champagne band so the form sits on a dedicated section */}
        </div>
      </section>
      <div
        ref={inquiryRef}
        className="scroll-mt-32 jj-band jj-band--surface jj-project-band jj-fullbleed-band"
        data-section="register-interest"
      >
        <div className="jj-project-shell py-12 md:py-16">
          <ConsultationRequestForm
            title={`Register Interest in ${project.name}`}
            subtitle={`Get expert guidance on ${project.name}${project.location ? ` at ${project.location}` : ''}. Our specialists are ready to assist you.`}
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      <section className="hidden">
        <div>




          {/* CallToAction reinstated below as full-bleed band */}
        </div>
      </section>

      {/* READY TO GET STARTED — full-bleed CTA band */}
      <SectionDividerGoldFullBleed />
      <div className="bg-[#FDFBF7] jj-project-band jj-fullbleed-band">
        <div className="jj-project-shell">
          <CallToActionSection projectName={project.name} projectId={project.id} />
        </div>
      </div>

      {/* Recommended Projects — seamless champagne bg continuation */}
      <SectionDividerGoldFullBleed />
      <div className="pt-10 md:pt-14 pb-10 md:pb-14 jj-project-band jj-fullbleed-band" style={{ background: 'linear-gradient(135deg, #EDE0C8 0%, #E2D4B8 50%, #D8C7A6 100%)' }}>
      <div className="jj-project-shell">
      <RecommendedProjects
        currentProjectId={project.id}
        currentDeveloperId={(project.developer as any)?.id || null}
        currentLocation={project.location}
        currentEmirate={(project as any).emirate || null}
      />
      </div>
      </div>



      {/* DirectContactCTA is now rendered globally in MainLayout - removed duplicate */}

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadCaptureOpen}
        onOpenChange={setLeadCaptureOpen}
        projectId={project.id}
        projectName={project.name}
        projectLocation={project.location}
        developerName={project.developer?.name}
        documentType={captureDocType}
        documentUrl={captureDocUrl}
      />

      {/* Footer is now rendered globally in MainLayout - removed duplicate */}

      {/* Owner/Visitor view is now driven by the header Mode switcher */}
    </div>
  );
}
