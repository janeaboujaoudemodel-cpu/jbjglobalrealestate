import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Developer } from "@/hooks/useProjects";

interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
}

// Developer tier classification
const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  ELITE: { label: "ELITE", color: "bg-gradient-to-r from-gold to-[#E8D5A3] text-black" },
  PREMIUM: { label: "PREMIUM", color: "bg-gradient-to-r from-amber-500 to-amber-400 text-black" },
  TOP_TIER: { label: "TOP TIER", color: "bg-gradient-to-r from-zinc-700 to-zinc-600 text-white" },
  ESTABLISHED: { label: "ESTABLISHED", color: "bg-gradient-to-r from-slate-600 to-slate-500 text-white" },
};

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "aldar", "omniyat"];
const PREMIUM_DEVELOPERS = ["ellington"];
const TOP_TIER_DEVELOPERS = ["binghatti", "majid-al-futtaim", "majid al futtaim"];
const ESTABLISHED_DEVELOPERS = ["danube", "azizi"];

function getDeveloperTier(slug: string): { label: string; color: string } | null {
  const normalizedSlug = slug.toLowerCase();
  
  if (ELITE_DEVELOPERS.some(d => normalizedSlug.includes(d))) return TIER_CONFIG.ELITE;
  if (PREMIUM_DEVELOPERS.some(d => normalizedSlug.includes(d))) return TIER_CONFIG.PREMIUM;
  if (TOP_TIER_DEVELOPERS.some(d => normalizedSlug.includes(d))) return TIER_CONFIG.TOP_TIER;
  if (ESTABLISHED_DEVELOPERS.some(d => normalizedSlug.includes(d))) return TIER_CONFIG.ESTABLISHED;
  
  return null;
}

const DeveloperCard = ({ developer, projectCount = 0 }: DeveloperCardProps) => {
  const tier = getDeveloperTier(developer.slug || "");
  
  return (
    <Link to={`/developer/${developer.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="group rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
        style={{
          border: '3px solid hsl(42 45% 59%)',
          boxShadow: `
            0 8px 32px rgba(200,167,102,0.25),
            0 4px 16px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
        }}
      >
        {/* Photo Section - Fixed Height */}
        <div className="relative h-[180px] flex-shrink-0">
          {developer.feature_image_url ? (
            <img
              src={developer.feature_image_url}
              alt={developer.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-gold/40 mx-auto mb-2" />
                <span className="text-gold/60 text-xs uppercase tracking-wider">Developer</span>
              </div>
            </div>
          )}
          
          {/* Tier Badge - Top Right */}
          {tier && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className={`${tier.color} px-3 py-1 text-[10px] font-bold tracking-wider shadow-lg`}>
                {tier.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Section - Champagne Background */}
        <div className="flex-1 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col">
          {/* Logo Plate - Premium White Box with mix-blend-mode for transparency */}
          <div 
            className="w-full h-14 rounded-lg flex items-center justify-center mb-3 overflow-hidden flex-shrink-0"
            style={{
              background: '#FFFFFF',
              border: '2px solid hsl(42 45% 59%)',
              boxShadow: '0 2px 8px rgba(200,167,102,0.2), inset 0 1px 2px rgba(255,255,255,0.9)'
            }}
          >
            {developer.logo_url ? (
              <img
                src={developer.logo_url}
                alt={`${developer.name} logo`}
                className="max-h-10 max-w-[80%] object-contain"
                style={{ 
                  mixBlendMode: 'multiply',
                  backgroundColor: 'white'
                }}
                loading="lazy"
              />
            ) : (
              <span className="text-zinc-800 font-semibold text-sm">{developer.name}</span>
            )}
          </div>

          {/* Developer Name */}
          <h3 className="text-black font-bold text-lg mb-2 line-clamp-1 group-hover:text-gold transition-colors">
            {developer.name}
          </h3>

          {/* Description - Fixed 2 lines */}
          <div className="flex-1 min-h-[40px]">
            {developer.description ? (
              <p className="text-zinc-600 text-xs line-clamp-2">
                {developer.description}
              </p>
            ) : (
              <p className="text-zinc-400 text-xs italic">
                Premier developer in the UAE market
              </p>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-zinc-700 text-xs mt-3 pt-3 border-t border-gold/20">
            {projectCount > 0 ? (
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gold" />
                <span>{projectCount} Projects</span>
              </div>
            ) : null}
            {developer.completed_projects && developer.completed_projects > 0 ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-gold" />
                <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
              </div>
            ) : null}
            {!projectCount && (!developer.completed_projects || developer.completed_projects === 0) && (
              <span className="text-zinc-500 italic">Coming soon</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DeveloperCard;
