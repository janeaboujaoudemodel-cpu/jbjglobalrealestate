import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

interface AreaDevelopersBarProps {
  areaName: string;
}

export const AreaDevelopersBar = ({ areaName }: AreaDevelopersBarProps) => {
  const { data: developers } = useQuery({
    queryKey: ["area-developers", areaName],
    queryFn: async () => {
      // Get developer names from projects in this area
      const { data, error } = await supabase
        .from("projects")
        .select("developer_name, developer:developers(id, name, slug, logo_url)")
        .ilike("area_name", `%${areaName}%`)
        .not("developer_name", "is", null);
      
      if (error) throw error;

      // Deduplicate by developer name
      const devMap = new Map<string, { name: string; slug?: string; logo_url?: string }>();
      for (const p of data || []) {
        const dev = (p.developer as any)?.[0] || p.developer;
        const name = dev?.name || p.developer_name;
        if (name && !devMap.has(name)) {
          devMap.set(name, {
            name,
            slug: dev?.slug,
            logo_url: dev?.logo_url,
          });
        }
      }
      return Array.from(devMap.values());
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!developers || developers.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-gold" />
          <h2 className="text-xl md:text-2xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            Developers in {areaName}
          </h2>
          <span className="text-zinc-500 text-sm">({developers.length})</span>
        </div>

        <div className="flex flex-wrap gap-3">
          {developers.map((dev, i) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              {dev.slug ? (
                <Link
                  to={`/developer/${dev.slug}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gold/30 rounded-xl hover:border-gold hover:shadow-lg transition-all"
                >
                  {dev.logo_url ? (
                    <img src={dev.logo_url} alt={dev.name} className="w-8 h-8 object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 bg-gold/20 rounded flex items-center justify-center text-gold font-bold text-xs">
                      {dev.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-black">{dev.name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gold/20 rounded-xl">
                  <div className="w-8 h-8 bg-gold/20 rounded flex items-center justify-center text-gold font-bold text-xs">
                    {dev.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-zinc-700">{dev.name}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
