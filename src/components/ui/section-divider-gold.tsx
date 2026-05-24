/**
 * SectionDividerGold — DISABLED globally.
 *
 * Per user directive: NO visible dividers between sections anywhere on the
 * site. Spacing alone separates sections. This shim keeps existing call
 * sites compiling and contributes a tiny vertical gap (no rule, no color).
 *
 * Do not re-enable. See mem://constraints/no-gray-surfaces.
 */
interface SectionDividerGoldProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SectionDividerGold({ size = "md", className = "" }: SectionDividerGoldProps) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`w-full my-4 md:my-6 ${className}`}
    />
  );
}

export default SectionDividerGold;
