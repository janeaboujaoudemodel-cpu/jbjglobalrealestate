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
  innerInset?: boolean;
}

export default function MIPreFooterCard({ maxWidthClass = "max-w-4xl", innerInset = false, ...props }: MIPreFooterCardProps) {
  // Service pages compare this CTA against the full section card, not an inner
  // text rail, so the emerald card itself must occupy the same content width.
  const insetPad = innerInset ? "" : "";
  return (
    // `data-cta-lock` + `jj-cta-lock` is a shared container/layout lock: it
    // breaks out of any nested wrapper (sidebars, prose containers, narrow
    // shells) using the full-bleed technique so the CTA always renders at its
    // intended width regardless of route or parent constraints. See
    // src/index.css → `[data-cta-lock].jj-cta-lock`.
    <div
      id="cta"
      data-cta-lock
      className="jj-cta-lock scroll-mt-24 bg-[#F7F2EA] py-12 md:py-16"
    >
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className={insetPad}>
          <div className="rounded-2xl overflow-hidden shadow-sm">
            <PreFooterSeparator {...props} fitContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
