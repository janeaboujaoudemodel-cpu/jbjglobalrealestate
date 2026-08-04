import { ReactNode } from "react";

/**
 * PremiumEmeraldCard — canonical JBJ front-end card.
 *
 * Reproduces the structure the owner approved on the "Ready to step inside JBJ"
 * band: a full-bleed emerald-ombre band with a slightly lighter metallic
 * emerald rectangle inside it, white ink and white icons throughout.
 *
 * Use for public/front-end cards only. Never apply to AI tool surfaces.
 */
export function PremiumEmeraldBand({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-surface="emerald"
      data-emerald="true"
      data-no-contrast-guard
      data-no-section-frame
      className={`jj-newsletter-emerald w-full overflow-hidden ${className}`}
    >
      {children}
    </section>
  );
}

export function PremiumEmeraldCard({
  className = "",
  children,
  as: Tag = "div",
  ...rest
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "article" | "button" | "a";
} & Record<string, unknown>) {
  const Comp = Tag as "div";
  return (
    <Comp
      data-surface="emerald"
      data-emerald="true"
      data-emerald-ok="button"
      data-allow-dark-cta
      data-no-contrast-guard
      className={`jj-emerald-metallic jj-ready-cta-metallic allow-white rounded-xl px-5 py-6 ${className}`}
      style={{ color: "#FFFFFF" }}
      {...(rest as object)}
    >
      {children}
    </Comp>
  );
}

export default PremiumEmeraldCard;
