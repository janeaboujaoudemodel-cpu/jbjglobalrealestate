import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { useDeveloper, useProjectsByDeveloper, useDevelopers } from "@/hooks/useProjects";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import EmiratesTabs from "@/components/EmiratesTabs";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Building2, MapPin, Calendar, TrendingUp, MapIcon, ChevronDown, ChevronUp, BarChart3, Trophy, Globe } from "lucide-react";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { Button } from "@/components/ui/button";
import { renderMarkdownToHtml, formatReellyDescription } from "@/lib/markdownUtils";
import { HtmlT } from "@/i18n/HtmlT";
import RecommendedDevelopers from "@/components/developer/RecommendedDevelopers";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { SEOHead } from "@/components/SEOHead";
import { SchemaEntity } from "@/components/SchemaEntity";
import BrokerRequestAccessButton from "@/components/developers-portal/BrokerRequestAccessButton";
import ammarCreekHarbourMasterplan from "@/assets/ammar-creek-harbour-masterplan.jpg";

// Lazy load map component to prevent boot errors from react-leaflet context issues
const DeveloperProjectsMap = lazy(() => import("@/components/developer/DeveloperProjectsMap").then(m => ({ default: m.DeveloperProjectsMap })));

// Map loading fallback
const MapLoadingFallback = () => (
  <div className="rounded-xl border border-[#064E3B]/30 bg-[#FDFBF7] p-8 h-[400px] flex items-center justify-center">
    <div className="text-center">
      <MapIcon className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-3 animate-pulse" />
      <p className="text-foreground/70">Loading map...</p>
    </div>
  </div>
);

const isAmmarDeveloper = (name?: string | null, slug?: string | null) => {
  const text = `${name || ""} ${slug || ""}`.toLowerCase();
  return /\bammar\b|\bamar\b/.test(text);
};

// Emaar's flagship Dubai Creek Harbour masterplan render — used as a premium
// hero cover when no curated feature image is set upstream.
const isEmaarDeveloper = (name?: string | null, slug?: string | null) => {
  const text = `${name || ""} ${slug || ""}`.toLowerCase();
  return /\bemaar\b/.test(text);
};

const fmtNumber = (value?: number | null) => Number(value || 0).toLocaleString("en-US");

