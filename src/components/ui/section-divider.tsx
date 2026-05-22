/**
 * SectionDivider — permanently disabled (no-op).
 *
 * Per global design rule: NO section dividers, NO gold/gray ornaments,
 * NO hairlines between sections. The entire site reads as one continuous
 * champagne canvas. This component is kept as a no-op so existing call
 * sites compile without churn.
 *
 * Do not re-enable. See mem://constraints/no-gray-surfaces.
 */
type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne" | "ornament" | "none";
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SectionDivider(_props: SectionDividerProps) {
  return null;
}

export default SectionDivider;
