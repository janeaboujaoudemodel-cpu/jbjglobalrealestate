import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { getSafeDeveloperDescription } from "@/utils/developerContent";
import { getDeveloperTier, TIER_LABELS } from "@/utils/developerTier";
import type { Developer } from "@/hooks/useProjects";


interface DeveloperCardProps {
  developer: Developer;
  projectCount?: number;
  index?: number;
  heroImageUrl?: string;
}


const DeveloperCard = ({ developer, projectCount = 0, index = 99, heroImageUrl }: DeveloperCardProps) => {
  const tierKey = getDeveloperTier(developer.slug || "", developer.name || "", developer.rank);
  const tierLabel = TIER_LABELS[tierKey];
  const isEager = index < 8;
  const cardHeroImageUrl = developer.feature_image_url || heroImageUrl || undefined;

  const hasHero = !!cardHeroImageUrl;
  const logoValid = isValidDeveloperLogoUrl(developer.logo_url);
  const safeDescription = getSafeDeveloperDescription(developer);

  return (
    <Link to={`/developer/${developer.slug}`} className="block h-full [perspective:1200px]">
      <motion.div
        whileHover={{ y: -8, scale: 1.015, boxShadow: "0 26px 54px -14px rgba(0,0,0,0.36), 0 14px 28px -12px rgba(6,78,59,0.34)" }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        data-developer-card
        className="group relative rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full bg-[#FDFBF7]"
        style={{
          boxShadow: "0 6px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
        }}
      >

        {/* Hero — project photo (preferred) with logo/name fallback */}
        <div className="relative aspect-[5/3] bg-[#F5F0E6] flex items-center justify-center overflow-hidden">
          {hasHero ? (
            <>
              <img
                src={cardHeroImageUrl}
                alt={`${developer.name} featured project`}
                loading={isEager ? "eager" : "lazy"}
                referrerPolicy="no-referrer"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              {/* LOCKED: the developer logo is never dropped when a signature
                  project photo is used as the card hero. It always rides on the
                  photo as a plate, with automatic light/dark plate contrast. */}
              <div className="absolute bottom-2 left-2 z-10">
                <DeveloperLogo
                  variant="nameplate"
                  src={developer.logo_url}
                  name={developer.name}
                  alt={`${developer.name} logo`}
                  websiteUrl={(developer as { website_url?: string | null }).website_url}
                  loading={isEager ? "eager" : "lazy"}
                />
              </div>
            </>
          ) : (
            <DeveloperLogo
              variant="card"
              src={logoValid ? developer.logo_url : null}
              name={developer.name}
              alt={`${developer.name} logo`}
              websiteUrl={developer.website_url}
              loading={isEager ? "eager" : "lazy"}
              className="!rounded-none !border-0 !shadow-none"
            />
          )}

          {/* Tier Badge — unified emerald metallic pill, white text, always present */}
          {tierKey !== "other" && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className="jj-pill-emerald-metallic allow-white text-white border-0 px-3 py-1 text-[10px] font-bold tracking-[0.14em] shadow-[0_6px_16px_rgba(4,31,24,0.35)] rounded-full"
                data-no-contrast-guard
                data-allow-white
              >
                <span className="text-white">{tierLabel}</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Content section — white surface with black text & icons */}
        <div className="flex-1 p-4 bg-white flex flex-col">
          <h3 className="text-[#0A0A0A] font-bold text-base md:text-lg mb-1.5 line-clamp-1">
            {developer.name}
          </h3>

          <div className="flex-1 min-h-[36px]">
            {safeDescription ? (
              <p className="text-[#0A0A0A]/75 text-xs line-clamp-2 leading-relaxed">
                {safeDescription}
              </p>
            ) : (
              <p className="text-[#0A0A0A]/60 text-xs italic">
                Premier developer in the UAE market
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#0A0A0A]/80 text-xs mt-3 pt-3 border-t border-[#0A0A0A]/10">
            {projectCount > 0 ? (
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>{projectCount} Projects</span>
              </div>
            ) : null}
            {developer.completed_projects && developer.completed_projects > 0 ? (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>{developer.completed_projects.toLocaleString()}+ Delivered</span>
              </div>
            ) : null}
            {!projectCount && (!developer.completed_projects || developer.completed_projects === 0) && (
              <span className="text-[#0A0A0A]/70 text-xs">View developer portfolio</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default DeveloperCard;

