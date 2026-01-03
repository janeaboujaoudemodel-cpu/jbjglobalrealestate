import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, MapPin, Calendar, TrendingUp, Briefcase } from "lucide-react";

const DeveloperDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading: loadingDeveloper } = useDeveloper(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByDeveloper(slug || "");
  const { data: communities } = useCommunities();
  const { data: trendingAreas } = useTrendingAreas();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);

  // Apply emirate filter to projects first
  const emirateFilteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!selectedEmirate) return projects;
    return projects.filter((p) => p.emirate === selectedEmirate);
  }, [projects, selectedEmirate]);

  const filteredProjects = useFilteredProjects(emirateFilteredProjects, filters);

  if (loadingDeveloper) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950">
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 w-64 bg-zinc-800 mb-4" />
          <Skeleton className="h-6 w-96 bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (!developer) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Developer not found</h1>
          <Link to="/" className="text-white hover:underline">
            Back to Developers
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
    filters.communityId !== null ||
    filters.handoverStatus !== null ||
    filters.furnishedStatus !== null ||
    filters.views.length > 0 ||
    filters.amenities.length > 0 ||
    filters.facilities.length > 0;

  // Developer stats
  const stats = [
    { 
      label: "Founded", 
      value: developer.founded_year || "N/A",
      icon: Calendar 
    },
    { 
      label: "Completed", 
      value: developer.completed_projects ? `${developer.completed_projects}+` : "N/A",
      icon: Building2 
    },
    { 
      label: "Off-Plan", 
      value: developer.offplan_projects ? `${developer.offplan_projects}+` : "N/A",
      icon: TrendingUp 
    },
    { 
      label: "Headquarters", 
      value: developer.headquarters || "UAE",
      icon: MapPin 
    },
  ];

  return (
    <section className="relative w-full min-h-screen py-8 md:py-16 bg-zinc-950">
      {/* Subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-zinc-900/50 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back to Developers</span>
        </Link>

        {/* Developer Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            {developer.logo_url && (
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                <img
                  src={developer.logo_url}
                  alt={developer.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-white text-4xl md:text-5xl font-bold mb-3">
                {developer.name}
              </h1>
              {developer.description && (
                <p className="text-zinc-400 text-lg max-w-3xl leading-relaxed">
                  {developer.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <stat.icon className="w-4 h-4" />
                  {stat.label}
                </div>
                <p className="text-white text-xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emirates Tabs */}
        <EmiratesTabs
          projects={projects}
          selectedEmirate={selectedEmirate}
          onEmirateSelect={(emirate) => {
            setSelectedEmirate(emirate);
            // Reset other filters when changing emirate
            setFilters({ ...defaultFilters, emirate: emirate });
          }}
        />

        {/* Projects Section */}
        <div className="mb-6">
          <h2 className="text-white text-2xl font-semibold mb-6">
            {selectedEmirate ? `Projects in ${selectedEmirate}` : "All Projects"}
          </h2>

          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
            communities={communities}
            trendingAreas={trendingAreas}
            showDeveloperFilter={false}
          />
        </div>

        {hasFiltersApplied && (
          <p className="text-zinc-400 mb-6">
            Found <span className="text-white font-semibold">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? "s" : ""}
          </p>
        )}

        {loadingProjects ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-zinc-800" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
            <Building2 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 mb-2">
              {hasFiltersApplied
                ? "No projects match your filters"
                : selectedEmirate
                ? `No projects in ${selectedEmirate} yet`
                : "No projects available from this developer yet."}
            </p>
            {(hasFiltersApplied || selectedEmirate) && (
              <button
                onClick={() => {
                  setFilters(defaultFilters);
                  setSelectedEmirate(null);
                }}
                className="text-white hover:underline mt-2 text-sm"
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
