import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import ImageCarousel from "@/components/ImageCarousel";
import DocumentDownloads from "@/components/DocumentDownloads";
import ShareButton from "@/components/ShareButton";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyReportModal from "@/components/PropertyReportModal";
import ClientMarketContext from "@/components/client-intelligence/ClientMarketContext";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Building, Calendar, DollarSign, Layers, Users, Map, Download, FileText, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "971565911000";

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug || "");
  const [showReportModal, setShowReportModal] = useState(false);
  if (isLoading) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950">
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
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Project not found</h1>
          <Link to="/" className="text-gold hover:underline">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `AED ${(price / 1000000).toFixed(1)}M`;
    }
    return `AED ${price.toLocaleString()}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi, I'm interested in ${project.name}. Please share more details.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    window.open(`tel:+${WHATSAPP_NUMBER}`, "_self");
  };

  return (
    <>
    <section className="relative w-full py-8 md:py-16 bg-zinc-950">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 flex-wrap">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            Home
          </Link>
          {project.developer && (
            <>
              <span className="text-gray-600">/</span>
              <Link
                to={`/developer/${project.developer.slug}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {project.developer.name}
              </Link>
            </>
          )}
          {project.community && (
            <>
              <span className="text-gray-600">/</span>
              <Link
                to={`/community/${project.community.slug}`}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {project.community.name}
              </Link>
            </>
          )}
          <span className="text-gray-600">/</span>
          <span className="text-white">{project.name}</span>
        </div>

        {/* White Content Area */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-xl mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Carousel */}
              <ImageCarousel images={project.images || []} projectName={project.name} />

              {/* Project Title & Description */}
              <div>
                <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                  <div className="flex-1">
                    <h1
                      className="text-black font-bold mb-2"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "clamp(28px, 4vw, 48px)",
                        lineHeight: "1.2",
                      }}
                    >
                      {project.name}
                    </h1>
                    {project.developer && (
                      <p className="text-gold" style={{ fontFamily: "Poppins, sans-serif" }}>
                        by {project.developer.name}
                      </p>
                    )}
                  </div>
                
                  {/* Right side - Price, Actions, Map */}
                  <div className="flex flex-col items-end gap-3">
                    {project.price_from && (
                      <div className="text-right">
                        <p className="text-zinc-500 text-sm">Starting from</p>
                        <p
                          className="text-gold font-bold text-2xl"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          {formatPrice(project.price_from)}
                        </p>
                        {project.price_to && project.price_to !== project.price_from && (
                          <p className="text-zinc-400 text-sm">
                            up to {formatPrice(project.price_to)}
                          </p>
                        )}
                      </div>
                    )}
                  
                    {/* Action Buttons - Right Aligned */}
                    <div className="flex items-center gap-2">
                      <FavoriteButton projectId={project.id} showShortlist={true} />
                      <ShareButton projectName={project.name} projectSlug={project.slug} />
                    </div>

                    {/* Google Maps Link - Uses project name for accurate search */}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.name + (project.location ? ", " + project.location : "") + ", Dubai, UAE")}&basemap=satellite`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-gold text-gold hover:bg-gold hover:text-black font-medium"
                      >
                        <Map className="w-4 h-4 mr-2 text-gold" />
                        View on Map
                      </Button>
                    </a>
                  </div>
              </div>

                {project.description && (
                  <p className="text-zinc-600 text-lg leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.location && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm font-medium">Location</span>
                    </div>
                    <p className="text-black">{project.location}</p>
                  </div>
                )}

                {project.bedrooms_min && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-medium">Bedrooms</span>
                    </div>
                    <p className="text-black">
                      {project.bedrooms_min === project.bedrooms_max
                        ? `${project.bedrooms_min} BR`
                        : `${project.bedrooms_min}-${project.bedrooms_max} BR`}
                    </p>
                  </div>
                )}

                {project.floors && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <Building className="w-5 h-5" />
                      <span className="text-sm font-medium">Floors</span>
                    </div>
                    <p className="text-black">{project.floors} Floors</p>
                  </div>
                )}

                {project.handover_date && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-medium">Handover</span>
                    </div>
                    <p className="text-black">{project.handover_date}</p>
                  </div>
                )}

                {project.service_charge && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <DollarSign className="w-5 h-5" />
                      <span className="text-sm font-medium">Service Charge</span>
                    </div>
                    <p className="text-black">{project.service_charge}</p>
                  </div>
                )}

                {project.payment_plan && (
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2 text-gold mb-2">
                      <Layers className="w-5 h-5" />
                      <span className="text-sm font-medium">Payment Plan</span>
                    </div>
                    <p className="text-black">{project.payment_plan}</p>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {project.amenities && project.amenities.length > 0 && (
                <div>
                  <h2
                    className="text-black font-semibold mb-4"
                    style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px" }}
                  >
                    Amenities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-zinc-700 text-sm font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold h-12 flex items-center justify-center"
                >
                  <MessageCircle className="w-5 h-5 mr-2 text-white" />
                  <span>WhatsApp</span>
                </Button>
                <Button
                  onClick={handleCall}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 mr-2 text-white" />
                  <span>Call Now</span>
                </Button>
              </div>

              {/* Exclusive Report & Share */}
              <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                    <FileText className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-black font-semibold">Property Report</h3>
                    <p className="text-zinc-500 text-sm">Download or share details</p>
                  </div>
                </div>
                <p className="text-zinc-500 text-sm mb-4">
                  Get a comprehensive report with all property details, photos, payment plans, and investment info.
                </p>
                <Button
                  onClick={() => setShowReportModal(true)}
                  className="w-full bg-gold text-black hover:bg-gold-light font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download & Share Report
                </Button>
              </div>

              {/* Market Context - Client Intelligence */}
              <ClientMarketContext
                areaName={project.community?.name || project.location || "Dubai"}
                trendDirection="stable"
                rentDemandLevel="moderate"
              />

              {/* Downloads */}
              <DocumentDownloads documents={project.documents || []} />

              {/* Contact Card */}
              <div className="bg-zinc-50 rounded-lg p-6 border border-zinc-200">
                <h3
                  className="text-black text-xl font-semibold mb-4"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Interested in this project?
                </h3>
                <p className="text-zinc-500 mb-6">
                  Get in touch with our team for more information, pricing, and availability.
                </p>
                <a 
                  href="https://wa.me/971565911000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-6 bg-white text-gold border-2 border-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition-all duration-300 text-center"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <Footer />

    {/* Property Report Modal */}
    <PropertyReportModal
      open={showReportModal}
      onOpenChange={setShowReportModal}
      project={project}
    />
    </>
  );
};

export default ProjectDetail;
