import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCommunity, useProjectsByCommunity, useDevelopers } from "@/hooks/useProjects";
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
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredProjects = useFilteredProjects(projects, filters);

  if (loadingCommunity) {
    return (
      <section
        className="relative w-full min-h-screen py-16 md:py-24"
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <Skeleton className="h-64 w-full rounded-lg bg-[#1a1a1a] mb-8" />
          <Skeleton className="h-12 w-64 bg-[#1a1a1a] mb-4" />
          <Skeleton className="h-6 w-96 bg-[#1a1a1a]" />
        </div>
      </section>
    );
  }

  if (!community) {
    return (
      <section
        className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
        }}
      >
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Community not found</h1>
          <Link to="/communities" className="text-[#D4A017] hover:underline">
            Back to Communities
          </Link>
        </div>
      </section>
    );
  }

  const hasFiltersApplied = 
    filters.search || 
    filters.priceMin > 0 || 
    filters.priceMax < 50000000 ||
    filters.bedroomsMin !== null ||
    filters.developerId !== null ||
    filters.handoverYear !== null;

  return (
    <section
      className="relative w-full min-h-screen"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
      }}
    >
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <img
          src={community.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600"}
          alt={community.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-transparent" />
        
        <Link
          to="/communities"
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span style={{ fontFamily: "Poppins, sans-serif" }}>Back to Communities</span>
        </Link>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-16">
        <h1
          className="text-white font-bold mb-2"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: "1.2",
          }}
        >
          {community.name}
        </h1>
        {community.location && (
          <p className="text-[#D4A017] text-lg mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            {community.location}
          </p>
        )}
        {community.description && (
          <p className="text-gray-400 text-lg mb-12 max-w-3xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            {community.description}
          </p>
        )}

        <h2
          className="text-white font-semibold mb-8"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "28px",
          }}
        >
          Projects in {community.name}
        </h2>

        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          developers={developers}
          showCommunityFilter={false}
        />

        {hasFiltersApplied && (
          <p className="text-gray-400 mb-6">
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        )}

        {loadingProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-[#1a1a1a]" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-lg">
            <p className="text-gray-400 mb-2">
              {hasFiltersApplied
                ? "No projects match your filters"
                : "No projects available in this community yet."}
            </p>
            {hasFiltersApplied && (
              <button
                onClick={() => setFilters(defaultFilters)}
                className="text-[#D4A017] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommunityDetail;
