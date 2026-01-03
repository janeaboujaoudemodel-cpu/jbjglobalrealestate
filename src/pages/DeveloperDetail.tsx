import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

const DeveloperDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading: loadingDeveloper } = useDeveloper(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByDeveloper(slug || "");
  const { data: communities } = useCommunities();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const filteredProjects = useFilteredProjects(projects, filters);

  if (loadingDeveloper) {
    return (
      <section
        className="relative w-full min-h-screen py-16 md:py-24"
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
        }}
      >
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 w-64 bg-[#1a1a1a] mb-4" />
          <Skeleton className="h-6 w-96 bg-[#1a1a1a]" />
        </div>
      </section>
    );
  }

  if (!developer) {
    return (
      <section
        className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
        }}
      >
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Developer not found</h1>
          <Link to="/" className="text-[#D4A017] hover:underline">
            Back to Developers
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
    filters.communityId !== null ||
    filters.handoverYear !== null;

  return (
    <section
      className="relative w-full min-h-screen py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212, 160, 23, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span style={{ fontFamily: "Poppins, sans-serif" }}>Back to Developers</span>
        </Link>

        <h1
          className="text-white font-bold mb-4"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(40px, 6vw, 72px)",
            lineHeight: "1.1",
          }}
        >
          {developer.name}
        </h1>
        {developer.description && (
          <p className="text-gray-400 text-lg mb-12 max-w-3xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            {developer.description}
          </p>
        )}

        <h2
          className="text-white font-semibold mb-8"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "28px",
          }}
        >
          All Projects
        </h2>

        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          communities={communities}
          showDeveloperFilter={false}
        />

        {hasFiltersApplied && (
          <p className="text-gray-400 mb-6">
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        )}

        {loadingProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
                : "No projects available from this developer yet."}
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

export default DeveloperDetail;
