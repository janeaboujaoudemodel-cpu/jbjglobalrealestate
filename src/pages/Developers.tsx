import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
} from "lucide-react";
import { useProjects, useCommunities, useDevelopers } from "@/hooks/useProjects";
import { useFilteredProjects, defaultFilters } from "@/hooks/useProjectFilters";
import ProjectFilters, { type FilterState } from "@/components/ProjectFilters";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

import developersHeroVideo from "@/assets/videos/dubai-landmarks-hero.mp4";

const Developers = () => {
  const { data: projects, isLoading } = useProjects();
  const { data: communities } = useCommunities();
  const { data: developers } = useDevelopers();
  
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const filteredProjects = useFilteredProjects(projects || [], filters);

  // Group projects by developer
  const projectsByDeveloper = filteredProjects.reduce<Record<string, typeof filteredProjects>>((acc, project) => {
    if (project.developer?.id) {
      if (!acc[project.developer.id]) {
        acc[project.developer.id] = [];
      }
      acc[project.developer.id].push(project);
    }
    return acc;
  }, {});

  // Get unique developers from filtered projects
  const activeDevelopers = Object.keys(projectsByDeveloper)
    .map(devId => developers?.find(d => d.id === devId))
    .filter(Boolean);

  return (
    <>
      <SEOHead 
        title="UAE Property Developers | JBJ Global Real Estate"
        description="Explore trusted UAE property developers offering off-plan and ready properties. Direct from developers - no secondary market listings."
        keywords="UAE developers, Dubai developers, Emaar, Nakheel, DAMAC, off-plan properties, new developments"
      />
      
      <div className="min-h-screen bg-premium-bg text-primary-foreground">
        {/* Hero Section - Full-width Video */}
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 bg-black">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              src={developersHeroVideo}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          </div>
          
          {/* Floating gold accent orbs */}
          <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Label */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                  Developer-Direct Properties
                </span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-[-0.02em]">
                UAE's Premier Developers
              </h1>
              
              <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Explore off-plan and ready properties directly from UAE's most trusted developers. 
                No secondary market — only developer-direct listings.
              </p>
            </motion.div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
          </motion.div>
        </section>

        {/* Project Filters */}
        <section className="sticky top-16 lg:top-[72px] z-40 bg-premium-bg/95 backdrop-blur-md border-b border-gold/20 py-3">
          <div className="container mx-auto px-4">
            <ProjectFilters
              filters={filters}
              onFiltersChange={setFilters}
              communities={communities}
              developers={developers}
              showDeveloperFilter={true}
              showCommunityFilter={true}
            />
          </div>
        </section>

        {/* Properties by Developer */}
        <section className="py-12 md:py-16">
          <div className="jj-layer-2">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading properties...</div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-gold/30 rounded-xl bg-premium-card/50">
                <Building2 className="w-20 h-20 text-gold/40 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-foreground mb-3">No Properties Found</h3>
                <p className="text-foreground/70 max-w-lg mx-auto">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {activeDevelopers.map((developer) => {
                  if (!developer) return null;
                  const devProjects = projectsByDeveloper[developer.id] || [];
                  
                  return (
                    <div key={developer.id} className="space-y-6">
                      {/* Developer Header */}
                      <div className="flex items-center justify-between border-b border-gold/20 pb-4">
                        <Link
                          to={`/developer/${developer.slug}`}
                          className="group flex items-center gap-4"
                        >
                          {developer.logo_url && (
                            <img
                              src={developer.logo_url}
                              alt={developer.name}
                              className="h-12 w-auto object-contain"
                            />
                          )}
                          <div>
                            <h2 className="text-2xl font-bold text-foreground group-hover:text-gold transition-colors">
                              {developer.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {devProjects.length} {devProjects.length === 1 ? 'property' : 'properties'}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                        </Link>
                      </div>
                      
                      {/* Properties Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {devProjects.map((project) => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Developers;
