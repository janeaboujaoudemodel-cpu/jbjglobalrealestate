import { useMemo, useRef, useState } from "react";
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
  const inquiryRef = useRef<HTMLDivElement>(null);
  const mortgageRef = useRef<HTMLDivElement>(null);

  const { isLeadCaptured } = useLeadCapture();

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

  const scrollToInquiry = () => {
    inquiryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToMortgage = () => {
    mortgageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  return (
    <>
      {/* HERO SECTION - Full Screen */}
      <section className="relative w-full h-screen min-h-[640px] -mt-24 xl:-mt-28">
        <div className="absolute inset-0">
          {currentHero?.url ? (
            <img src={currentHero.url} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-premium-bg" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-premium-bg via-premium-bg/60 to-transparent" />
        </div>

        {/* Corner badges */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-28 left-4 md:left-8">
            {project.property_type_label && (
              <div className="px-3 py-1 rounded-full bg-overlay/90 text-overlay-foreground border border-gold/50 text-xs font-semibold">
                {project.property_type_label}
              </div>
            )}
          </div>
          <div className="absolute top-28 right-4 md:right-8">
            {project.status_label && (
              <div className="px-3 py-1 rounded-full bg-overlay/90 text-overlay-foreground border border-gold/50 text-xs font-semibold">
                {project.status_label}
              </div>
            )}
          </div>
          <div className="absolute bottom-24 left-4 md:left-8">
            {project.payment_plan && (
              <div className="px-3 py-1 rounded-full bg-overlay/90 text-overlay-foreground border border-gold/50 text-xs font-semibold">
                {project.payment_plan}
              </div>
            )}
          </div>
          <div className="absolute bottom-24 right-4 md:right-8">
            <div className="px-3 py-1 rounded-full bg-overlay/90 text-overlay-foreground border border-gold/50 text-xs font-semibold">
              {project.handover_date || "TBA"}
            </div>
          </div>
        </div>

        {/* Hero navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-overlay/85 border-2 border-gold/60 text-overlay-foreground flex items-center justify-center hover:bg-overlay hover:border-gold transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-overlay/85 border-2 border-gold/60 text-overlay-foreground flex items-center justify-center hover:bg-overlay hover:border-gold transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Hero content */}
        <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-end pt-24 xl:pt-28 pb-16">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-primary-foreground/80 mb-4 flex-wrap">
            <Link to="/" className="hover:text-primary-foreground transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-primary-foreground transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-primary-foreground">{project.name}</span>
          </div>

          {/* Title and info */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-h1-sm md:text-h1-md lg:text-h1 font-semibold text-primary-foreground leading-[1.05]">
                {project.name}
              </h1>

              <div className="mt-3 flex flex-col gap-2">
                {project.developer?.name && (
                  <p className="text-body-lg text-primary-foreground/80">
                    by{" "}
                    {project.developer?.slug ? (
                      <Link to={`/developer/${project.developer.slug}`} className="text-gold hover:underline">
                        {project.developer.name}
                      </Link>
                    ) : (
                      <span className="text-gold">{project.developer.name}</span>
                    )}
                  </p>
                )}

                {project.location && (
                  <p className="text-meta text-primary-foreground/80 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </p>
                )}

                {typeof project.price_from === "number" && (
                  <p className="text-body-lg text-primary-foreground/90">
                    Starting from <span className="text-gold font-semibold">{formatPrice(project.price_from)}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Hero CTAs */}
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={scrollToMortgage}>
                <Calculator className="w-4 h-4" />
                Calculate Mortgage
              </Button>
              <Button variant="hero" size="lg" onClick={scrollToInquiry}>
                Register Interest
              </Button>
            </div>
          </div>
        </div>
      </section>

      {adminBar}

      {/* CONTACT BAR - Sticky */}
      <div className="sticky top-20 sm:top-24 lg:top-28 z-40 bg-card/95 backdrop-blur-md border-b border-gold/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <a href={getWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
              <a href={getCallUrl()}>
                <Button variant="secondary" size="sm">
                  <Phone className="w-4 h-4" />
                  Call
                </Button>
              </a>
              <a href={getEmailUrl()}>
                <Button variant="secondary" size="sm">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-3">
              {brochurePrimary && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleDocumentDownload("brochure", brochurePrimary.url)}
                >
                  <Download className="w-4 h-4" />
                  Brochure
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={scrollToInquiry}>
                Register Interest
              </Button>
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
              <p className="mt-1 text-lg font-semibold text-foreground">
                {typeof project.bedrooms_min === "number"
                  ? project.bedrooms_min === project.bedrooms_max
                    ? `${project.bedrooms_min} BR`
                    : `${project.bedrooms_min}-${project.bedrooms_max} BR`
                  : "Varies"}
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-12">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent border-b border-gold/20 rounded-none p-0 mb-8">
              <TabsTrigger value="details" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-muted-foreground data-[state=active]:bg-transparent">
                <FileText className="w-4 h-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-muted-foreground data-[state=active]:bg-transparent">
                <ImageIcon className="w-4 h-4" />
                Gallery
              </TabsTrigger>
              <TabsTrigger value="floor-plans" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-muted-foreground data-[state=active]:bg-transparent">
                <Layers className="w-4 h-4" />
                Floor Plans
              </TabsTrigger>
              <TabsTrigger value="amenities" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-muted-foreground data-[state=active]:bg-transparent">
                <Building2 className="w-4 h-4" />
                Amenities
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-muted-foreground data-[state=active]:bg-transparent">
                <Sparkles className="w-4 h-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0">
              <div className="jj-card-inner">
                <h2 className="text-h3 font-medium text-foreground">About {project.name}</h2>
                <p className="mt-4 text-body text-muted-foreground leading-relaxed whitespace-pre-line">
                  {project.description || "Details will be added during the next sync."}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-0">
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
                  <p className="text-body text-muted-foreground">Images will appear after the next sync.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="floor-plans" className="mt-0">
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
                  <p className="mt-3 text-body text-muted-foreground">Floor plans will be added during the next sync.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="mt-0">
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
                  <p className="mt-3 text-body text-muted-foreground">Amenities will appear after the next sync.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
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
            </TabsContent>
          </Tabs>

          {/* LOCATION MAP - Full Width */}
          <div className="mb-12">
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

          {/* BROCHURE 3D BOOK + PAYMENT PLAN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* 3D Brochure Book */}
            <div className="jj-card-inner flex flex-col items-center justify-center py-8">
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
            <div className="jj-card-inner">
              <h3 className="text-h3-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Payment Plan
              </h3>
              <p className="text-body text-muted-foreground mb-6">
                {project.payment_plan || "Payment plan details will be added during the next sync."}
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
