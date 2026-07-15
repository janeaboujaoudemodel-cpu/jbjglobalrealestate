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

export default function MIPreFooterCard({ maxWidthClass = "max-w-4xl", innerInset = false, ...props }: MIPreFooterCardProps & { innerInset?: boolean }) {
  // When rendered on service pages (innerInset=true), the visible CTA card must
  // align with the FAQ accordion items above — those sit inside a Section panel
  // with p-6 md:p-9 padding, so we add matching horizontal inset here.
  const insetPad = innerInset ? "px-6 md:px-9" : "";
  return (
    <div id="cta" className="scroll-mt-24 bg-[#F7F2EA] py-12 md:py-16">
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className={insetPad}>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <PreFooterSeparator {...props} />
          </div>
        </div>
      </div>
    </div>
  );
}
