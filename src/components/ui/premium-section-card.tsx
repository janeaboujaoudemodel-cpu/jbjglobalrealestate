import { forwardRef, type HTMLAttributes } from "react";

/**
 * PremiumSectionCard — canonical gold-bordered champagne shell used to wrap
 * homepage sections so each one reads as a self-contained premium card.
 *
 * Mirrors the shell already used by ExploreServicesExpander, ToolkitShowcaseCard,
 * and the Mortgage Calculator block:
 *
 *   rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7]
 *   shadow-[0_8px_28px_rgba(184,149,85,0.10)]
 *
 * Renders inside a centered container with horizontal page padding so the
 * card never touches the screen edges. Vertical rhythm is controlled by the
 * full-bleed gold dividers placed between cards on the homepage.
 */
interface Props extends HTMLAttributes<HTMLElement> {
  /** Inner padding tier. Default md. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Inner background tone. Default page (#FDFBF7). */
  tone?: "page" | "surface" | "raised";
  /** Outer wrapper extra classes (controls container width / vertical spacing). */
  wrapperClassName?: string;
  /**
   * Width mode. Default "full" = card spans edge-to-edge with minimal gutter.
   * "contained" = legacy centered max-w-7xl container.
   */
  width?: "full" | "contained";
}

const PADDING: Record<NonNullable<Props["padding"]>, string> = {
  none: "",
  sm: "p-4 md:p-6",
  md: "p-5 md:p-8",
  lg: "p-6 md:p-10",
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  page: "bg-[#FDFBF7]",
  surface: "bg-[#F7F2EA]",
  raised: "bg-[#EFE6D6]",
};

export const PremiumSectionCard = forwardRef<HTMLElement, Props>(
  ({ padding = "md", tone = "page", wrapperClassName = "", className = "", width = "contained", children, ...rest }, ref) => {
    const inner =
      width === "contained"
        ? "w-full px-2 md:px-3"
        : "w-full";
    // Global fix: removed the wrapper gold border + rounded shell so sections
    // that already render their OWN bordered card (Explore Our Services,
    // Royal Tools Hub, AI Comparison, Mortgage block, etc.) don't show as a
    // double-bordered card. PremiumSectionCard is now a transparent layout
    // wrapper — only padding/tone classes are applied when explicitly set.
    const radius = "";
    const border = "";

    return (
      <section
        ref={ref}
        className={`w-full empty:hidden has-[>div>div:empty]:hidden ${wrapperClassName}`}
        {...rest}
      >
        <div className={`${inner} empty:hidden`}>
          <div
            className={`${radius} ${border} ${TONE[tone]} overflow-hidden shadow-none ${PADDING[padding]} ${className} empty:hidden`}
          >
            {children}
          </div>
        </div>
      </section>
    );
  }
);
PremiumSectionCard.displayName = "PremiumSectionCard";

export default PremiumSectionCard;

