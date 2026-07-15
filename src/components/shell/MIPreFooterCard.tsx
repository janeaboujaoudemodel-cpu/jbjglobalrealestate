import PreFooterSeparator from "@/components/PreFooterSeparator";

interface MIPreFooterCardProps {
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
  /**
   * Tailwind max-width class. Defaults to `max-w-4xl` for MI/Insights pages;
   * service pages pass `max-w-6xl` so the CTA card matches the width of the
   * other content cards above it.
   */
  maxWidthClass?: string;
}

export default function MIPreFooterCard({ maxWidthClass = "max-w-4xl", ...props }: MIPreFooterCardProps) {
  return (
    <div id="cta" className="scroll-mt-24 bg-[#F7F2EA] py-12 md:py-16">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <PreFooterSeparator {...props} />
        </div>
      </div>
    </div>
  );
}
