import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface AreaProjectsGridProps {
  areaName: string;
  areaSlug: string;
}

export const AreaProjectsGrid = ({ areaName, areaSlug }: AreaProjectsGridProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["area-projects", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, slug, cover_image_url, developer_name, price_from, area_name, construction_status")
        .ilike("area_name", `%${areaName}%`)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-[hsl(var(--premium-bg))]">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) return null;

  return (
    <section className="py-16 bg-[hsl(var(--premium-bg))]">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
          Projects in {areaName}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/project/${project.slug}`}>
                <div className="group rounded-xl overflow-hidden border-2 border-gold/30 hover:border-gold transition-all shadow-md hover:shadow-xl">
                  <div className="relative h-48">
                    {project.cover_image_url ? (
                      <img
                        src={project.cover_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-zinc-400" />
                      </div>
                    )}
                    {project.construction_status && (
                      <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white text-[10px] font-medium rounded">
                        {project.construction_status}
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                    <h3 className="font-bold text-black text-sm line-clamp-1 group-hover:text-gold transition-colors">
                      {project.name}
                    </h3>
                    {project.developer_name && (
                      <p className="text-zinc-500 text-xs mt-1">by {project.developer_name}</p>
                    )}
                    {project.price_from && (
                      <p className="text-gold font-semibold text-sm mt-2">
                        From AED {Number(project.price_from).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {projects.length >= 12 && (
          <div className="text-center mt-8">
            <Link
              to={`/properties?area=${areaSlug}`}
              className="text-gold hover:text-gold-light transition-colors font-medium"
            >
              View All Projects in {areaName} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
