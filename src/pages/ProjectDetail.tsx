import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import ImageCarousel from "@/components/ImageCarousel";
import DocumentDownloads from "@/components/DocumentDownloads";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, MapPin, Building, Calendar, DollarSign, Layers, Users } from "lucide-react";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug || "");

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

  return (
    <section className="relative w-full min-h-screen py-8 md:py-16 bg-zinc-950">
      <div className="container mx-auto px-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            <ImageCarousel images={project.images || []} projectName={project.name} />

            {/* Project Title & Description */}
            <div>
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h1
                    className="text-white font-bold mb-2"
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
                {project.price_from && (
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Starting from</p>
                    <p
                      className="text-gold font-bold text-2xl"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {formatPrice(project.price_from)}
                    </p>
                    {project.price_to && project.price_to !== project.price_from && (
                      <p className="text-gray-500 text-sm">
                        up to {formatPrice(project.price_to)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {project.description && (
                <p className="text-gray-300 text-lg leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {project.location && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="text-white">{project.location}</p>
                </div>
              )}

              {project.bedrooms_min && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Bedrooms</span>
                  </div>
                  <p className="text-white">
                    {project.bedrooms_min === project.bedrooms_max
                      ? `${project.bedrooms_min} BR`
                      : `${project.bedrooms_min}-${project.bedrooms_max} BR`}
                  </p>
                </div>
              )}

              {project.floors && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <Building className="w-5 h-5" />
                    <span className="text-sm font-medium">Floors</span>
                  </div>
                  <p className="text-white">{project.floors} Floors</p>
                </div>
              )}

              {project.handover_date && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Handover</span>
                  </div>
                  <p className="text-white">{project.handover_date}</p>
                </div>
              )}

              {project.service_charge && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Service Charge</span>
                  </div>
                  <p className="text-white">{project.service_charge}</p>
                </div>
              )}

              {project.payment_plan && (
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <Layers className="w-5 h-5" />
                    <span className="text-sm font-medium">Payment Plan</span>
                  </div>
                  <p className="text-white">{project.payment_plan}</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h2
                  className="text-white font-semibold mb-4"
                  style={{ fontFamily: "Poppins, sans-serif", fontSize: "24px" }}
                >
                  Amenities
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-gray-300 text-sm"
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
            {/* Downloads */}
            <DocumentDownloads documents={project.documents || []} />

            {/* Contact Card */}
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3
                className="text-white text-xl font-semibold mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Interested in this project?
              </h3>
              <p className="text-gray-400 mb-6">
                Get in touch with our team for more information, pricing, and availability.
              </p>
              <a 
                href={INQUIRY_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-6 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:opacity-90 transition-opacity text-center"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectDetail;
