import { forwardRef, type HTMLAttributes } from "react";

/**
 * AIShellCard — the canonical outer-shell card used site-wide on public and
 * tool pages. Mirrors the shell used by AIComparisonWidget on the homepage:
 *
 *   bg-[#F7F2EA] rounded-2xl p-8 md:p-10 relative overflow-hidden
 *   + two soft champagne blur orbs in opposite corners
 *
 * NEVER use on homepage components (`src/pages/Index.tsx` and
 * `src/components/home/**` are locked).
 */
type Padding = "sm" | "md" | "lg";
type Tone = "surface" | "page" | "raised";

interface Props extends HTMLAttributes<HTMLElement> {
  padding?: Padding;
  tone?: Tone;
  /** Hide the decorative blur orbs (useful when the card already has heavy art). */
  noOrbs?: boolean;
  as?: "section" | "div" | "article";
}

const PADDING: Record<Padding, string> = {
  sm: "p-5 md:p-6",
  md: "p-6 md:p-8",
  lg: "p-8 md:p-10",
};

const TONE: Record<Tone, string> = {
  surface: "bg-[#F7F2EA]",
  page: "bg-[#FDFBF7]",
  raised: "bg-[#EFE6D6]",
};

export const AIShellCard = forwardRef<HTMLElement, Props>(
  (
    {
      padding = "lg",
      tone = "surface",
      noOrbs = false,
      as = "section",
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const Tag = as as any;
    return (
      <Tag
        ref={ref}
        data-surface="light"
        className={`${TONE[tone]} rounded-2xl ${PADDING[padding]} relative overflow-hidden ${className}`}
        {...rest}
      >
        {!noOrbs && (
          <>
            <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
          </>
        )}
        <div className="relative z-10">{children}</div>
      </Tag>
    );
  },
);
AIShellCard.displayName = "AIShellCard";

export default AIShellCard;
