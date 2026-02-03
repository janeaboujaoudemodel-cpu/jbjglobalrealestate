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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MortgageCalculator from "@/components/MortgageCalculator";
import ImageCarousel from "@/components/ImageCarousel";
import ProjectInquiryForm from "@/components/project-detail/ProjectInquiryForm";
import AIMarketAnalyzer from "@/components/AIMarketAnalyzer";
import PremiumBrochureCard from "@/components/project-detail/PremiumBrochureCard";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";
import ProjectBreadcrumb from "@/components/project-detail/ProjectBreadcrumb";
import CallToActionSection from "@/components/project-detail/CallToActionSection";
import NewsletterSection from "@/components/project-detail/NewsletterSection";
import Footer from "@/components/Footer";
import { CONTACT_INFO, getCallUrl, getEmailUrl, getWhatsAppUrl } from "@/constants/stats";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { SafeImage } from "@/components/SafeImage";
import { formatPrice as formatPriceUtil } from "@/utils/formatNumber";
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
  developer?: { name: string; slug?: string | null } | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  size_min?: number | null;
  size_max?: number | null;
  handover_date?: string | null;
  payment_plan?: string | null;
  property_type_label?: string | null;
  status_label?: string | null;
  amenities?: string[] | null;
  images: { id: string; url: string; alt?: string | null }[];
  documents: { id: string; type: string; url: string; name?: string | null }[];
  // New fields for full mirroring
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
};

interface ProjectDetailLayoutProps {
  project: ProjectDetailData;
  adminBar?: React.ReactNode;
  onRequestReport?: () => void;
  showFooter?: boolean;
}

const MIN_REASONABLE_PRICE_AED = 50_000;

const MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

