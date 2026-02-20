import { Link } from "react-router-dom";
import { Sparkles, ChevronRight, CreditCard } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { SafeImage } from "@/components/SafeImage";
import { DeveloperLink } from "@/components/ui/developer-link";
import { useMemo } from "react";
import { formatDisplayDate } from "@/utils/formatDate";
import { useCurrency } from "@/hooks/useCurrency";

interface RecommendedProjectsProps {
  currentProjectId: string;
  currentDeveloperId?: string | null;
  currentLocation?: string | null;
  currentEmirate?: string | null;
}

export default function RecommendedProjects({
  currentProjectId,
  currentDeveloperId,
  currentLocation,
  currentEmirate,
}: RecommendedProjectsProps) {
  const { data: projects } = useProjects();
  const { formatPrice } = useCurrency();

  const recommendedProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    const otherProjects = projects.filter((p) => {
      if (p.id === currentProjectId) return false;
      const status = ((p as any).sale_status || "").toLowerCase();
      if (status.includes("sold")) return false;
      return true;
    });
    const scored = otherProjects.map((p) => {
      let score = 0;
      if (currentDeveloperId && p.developer?.id === currentDeveloperId) score += 10;
      if (currentLocation && p.location?.toLowerCase().includes(currentLocation.toLowerCase())) score += 5;
      if (currentEmirate && p.emirate === currentEmirate) score += 3;
      if (p.images && p.images.length > 0) score += 2;
      if (p.price_from) score += 1;
      return { project: p, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.project);
  }, [projects, currentProjectId, currentDeveloperId, currentLocation, currentEmirate]);

  if (recommendedProjects.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-gold" />
            <h2 className="text-2xl md:text-3xl font-bold text-black">Recommended Projects</h2>
          </div>
          <Link
            to="/properties"
            className="text-gold hover:underline text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Projects Grid — items-stretch ensures equal height columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {recommendedProjects.map((project) => {
            const breakdown = (project as any).payment_breakdown;
            const percentages = breakdown && Array.isArray(breakdown)
              ? breakdown.map((b: any) => b.percentage).filter((p: any) => typeof p === 'number')
              : [];
            const paymentLabel = percentages.length > 0 ? percentages.join('/') : null;
            const saleStatus = (project as any).sale_status || "On Sale";
            const devLogo = (project.developer as any)?.logo_url;

            // Location fallback: location → area_name → emirate
            const displayLocation =
              (project as any).location ||
              (project as any).area_name ||
              (project as any).emirate ||
              null;

            return (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                className="group relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:border-gold/60 transition-all shadow-sm flex flex-col h-full"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative flex-shrink-0">
                  <SafeImage
                    src={project.images?.[0]?.image_url || (project as any).cover_image_url}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges Row — sale status + recommended only */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Sale Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        saleStatus.toLowerCase().includes("sold")
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
                      }`}>
                        {saleStatus}
                      </span>
                    </div>
                    {/* Recommended Badge */}
                    <span className="bg-gold/90 text-black px-2 py-0.5 rounded text-[11px] font-bold">
                      Recommended
                    </span>
                  </div>

                  {/* Developer Logo — Bottom Left */}
                  {devLogo && (
                    <div className="absolute bottom-3 left-3 w-10 h-10 rounded-lg bg-white border border-gold/30 overflow-hidden shadow-md flex items-center justify-center p-1">
                      <SafeImage
                        src={devLogo}
                        alt={project.developer?.name || "Developer"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Handover Date — Bottom Right */}
                  {project.handover_date && (
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-black/70 backdrop-blur-sm text-gold border border-gold/40 px-2 py-0.5 rounded text-[11px] font-bold">
                        {formatDisplayDate(project.handover_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content — flex-col flex-1 so it fills remaining card height */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold text-black group-hover:text-gold transition-colors whitespace-normal break-words leading-tight mb-1">
                    {project.name}
                  </h3>

                  {project.developer && (
                    <DeveloperLink
                      name={project.developer.name}
                      slug={project.developer.slug}
                      className="text-sm mb-1"
                    />
                  )}

                  {/* Location with fallback — flex-1 so it takes up remaining space */}
                  <div className="flex-1">
                    {displayLocation && (
                      <p className="text-muted-foreground text-sm truncate mt-1">
                        {displayLocation}
                      </p>
                    )}
                  </div>

                  {/* Divider + Price — always pinned to bottom via mt-auto */}
                  <div className="border-t border-gold/20 pt-3 mt-4 flex items-center justify-between">
                    {/* Price */}
                    <p className="text-handover font-bold text-sm">
                      {project.price_from
                        ? `From ${formatPrice(project.price_from)}`
                        : "Price on request"
                      }
                    </p>

                    {/* Payment Plan Badge */}
                    {paymentLabel && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-1">
                        <CreditCard className="w-3 h-3" />
                        {paymentLabel}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
