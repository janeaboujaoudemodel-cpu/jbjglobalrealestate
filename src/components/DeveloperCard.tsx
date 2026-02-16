import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Developer } from "@/hooks/useProjects";

interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
  index?: number;
}

// Developer tier classification
const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  ELITE: { label: "ELITE", color: "bg-gradient-to-r from-gold to-[#E8D5A3] text-black" },
  PREMIUM: { label: "PREMIUM", color: "bg-gradient-to-r from-amber-500 to-amber-400 text-black" },
  TOP_TIER: { label: "TOP TIER", color: "bg-gradient-to-r from-zinc-700 to-zinc-600 text-white" },
  ESTABLISHED: { label: "ESTABLISHED", color: "bg-gradient-to-r from-slate-600 to-slate-500 text-white" },
};

const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "omniyat"];
const PREMIUM_DEVELOPERS = ["ellington", "aldar"];
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

const DeveloperCard = ({ developer, projectCount = 0, index = 99 }: DeveloperCardProps) => {
  const tier = getDeveloperTier(developer.slug || "");
  const isEager = index < 8;
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // logo_bg_color no longer used on external cards
  const showFeatureImage = developer.feature_image_url && !imageError;
  
  return (
    <Link to={`/developer/${developer.slug}`}>
      <motion.div
        whileHover={{ y: -6, rotateX: 2, rotateY: -1 }}
        transition={{ duration: 0.3 }}
        className="group rounded-xl overflow-hidden cursor-pointer flex flex-col h-full"
        style={{
          border: '3px solid hsl(42 45% 59%)',
          boxShadow: `
            0 8px 32px rgba(200,167,102,0.25),
            0 4px 16px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          perspective: '1000px',
        }}
      >
        {/* Photo Section */}
        <div className="relative h-[220px] flex-shrink-0">
          {showFeatureImage ? (
            <img
              src={developer.feature_image_url}
              alt={developer.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading={isEager ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              {developer.logo_url ? (
                <div className="text-center">
                  <img
                    src={developer.logo_url}
                    alt={developer.name}
                    className="w-20 h-20 object-contain mx-auto mb-2 opacity-80"
                    loading="lazy"
                  />
                  <span className="text-white/60 text-xs font-medium tracking-wider uppercase">{developer.name}</span>
                </div>
              ) : (
                <div className="text-center">
                  <Building2 className="w-12 h-12 text-gold/50 mx-auto mb-2" />
                  <span className="text-white/60 text-xs font-medium tracking-wider uppercase">{developer.name}</span>
                </div>
              )}
            </div>
          )}
          
      {/* Logo Overlay - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            {developer.logo_url && !logoError ? (
              <div
              className={`w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center ${
                  developer.logo_bg_color ? 'shadow-lg' : ''
                }`}
                style={{ backgroundColor: developer.logo_bg_color || 'transparent' }}
              >
                <img
                  src={developer.logo_url}
                  alt={`${developer.name} logo`}
                  className="w-full h-full object-contain"
                  loading={isEager ? "eager" : "lazy"}
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <Building2 className="w-8 h-8 text-white/60 drop-shadow-lg" />
            )}
          </div>
          
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
              <span className="text-zinc-500 text-xs">View developer portfolio</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DeveloperCard;
