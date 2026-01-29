import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MortgageCalculator from "@/components/MortgageCalculator";
import ImageCarousel from "@/components/ImageCarousel";
import ProjectInquiryForm from "@/components/project-detail/ProjectInquiryForm";
import AIMarketAnalyzer from "@/components/AIMarketAnalyzer";
import BrochureBook3D from "@/components/project-detail/BrochureBook3D";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";
import Footer from "@/components/Footer";
import { CONTACT_INFO, getCallUrl, getEmailUrl, getWhatsAppUrl } from "@/constants/stats";
import { useLeadCapture } from "@/hooks/useLeadCapture";

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
};

interface ProjectDetailLayoutProps {
  project: ProjectDetailData;
  adminBar?: React.ReactNode;
  onRequestReport?: () => void;
  showFooter?: boolean;
}

const formatPrice = (price: number) => {
  if (price >= 1000000) return `AED ${(price / 1000000).toFixed(2)}M`;
  return `AED ${price.toLocaleString()}`;
};

const MAPS_API_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

// Sticky sub-nav tabs config
const SUB_NAV_TABS = [
  { id: "details", label: "Details", icon: FileText },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "floor-plans", label: "Floor Plans", icon: Layers },
  { id: "amenities", label: "Amenities", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
  { id: "payment", label: "Payment Plan", icon: CreditCard },
  { id: "brochure", label: "Brochure", icon: Download },
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
  const [heroIndex, setHeroIndex] = useState(0);
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
  const currentHero = images[heroIndex] || images[0];

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

  const whatsappMessage = `Hi, I'm interested in ${project.name}${project.location ? ` at ${project.location}` : ""}. Please share more details.`;

  const goPrev = () => setHeroIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  const goNext = () => setHeroIndex((p) => (p === images.length - 1 ? 0 : p + 1));

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
      "floor-plans": floorPlansRef,
      amenities: amenitiesRef,
      location: locationRef,
      payment: paymentRef,
      brochure: brochureRef,
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
          {currentHero?.url ? (
            <img src={currentHero.url} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-premium-bg" />
          )}
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Hero navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/20 hover:border-white/40 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
            
            {/* Image dots */}
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {images.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === heroIndex ? "bg-gold w-8" : "bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Hero content - Bottom aligned */}
        <div className="relative z-20 container mx-auto px-4 md:px-8 h-full flex flex-col justify-end pb-8">
          {/* Starting Price - Above title */}
          {typeof project.price_from === "number" && (
            <p className="text-lg md:text-xl text-white/80 mb-2">
              Starting from <span className="text-gold font-bold text-2xl md:text-3xl">{formatPrice(project.price_from)}</span>
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
            {project.payment_plan && (
              <div className="flex items-center gap-2 text-white/90">
                <CreditCard className="w-5 h-5 text-gold" />
                <span className="text-sm md:text-base">{project.payment_plan}</span>
              </div>
            )}
          </div>

          {/* Hero CTAs - Download Brochure + Register Interest */}
          <div className="flex flex-wrap gap-4">
            {brochurePrimary && (
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                onClick={() => handleDocumentDownload("brochure", brochurePrimary.url)}
              >
                <Download className="w-5 h-5" />
                Download Brochure
              </Button>
            )}
            <Button 
              variant="hero" 
              size="lg"
              onClick={scrollToInquiry}
            >
              Register Interest
            </Button>
          </div>
        </div>
      </section>

      {adminBar}

      {/* STICKY SUB-NAVIGATION - Appears on scroll */}
      <div 
        className={`fixed top-20 sm:top-24 lg:top-28 left-0 right-0 z-40 transition-all duration-300 ${
          showStickyNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-card/98 backdrop-blur-md border-b border-gold/30 shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              {/* Tab Navigation */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-1 py-2">
                  {SUB_NAV_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? "bg-gold/20 text-gold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                    onClick={() => handleDocumentDownload("brochure", brochurePrimary.url)}
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
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="jj-card-inner p-4 text-center">
              <p className="text-meta-xs text-muted-foreground">Starting Price</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {typeof project.price_from === "number" ? formatPrice(project.price_from) : "On request"}
              </p>
            </div>
            <div className="jj-card-inner p-4 text-center">
              <p className="text-meta-xs text-muted-foreground">Handover</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{project.handover_date || "TBA"}</p>
            </div>
            <div className="jj-card-inner p-4 text-center">
              <p className="text-meta-xs text-muted-foreground">Payment Plan</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{project.payment_plan || "Available"}</p>
            </div>
            <div className="jj-card-inner p-4 text-center">
              <p className="text-meta-xs text-muted-foreground">Bedrooms</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{bedroomsText || "Varies"}</p>
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
          <div ref={galleryRef} id="gallery" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              {images.length ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-h3-sm font-medium text-foreground">Project Gallery</h3>
                    <Button
                      variant="secondary"
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
                </>
              ) : (
                <p className="text-body text-muted-foreground">Gallery images will be available soon.</p>
              )}
            </div>
          </div>

          {/* FLOOR PLANS SECTION */}
          <div ref={floorPlansRef} id="floor-plans" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <h3 className="text-h3-sm font-medium text-foreground">Floor Plans</h3>
              {floorPlanDocs.length ? (
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
                <p className="mt-3 text-body text-muted-foreground">Floor plans will be available upon request.</p>
              )}
            </div>
          </div>

          {/* AMENITIES SECTION */}
          <div ref={amenitiesRef} id="amenities" className="mb-12 scroll-mt-40">
            <div className="jj-card-inner">
              <h3 className="text-h3-sm font-medium text-foreground">Amenities</h3>
              {project.amenities?.length ? (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {project.amenities.slice(0, 40).map((a, idx) => (
                    <div key={idx} className="rounded-xl border border-gold/30 bg-card p-3">
                      <p className="text-xs text-foreground">{a}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-body text-muted-foreground">Amenities will be available soon.</p>
              )}
            </div>
          </div>

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

          {/* BROCHURE 3D BOOK + PAYMENT PLAN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* 3D Brochure Book */}
            <div ref={brochureRef} id="brochure" className="jj-card-inner flex flex-col items-center justify-center py-8 scroll-mt-40">
              <h3 className="text-h3-sm font-medium text-foreground mb-6 text-center">Project Brochure</h3>
              <BrochureBook3D
                projectName={project.name}
                developerName={project.developer?.name}
                brochureUrl={brochurePrimary?.url}
                onDownloadClick={() => handleDocumentDownload("brochure", brochurePrimary?.url)}
                isLocked={!isLeadCaptured && !!brochurePrimary}
                coverImageUrl={heroImageUrl}
              />
            </div>

            {/* Payment Plan */}
            <div ref={paymentRef} id="payment" className="jj-card-inner scroll-mt-40">
              <h3 className="text-h3-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Payment Plan
              </h3>
              <p className="text-body text-muted-foreground mb-6">
                {project.payment_plan || "Payment plan details available upon request."}
              </p>

              {paymentPlanDocs.length > 0 && (
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
              )}

              <div className="mt-6 pt-6 border-t border-gold/20">
                <Button variant="primary" className="w-full" onClick={scrollToInquiry}>
                  Request Detailed Payment Plan
                </Button>
              </div>
            </div>
          </div>

          {/* MORTGAGE CALCULATOR - Full Width */}
          <div ref={mortgageRef} className="mb-12 scroll-mt-32">
            <div className="jj-card-inner p-0 overflow-hidden">
              <MortgageCalculator
                defaultPrice={project.price_from ?? 2000000}
                compact={false}
                context={{ projectName: project.name, location: project.location || undefined }}
                showAssistant
              />
            </div>
          </div>

          {/* INQUIRY FORM - Full Width */}
          <div ref={inquiryRef} className="scroll-mt-32">
            <ProjectInquiryForm
              projectId={project.id}
              projectName={project.name}
              projectLocation={project.location || undefined}
              developerName={project.developer?.name}
            />
          </div>
        </div>
      </section>

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
