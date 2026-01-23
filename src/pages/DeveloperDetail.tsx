import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, MapPin, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const DeveloperDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading: loadingDeveloper } = useDeveloper(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByDeveloper(slug || "");
  const { data: communities } = useCommunities();
  const { data: trendingAreas } = useTrendingAreas();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);

  // Apply emirate filter first, then apply other filters
  const projectsInEmirate = useMemo(() => {
    if (!projects) return [];
    if (!selectedEmirate) return projects;
    return projects.filter((p) => p.emirate === selectedEmirate);
  }, [projects, selectedEmirate]);

  const filteredProjects = useFilteredProjects(projectsInEmirate, filters);

  const hasFiltersApplied =
    filters.search ||
    filters.priceMin > 0 ||
    filters.priceMax < 500000000 ||
    filters.bedroomsMin !== null ||
    filters.communityId !== null ||
    filters.handoverStatus !== null ||
    filters.trendingArea !== null ||
    filters.furnishedStatus !== null ||
    filters.views.length > 0 ||
    filters.amenities.length > 0 ||
    filters.facilities.length > 0 ||
    filters.premiumOnly;

  if (loadingDeveloper) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-premium-bg">
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 w-64 bg-champagne/50 mb-4" />
          <Skeleton className="h-6 w-96 bg-champagne/50" />
        </div>
      </section>
    );
  }

  if (!developer) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-premium-bg">
        <div className="text-center">
          <h1 className="text-foreground text-2xl mb-4">Developer not found</h1>
          <Link to="/developers" className="text-gold hover:underline">
            Back to Developers
          </Link>
        </div>
      </section>
    );
  }

  const stats = [
    {
      icon: Calendar,
      label: "Founded",
      value: developer.founded_year || "N/A",
    },
    {
      icon: Building2,
      label: "Units Delivered",
      value: developer.completed_projects
        ? `${developer.completed_projects.toLocaleString()}+`
        : "N/A",
    },
    {
      icon: TrendingUp,
      label: "Active Projects",
      value: developer.offplan_projects || projects?.length || "N/A",
    },
    {
      icon: MapPin,
      label: "Headquarters",
      value: developer.headquarters || "UAE",
    },
  ];

  return (
    <section className="relative w-full min-h-screen bg-premium-bg">
      {/* Top spacing + back action */}
      <div className="container mx-auto px-4 pt-8 md:pt-12">
        <Button asChild variant="secondary" size="sm">
          <Link to="/developers" className="inline-flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Developers</span>
          </Link>
        </Button>
      </div>

      {/* Content (New JJ 3-layer system) */}
      <div className="jj-layer-2 mt-6 md:mt-8 mb-12">
        {/* Layer 3: Developer header */}
        <div className="jj-card-inner">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Logo plate (high contrast white background) */}
            <div className="w-full md:w-[280px]">
              <div className="h-28 rounded-xl border border-gold/30 bg-card flex items-center justify-center overflow-hidden p-4">
                {developer.logo_url ? (
                  <img
                    src={developer.logo_url}
                    alt={`${developer.name} logo`}
                    className="max-h-20 w-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-foreground font-semibold">{developer.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Text */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                <span className="text-gold">{developer.name.split(" ")[0]}</span>{" "}
                {developer.name.split(" ").slice(1).join(" ")}
              </h1>
              {developer.description && (
                <p className="text-foreground/75 text-base md:text-lg max-w-3xl leading-relaxed">
                  {developer.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="jj-box-active p-4">
                    <div className="flex items-center gap-2 text-foreground/70 text-sm mb-1">
                      <stat.icon className="w-4 h-4 text-gold" />
                      {stat.label}
                    </div>
                    <p className="text-foreground text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2: Projects section */}
        <div className="mt-8 jj-layer-active p-4 md:p-6">
          <div className="jj-card-inner">
            {/* Emirates Tabs */}
            <EmiratesTabs
              projects={projects}
              selectedEmirate={selectedEmirate}
              onEmirateSelect={(emirate) => {
                setSelectedEmirate(emirate);
                setFilters({ ...defaultFilters, emirate: emirate });
              }}
            />

            <h2 className="text-foreground text-2xl font-semibold mb-6">
              {selectedEmirate ? `Projects in ${selectedEmirate}` : "All Projects"}
            </h2>

            <ProjectFilters
              filters={filters}
              onFiltersChange={setFilters}
              communities={communities}
              trendingAreas={trendingAreas}
              showDeveloperFilter={false}
            />

            {hasFiltersApplied && (
              <p className="text-foreground/70 mb-6">
                Found <span className="text-gold font-semibold">{filteredProjects.length}</span> project
                {filteredProjects.length !== 1 ? "s" : ""}
              </p>
            )}

            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-champagne/50" />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 jj-box-active">
                <Building2 className="w-12 h-12 text-gold mx-auto mb-4" />
                <p className="text-foreground/75 mb-2">
                  {hasFiltersApplied
                    ? "No projects match your filters"
                    : selectedEmirate
                      ? `No projects in ${selectedEmirate} yet`
                      : "No projects available from this developer yet."}
                </p>
                {(hasFiltersApplied || selectedEmirate) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setFilters(defaultFilters);
                      setSelectedEmirate(null);
                    }}
                    className="mt-2"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperDetail;