const fmtAED = (value: number) => {
  if (!value) return "—";
  if (value >= 1_000_000_000) return `AED ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
  return `AED ${Math.round(value).toLocaleString("en-US")}`;
};

const DeveloperPerformancePanel = ({ developer, projects, competitors }: { developer: any; projects: any[]; competitors: any[] }) => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const totalUnits = projects.reduce((sum, p) => sum + Number(p.total_units || 0), 0);
  const activeProjects = developer.offplan_projects || projects.length;
  const publishedValueFloor = projects.reduce((sum, p) => sum + Number(p.price_from || 0), 0);
  const launchesThisYear = projects.filter((p) => new Date(p.created_at || p.updated_at || 0).getFullYear() === currentYear).length;
  const deliveredLastYear = projects.filter((p) => {
    const status = `${p.construction_status || p.status_label || p.status || ""}`.toLowerCase();
    const year = new Date(p.handover_date || p.updated_at || p.created_at || 0).getFullYear();
    return status.includes("complete") && year === lastYear;
  }).length;
  const topAreas = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      const area = p.area_name || p.location || p.community?.name;
      if (area) acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const score = activeProjects * 2 + (developer.completed_projects || 0) / 25 + totalUnits / 500;
  const rankList = [developer, ...competitors].sort((a, b) => ((b.offplan_projects || 0) * 2 + (b.completed_projects || 0) / 25) - ((a.offplan_projects || 0) * 2 + (a.completed_projects || 0) / 25));
  const rank = Math.max(1, rankList.findIndex((d) => d.id === developer.id) + 1);

  return (
    <section data-developer-intelligence className="mt-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#064E3B]/25 shadow-[0_20px_60px_-36px_rgba(6,78,59,0.38)]">
      <div className="bg-gradient-to-r from-[#064E3B] via-[#042C1C] to-black px-5 md:px-7 py-5 allow-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl md:text-3xl font-bold">JBJ Developer Intelligence</h2>
              <p className="text-white/78 text-sm">{developer.name} verified portfolio profile</p>
            </div>
          </div>
          <div className="jj-pill-emerald-metallic allow-white text-white border-0 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
            Rank #{rank} · Score {Math.round(score)}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active projects", value: fmtNumber(activeProjects), icon: Building2 },
            { label: "Published units", value: totalUnits ? fmtNumber(totalUnits) : fmtNumber(developer.completed_projects), icon: Trophy },
            { label: "New launches YTD", value: fmtNumber(launchesThisYear), icon: TrendingUp },
            { label: `Delivered ${lastYear}`, value: fmtNumber(deliveredLastYear), icon: Calendar },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#064E3B]/20 bg-[#FDFBF7] p-4">
              <div className="flex items-center gap-2 text-[#064E3B] text-[10px] uppercase tracking-[0.16em] font-bold mb-2">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              <p className="text-[#1A1A1A] text-2xl font-extrabold tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl border border-[#064E3B]/20 bg-[#FDFBF7] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-[#1A1A1A] font-bold text-lg">Competitive Standing</h3>
              <span className="text-[#064E3B] text-xs font-bold">{fmtAED(publishedValueFloor)} price-floor portfolio</span>
            </div>
            <div className="space-y-2.5">
              {[developer, ...competitors.slice(0, 3)].map((dev, index) => {
                const units = Number(dev.completed_projects || 0);
                const active = Number(dev.offplan_projects || (dev.id === developer.id ? projects.length : 0));
                const width = Math.max(16, Math.min(100, (active / Math.max(activeProjects, ...competitors.map((d) => Number(d.offplan_projects || 0)), 1)) * 100));
                const selected = dev.id === developer.id;
                return (
                  <div key={dev.id || dev.name} className="rounded-lg border border-[#064E3B]/15 bg-[#F7F2EA] overflow-hidden">
                    <div className="relative px-3 py-3">
                      <div className="absolute inset-y-0 left-0 bg-[#064E3B]/10" style={{ width: `${width}%` }} />
                      <div className="relative flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={selected ? "jj-pill-emerald-metallic allow-white text-white border-0 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold" : "w-8 h-8 rounded-full border border-[#064E3B]/25 bg-[#FDFBF7] text-[#1A1A1A] flex items-center justify-center text-xs font-bold"}>{index + 1}</span>
                          <span className="text-[#1A1A1A] font-bold truncate">{dev.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#1A1A1A] text-sm font-extrabold">{fmtNumber(active)} active</p>
                          <p className="text-[#1A1A1A]/68 text-xs">{fmtNumber(units)} delivered</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#064E3B]/20 bg-[#FDFBF7] p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[#064E3B]" />
              <h3 className="text-[#1A1A1A] font-bold text-lg">Top Areas</h3>
            </div>
            <div className="space-y-2">
              {topAreas.length > 0 ? topAreas.map(([area, count], i) => (
                <div key={area} className="flex items-center justify-between gap-3 rounded-lg border border-[#064E3B]/15 bg-[#F7F2EA] px-3 py-2">
                  <span className="text-[#1A1A1A] text-sm font-semibold truncate">{i + 1}. {area}</span>
                  <span className="text-[#064E3B] text-xs font-bold">{count} projects</span>
                </div>
              )) : (
                <p className="text-[#1A1A1A]/70 text-sm">Area data will appear when published projects are mapped.</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#064E3B]/20 bg-[#FDFBF7] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#064E3B]" />
            <h3 className="text-[#1A1A1A] font-bold text-lg">Developer Buyer Nationalities</h3>
          </div>
          <p className="text-[#1A1A1A]/78 text-sm leading-relaxed">
            Developer-level nationality rankings require a named DLD developer transaction feed. Until that source is connected, no fabricated nationality data is shown for {developer.name}.
          </p>
        </div>
      </div>
    </section>
  );
};

const DeveloperDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading: loadingDeveloper } = useDeveloper(slug || "");
  const { data: projects, isLoading: loadingProjects } = useProjectsByDeveloper(slug || "");
  const { data: allDevelopers } = useDevelopers();
  const { trackView } = useRecentSearches();

  // Track developer view
  useEffect(() => {
    if (!developer) return;
    trackView({
      id: developer.id,
      type: "developer",
      name: developer.name,
      slug: developer.slug || slug || "",
      imageUrl: (developer as any).logo_url || undefined,
      subtitle: `${projects?.length || 0} Projects`,
    });
  }, [developer, projects?.length]);

  const [filters, setFilters] = useState<FilterState>(() => {
    const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem('jj_currency') : null;
    return { ...(defaultFilters as unknown as FilterState), currency: (storedCurrency || 'AED') as any };
  });

  // Sync currency with global switcher
  useEffect(() => {
    const handler = (e: Event) => {
      const code = (e as CustomEvent).detail;
      if (code) setFilters(prev => ({ ...prev, currency: code }));
    };
    window.addEventListener('currencyChange', handler);
    return () => window.removeEventListener('currencyChange', handler);
  }, []);
  const [selectedEmirate, setSelectedEmirate] = useState<string | null>(null);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);

  // Listen for global filter changes from the header bar
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<ShortcutFilterState>).detail;
      if (next) setShortcutFilters(next);
    };
    window.addEventListener('globalFilterChange', handler);
    return () => window.removeEventListener('globalFilterChange', handler);
  }, []);
  const [isDevDescExpanded, setIsDevDescExpanded] = useState(false);
  const [isFilterFixed, setIsFilterFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const filterSentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for fixed filter positioning
  const hasProjects = !!projects;
  useEffect(() => {
    const sentinel = filterSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFilterFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
      },
      { threshold: 0, rootMargin: "-140px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasProjects]);

  // Bottom sentinel: hide fixed bar when "Ready to Get Started" enters viewport
  useEffect(() => {
    const target = document.getElementById('ready-to-get-started');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Signal GlobalHeader to hide when filter bar is fixed
  useEffect(() => {
    if (isFilterFixed && !bottomReached) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFilterFixed, bottomReached]);

  // Reset showAll when filters or developer changes
  useEffect(() => { setShowAllProjects(false); setVisibleCount(6); }, [slug, selectedEmirate, filters]);

  // Apply emirate filter first, then apply other filters
  const projectsInEmirate = useMemo(() => {
    if (!projects) return [];
    if (!selectedEmirate) return projects;
    return projects.filter((p) => p.emirate === selectedEmirate);
  }, [projects, selectedEmirate]);

  const filteredProjectsBase = useFilteredProjects(projectsInEmirate, filters);
  const filteredProjects = useMemo(() => applyShortcutFilters(filteredProjectsBase, shortcutFilters), [filteredProjectsBase, shortcutFilters]);

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
          <Skeleton className="h-20 w-64 bg-[#064E3B]/18 mb-4" />
          <Skeleton className="h-6 w-96 bg-[#064E3B]/18" />
        </div>
      </section>
    );
  }

  if (!developer) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-premium-bg">
        <div className="text-center">
          <h1 className="text-foreground text-2xl mb-4">Developer not found</h1>
          <Link to="/developers" className="text-[#1A1A1A] hover:underline">
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
      value: developer.founded_year || null,
    },
    {
      icon: Building2,
      label: "Units Delivered",
      value: developer.completed_projects
        ? `${developer.completed_projects.toLocaleString()}+`
        : null,
    },
    {
      icon: TrendingUp,
      label: "Active Projects",
      value: developer.offplan_projects || projects?.length || null,
    },
    {
      icon: MapPin,
      label: "Headquarters",
      value: developer.headquarters 
        ? (() => {
            const parts = developer.headquarters.split(',').map((s: string) => s.trim());
            return parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : parts[parts.length - 1];
          })()
        : null,
    },
  ].filter(s => s.value !== null);

  const heroImageUrl = isAmmarDeveloper(developer.name, developer.slug)
    ? ammarCreekHarbourMasterplan
    : developer.feature_image_url;

  const competitorDevelopers = (allDevelopers || [])
    .filter((d) => d.id !== developer.id)
    .sort((a, b) => ((b.offplan_projects || 0) * 2 + (b.completed_projects || 0) / 25) - ((a.offplan_projects || 0) * 2 + (a.completed_projects || 0) / 25))
    .slice(0, 3);

  return (
    <section className="relative w-full min-h-screen bg-premium-bg">
      <SEOHead
        title={`${developer.name} | UAE Property Developer`}
        description={(developer.description || `Explore ${developer.name} property projects in Dubai and the UAE. ${developer.completed_projects ? `${developer.completed_projects.toLocaleString()}+ units delivered. ` : ""}Off-plan and ready properties on JBJ Global Real Estate.`).replace(/<[^>]+>/g, "").slice(0, 200)}
        canonicalPath={`/developer/${slug}`}
        ogImage={developer.feature_image_url || developer.logo_url}
      />
      <SchemaEntity kind="developer" slug={slug || ""} pageTitle={`${developer.name} — Live Projects in the UAE`} />
      {/* Hero section - always visible */}
      <div className="relative w-full h-screen min-h-[500px] overflow-hidden">
          {heroImageUrl ? (
          <img
            src={typeof heroImageUrl === "string" && heroImageUrl.startsWith("http") ? getHighResImageUrl(heroImageUrl) : heroImageUrl}
            alt={`${developer.name} featured project`}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              // Fallback to original URL if high-res fails
              const img = e.currentTarget;
              if (developer.feature_image_url && img.src !== developer.feature_image_url) {
                img.src = developer.feature_image_url;
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-premium-bg/70 via-transparent to-transparent" />
        {/* Hero Title Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-4 drop-shadow-lg">
            {developer.name}
          </h1>
          <p className="text-white/80 text-lg md:text-xl text-center max-w-2xl">
            {(developer as any).tagline || `Discover premium developments by ${developer.name}`}
          </p>
        </div>
        <div className="absolute bottom-4 left-4 md:left-8 z-10">
          <Link to="/developers">
            <Button variant="primary" size="sm" className="group">
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Developers</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Content (Layer 2) */}
      <div className="jj-layer-2 mt-6 md:mt-8 mb-12" style={{ marginLeft: 0, marginRight: 0, borderRadius: 0, border: 'none' }}>
        {/* Developer header */}
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Logo plate - Full-fit, no white corners */}
          <div 
            className="w-32 h-32 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]"
            style={{
              border: '1px solid rgba(6,78,59,0.34)',
              boxShadow: '0 4px 16px rgba(6,78,59,0.18)'
            }}
          >
            {developer.logo_url ? (
              <img
                src={developer.logo_url}
                alt={`${developer.name} logo`}
                className="w-full h-full object-contain"
                loading="eager"
               decoding="async" />
            ) : (
              <Building2 className="w-10 h-10 text-[#1A1A1A]/70" />
            )}
          </div>

          {/* Text */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
              <span className="text-[#1A1A1A]">{developer.name.split(" ")[0]}</span>{" "}
              {developer.name.split(" ").slice(1).join(" ")}
            </h1>
            {developer.description && (
              <div className="max-w-3xl">
                <div className={`relative ${!isDevDescExpanded && developer.description.length > 400 ? 'max-h-32 overflow-hidden' : ''}`}>
                  <HtmlT
                    html={renderMarkdownToHtml(formatReellyDescription(developer.description))}
                    domain="developer.description"
                    className="text-foreground/75 text-base md:text-lg leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:mb-2"
                  />
                  {!isDevDescExpanded && developer.description.length > 400 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F7F2EA] to-transparent pointer-events-none" />
                  )}
                </div>
                {developer.description.length > 400 && (
                  <button
                    onClick={() => setIsDevDescExpanded(!isDevDescExpanded)}
                    className="flex items-center gap-1 text-[#1A1A1A] text-sm font-medium mt-3 hover:underline"
                  >
                    {isDevDescExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> Show Less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> Read More</>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Stats - Aligned consistent layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {stats.map((stat) => (
                <div 
                  key={stat.label} 
                  className="rounded-xl border border-[#064E3B]/28 p-4"
                  style={{
                    background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)',
                    boxShadow: '0 0 15px rgba(6,78,59,0.14), inset 0 1px 2px rgba(255,255,255,0.4)',
                  }}
                >
                  <div className="flex items-center gap-2 text-foreground/70 text-xs uppercase tracking-wide mb-2">
                    <stat.icon className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                    <span className="truncate">{stat.label}</span>
                  </div>
                  <p className="text-foreground text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Identity actions — View all projects + (broker-only) request rep access */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to={`/properties?developer=${encodeURIComponent(developer.slug || developer.id)}`}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-[0.02em] px-4 py-2 text-[#1A1A1A] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:bg-[#F7F2EA]"
                style={{ border: '1px solid rgba(6,78,59,0.34)' }}
              >
                View all projects by {developer.name}
              </Link>
              <BrokerRequestAccessButton
                developerId={developer.id}
                developerName={developer.name}
              />
            </div>
          </div>
        </div>


        {/* Developer Projects Map - Wrapped in error boundary */}
        {projects && projects.length > 0 && (
          <div className="mt-8">
            <MapErrorBoundary>
              <Suspense fallback={<MapLoadingFallback />}>
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
              </Suspense>
            </MapErrorBoundary>
          </div>
        )}

        <DeveloperPerformancePanel developer={developer} projects={projects || []} competitors={competitorDevelopers} />

        {/* Projects section */}
        <div className="mt-8">
          {/* Emirates Tabs */}
          <EmiratesTabs
            projects={projects}
            selectedEmirate={selectedEmirate}
            onEmirateSelect={(emirate) => {
              setSelectedEmirate(emirate);
              setFilters({ ...defaultFilters as unknown as FilterState, emirate: emirate });
            }}
          />

          <h2 className="text-foreground text-2xl font-semibold mb-6">
            {selectedEmirate ? `Projects in ${selectedEmirate}` : "All Projects"}
          </h2>

          {/* Sentinel for IntersectionObserver */}
          <div ref={filterSentinelRef} className="h-0" />

          {/* Inline filter bar — 2 rows only */}
          <div data-filter-clean="true" className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-black border border-white/12 rounded-2xl p-2 sm:p-4 mb-6 overflow-x-auto scrollbar-hide">
            <FilterShortcutBar
              variant="dark"
              filters={shortcutFilters}
              onFilterChange={setShortcutFilters}
              priorityFilter="developers"
            />
          </div>

          {/* Spacer when filter is fixed to prevent content hiding under it */}
          {isFilterFixed && <div className="h-[100px]" />}

          {/* Fixed portal filter bar removed — handled globally by GlobalFilterBar */}

          {hasFiltersApplied && (
            <p className="text-foreground/70 mb-6">
              Found <span className="text-[#1A1A1A] font-semibold">{filteredProjects.length}</span> project
              {filteredProjects.length !== 1 ? "s" : ""}
            </p>
          )}

          {loadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg bg-[#064E3B]/18" />
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
                {filteredProjects.slice(0, visibleCount).map((project) => (
                  <ProjectCard key={project.id} project={project} currency={filters.currency} sizeUnit={filters.sizeUnit} />
                ))}
              </div>
              {visibleCount < filteredProjects.length && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => Math.min(c + 6, filteredProjects.length))}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold tracking-wide rounded-xl transition-all duration-150 border border-[#064E3B]/35 hover:border-[#064E3B]/60 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)',
                      boxShadow: '0 4px 20px rgba(6,78,59,0.16)',
                    }}
                  >
                    <span className="text-foreground">
                      View more · Showing {visibleCount} of {filteredProjects.length}
                    </span>
                    <ChevronDown className="w-5 h-5 text-[#1A1A1A] group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border border-[#064E3B]/24 bg-[#FDFBF7]">
              <Building2 className="w-12 h-12 text-[#1A1A1A] mx-auto mb-4" />
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
                    setFilters(defaultFilters as unknown as FilterState);
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

        {/* Divider between projects and recommendations */}
        <div className="py-10 md:py-14">
          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#064E3B]/45 to-transparent" />
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-[#064E3B]/45 to-transparent" />
          </div>
        </div>

        {/* Similar Developers */}
        <RecommendedDevelopers
          currentDeveloperSlug={slug || ""}
          currentDeveloperEmirate={developer?.headquarters || null}
        />
      </div>
    </section>
  );
};

export default DeveloperDetail;