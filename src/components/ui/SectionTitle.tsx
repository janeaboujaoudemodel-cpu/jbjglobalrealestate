import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SectionTitle — Canonical page/section heading.
 *
 * Renders an ink-black (#1A1A1A) heading using the project's typography
 * standard. Use this for every top-level section title so styling stays
 * consistent across the site.
 *
 * Variants control size only — color is locked to ink #1A1A1A.
 *
 * Usage:
 *   <SectionTitle>Top Areas in Dubai</SectionTitle>
 *   <SectionTitle as="h3" size="sm">Quick Reference</SectionTitle>
 *   <SectionTitle eyebrow="Insights">Market Intelligence</SectionTitle>
 */

type SectionTitleSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<SectionTitleSize, string> = {
  sm: "text-xl md:text-2xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-4xl md:text-5xl",
};

export interface SectionTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  size?: SectionTitleSize;
  /** Optional small eyebrow label rendered above the title. */
  eyebrow?: React.ReactNode;
  /** Optional supporting subtitle rendered below the title. */
  subtitle?: React.ReactNode;
  /** Align the block. Defaults to "left". */
  align?: "left" | "center";
}

export const SectionTitle = React.forwardRef<HTMLHeadingElement, SectionTitleProps>(
  (
    {
      as: Tag = "h2",
      size = "lg",
      eyebrow,
      subtitle,
      align = "left",
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const alignment = align === "center" ? "text-center mx-auto" : "text-left";

    return (
      <div className={cn("section-title-block", alignment)} data-section-title-block="">
        {eyebrow ? (
          <div
            className={cn(
              "section-title-eyebrow text-[11px] uppercase tracking-[0.18em] font-medium text-[#1A1A1A]/60 mb-2",
            )}
          >
            {eyebrow}
          </div>
        ) : null}
        <Tag
          ref={ref}
          data-section-title=""
          className={cn(
            "font-semibold tracking-tight leading-tight text-[#1A1A1A]",
            SIZE_CLASSES[size],
            className,
          )}
          style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
          {...rest}
        >
          {children}
        </Tag>
        {subtitle ? (
          <p className="section-title-subtitle mt-2 text-sm md:text-base text-[#1A1A1A]/70 max-w-2xl">
            {subtitle}
          </p>
        ) : null}
      </div>
    );
  },
);

SectionTitle.displayName = "SectionTitle";

export default SectionTitle;
