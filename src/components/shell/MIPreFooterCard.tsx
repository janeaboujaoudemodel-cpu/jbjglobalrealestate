import PreFooterSeparator from "@/components/PreFooterSeparator";

interface MIPreFooterCardProps {
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
  /**
   * Tailwind max-width class. Kept for backwards compatibility; the shared
   * CTA layout lock in CSS now forces the canonical global content track so
   * these cards match the homepage "Top Areas in Dubai" panel everywhere.
   */
  maxWidthClass?: string;
  innerInset?: boolean;
}

export default function MIPreFooterCard({ maxWidthClass = "max-w-none", innerInset = false, ...props }: MIPreFooterCardProps) {
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
      className="jj-cta-lock scroll-mt-24 bg-[#F7F2EA] py-6 md:py-8"
    >
      <div data-cta-inner className={`${maxWidthClass} mx-auto w-full px-4 sm:px-6 lg:px-8`}>
        <div className={insetPad}>
          <div data-cta-card className="overflow-hidden rounded-3xl shadow-sm">
            <PreFooterSeparator {...props} fitContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
