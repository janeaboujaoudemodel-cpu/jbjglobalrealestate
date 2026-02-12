import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowUpRight, Search, X } from "lucide-react";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { motion } from "framer-motion";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/useProjects";

interface AreaProjectsGridProps {
  areaName: string;
  areaSlug: string;
}

export const AreaProjectsGrid = ({ areaName, areaSlug }: AreaProjectsGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [isFixed, setIsFixed] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const placeholderRef = useRef<HTMLDivElement>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["area-projects-full", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id, name, slug, cover_image_url, developer_name, price_from, area_name,
          construction_status, handover_date, description, status_label, sale_status,
          is_sold_out, property_type_label, bedrooms_min, bedrooms_max, size_min, size_max, location,
          developers(name, slug, logo_url),
          project_images(image_url, alt_text, display_order)
        `)
        .ilike("area_name", `%${areaName}%`)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        developer: p.developers || (p.developer_name ? { name: p.developer_name, slug: null, logo_url: null } : null),
        images: (p.project_images || []).sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)),
      })) as (Project & { is_sold_out?: boolean | null })[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // IntersectionObserver for fixed positioning
  const hasProjects = !!projects;
  useEffect(() => {
    const sentinel = placeholderRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFixed(!entry.isIntersecting && entry.boundingClientRect.top < 140);
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
    if (isFixed && !bottomReached) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [isFixed, bottomReached]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.developer_name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return applyShortcutFilters(result, shortcutFilters);
  }, [projects, searchQuery, shortcutFilters]);

  const clearFilters = () => {
    setSearchQuery("");
    setShortcutFilters(defaultShortcutFilters);
  };

  const filterBarContent = (
    <>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
        <input
          type="text"
          placeholder="Search projects or developers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-white/70 border-2 border-gold/30 text-black text-sm placeholder:text-black/30 focus:outline-none focus:border-gold/60 transition-colors"
          style={{ fontSize: '16px' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-black/40 hover:text-black" />
          </button>
        )}
      </div>
    </>
  );

  if (isLoading) {
    return (
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="h-8 w-64 bg-zinc-800 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gold/20">
                <div className="aspect-[16/10] bg-zinc-800 animate-pulse" />
                <div className="p-4 bg-zinc-900 space-y-2">
                  <div className="h-4 w-3/4 bg-zinc-800 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-zinc-800 animate-pulse rounded" />
                  <div className="h-4 w-1/3 bg-zinc-800 animate-pulse rounded mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) return null;

  return (
    <section id="projects-section" className="pt-16 pb-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="rounded-2xl pt-8 overflow-visible" style={{ background: 'linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)' }}>
          <h2 className="text-black text-2xl md:text-3xl font-bold mb-6 px-6" style={{ fontFamily: "Poppins, sans-serif" }}>
            Projects in {areaName.replace(/\s*\(.*?\)/g, '')}
          </h2>

          {/* Sentinel for IntersectionObserver — sits just above inline bar */}
          <div ref={placeholderRef} className="h-0" />

          {/* Phase 1: Inline filter bar — always rendered in natural flow */}
          <div className="py-3 px-6">
            <div className="flex flex-wrap items-center gap-3">
              {filterBarContent}
            </div>
            <div className="mt-3">
              <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
            </div>
          </div>

          {/* Phase 2: Fixed portal copy — only when scrolled past sentinel */}
          {isFixed && !bottomReached && createPortal(
            <div
              className="fixed top-0 left-0 right-0 z-[9998] shadow-[0_4px_20px_rgba(200,167,102,0.15)] bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-b border-gold/20 py-3 transition-all duration-200 lg:left-[200px]"
            >
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap items-center gap-3">
                  {filterBarContent}
                </div>
                <div className="mt-3">
                  <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Grid */}
          <div className="p-6">
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="h-full"
                  >
                    <div className="h-full [&>div]:h-full [&>div]:flex [&>div]:flex-col">
                      <ProjectCard project={project} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-black/20 mx-auto mb-3" />
                <p className="text-black/50 text-sm font-medium">No projects match your filters</p>
                <button onClick={clearFilters} className="mt-3 text-gold text-sm font-semibold hover:underline">
                  Clear all filters
                </button>
              </div>
            )}

            {filteredProjects.length > 0 && (
              <div className="text-center mt-8">
                <Link to={`/properties?area=${areaSlug}`}>
                  <Button className="px-8 py-6 text-base bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black font-bold border-2 border-gold hover:from-gold hover:to-amber-500 hover:text-black transition-all">
                    View All Projects in {areaName}
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
