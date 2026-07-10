/**
 * MarketIntelligenceHero — now a thin wrapper over the LOCKED
 * PremiumEmeraldHero. Solid emerald ombré, centered title, NO photo,
 * NO stripe overlays. Keeps the legacy prop surface so all MI pages
 * (Market Intelligence, Overview, Areas, Reports, Methodology)
 * inherit the fix without changes.
 *
 * Data attributes are preserved so:
 *  - MarketIntelligenceTableOfContents "pastHero" logic keeps working
 *    ([data-mi-hero], [data-hero-dark]).
 *  - GuideTableOfContents also detects it via [data-premium-emerald-hero].
 */
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import PremiumEmeraldHero from "@/components/content-page/PremiumEmeraldHero";

interface MarketIntelligenceHeroProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: ReactNode;
  description: string;
  /** Legacy props — intentionally ignored to enforce the locked emerald hero. */
  videoSrc?: string;
  videoPoster?: string;
  backgroundImage?: string;
  actions?: ReactNode;
}

export const MarketIntelligenceHero = ({
  badge,
  badgeIcon,
  title,
  description,
  actions,
}: MarketIntelligenceHeroProps) => {
  return (
    <div data-mi-hero data-unified-hero data-faq-hero data-hero-dark>
      <PremiumEmeraldHero
        eyebrow={badge}
        eyebrowIcon={badgeIcon}
        title={title}
        subtitle={description}
        meta={actions ? <div className="flex flex-wrap justify-center gap-4">{actions}</div> : undefined}
      />
    </div>
  );
};

export default MarketIntelligenceHero;
