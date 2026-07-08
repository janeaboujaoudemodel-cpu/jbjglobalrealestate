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
import { isMortgageEligible, mortgageIneligibilityReason } from "@/utils/mortgageEligibility";
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
import { formatBedroomRange } from "@/utils/formatBedroomRange";
import BrandedDeckCaptureDialog from "@/components/project-detail/BrandedDeckCaptureDialog";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import citiBuddyDocumentCoverAsset from "@/assets/citi-buddy-document-cover.jpg.asset.json";
import citiBuddyRobotRealAsset from "@/assets/citi-buddy-robot-real.png.asset.json";
const citiBuddyRobotLocal = citiBuddyRobotRealAsset.url;
import amraFactsheetAsset from "@/assets/amra-factsheet.pdf.asset.json";
import AmraFactSheetInsights from "@/components/project-detail/AmraFactSheetInsights";
// Amra brochure-cropped imagery (extracted from the official AMRA Factsheet PDF).
// Every amenity below uses one of these — no generated stand-ins beyond Citi Buddy.
import amraPoolCabanas from "@/assets/amra-brochure/pool-cabanas-marina.jpg";
import amraAerialResort from "@/assets/amra-brochure/aerial-resort.jpg";
import amraFurnishedApts from "@/assets/amra-brochure/furnished-serviced-apartments.jpg";
import amraGrandLobbyHero from "@/assets/amra-brochure/grand-lobby-hero.jpg";
import amraGrandLobby from "@/assets/amra-brochure/grand-lobby.jpg";
import amraHallwayPassage from "@/assets/amra-brochure/hallway-passage.jpg";
import amraSideLobby from "@/assets/amra-brochure/side-lobby.jpg";
import amraRedLight from "@/assets/amra-brochure/red-light-therapy.jpg";
import amraSpaPool from "@/assets/amra-brochure/spa-pool.jpg";
import amraFemaleSpaTreatment from "@/assets/amra-brochure/female-spa-treatment.jpg";
import amraReikiRoom from "@/assets/amra-brochure/reiki-room.jpg";
import amraSoundHealing from "@/assets/amra-brochure/sound-healing-dome.jpg";
import amraNapReset from "@/assets/amra-brochure/nap-reset-room.jpg";
import amraStudio from "@/assets/amra-brochure/studio.jpg";
import amraSmartBoots from "@/assets/amra-brochure/smart-recovery-boots.jpg";
import amraFemaleChanging from "@/assets/amra-brochure/female-changing-room.jpg";
import amraFloatingPods from "@/assets/amra-brochure/floating-sleep-pods.jpg";
import amraSpaReception from "@/assets/amra-brochure/spa-reception.jpg";
import amraDigitalDetox from "@/assets/amra-brochure/digital-detox-cabins.jpg";
import amraSpaHydro from "@/assets/amra-brochure/spa-hydrotherapy.jpg";
import amraSpaLounge from "@/assets/amra-brochure/spa-lounge.jpg";
import amraSaltRoom from "@/assets/amra-brochure/salt-room.jpg";
import amraSpaTreatment from "@/assets/amra-brochure/spa-treatment-room.jpg";
import amraBeautySalon from "@/assets/amra-brochure/beauty-salon.jpg";
import amraShowerRoom from "@/assets/amra-brochure/shower-room.jpg";
import amraTrampoline from "@/assets/amra-brochure/trampoline-studio.jpg";
import amraRowing from "@/assets/amra-brochure/rowing-studio.jpg";
import amraKidsPlay from "@/assets/amra-brochure/kids-soft-play.jpg";
import amraKidsClimb from "@/assets/amra-brochure/kids-climbing.jpg";
import amraVirtualFitness from "@/assets/amra-brochure/virtual-fitness.jpg";
import amraParkour from "@/assets/amra-brochure/parkour.jpg";
import amraCycling from "@/assets/amra-brochure/cycling.jpg";
import amraPanoramicGym from "@/assets/amra-brochure/panoramic-gym.jpg";
import amraSeaViewGym from "@/assets/amra-brochure/sea-view-gym.jpg";
import amraSeaTurtles from "@/assets/amra-brochure/sea-turtles.jpg";
import amraIndoorPoolCols from "@/assets/amra-brochure/indoor-pool-columns.jpg";
import amraChandelierLounge from "@/assets/amra-brochure/chandelier-lounge.jpg";
import amraMinimalPool from "@/assets/amra-brochure/minimal-pool.jpg";
import amraCryoChamber from "@/assets/amra-brochure/cryo-chamber.jpg";
import amraHyperbaric from "@/assets/amra-brochure/hyperbaric-room.jpg";
import amraSaunaSteam from "@/assets/amra-brochure/sauna-steam.jpg";
import amraInRoomDining from "@/assets/amra-brochure/in-room-dining.jpg";

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
  videos?: { id: string; url: string; title?: string | null; display_order?: number | null; is_visible?: boolean | null }[];
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

