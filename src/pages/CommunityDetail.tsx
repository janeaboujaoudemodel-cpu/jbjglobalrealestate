import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCommunity, useProjectsByCommunity, useDevelopers, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

const CommunityDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: community, isLoading: loadingCommunity } = useCommunity(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByCommunity(slug || "");
  const { data: developers } = useDevelopers();
  const { data: trendingAreas } = useTrendingAreas();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredProjects = useFilteredProjects(projects, filters);

  if (loadingCommunity) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <Skeleton className="h-64 w-full rounded-lg bg-zinc-800 mb-8" />
          <Skeleton className="h-12 w-64 bg-zinc-800 mb-4" />
          <Skeleton className="h-6 w-96 bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (!community) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Community not found</h1>
          <Link to="/communities" className="text-gold hover:underline">
            Back to Communities
          </Link>
        </div>
      </section>
    );
  }

  const hasFiltersApplied = 
    filters.search || 
    filters.priceMin > 0 || 
    filters.priceMax < 500000000 ||
    filters.bedroomsMin !== null ||
    filters.developerId !== null ||
    filters.handoverStatus !== null ||
    filters.emirate !== null ||
    filters.furnishedStatus !== null ||
    filters.views.length > 0 ||
    filters.amenities.length > 0 ||
    filters.facilities.length > 0;

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh]">
        {community.image_url ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-premium-card to-premium-bg" aria-label={community.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        <Link
          to="/communities"
          className="absolute top-6 left-6 flex items-center gap-2 text-black hover:text-gold transition-colors bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] backdrop-blur-sm px-4 py-2 rounded-full border border-gold/40 shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Communities</span>
        </Link>
      </div>

      {/* Content - Global locked gutter */}
      <div className="jj-layer-2 -mt-20 relative z-10 mb-12">
        {/* Layer 2: Active Champagne */}
        <div className="jj-card-inner rounded-xl p-6 md:p-8 shadow-xl">
          {/* Layer 3: Locked Champagne - Community Info Card */}
          <div className="jj-card-inner rounded-xl p-6 md:p-8">
            <h1 className="text-black font-bold mb-2 text-3xl md:text-4xl lg:text-5xl">
              <span className="text-gold">{community.name.split(' ')[0]}</span> {community.name.split(' ').slice(1).join(' ')}
            </h1>
            {community.location && (
              <p className="text-gold text-lg mb-4 font-medium">{community.location}</p>
            )}
            {community.description && (
              <p className="text-zinc-700 text-lg max-w-3xl">{community.description}</p>
            )}
          </div>
        </div>

        {/* Projects Section - Layer 2: Active Champagne */}
        <div className="py-10 px-4 md:px-8 jj-layer-active rounded-2xl shadow-lg">
          {/* Layer 3: Locked Champagne */}
          <div className="jj-card-inner rounded-xl p-6 md:p-8">
            <h2 className="text-black font-semibold mb-6 text-2xl">
              <span className="text-gold">Projects</span> in {community.name}
            </h2>

            <ProjectFilters
              filters={filters}
              onFiltersChange={setFilters}
              developers={developers}
              trendingAreas={trendingAreas}
              showCommunityFilter={false}
            />

            {hasFiltersApplied && (
              <p className="text-zinc-600 mb-6">
                Found <span className="text-gold font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
              </p>
            )}

            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-champagne/50" />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} currency={filters.currency} sizeUnit={filters.sizeUnit} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-lg border-2 border-gold/30">
                <p className="text-zinc-700 mb-2">
                  {hasFiltersApplied
                    ? "No projects match your filters"
                    : "No projects available in this community yet."}
                </p>
                {hasFiltersApplied && (
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="text-gold hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Educational Disclaimer - Layer 2 + Layer 3 */}
        <div className="mt-8 py-6 px-4 md:px-6 jj-layer-active rounded-xl">
          <div className="jj-card-inner rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-lg flex items-center justify-center flex-shrink-0 border border-gold/30">
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-gold font-semibold mb-1">Information provided is for general guidance only</h3>
                <p className="text-zinc-700 text-sm">This community guide provides educational information about {community.name}. For specific property inquiries, please contact our team.</p>
              </div>
            </div>
          </div>
        </div>

        {/* View All Areas CTA */}
        <div className="mt-8 text-center">
          <Link 
            to="/areas"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
          >
            <span className="text-gold font-semibold">View All Area Guides</span>
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CommunityDetail;
