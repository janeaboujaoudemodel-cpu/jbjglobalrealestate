import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { motion } from "framer-motion";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getDeveloperLogoUrl } from "@/utils/developerLogo";

interface AreaDevelopersBarProps {
  areaName: string;
}

type AreaDeveloperChip = { name: string; slug?: string; logo_url?: string | null; website_url?: string | null };

export const AreaDevelopersBar = ({ areaName }: AreaDevelopersBarProps) => {
  const { data: developers } = useQuery({
    queryKey: ["area-developers", areaName],
    queryFn: async () => {
      // Get developer names from projects in this area, then enrich from the full developers table
      // so logo_url does not depend on a possibly-missing FK relation on the project row.
      const [{ data, error }, { data: allDevelopers }] = await Promise.all([
        supabase
        .from("projects")
        .select("developer_name, developer:developers(id, name, slug, logo_url, website_url)")
        .ilike("area_name", `%${areaName}%`)
        .not("developer_name", "is", null),
        supabase
          .from("developers")
          .select("name, slug, logo_url, website_url")
          .not("logo_url", "is", null),
      ]);
      
      if (error) throw error;

      const normalize = (value?: string | null) => (value || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
      const logoMap = new Map<string, AreaDeveloperChip>();
      for (const dev of allDevelopers || []) {
          if (dev.name) logoMap.set(normalize(dev.name), { ...(dev as any), logo_url: getDeveloperLogoUrl(dev as any) });
      }

      // Deduplicate by developer name
      const devMap = new Map<string, AreaDeveloperChip>();
      for (const p of data || []) {
        const dev = (p.developer as any)?.[0] || p.developer;
        const name = dev?.name || p.developer_name;
        if (name && !devMap.has(name)) {
          const normalizedName = normalize(name);
          const fallback = logoMap.get(normalizedName)
            || Array.from(logoMap.entries()).find(([key]) => key.includes(normalizedName) || normalizedName.includes(key))?.[1];
          devMap.set(name, {
            name: fallback?.name || name,
            slug: dev?.slug || fallback?.slug,
            logo_url: getDeveloperLogoUrl(dev as any) || fallback?.logo_url,
            website_url: dev?.website_url || fallback?.website_url,
          });
        }
      }
      return Array.from(devMap.values());
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!developers || developers.length === 0) return null;

  return (
    <section data-surface="champagne" id="developers-section" className="pt-0 pb-12" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)' }}>
      <div className="jj-layer-2">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6" style={{ color: '#0A0A0A' }} />
          <h2 data-no-contrast-guard style={{ color: '#0A0A0A' }} className="text-xl md:text-2xl font-bold">
            Developers in {areaName}
          </h2>
          <span data-no-contrast-guard style={{ color: '#0A0A0A', opacity: 0.7 }} className="text-sm">({developers.length})</span>
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
                <Link aria-label={dev.name}
                  to={`/developer/${dev.slug}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white/70 border border-[#064E3B]/15 rounded-xl hover:shadow-lg hover:border-[#064E3B]/40 transition-all"
                >
                  <DeveloperLogo src={dev.logo_url} alt={dev.name} name={dev.name} websiteUrl={dev.website_url} loading="eager" renderFallback className="w-20 h-10 border-[#064E3B]/20" />
                  <span data-no-contrast-guard style={{ color: '#0A0A0A' }} className="text-sm font-semibold">{dev.name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-white/70 border border-[#064E3B]/15 rounded-xl">
                  <DeveloperLogo src={dev.logo_url} alt={dev.name} name={dev.name} websiteUrl={dev.website_url} loading="eager" renderFallback className="w-20 h-10 border-[#064E3B]/20" />
                  <span data-no-contrast-guard style={{ color: '#0A0A0A' }} className="text-sm font-semibold">{dev.name}</span>
                </div>
              )}

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
