import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { DeveloperProjectsMap } from "@/components/developer/DeveloperProjectsMap";
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
        <Link 
          to="/developers" 
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gold bg-gold text-black font-medium text-sm transition-all duration-200 hover:bg-transparent hover:text-gold"
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Developers</span>
        </Link>
      </div>

      {/* Content (Layer 2) */}
      <div className="jj-layer-2 mt-6 md:mt-8 mb-12">
        {/* Developer header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Logo plate - Clean white box without gray overlay */}
          <div 
            className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{
              background: '#FFFFFF',
              border: '3px solid hsl(42 45% 59%)',
              boxShadow: '0 4px 12px rgba(200,167,102,0.25)'
            }}
          >
            {developer.logo_url ? (
              <img
                src={developer.logo_url}
                alt={`${developer.name} logo`}
                className="max-h-14 max-w-[90%] object-contain"
                loading="eager"
              />
            ) : (
              <Building2 className="w-8 h-8 text-zinc-400" />
            )}
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

            {/* Stats - Aligned consistent layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {stats.map((stat) => (
                <div 
                  key={stat.label} 
                  className="rounded-xl border-2 border-gold/40 p-4"
                  style={{
                    background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
                    boxShadow: '0 0 15px rgba(200,167,102,0.22), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                >
                  <div className="flex items-center gap-2 text-foreground/70 text-xs uppercase tracking-wide mb-2">
                    <stat.icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-foreground text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Developer Projects Map */}
        {projects && projects.length > 0 && (
          <div className="mt-8">
            <DeveloperProjectsMap
              developerId={developer.id}
              developerName={developer.name}
              projects={projects.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                latitude: p.latitude,
                longitude: p.longitude,
                price_from: p.price_from,
                cover_image_url: p.cover_image_url,
                location: p.location,
              }))}
            />
          </div>
        )}

        {/* Projects section */}
        <div className="mt-8">
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
              <h3 className="text-foreground text-xl font-semibold mb-2">
                {hasFiltersApplied
                  ? "No Projects Match Your Filters"
                  : selectedEmirate
                    ? `No Projects in ${selectedEmirate} Yet`
                    : "No Projects Available Yet"}
              </h3>
              <p className="text-foreground/70 mb-4 max-w-md mx-auto">
                {hasFiltersApplied
                  ? "Try adjusting your filters to see more results."
                  : selectedEmirate
                    ? `${developer.name} doesn't have any projects in ${selectedEmirate} at the moment.`
                    : `${developer.name} projects are coming soon. Check back later for updates.`}
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
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeveloperDetail;