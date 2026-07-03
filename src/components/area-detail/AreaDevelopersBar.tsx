import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

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
    <section id="developers-section" className="pt-0 pb-12" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)' }}>
      <div className="jj-layer-2">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-[#1A1A1A]" />
          <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A]">
            Developers in {areaName}
          </h2>
          <span className="text-[#1A1A1A]/70 text-sm">({developers.length})</span>
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
                  className="flex items-center gap-3 px-4 py-3 bg-[#FDFBF7] border-0 rounded-xl hover:shadow-lg transition-all"
                >
                  <DeveloperLogo src={dev.logo_url} alt={dev.name} className="w-10 h-10" />
                  <span className="text-sm font-medium text-[#1A1A1A]">{dev.name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#FDFBF7] border-0 rounded-xl">
                  <DeveloperLogo src={dev.logo_url} alt={dev.name} className="w-10 h-10" />
                  <span className="text-sm font-medium text-[#1A1A1A]/70">{dev.name}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
