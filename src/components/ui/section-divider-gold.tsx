interface SectionDividerGoldProps {
  /** sm = 1px, md = 2px, lg = 3px (bigger between major sections). Default md. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Premium gold gradient divider used between filter blocks and major sections.
 * Champagne-faded horizontal rule — never gray.
 */
export function SectionDividerGold({
  size = "md",
  className = "",
}: SectionDividerGoldProps) {
  const h = size === "sm" ? "h-px" : size === "lg" ? "h-[3px]" : "h-0.5";
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`w-full ${h} bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent ${className}`}
    />
  );
}

export default SectionDividerGold;
