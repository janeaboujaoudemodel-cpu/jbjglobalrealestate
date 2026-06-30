import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";

interface PreFooterSeparatorProps {
  showCTA?: boolean;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
}

/**
 * PreFooterSeparator — unified to render the canonical homepage
 * "Ready to Get Started" CTA card (CombinedContactNewsletter) so every
 * pre-footer CTA across the site shares identical UI, colors, and motion.
 *
 * Legacy props (badge / primary / secondary buttons) are accepted for
 * backwards compatibility but intentionally ignored — the canonical card
 * uses WhatsApp / Call / Email tiles plus newsletter, not arbitrary links.
 */
export const PreFooterSeparator = ({
  showCTA = true,
  title,
  subtitle,
}: PreFooterSeparatorProps) => {
  if (!showCTA) {
    return (
      <section className="bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark py-16">
        <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4 text-center">
          <div className="h-px bg-[#EFE6D6]/30 w-24 mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <CombinedContactNewsletter
      title={title}
      subtitle={subtitle}
    />
  );
};

export default PreFooterSeparator;
