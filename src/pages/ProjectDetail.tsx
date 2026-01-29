import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import ImageCarousel from "@/components/ImageCarousel";
import DocumentDownloads from "@/components/DocumentDownloads";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyReportModal from "@/components/PropertyReportModal";
import ProjectInquiryForm from "@/components/project-detail/ProjectInquiryForm";
import ProjectDetailTabs from "@/components/project-detail/ProjectDetailTabs";
import AIMarketAnalyzer from "@/components/AIMarketAnalyzer";
import MortgageCalculator from "@/components/MortgageCalculator";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  MapPin, 
  Download, 
  FileText, 
  MessageCircle, 
  Phone, 
  Home,
  Bed,
  Building2,
  Calendar,
  DollarSign,
  Layers,
  Map as MapIcon,
  Info,
  Scale,
  ChevronRight
} from "lucide-react";
import { getWhatsAppUrl, getCallUrl } from "@/constants/stats";

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug || "");
  const [showReportModal, setShowReportModal] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const inquiryRef = useRef<HTMLDivElement>(null);
  
  // Track scroll for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set CSS variable to control header transparency on this page
  useEffect(() => {
    document.documentElement.style.setProperty('--header-bg-opacity', isScrolled ? '1' : '0');
    document.documentElement.classList.add('project-detail-page');
    return () => {
      document.documentElement.style.removeProperty('--header-bg-opacity');
      document.documentElement.classList.remove('project-detail-page');
    };
  }, [isScrolled]);
  
  const scrollToInquiry = () => {
    inquiryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 bg-zinc-800 mb-8" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg bg-zinc-800 mb-8" />
          <Skeleton className="h-12 w-64 bg-zinc-800 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Project not found</h1>
          <Link to="/properties" className="text-primary hover:underline">
            Back to Properties
          </Link>
        </div>
      </section>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(2)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const whatsappMessage = `Hi, I'm interested in ${project.name}${project.location ? ` at ${project.location}` : ''}. Please share more details.`;
  const brochure = project.documents?.find(doc => doc.document_type === 'brochure');

  const handleWhatsApp = () => {
    window.open(getWhatsAppUrl(whatsappMessage), '_blank');
  };

  const handleCall = () => {
    window.location.href = getCallUrl();
  };

  const heroImages = project.images?.filter(img => img.image_url) || [];
  const currentHeroImage = heroImages[heroImageIndex] || heroImages[0];

  const goToPrevHero = () => {
    setHeroImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const goToNextHero = () => {
    setHeroImageIndex((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Full-Screen Hero Section - Transparent header on load */}
      <section className="relative w-full h-screen min-h-[600px]">
        {/* Background Image - Full viewport */}
        <div className="absolute inset-0">
          {currentHeroImage?.image_url ? (
            <img 
              src={currentHeroImage.image_url} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          {/* Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        </div>

        {/* Hero Navigation Arrows - Premium Gold Style (same as listing cards) */}
        {heroImages.length > 1 && (
          <>
            <button
              onClick={goToPrevHero}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-card border-2 border-gold/60 text-gold flex items-center justify-center shadow-lg hover:bg-gold hover:text-black hover:border-gold transition-all duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNextHero}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-card border-2 border-gold/60 text-gold flex items-center justify-center shadow-lg hover:bg-gold hover:text-black hover:border-gold transition-all duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Image Counter */}
            <div className="absolute bottom-32 right-8 bg-black/50 px-4 py-2 rounded-full text-white text-sm z-20">
              {heroImageIndex + 1} / {heroImages.length}
            </div>
          </>
        )}

        {/* Hero Content - Positioned at bottom */}
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end pb-16 pt-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4 flex-wrap text-white/80">
            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-white transition-colors">
              All Projects in Dubai
            </Link>
            {project.location && (
              <>
                <span>/</span>
                <span>{project.location}</span>
              </>
            )}
            <span>/</span>
            <span className="text-white">{project.name}</span>
          </div>

          {/* Title and CTA */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-3">
                {project.name}
              </h1>
              {project.developer && (
                <p className="text-xl text-white/80">
                  by{' '}
                  <Link 
                    to={`/developer/${project.developer.slug}`}
                    className="text-gold hover:underline font-medium"
                  >
                    {project.developer.name}
                  </Link>
                </p>
              )}
              {project.location && (
                <p className="text-white/70 mt-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {brochure && (
                <a href={brochure.file_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                    <Download className="w-4 h-4 mr-2" />
                    Download Brochure
                  </Button>
                </a>
              )}
              <Button 
                onClick={scrollToInquiry}
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-black font-semibold"
              >
                Register Interest
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Tabs Section */}
          <ProjectDetailTabs project={project} />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Carousel */}
              <div className="bg-zinc-50 rounded-xl p-4">
                <ImageCarousel images={project.images || []} projectName={project.name} />
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.price_from && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Starting Price</span>
                    </div>
                    <p className="text-xl font-bold text-black">{formatPrice(project.price_from)}</p>
                  </div>
                )}
                
                {project.handover_date && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Handover</span>
                    </div>
                    <p className="text-xl font-bold text-handover">{project.handover_date}</p>
                  </div>
                )}

                {project.payment_plan && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Layers className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Payment Plan</span>
                    </div>
                    <p className="text-xl font-bold text-black">{project.payment_plan}</p>
                  </div>
                )}

                {project.location && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Location</span>
                    </div>
                    <p className="text-lg font-semibold text-black">{project.location}</p>
                  </div>
                )}

                {project.bedrooms_min && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Bed className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Bedrooms</span>
                    </div>
                    <p className="text-lg font-semibold text-black">
                      {project.bedrooms_min === project.bedrooms_max
                        ? project.bedrooms_min === 0 ? "Studio" : `${project.bedrooms_min} BR`
                        : `${project.bedrooms_min === 0 ? "Studio" : project.bedrooms_min}-${project.bedrooms_max} BR`}
                    </p>
                  </div>
                )}

                {project.floors && (
                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Building2 className="w-5 h-5" />
                      <span className="text-sm font-medium text-zinc-600">Floors</span>
                    </div>
                    <p className="text-lg font-semibold text-black">{project.floors} Floors</p>
                  </div>
                )}
              </div>

              {/* Location Map */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-black">Location</h3>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.name + (project.location ? ", " + project.location : "") + ", Dubai, UAE")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
                  >
                    <MapIcon className="w-4 h-4" />
                    View Larger Map
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(project.name + (project.location ? ", " + project.location : "") + ", Dubai, UAE")}&maptype=satellite`}
                    width="100%"
                    height="350"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${project.name} Location Map`}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Use two fingers to zoom on touch devices
                </p>
              </div>

              {/* Inquiry Form - After Location */}
              <div ref={inquiryRef}>
                <ProjectInquiryForm 
                  projectId={project.id}
                  projectName={project.name}
                  projectLocation={project.location}
                  developerName={project.developer?.name}
                />
              </div>

              {/* AI Market Analysis */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-black">AI Market Analysis</h3>
                </div>
                <AIMarketAnalyzer
                  type="property"
                  name={project.name}
                  location={project.location || project.community?.name}
                  pricePerSqft={project.price_from && project.size_min ? Math.round(project.price_from / project.size_min) : undefined}
                  totalPrice={project.price_from}
                  size={project.size_min}
                  bedrooms={project.bedrooms_min}
                  developer={project.developer?.name}
                  amenities={project.amenities}
                  handoverDate={project.handover_date}
                  variant="full"
                />
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Get in Touch</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCall}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-black hover:bg-zinc-800 text-white font-medium transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    Call
                  </button>
                </div>
              </div>

              {/* Property Report */}
              <div className="bg-zinc-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-black">Property Report</h3>
                </div>
                <p className="text-zinc-600 text-sm mb-4">
                  Download a comprehensive report with all details, photos, and investment info.
                </p>
                <Button
                  onClick={() => setShowReportModal(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>

              {/* Documents */}
              <div className="bg-zinc-50 rounded-xl">
                <DocumentDownloads documents={project.documents || []} />
              </div>

              {/* Mortgage Calculator - Single Column Layout */}
              {project.price_from && (
                <div className="bg-zinc-50 rounded-xl overflow-hidden">
                  <MortgageCalculator defaultPrice={project.price_from} compact={true} />
                </div>
              )}

              {/* Compare Link */}
              <Link to={`/compare?project=${project.slug}`}>
                <div className="bg-zinc-50 rounded-xl p-6 hover:bg-zinc-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold text-black">Compare Properties</h3>
                      <p className="text-zinc-500 text-sm">Find similar options</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <PropertyReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        project={project}
      />
    </>
  );
};

export default ProjectDetail;