const STICKY_PROJECT_TAB_IDS = new Set([
  "developer",
  
  "house-details",
  "amenities",
  "location",
  "brochure",
  "payment",
  "ai",
]);

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
  const { formatPriceRangeFull } = useCurrency();
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

  // Replace the global horizontal header as soon as the user scrolls away from the top.
  // At scrollY=0 the normal site header is restored.
  useEffect(() => {
    const onScroll = () => {
      setShowStickyNav(window.scrollY > 16);
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

  const isAmraProject = /amra/i.test(project.name);

  // AMRA: replace any legacy brochure/factsheet documents with the new
  // AMRA English Factsheet asset (single source of truth). Older factsheets
  // are filtered out of the documents list entirely — everywhere the app
  // reads brochures pulls from this same effective list.
  const effectiveDocuments = useMemo(() => {
    if (!isAmraProject) return project.documents;
    const nonBrochure = project.documents.filter((d) => {
      const t = normalizeDocType(d.type || "");
      const n = normalizeDocType(`${d.name || ""} ${d.display_title || ""}`);
      const isDeprecatedFactSheet =
        t === "factsheet" ||
        t === "fact_sheet" ||
        n.includes("fact_sheet") ||
        n.includes("factsheet") ||
        n.includes("amra_fact_sheet");
      return !isDeprecatedFactSheet;
    });
    const replacement = {
      id: "amra-factsheet-v4",
      type: "brochure",
      url: amraFactsheetAsset.url,
      name: "AMRA English Factsheet",
      display_title: "AMRA English Factsheet",
      cover_image_url: null,
      is_visible: true,
      allow_download: true,
    } as ProjectDetailData["documents"][number];
    return [replacement, ...nonBrochure];
  }, [isAmraProject, project.documents]);

  const brochureDocs = useMemo(
    () =>
      effectiveDocuments.filter((d) => {
        const t = normalizeDocType(d.type || "");
        const n = normalizeDocType(d.name || "");
        return t === "brochure" || t === "factsheet" || t === "fact_sheet" || t.includes("brochure") || n.includes("brochure") || n.includes("fact_sheet") || n.includes("factsheet");
      }),
    [effectiveDocuments],
  );
  const paymentPlanDocs = useMemo(
    () =>
      effectiveDocuments.filter((d) => {
        const t = normalizeDocType(d.type || "");
        return t === "payment_plan" || t === "paymentplan" || (t.includes("payment") && t.includes("plan"));
      }),
    [effectiveDocuments],
  );
  const floorPlanDocs = useMemo(
    () =>
      effectiveDocuments.filter((d) => {
        const t = normalizeDocType(d.type || "");
        return t === "floor_plan" || t === "floorplan" || (t.includes("floor") && t.includes("plan"));
      }),
    [effectiveDocuments],
  );

  const videoDocs = useMemo(
    () =>
      effectiveDocuments.filter((d) => {
        const t = normalizeDocType(d.type || "");
        const n = `${d.name || ""} ${d.url || ""}`.toLowerCase();
        return ["video", "videos", "project_video", "media", "tour", "virtual_tour"].includes(t) || n.includes(".mp4") || n.includes(".mov") || n.includes(".m4v") || n.includes(".webm") || n.includes(".ogg") || n.includes("video") || n.includes("tour");
      }),
    [effectiveDocuments],
  );
  const uploadedVideos = useMemo(
    () => (project.videos || []).filter((v) => (v.is_visible ?? true) && !!v.url),
    [project.videos],
  );

  const visibleTabs = useMemo(() => {
    const hasGallery = images.length > 0;
    const hasUsp = (project.usp_bullets?.length ?? 0) > 0;
    const hasFloorPlans = floorPlanDocs.length > 0 || (project.floor_plan_types?.length ?? 0) > 0;
    const hasAmenities = (project.amenities?.length ?? 0) > 0 || isAmraProject;
    const hasPayment = !!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown || !!project.down_payment_percent;
    const hasUsefulInfo = (project.faqs?.length ?? 0) > 0;
    const hasBrochure = brochureDocs.length > 0;
    // Reelly-style sections
    const hasUnits = (project.unit_types?.length ?? 0) > 0;
    const hasConstruction = true; // Always show construction section
    const hasMedia = !!project.video_url || !!project.virtual_tour_url || videoDocs.length > 0 || uploadedVideos.length > 0;
    const hasInvestment = !!project.roi_estimate || !!project.rental_yield_estimate;
    const hasDeveloper = !!project.developer;
    const hasHouseDetails = !!project.floors || !!project.total_units || !!project.service_charge || !!project.finishing_standard || isAmraProject;
    const hasMasterPlan = !!project.master_plan_image_url || (project.community_highlights?.length ?? 0) > 0;

    const mortgageEligible = isMortgageEligible({
      sale_status: project.sale_status,
      construction_status: project.construction_status,
      status_label: project.status_label,
      construction_progress: project.construction_progress,
      developer_name: project.developer?.name,
      developer: project.developer ? { name: project.developer.name } : null,
    });

    return SUB_NAV_TABS.filter((t) => {
      if (t.id === "gallery") return hasGallery;
      if (t.id === "usp") return hasUsp;
      
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
      if (t.id === "mortgage") return mortgageEligible;
      return true;
    });
  }, [brochureDocs.length, floorPlanDocs.length, images.length, paymentPlanDocs.length, videoDocs.length, uploadedVideos.length, project.amenities, project.faqs, project.payment_breakdown, project.payment_plan, project.floor_plan_types, project.usp_bullets, project.unit_types, project.construction_progress, project.video_url, project.virtual_tour_url, project.roi_estimate, project.rental_yield_estimate, project.developer, project.floors, project.total_units, project.service_charge, project.finishing_standard, project.master_plan_image_url, project.community_highlights, project.sale_status, project.construction_status, project.status_label, isAmraProject]);

  const stickyProjectTabs = useMemo(
    () => visibleTabs.filter((tab) => STICKY_PROJECT_TAB_IDS.has(tab.id)),
    [visibleTabs],
  );

  const mortgageEligible = useMemo(() => isMortgageEligible({
    sale_status: project.sale_status,
    construction_status: project.construction_status,
    status_label: project.status_label,
    construction_progress: project.construction_progress,
    developer_name: project.developer?.name,
    developer: project.developer ? { name: project.developer.name } : null,
  }), [project.sale_status, project.construction_status, project.status_label, project.construction_progress, project.developer]);

  const mortgageBlockedReason = useMemo(() => mortgageIneligibilityReason({
    sale_status: project.sale_status,
    construction_status: project.construction_status,
    status_label: project.status_label,
    construction_progress: project.construction_progress,
    developer_name: project.developer?.name,
    developer: project.developer ? { name: project.developer.name } : null,
  }), [project.sale_status, project.construction_status, project.status_label, project.construction_progress, project.developer]);

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

  const hasProjectCoords = typeof project.latitude === "number" && typeof project.longitude === "number";
  const mapQuery = hasProjectCoords
    ? `${project.latitude},${project.longitude}`
    : `${project.name}${project.location ? `, ${project.location}` : ""}${(project as any).emirate ? `, ${(project as any).emirate}` : ""}, UAE`;
  const brochurePrimary = brochureDocs[0];
  const heroImageUrl = images[0]?.url;
  const projectDocumentHeroImage = project.cover_image_url || images.find((img) => !/bathroom|toilet/i.test(`${img.alt || ""} ${img.url || ""}`))?.url || images[0]?.url;

  const publicProjectStatus = useMemo(() => {
    if (project.sale_status?.toLowerCase().includes("off")) return "Off-plan";
    return getProjectStatus(project).label;
  }, [project]);

  const citiBuddyImageUrl = useMemo(
    () => images.find((img) => /citi\s*buddy|city\s*buddy|citybuddy|robot|buddy|concierge/i.test(`${img.alt || ""} ${img.url || ""}`))?.url || citiBuddyRobotLocal,
    [images],
  );

  const documentCoverFor = (doc: ProjectDetailData["documents"][number], index: number) => {
    if (doc.cover_image_url) return doc.cover_image_url;
    const lower = `${doc.name || ""} ${doc.display_title || ""}`.toLowerCase();
    if (/city\s*buddy|citi\s*buddy|citybuddy|robot|buddy/.test(lower)) return citiBuddyDocumentCoverAsset.url || citiBuddyImageUrl || undefined;
    if (/fact\s*sheet|factsheet|brochure|spa\s*draft|catalogue|catalog/i.test(lower)) return projectDocumentHeroImage;
    const nonBathroom = images.find((img, i) => i >= index && !/bathroom|toilet/i.test(`${img.alt || ""} ${img.url || ""}`));
    return nonBathroom?.url || projectDocumentHeroImage || undefined;
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

  const priceRangeText = useMemo(
    () => formatPriceRangeFull(project.price_from, project.price_to),
    [formatPriceRangeFull, project.price_from, project.price_to],
  );

  const plotSizeText = useMemo(() => {
    const raw = project.built_up_area || null;
    if (!raw) return null;
    const n = Number(String(raw).replace(/[^\d.]/g, ""));
    if (Number.isFinite(n) && n > 0) return `${Math.round(n).toLocaleString("en-US")} sq ft`;
    return String(raw);
  }, [project.built_up_area]);

  const brochureInclusions = useMemo(() => {
    const hasCityBuddy = project.documents.some((doc) => /citi\s*buddy|city\s*buddy|buddy/i.test(`${doc.name || ""} ${doc.display_title || ""} ${doc.url || ""}`));
    return [
      "Full floor plan layouts",
      "Detailed specifications",
      "Payment plan breakdown",
      ...(hasCityBuddy ? ["Citi Buddy concierge service"] : []),
    ];
  }, [project.documents]);

  const hasCitiBuddyDocument = useMemo(
    () => project.documents.some((doc) => /citi\s*buddy|city\s*buddy|buddy/i.test(`${doc.name || ""} ${doc.display_title || ""} ${doc.url || ""}`)),
    [project.documents],
  );

  // Full amenity roster for AMRA, sourced directly from the AMRA English Factsheet
  // (Ground Floor + Wellness & Longevity Zone + Mind & Movement Zone + Tower B).
  // Each label below is paired 1:1 with an image cropped from the brochure via
  // `amraAmenityImages`, so no title ever renders against a random gallery photo.
  const amraAmenities = useMemo(() => {
    const base = project.amenities || [];
    if (!isAmraProject) return base;
    const roster = [
      // Signature project USPs
      "Citi Buddy (AI Robot Companion)",
      "165+ wellness and lifestyle amenities",
      "688,000 sq ft dedicated wellness area",
      "Heli and air-taxi landing pad",
      "Yacht limo service and private marina deck",
      "In-room dining and all-day dining",
      "Fully furnished apartments",
      "Fully serviced apartments",
      "Full sea view & direct beach access",
      "App-enabled short-stay management (Amra B&B)",
      // Ground Floor — Outdoor Wellness Amenities (142,625 sq ft)
      "Adult Infinity Pool with lagoon horizon",
      "Dedicated Kids' Pool with shaded edges",
      "Pool Decks & sun-loungers",
      "Cabanas",
      "Relaxation pods",
      "Social sitting & dining zones",
      "BBQ area",
      "Kids' play zones",
      "Lagoon-side viewing decks",
      "Landscaped green buffers",
      "Water cascades & shaded seating",
      // Ground Floor — Indoor Amenities (148,424 sq ft)
      "Grand Entrance Lobby with water features",
      "Hallway passages & side lobbies",
      "All Day Dining restaurant",
      "Isabella Restaurant",
      "Hunter & Barrel Restaurant",
      "Organic Super Market",
      "Art Gallery",
      "Pharmacy",
      // Tower E — Wellness & Longevity Zone (22,604 sq ft)
      "Heated Marble Lounge",
      "Hydro Pool",
      "Female Spa Area",
      "Male Spa Area",
      "Oxygen Therapy Rooms",
      "Breath Work Room",
      "Smart Recovery Hub",
      "Soundproof Nap & Reset Room",
      "Digital Detox Cabins",
      "Sound Healing Dome",
      "Red Light Therapy Suites",
      "Smart Recovery Boots",
      "IV Vitamin Infusion Lounge",
      "Floating Sleep Therapy Pods",
      "Movement Studio",
      "Reiki Room",
      "Female Changing Room",
      // Tower A — Reception, Treatment & Hydrotherapy (18,817 sq ft)
      "Spa Reception & Lounge",
      "Wellness Bar (teas, infusions, supplements)",
      "Full-service Beauty Salon",
      "Sensory Room for guided meditation",
      "Snow Shower",
      "Salt Earth Room",
      "Hyperbaric Room",
      "Cryo Rooms",
      "Massage Room",
      "Hot-bath Jacuzzi & Cold Plunge",
      "Sauna & Steam Rooms",
      "Sensory Shower & Vitality Bar",
      "Indoor Wellness Swimming Pool",
      "Dedicated Hydrotherapy Pool",
      "Relaxation Lounge",
      "Luxury Shower Rooms",
      // Tower D — Mind & Movement Zone (15,070 sq ft)
      "Signature Gym",
      "Virtual Fitness Room",
      "Indoor Cycling Studio",
      "Indoor Rowing Studio",
      "Trampoline Studio",
      "Kids Soft Play Sports Zone",
      "Parkour Studio",
      "Dance Studio",
      "Wellness Café",
      "HIIT Training Room",
      // Tower B — Sports & Movement (12,952 sq ft)
      "Squash Court",
      "Yoga & Meditation Studios",
      "Panoramic Sea View Gym",
      "Pilates Studio",
      "Boxing Ring",
      "HIIT Studio",
      "Punching Studio",
      "Healthy Café Area",
    ];
    // Merge owner-supplied amenities first (they win), then de-dupe against roster.
    const merged = [...base, ...roster];
    return merged.filter((item, index, list) => list.findIndex((v) => v.toLowerCase().trim() === item.toLowerCase().trim()) === index);
  }, [isAmraProject, project.amenities]);

  const amraAmenityImages = useMemo(() => {
    const mapped: Record<string, string> = { ...(project.amenity_images || {}) };
    if (!isAmraProject) return mapped;

    // 1:1 mapping — every title below is an exact key from `amraAmenities` and
    // resolves to a brochure-cropped photo (or, for Citi Buddy, the official
    // robot render). Titles absent from this map fall back to an icon tile.
    const dedicated: Record<string, string> = {
      "Citi Buddy (AI Robot Companion)": citiBuddyRobotLocal,
      "165+ wellness and lifestyle amenities": amraAerialResort,
      "688,000 sq ft dedicated wellness area": amraSpaPool,
      "Heli and air-taxi landing pad": amraAerialResort,
      "Yacht limo service and private marina deck": amraPoolCabanas,
      "In-room dining and all-day dining": amraInRoomDining,
      "App-enabled short-stay management (Amra B&B)": citiBuddyDocumentCoverAsset.url,
      "Fully furnished apartments": amraFurnishedApts,
      "Fully serviced apartments": amraGrandLobby,
      "Full sea view & direct beach access": amraSeaTurtles,

      "Adult Infinity Pool with lagoon horizon": amraPoolCabanas,
      "Dedicated Kids' Pool with shaded edges": amraMinimalPool,
      "Pool Decks & sun-loungers": amraPoolCabanas,
      "Cabanas": amraPoolCabanas,
      "Relaxation pods": amraFloatingPods,
      "Social sitting & dining zones": amraChandelierLounge,
      "BBQ area": amraPoolCabanas,
      "Kids' play zones": amraKidsPlay,
      "Lagoon-side viewing decks": amraPoolCabanas,
      "Landscaped green buffers": amraAerialResort,
      "Water cascades & shaded seating": amraIndoorPoolCols,

      "Grand Entrance Lobby with water features": amraGrandLobbyHero,
      "Hallway passages & side lobbies": amraHallwayPassage,
      "All Day Dining restaurant": amraSpaLounge,
      "Isabella Restaurant": amraChandelierLounge,
      "Hunter & Barrel Restaurant": amraChandelierLounge,
      "Organic Super Market": amraSideLobby,
      "Art Gallery": amraSideLobby,
      "Pharmacy": amraSideLobby,

      "Heated Marble Lounge": amraSpaHydro,
      "Hydro Pool": amraSpaPool,
      "Female Spa Area": amraFemaleSpaTreatment,
      "Male Spa Area": amraSpaTreatment,
      "Oxygen Therapy Rooms": amraNapReset,
      "Breath Work Room": amraStudio,
      "Smart Recovery Hub": amraSmartBoots,
      "Soundproof Nap & Reset Room": amraNapReset,
      "Digital Detox Cabins": amraDigitalDetox,
      "Sound Healing Dome": amraSoundHealing,
      "Red Light Therapy Suites": amraRedLight,
      "Smart Recovery Boots": amraSmartBoots,
      "IV Vitamin Infusion Lounge": amraSpaTreatment,
      "Floating Sleep Therapy Pods": amraFloatingPods,
      "Movement Studio": amraStudio,
      "Reiki Room": amraReikiRoom,
      "Female Changing Room": amraFemaleChanging,

      "Spa Reception & Lounge": amraSpaReception,
      "Wellness Bar (teas, infusions, supplements)": amraSpaLounge,
      "Full-service Beauty Salon": amraBeautySalon,
      "Sensory Room for guided meditation": amraStudio,
      "Snow Shower": amraShowerRoom,
      "Salt Earth Room": amraSaltRoom,
      "Hyperbaric Room": amraHyperbaric,
      "Cryo Rooms": amraCryoChamber,
      "Massage Room": amraSpaTreatment,
      "Hot-bath Jacuzzi & Cold Plunge": amraSpaHydro,
      "Sauna & Steam Rooms": amraSaunaSteam,
      "Sensory Shower & Vitality Bar": amraShowerRoom,
      "Indoor Wellness Swimming Pool": amraSpaPool,
      "Dedicated Hydrotherapy Pool": amraSpaHydro,
      "Relaxation Lounge": amraSpaLounge,
      "Luxury Shower Rooms": amraShowerRoom,

      "Signature Gym": amraSeaViewGym,
      "Virtual Fitness Room": amraVirtualFitness,
      "Indoor Cycling Studio": amraCycling,
      "Indoor Rowing Studio": amraRowing,
      "Trampoline Studio": amraTrampoline,
      "Kids Soft Play Sports Zone": amraKidsClimb,
      "Parkour Studio": amraParkour,
      "Dance Studio": amraStudio,
      "Wellness Café": amraSpaLounge,
      "HIIT Training Room": amraSeaViewGym,

      "Squash Court": amraPanoramicGym,
      "Yoga & Meditation Studios": amraStudio,
      "Panoramic Sea View Gym": amraPanoramicGym,
      "Pilates Studio": amraStudio,
      "Boxing Ring": amraSeaViewGym,
      "HIIT Studio": amraSeaViewGym,
      "Punching Studio": amraSeaViewGym,
      "Healthy Café Area": amraSpaLounge,
    };

    amraAmenities.forEach((label) => {
      if (mapped[label]) return; // owner-supplied wins
      if (dedicated[label]) mapped[label] = dedicated[label];
    });

    // Legacy aliases
    mapped["Citi Buddy concierge"] = citiBuddyRobotLocal;
    return mapped;
  }, [amraAmenities, isAmraProject, project.amenity_images]);

  const amraLocationDistances = useMemo(() => {
    const base = project.location_distances || [];
    if (!isAmraProject) return base;
    const additions = [
      { label: "Marjan Island", time: "15 minutes by road" },
      { label: "Dubai International Airport", time: "40 minutes by road · 15 minutes by air taxi" },
      { label: "Al Khor Mangrove", time: "5 minutes by car" },
      { label: "Wynn Casino / Marjan nightlife", time: "15 minutes by car · 7 minutes by air taxi" },
      { label: "Vida Resort", time: "Next to the project · approximately 25 meters" },
      { label: "25hours Hotel / UAQ Downtown", time: "Confirm from official source" },
    ];
    const overrideLabels = new Set(additions.map((item) => item.label.toLowerCase()));
    const cleanedBase = base.filter((item) => !overrideLabels.has(item.label.toLowerCase()));
    return [...additions, ...cleanedBase].filter((item, index, list) => list.findIndex((v) => v.label.toLowerCase() === item.label.toLowerCase()) === index);
  }, [isAmraProject, project.location_distances]);

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

  // Format bedrooms text as a RANGE — see src/utils/formatBedroomRange.ts
  // (LOCKED: "Studio, 2, 4" from bedroom_types means range Studio → 4 BR,
  // not three discrete options.)
  const bedroomsText = useMemo(
    () => formatBedroomRange(project as any),
    [project.bedrooms_min, project.bedrooms_max, (project as any).bedroom_types, (project as any).has_studio]
  );

  // Format size text
  const sizeText = useMemo(() => {
    if (!project.size_min && plotSizeText) return plotSizeText;
    if (!project.size_min) return null;
    if (project.size_min === project.size_max) return formatSize(project.size_min);
    return `${convertSize(project.size_min).toLocaleString()} - ${formatSize(project.size_max || 0)}`;
  }, [project.size_min, project.size_max, plotSizeText, formatSize, convertSize]);

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
              Price range{" "}
              <InlineEditable projectId={project.id} field="price_from" value={project.price_from} type="number" surface="dark">
                <span className="font-bold text-2xl md:text-3xl drop-shadow-[0_0_12px_rgba(234,88,12,0.4)]" style={{ color: '#FB923C' }}>{priceRangeText}</span>
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
            {(project.emirate || project.area_name || project.location) && (() => {
              const displayLoc = project.emirate
                ? `${project.emirate}${project.area_name ? ` · ${project.area_name}` : ""}`
                : (project.area_name || project.location || "");
              return (
              <div className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                <MapPin className="w-5 h-5 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{displayLoc}</span>
              </div>
              );
            })()}

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
                    <span className="text-sm md:text-base text-white" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{publicProjectStatus}</span>
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
          <ProjectBreadcrumb projectName={project.name} location={project.location} emirate={(project as any).emirate ?? null} surface="dark" />
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


      {/* STICKY PROJECT HEADER - replaces the global horizontal header while scrolled. */}
      <div 
        data-project-sticky-nav="true"
        className={`jj-utility-shell fixed left-0 right-0 z-[9999] backdrop-blur-md transition-all duration-300 ${
          showStickyNav
            ? "top-0 translate-y-0 opacity-100"
            : "top-0 -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {/* Row 1: project search/filter pills only. */}
        <div data-filter-clean="true" data-filter-bar-gold="project-detail" data-project-detail-filterbar="true" className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20 py-2 px-2 transition-all duration-300">
          <div className="max-w-full overflow-x-auto overscroll-x-contain scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x pan-y' } as React.CSSProperties}>
            <FilterShortcutBar
              variant="light"
              filters={shortcutFilters}
              onFilterChange={setShortcutFilters}
              priorityFilter="projects"
              hidePropertyType
              hideTrendingSort
            />
          </div>
        </div>

        {/* Row 2: project section tabs only. */}
        <div className="bg-gradient-to-r from-[#EDE0C8] via-[#E2D4B8] to-[#D8C7A6] border-b-2 border-[#B89555] shadow-[0_4px_12px_rgba(200,167,102,0.25)]">
          <div className="jj-content-track">
            <div ref={tabNavRef} className="overflow-x-auto scrollbar-hide" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              <div className="flex w-max min-w-max items-center gap-1 py-2.5">
                {stickyProjectTabs.map((tab) => (
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
                    ? priceRangeText
                    : "Price TBA"}
                </p>
              </InlineEditable>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Handover</p>
              <InlineEditable projectId={project.id} field="handover_date" value={project.handover_date} type="date" scope="quick_facts" label="Edit handover date">
                <p className="mt-2 text-xl font-bold text-foreground">{publicProjectStatus}</p>
              </InlineEditable>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Bedrooms</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {bedroomsText || deriveBedroomsFromUnitTypes(project.unit_types) || "TBA"}
              </p>
            </div>
            <div className="rounded-xl border-2 border-[#B89555] bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">{plotSizeText ? "Plot size" : "Size"}</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {plotSizeText || sizeText || deriveSizeFromUnitTypes(project.unit_types) || "TBA"}
              </p>
            </div>
          </div>

          {/* QUICK FACTS BAR - Reelly-style horizontal bar */}
          <div className="mb-12">
             <QuickFactsBar
               projectId={project.id}
               propertyType={project.property_type_label}
               totalUnits={project.availability_visible ? project.total_units : null}
               floors={project.floors && project.floors > 3 ? project.floors : undefined}
               availabilityStatus={project.availability_visible ? project.availability_status : null}
               statusLabel={project.status_label}
               saleStatus={project.sale_status}
               handoverDate={project.handover_date}
               updatedAt={project.updated_at}
               showUpdated={isOwner}
             />
          </div>

          {/* OWNER PROVENANCE — collapsed to a gold star; click to expand.
              Public "Updated" chip lives inside <QuickFactsBar> only. */}
          {isOwner && (
            <div className="mb-8 flex justify-end">
              <div className="max-w-md">
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
           {(project.floors || project.total_units || project.service_charge || project.finishing_standard || hasCitiBuddyDocument || isAmraProject) && (
             <div ref={houseDetailsRef} id="house-details" className="mb-14 scroll-mt-40 relative">
                <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="house-details" initial={project as any} /></div>
                <HouseDetailsSection
                  floors={isAmraProject ? (project.floors || 15) : project.floors}
                  totalUnits={project.availability_visible ? project.total_units : null}
                  buildingType={project.property_type_label}
                 ceilingHeight={project.ceiling_height}
                 finishingStandard={project.finishing_standard}
                   serviceCharge={isAmraProject ? (project.service_charge || "AED 22/sq ft") : project.service_charge}
                    standardInclusions={isAmraProject ? [
                      "Fully furnished & serviced apartment",
                      "Sea view from every apartment",
                      "688,000 sq. ft dedicated wellness area (shared)",
                      "Access to 140+ facilities across dedicated zones",
                      "Dedicated marina for private yachts",
                      "Amra BNB one-stop short-stay management",
                      "Citi Buddy concierge via Citi Developers App",
                      "In-room dining & all-day dining",
                    ] : hasCitiBuddyDocument ? ["Citi Buddy"] : null}
                 projectName={project.name}
               />
             </div>
           )}

           {/* FLOOR PLANS SECTION — removed per owner: floor-plan files remain
               available inside the Project Documents section below. */}


           {/* AMENITIES SECTION - Premium with Icons */}
           {amraAmenities.length > 0 && (
              <div ref={amenitiesRef} id="amenities" className="mb-14 scroll-mt-40">
                <div className="jj-card-inner">
                   <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                     <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                     Amenities & Features
                     <span className="ml-auto"><OwnerSectionEditor projectId={project.id} section="amenities" initial={project as any} /></span>
                   </h3>
                     <AmenitiesWithPhotos amenities={amraAmenities} amenityImages={amraAmenityImages} pageSize={12} />
                 </div>
               </div>
              )}

            {(hasCitiBuddyDocument || isAmraProject) && (
              <div className="mb-14 scroll-mt-40">
                <div className="jj-card-inner overflow-hidden p-0">
                  <div className={citiBuddyImageUrl ? "grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]" : "grid grid-cols-1"}>
                    {citiBuddyImageUrl && (
                      <div className="relative bg-[#FDFBF7]">
                        <SafeImage
                          src={citiBuddyImageUrl}
                          alt="Citi Buddy resident concierge robot"
                          className="h-[320px] lg:h-full min-h-[320px] w-full object-contain p-5"
                          loading="eager"
                          decoding="async"
                        />
                        {/* Premium value chip — signals the AED 25K gift without competing with the pin card */}
                        <div className="absolute top-4 left-4 rounded-full border border-[#B89555]/60 bg-white/92 px-3 py-1.5 text-[11px] font-semibold text-[#1A1A1A] shadow-sm">
                          <span className="text-[#064E3B]">Included gift</span>
                          <span className="mx-1.5 text-[#B89555]">·</span>
                          <span>USD 25,000 value</span>
                        </div>
                      </div>
                    )}
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-3">Complimentary with every residence</p>
                      <h3 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mb-2">Citi Buddy — your in-home robot concierge</h3>
                      <p className="text-[14px] leading-relaxed text-[#1A1A1A]/82">
                        A <strong>USD 25,000</strong> Citi Buddy robot is gifted with every apartment — studio through 4-bedroom — and paired with the Citi Developers app for smart-home controls, concierge, dining, security alerts and short-stay management.
                      </p>

                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {[
                          "Smart-home & climate controls",
                          "Concierge and in-room dining",
                          "Housekeeping & maintenance requests",
                          "Short-stay & yearly rental management",
                          "Security alerts and access",
                          "Owner dashboard — anytime",
                        ].map((feature) => (
                          <div key={feature} className="flex items-center gap-2 rounded-md border border-[#B89555]/25 bg-[#F7F2EA] px-3 py-2 text-[13px] font-semibold text-[#1A1A1A]">
                            <Check className="h-4 w-4 text-[#064E3B]" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divider band */}
                  <div className="border-t border-[#B89555]/25" />

                  {/* Kitchen package — Smeg + Villeroy & Boch */}
                  <div className="p-6 md:p-8 bg-[#FDFBF7]">
                    <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold">Fully fitted kitchen · included</p>
                        <h4 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] mt-1">Smeg Italian appliances & Villeroy &amp; Boch tableware</h4>
                      </div>
                      <span className="rounded-full border border-[#B89555]/50 bg-white px-3 py-1 text-[11px] font-semibold text-[#064E3B]">Move-in ready</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        "Smeg fridge / refrigerator",
                        "Smeg dishwasher",
                        "Smeg washing machine",
                        "Gas cooker + electric cooktop",
                        "Built-in oven & extractor hood",
                        "Espresso coffee machine",
                        "Cheese maker",
                        "Citrus juicer — lemon & orange",
                        "Toaster & baking tray",
                        "2 × Villeroy & Boch dinnerware sets",
                        "Full cutlery & serving pieces",
                        "Decorative accessories",
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2 rounded-md border border-[#B89555]/25 bg-white px-3 py-2 text-[13px] font-medium text-[#1A1A1A]">
                          <Check className="h-3.5 w-3.5 text-[#064E3B] flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider band */}
                  <div className="border-t border-[#B89555]/25" />

                  {/* Property management + serviced living */}
                  <div className="p-6 md:p-8">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-xl border border-[#B89555]/35 bg-[#F7F2EA] p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold">Included with the price</p>
                        <h5 className="text-lg font-semibold text-[#1A1A1A] mt-1 mb-3">Serviced living, always on</h5>
                        <ul className="space-y-2 text-[13.5px] text-[#1A1A1A]/85">
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> 24/7 valet service</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Property maintenance</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Housekeeping twice a week</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Towel & bathrobe changes</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> All available even if you don't rent out your unit</li>
                        </ul>
                      </div>
                      <div className="rounded-xl border border-[#B89555]/35 bg-white p-5">
                        <div className="flex items-baseline justify-between gap-2 mb-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold">Optional rental program</p>
                            <h5 className="text-lg font-semibold text-[#1A1A1A] mt-1">Full property management</h5>
                          </div>
                          <span className="rounded-full bg-[#064E3B] text-white px-3 py-1 text-[11px] font-semibold">12% fee</span>
                        </div>
                        <ul className="space-y-2 text-[13.5px] text-[#1A1A1A]/85">
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Check-in & check-out handled for you</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Cleaning between stays</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Live occupancy & revenue in the app</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Payouts sent straight to your bank</li>
                          <li className="flex gap-2"><Check className="h-4 w-4 text-[#064E3B] flex-shrink-0 mt-0.5" /> Only 12% of revenue — everything else stays yours</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

           {/* PROJECT MEDIA SECTION (Reelly-style) */}
           {(project.video_url || project.virtual_tour_url || videoDocs.length > 0 || uploadedVideos.length > 0) && (
             <div ref={mediaRef} id="media" className="mb-14 scroll-mt-40 relative">
               <div className="absolute right-0 -top-2 z-10"><OwnerSectionEditor projectId={project.id} section="media" initial={project as any} /></div>
                {(project.video_url || project.virtual_tour_url) && (
                  <ProjectMediaSection
                    videoUrl={project.video_url}
                    virtualTourUrl={project.virtual_tour_url}
                    projectName={project.name}
                  />
                )}
                {(videoDocs.length > 0 || uploadedVideos.length > 0) && (
                  <div className="jj-card-inner mt-6">
                    <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-4">
                      <Video className="w-5 h-5 text-[#064E3B]" />
                      Project Videos Gallery
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[...uploadedVideos.map((v) => ({ id: v.id, url: v.url, title: v.title || "Uploaded project video" })), ...videoDocs.map((v) => ({ id: v.id, url: v.url, title: v.display_title || v.name || "Project video" }))].map((video) => (
                        <div key={video.id} className="overflow-hidden rounded-lg border border-[#B89555]/35 bg-[#FDFBF7]">
                          <video src={video.url} className="aspect-video w-full bg-[#021611] object-cover" controls playsInline preload="metadata" />
                          <div className="p-3 text-sm font-semibold text-[#1A1A1A]">{video.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  href={hasProjectCoords ? `https://maps.google.com/?q=${project.latitude},${project.longitude}` : `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`}
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


              {/* Unified project location map — red pin marks this project, gold champagne
                  pins mark the developer's other projects. Zoom & drag enabled. */}
              <div className="mt-2">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {project.developer?.name
                    ? `${project.name} & more by ${project.developer.name}`
                    : `${project.name} on the map`}
                </h3>
                <Suspense fallback={<div className="h-[460px] rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA]" aria-hidden />}>
                  <ProjectNearbyPropertiesMap
                    currentProjectId={project.id}
                    currentProjectName={project.name}
                    currentProjectSlug={project.slug ?? null}
                    currentDeveloperId={project.developer?.id ?? (project as any).developer_id ?? null}
                    currentDeveloperName={project.developer?.name ?? null}
                    latitude={typeof project.latitude === 'number' ? project.latitude : null}
                    longitude={typeof project.longitude === 'number' ? project.longitude : null}
                    areaName={project.area_name || null}
                    emirate={project.emirate || null}
                  />
                </Suspense>
                <p className="mt-2 text-xs text-[#1A1A1A]/70">
                  {project.name} is the highlighted pin. Gold pins mark other projects by {project.developer?.name || 'this developer'}. Hover to preview, click to open.
                </p>
              </div>




              {/* Nearby Points of Interest - Below Map */}
              {amraLocationDistances && amraLocationDistances.length > 0 && (
                <div className="mt-6">
                  <PointsOfInterest points={amraLocationDistances} />
                </div>
              )}
            </div>
          </div>

          {/* AMRA-only factsheet insights: BNB investor management, AED 750M Emirates Road,
              sustainability, and named design/brand partners. Content is verbatim from the
              AMRA English Factsheet (developer document). */}
          {isAmraProject && <AmraFactSheetInsights projectName={project.name} />}

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
              {/* Manual owner-entered payment plans are inherently verified; the
                  "Mark as verified" toggle only made sense for scraped data and
                  was confusing to users, so it's intentionally removed. */}
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
                    {brochureInclusions.map((item) => (
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
                    location={project.emirate ? `${project.emirate}${project.area_name ? ` • ${project.area_name}` : ""}` : (project.area_name || undefined)}
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
            {effectiveDocuments.length > 0 ? (
              <BookStyleDocuments
                documents={effectiveDocuments.map(d => ({
                  id: d.id,
                  type: d.type,
                  url: d.url,
                  name: d.name,
                  display_title: d.display_title,
                  cover_image_url: documentCoverFor(d, effectiveDocuments.findIndex((doc) => doc.id === d.id)),
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

           {/* MORTGAGE CALCULATOR — hidden for off-plan (unless tier-1 dev ≥50% built) */}
           {mortgageEligible ? (
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
           ) : (
             <div ref={mortgageRef} className="mb-14 scroll-mt-32">
               <div className="jj-card-inner p-6 text-sm text-[#1A1A1A]/80 bg-[#FDFBF7] border border-[#B89555]/30 rounded-xl">
                 <div className="flex items-start gap-3">
                   <Calculator className="w-5 h-5 text-[#064E3B] mt-0.5" />
                   <div>
                     <p className="font-semibold text-[#1A1A1A] mb-1">Mortgage financing will be available on handover</p>
                      <p>
                        For this off-plan payment structure, the buyer pays 70% through booking and construction.
                        On handover, the remaining 30% can be converted into a UAE mortgage and repaid over up to
                        25 years through the bank — instead of the developer's 3-year post-handover plan — subject to
                        bank approval.
                      </p>
                   </div>
                 </div>
               </div>
             </div>

           )}

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

           {/* BUYER NATIONALITY INSIGHTS — project + area */}
           <BuyerNationalityInsights
             projectName={project.name}
             areaName={project.area_name || project.location || null}
           />

           {/* MORE FROM THIS DEVELOPER — moved down into its own band directly above
               Dubai Market Intelligence (see below). Placeholder kept for git history. */}




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

            {/* REPORT AN ISSUE BANNER — imported/scraped projects only, never manual owner-entered projects */}
            {project.import_source && project.import_source !== "manual" && (
              <div className="mb-10 md:mb-12">
                <ReportIssueButton
                  projectName={project.name}
                  projectId={project.id}
                  projectSlug={project.slug || undefined}
                />
              </div>
            )}

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

      {/* MORE PROJECTS BY THIS DEVELOPER — dedicated band directly above Dubai
          Market Intelligence, so users see the developer's full portfolio
          before the wider market context. */}
      <SectionDividerGoldFullBleed />
      <div className="pt-10 md:pt-14 pb-6 md:pb-8 jj-project-band jj-fullbleed-band bg-[#FDFBF7]">
        <div className="jj-project-shell">
          <MoreFromDeveloperStrip
            currentProjectId={project.id}
            developerId={project.developer?.id ?? (project as any).developer_id ?? null}
            developerName={project.developer?.name ?? (project as any).developer_name ?? null}
            developerSlug={project.developer?.slug ?? null}
          />
        </div>
      </div>

      {/* DUBAI MARKET INTELLIGENCE — after developer portfolio strip */}
      <div className="jj-project-nested-band mb-10 md:mb-12">
        <SectionDividerGoldFullBleed />
        <DLDMarketWidget />
        <SectionDividerGoldFullBleed />
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
