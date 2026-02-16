import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowUpRight, Search } from "lucide-react";
import { applyShortcutFilters } from "@/utils/applyShortcutFilters";
import { type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";
import { motion } from "framer-motion";
import ProjectCard from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import type { Project } from "@/hooks/useProjects";
import { useCurrency } from "@/hooks/useCurrency";

interface AreaProjectsGridProps {
  areaName: string;
  areaSlug: string;
  shortcutFilters: ShortcutFilterState;
  searchQuery: string;
  onClearFilters: () => void;
}

export const AreaProjectsGrid = ({ areaName, areaSlug, shortcutFilters, searchQuery, onClearFilters }: AreaProjectsGridProps) => {
  const { currency } = useCurrency();
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
    <section className="py-16 overflow-visible px-4 sm:px-6 md:px-8" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)' }}>
      <div>
        <h2 className="text-black text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
          Projects in {areaName.replace(/\s*\(.*?\)/g, '')}
        </h2>

        {/* Grid */}
        <div>
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
                    <ProjectCard project={project} currency={currency as any} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-black/20 mx-auto mb-3" />
              <p className="text-black/50 text-sm font-medium">No projects match your filters</p>
              <button onClick={onClearFilters} className="mt-3 text-gold text-sm font-semibold hover:underline">
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
    </section>
  );
};