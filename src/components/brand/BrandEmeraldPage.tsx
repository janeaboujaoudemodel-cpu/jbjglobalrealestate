import { ReactNode } from "react";

/**
 * BrandEmeraldPage
 * Locks the entire page (Services / Insights / Guides) to the emerald+champagne brand.
 * All styling is enforced globally by PASS 165 in src/index.css, keyed on
 * `data-brand-emerald-page`. Wrap the page root and mark heros with
 * `<section data-brand-hero>...</section>` and cards with
 * `data-surface="emerald"` or `data-surface="champagne"`.
 */
export function BrandEmeraldPage({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const Component = Tag as any;
  return (
    <Component
      data-brand-emerald-page
      data-surface="emerald"
      data-on-dark="true"
      className={`min-h-screen ${className}`}
      style={{ background: "#010806" }}
    >
      {children}
    </Component>
  );
}

export default BrandEmeraldPage;
