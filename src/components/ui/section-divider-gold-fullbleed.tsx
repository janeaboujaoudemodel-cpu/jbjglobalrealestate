/**
 * SectionDividerGoldFullBleed — DISABLED globally.
 *
 * Per user directive: NO visible dividers between sections anywhere on the
 * site. Sections sit on one continuous champagne canvas and are separated
 * purely by padding/margin breathing room.
 *
 * Kept as a spacing-only presentational shim so existing call sites still
 * contribute vertical rhythm between sections without rendering any rule.
 *
 * Do not re-enable. See mem://constraints/no-gray-surfaces and
 * mem://ui-ux/visual-standards/sort-and-divider-standard (updated:
 * dividers removed, spacing-only).
 */
interface Props {
  size?: "sm" | "md" | "lg";
  spacing?: "sm" | "md" | "lg";
  className?: string;
}

export function SectionDividerGoldFullBleed({
  spacing = "md",
  className = "",
}: Props) {
  // Preserve vertical breathing room from the original divider so layouts
  // that relied on it don't visually collapse. No visible line.
  const my =
    spacing === "sm" ? "my-6 md:my-8" : spacing === "lg" ? "my-14 md:my-20" : "my-10 md:my-14";
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`w-full ${my} ${className}`}
    />
  );
}

export default SectionDividerGoldFullBleed;
