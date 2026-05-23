/**
 * SectionDividerGoldFullBleed — full edge-to-edge premium gold gradient divider.
 *
 * Escapes container padding to span 100vw. Used between major homepage
 * sections so each card reads as visually separated from the next.
 */
interface Props {
  /** sm = 1px, md = 2px, lg = 3px. Default md. */
  size?: "sm" | "md" | "lg";
  /** Vertical spacing (margin) around the rule. Default md. */
  spacing?: "sm" | "md" | "lg";
  className?: string;
}

export function SectionDividerGoldFullBleed({
  size = "md",
  spacing = "md",
  className = "",
}: Props) {
  const h = size === "sm" ? "h-px" : size === "lg" ? "h-[3px]" : "h-0.5";
  const my =
    spacing === "sm" ? "my-6 md:my-8" : spacing === "lg" ? "my-14 md:my-20" : "my-10 md:my-14";
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={`relative left-1/2 -translate-x-1/2 w-screen ${h} ${my} bg-gradient-to-r from-transparent via-[#B89555]/65 to-transparent ${className}`}
    />
  );
}

export default SectionDividerGoldFullBleed;