// Sticky sub-nav tabs config
const SUB_NAV_TABS = [
  { id: "details", label: "Details", icon: FileText },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "usp", label: "Highlights", icon: Star },
  { id: "floor-plans", label: "Floor Plans", icon: Layers },
  { id: "amenities", label: "Amenities", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "payment", label: "Payment Plan", icon: CreditCard },
  { id: "faq", label: "Useful info", icon: HelpCircle },
  { id: "ai", label: "AI Analyzer", icon: Sparkles },
  { id: "mortgage", label: "Mortgage", icon: Calculator },
] as const;

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

  const images = useMemo(() => project.images?.filter((i) => i.url) || [], [project.images]);
  const heroImage = images[0];

  const brochureDocs = useMemo(
    () => project.documents.filter((d) => d.type === "brochure"),
    [project.documents],
  );
  const paymentPlanDocs = useMemo(
    () => project.documents.filter((d) => d.type === "payment_plan"),
    [project.documents],
  );
  const floorPlanDocs = useMemo(
    () => project.documents.filter((d) => d.type === "floor_plan"),
    [project.documents],
  );

  const visibleTabs = useMemo(() => {
    const hasGallery = images.length > 0;
    const hasUsp = (project.usp_bullets?.length ?? 0) > 0;
    const hasFloorPlans = floorPlanDocs.length > 0 || (project.floor_plan_types?.length ?? 0) > 0;
    const hasAmenities = (project.amenities?.length ?? 0) > 0;
    const hasPayment = !!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown;
    const hasUsefulInfo = (project.faqs?.length ?? 0) > 0;

    return SUB_NAV_TABS.filter((t) => {
      if (t.id === "gallery") return hasGallery;
      if (t.id === "usp") return hasUsp;
      if (t.id === "floor-plans") return hasFloorPlans;
      if (t.id === "amenities") return hasAmenities;
      if (t.id === "payment") return hasPayment;
      if (t.id === "faq") return hasUsefulInfo;
      return true;
    });
  }, [floorPlanDocs.length, images.length, paymentPlanDocs.length, project.amenities, project.faqs, project.payment_breakdown, project.payment_plan, project.floor_plan_types, project.usp_bullets]);

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
      payment: paymentRef,
      faq: faqRef,
      ai: aiRef,
      mortgage: mortgageRef,
    };
    const targetRef = refMap[tabId];
    if (targetRef) scrollToRef(targetRef);
  };

  const handleDocumentDownload = (type: "brochure" | "floor_plan" | "payment_plan" | "images", url?: string) => {
    if (isLeadCaptured && url) {
      window.open(url, "_blank");
    } else {
      setCaptureDocType(type);
      setCaptureDocUrl(url);
      setLeadCaptureOpen(true);
    }
  };

  const mapQuery = `${project.name}${project.location ? `, ${project.location}` : ""}, Dubai, UAE`;
  const brochurePrimary = brochureDocs[0];
  const heroImageUrl = images[0]?.url;

  // Format bedrooms text
  const bedroomsText = useMemo(() => {
    if (!project.bedrooms_min) return null;
    if (project.bedrooms_min === project.bedrooms_max) return `${project.bedrooms_min} BR`;
    return `${project.bedrooms_min}-${project.bedrooms_max} BR`;
  }, [project.bedrooms_min, project.bedrooms_max]);

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
                <span className="text-sm md:text-base">{project.handover_date}</span>
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

      {/* STICKY SUB-NAVIGATION - Appears on scroll */}
      <div 
        className={`fixed top-24 sm:top-28 lg:top-32 left-0 right-0 z-40 transition-all duration-300 ${
          showStickyNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-card/98 backdrop-blur-md border-b border-gold/30 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              {/* Tab Navigation */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 py-2">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden md:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-2 shrink-0 py-2">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={scrollToInquiry}
                >
                  Register Interest
                </Button>
                {brochurePrimary && (
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => scrollToRef(brochureRef)}
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Brochure</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <section className="jj-section-champagne">
        <div className="container mx-auto px-4">
          {/* Quick Stats Grid - Premium gold border visible */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Starting Price</p>
              <p className="mt-2 text-xl font-bold text-gold">
                {typeof project.price_from === "number" ? formatPriceUtil(project.price_from) : "On request"}
              </p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Handover</p>
              <p className="mt-2 text-xl font-bold text-foreground">{project.handover_date || "TBA"}</p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Bedrooms</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {bedroomsText || (project.bedrooms_min ? `${project.bedrooms_min} BR` : "Contact Us")}
              </p>
            </div>
            <div className="rounded-xl border-2 border-gold bg-card p-5 text-center shadow-md hover:shadow-lg hover:shadow-gold/20 transition-all">
              <p className="text-meta-xs text-muted-foreground uppercase tracking-wider">Size</p>
              <p className="mt-2 text-xl font-bold text-foreground">
                {sizeText || (project.size_min ? `${project.size_min.toLocaleString()} sqft` : "Contact Us")}
              </p>
            </div>
          </div>

          {/* DETAILS SECTION */}
          <div ref={detailsRef} id="details" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <h2 className="text-h3 font-medium text-foreground">About {project.name}</h2>
              <p className="mt-4 text-body text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.description || "Details will be provided by our team."}
              </p>
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

           {/* UNIQUE SELLING POINTS (USP/Highlights) SECTION */}
           {(project.usp_bullets?.length ?? 0) > 0 && (
             <div ref={uspRef} id="usp" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                  <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
                    <Star className="w-5 h-5 text-gold" />
                    Unique Selling Points
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* USP Image */}
                  {project.usp_image_url && (
                    <div className="rounded-xl overflow-hidden border border-gold/30">
                      <SafeImage 
                        src={project.usp_image_url} 
                        alt={`${project.name} Highlights`} 
                        className="w-full h-[300px] object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                    </div>
                  )}
                  <div className={project.usp_image_url ? "" : "lg:col-span-2"}>
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

           {/* FLOOR PLANS SECTION */}
           {(floorPlanDocs.length > 0 || (project.floor_plan_types?.length ?? 0) > 0) && (
             <div ref={floorPlansRef} id="floor-plans" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                  <h3 className="text-h3-sm font-medium text-foreground">Floor Plans</h3>

                  {floorPlanDocs.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {floorPlanDocs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentDownload("floor_plan", doc.url)}
                          className="rounded-xl border border-gold/30 bg-card p-4 hover:border-gold/60 transition-colors text-left"
                        >
                          <p className="text-sm font-semibold text-foreground truncate">{doc.name || "Floor Plan"}</p>
                          <p className="mt-1 text-xs text-muted-foreground truncate">Click to download</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(project.floor_plan_types || []).map((t, idx) => (
                        <div key={idx} className="rounded-xl border border-border bg-card p-4">
                          <p className="text-sm font-semibold text-foreground">{t.label}</p>
                          {t.pdfUrl ? (
                            <button
                              type="button"
                              className="mt-1 text-xs text-primary underline underline-offset-4"
                              onClick={() => handleDocumentDownload("floor_plan", t.pdfUrl)}
                            >
                              Download
                            </button>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">Available on request</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

           {/* AMENITIES SECTION */}
           {(project.amenities?.length ?? 0) > 0 && (
             <div ref={amenitiesRef} id="amenities" className="mb-12 scroll-mt-40">
               <div className="jj-card-inner">
                  <h3 className="text-h3-sm font-medium text-foreground">Amenities</h3>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {project.amenities!.slice(0, 40).map((a, idx) => (
                      <div key={idx} className="rounded-xl border border-border bg-card p-3">
                        <p className="text-xs text-foreground">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                    <p className="text-muted-foreground leading-relaxed">{project.location_description}</p>
                  )}
                </div>
              )}

              {/* Location Distances */}
              {project.location_distances && project.location_distances.length > 0 && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.location_distances.map((dist, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gold/30 bg-card">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{dist.time}</p>
                        <p className="text-xs text-muted-foreground">{dist.label}</p>
                      </div>
                    </div>
                  ))}
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

              <div className="rounded-xl overflow-hidden border border-gold/30">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${encodeURIComponent(mapQuery)}&maptype=satellite`}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${project.name} Location Map`}
                />
              </div>
            </div>
          </div>

          {/* AI ANALYZER SECTION */}
          <div ref={aiRef} id="ai" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <AIMarketAnalyzer
                type="property"
                name={project.name}
                location={project.location}
                totalPrice={project.price_from ?? undefined}
                size={project.size_min ?? undefined}
                bedrooms={project.bedrooms_min ?? undefined}
                developer={project.developer?.name}
                amenities={project.amenities ?? undefined}
                handoverDate={project.handover_date ?? undefined}
                variant="full"
              />
            </div>
          </div>

          {/* BROCHURE (full width) */}
          <div ref={brochureRef} id="brochure" className="jj-card-inner flex flex-col items-center justify-center py-10 mb-8 scroll-mt-40">
            <h3 className="text-h3-sm font-medium text-foreground mb-8 text-center">Project Brochure</h3>
            <PremiumBrochureCard
              projectName={project.name}
              brochureUrl={brochurePrimary?.url}
              projectImageUrl={project.images?.[0]?.url || undefined}
              onDownloadClick={() => handleDocumentDownload("brochure", brochurePrimary?.url)}
              isLocked={!isLeadCaptured && !!brochurePrimary}
            />
          </div>

           {/* PAYMENT PLAN (full width, separate section) */}
           {(!!project.payment_plan || paymentPlanDocs.length > 0 || !!project.payment_breakdown) && (
           <div ref={paymentRef} id="payment" className="jj-card-inner scroll-mt-40 mb-16">
            <h3 className="text-h3-sm font-medium text-foreground mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              Payment Plan
            </h3>

            {/* Payment Plan Summary */}
            {project.payment_plan && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30">
                <p className="text-lg font-semibold text-foreground text-center">{project.payment_plan}</p>
              </div>
            )}

            {/* Payment Plan Documents */}
            {paymentPlanDocs.length > 0 ? (
              <div className="space-y-3">
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
            ) : (
               <></>
            )}

             {/* Payment breakdown (milestones) */}
             {project.payment_breakdown && (
               <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                 {project.payment_breakdown.down_payment && (
                   <div className="rounded-xl border border-border bg-card p-4">
                     <p className="text-xs text-muted-foreground">Down payment</p>
                     <p className="mt-1 text-base font-semibold text-foreground">{project.payment_breakdown.down_payment}</p>
                   </div>
                 )}
                 {project.payment_breakdown.during_construction && (
                   <div className="rounded-xl border border-border bg-card p-4">
                     <p className="text-xs text-muted-foreground">During construction</p>
                     <p className="mt-1 text-base font-semibold text-foreground">{project.payment_breakdown.during_construction}</p>
                   </div>
                 )}
                 {project.payment_breakdown.on_completion && (
                   <div className="rounded-xl border border-border bg-card p-4">
                     <p className="text-xs text-muted-foreground">On completion</p>
                     <p className="mt-1 text-base font-semibold text-foreground">{project.payment_breakdown.on_completion}</p>
                   </div>
                 )}
               </div>
             )}
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

          {/* INQUIRY FORM - Full Width with premium styling */}
          <div ref={inquiryRef} className="scroll-mt-32 mb-8">
            <div className="jj-card-inner p-8 md:p-10 border-2 border-gold/40 bg-gradient-to-br from-champagne/50 via-champagne-light/30 to-champagne/50">
              <ProjectInquiryForm
                projectId={project.id}
                projectName={project.name}
                projectLocation={project.location || undefined}
                developerName={project.developer?.name}
              />
            </div>
          </div>

          {/* CONTACT DETAILS - Separated Section with Gold Borders */}
          <div className="mb-8">
            <div className="jj-card-inner p-6 md:p-10">
              <h3 className="text-h3-sm font-medium text-foreground mb-8 text-center">Contact Us Directly</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
                <a 
                  href={getWhatsAppUrl(whatsappMessage)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-card via-card to-gold/5 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-7 h-7 text-green-500" />
                  </div>
                  <span className="text-base font-semibold text-foreground">WhatsApp</span>
                  <span className="text-sm text-muted-foreground">{CONTACT_INFO.phone}</span>
                </a>
                <a 
                  href={getCallUrl()}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-card via-card to-gold/5 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-7 h-7 text-gold" />
                  </div>
                  <span className="text-base font-semibold text-foreground">Call Us</span>
                  <span className="text-sm text-muted-foreground">{CONTACT_INFO.phone}</span>
                </a>
                <a 
                  href={getEmailUrl()}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-card via-card to-gold/5 hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-2 border-blue-500/40 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-7 h-7 text-blue-500" />
                  </div>
                  <span className="text-base font-semibold text-foreground">Email</span>
                  <span className="text-sm text-muted-foreground">{CONTACT_INFO.email}</span>
                </a>
              </div>
            </div>
          </div>

          {/* CTA Section - Request a call back */}
          <CallToActionSection projectName={project.name} projectId={project.id} />
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadCaptureOpen}
        onOpenChange={setLeadCaptureOpen}
        projectId={project.id}
        projectName={project.name}
        documentType={captureDocType}
        documentUrl={captureDocUrl}
      />

      {showFooter && <Footer />}
    </>
  );
}
