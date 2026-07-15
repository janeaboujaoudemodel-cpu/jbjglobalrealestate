import PreFooterSeparator from "@/components/PreFooterSeparator";

interface MIPreFooterCardProps {
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
}

/**
 * MIPreFooterCard — canonical pre-footer CTA wrapper for Market Intelligence
 * and Insights pages. Constrains the emerald "Ready to..." band to the same
 * max-w-4xl width as the "Compliance & Transparency" card, so both cards
 * align edge-to-edge across the site.
 */
export default function MIPreFooterCard(props: MIPreFooterCardProps) {
  return (
    <div id="cta" className="scroll-mt-24 bg-[#F7F2EA] py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <PreFooterSeparator {...props} />
        </div>
      </div>
    </div>
  );
}
