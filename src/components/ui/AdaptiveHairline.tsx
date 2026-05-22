/**
 * AdaptiveHairline — permanently disabled (no-op).
 *
 * Per global design rule: NO hairline dividers between sections. Champagne
 * canvas flows uninterrupted. Component kept as a no-op so existing call
 * sites compile. See mem://constraints/no-gray-surfaces.
 */
interface AdaptiveHairlineProps {
  variant?: "accent" | "nav" | "soft";
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AdaptiveHairline = (_props: AdaptiveHairlineProps) => null;

export default AdaptiveHairline;
