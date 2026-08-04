/**
 * ContentPageShell — LOCKED wrapper for content pages.
 * Guarantees:
 *  - Solid premium emerald hero, centered title (no stripe overlay).
 *  - Full-width content column (max-w-4xl, mx-auto) — TOC NEVER shrinks it.
 *  - Floating right-side emerald TOC (z-index 60), fixed, always above sections.
 * See .lovable/memory/ui-ux/visual-standards/content-page-layout-standard.md
 */
import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import PremiumEmeraldHero from "./PremiumEmeraldHero";
import { GuideTableOfContents } from "@/components/guides/GuideTableOfContents";

export interface ContentSection {
  id: string;
  title: string;
  icon?: LucideIcon;
}

interface ContentPageShellProps {
  hero: {
    eyebrow: string;
    eyebrowIcon?: LucideIcon;
    title: ReactNode;
    subtitle?: string;
    meta?: ReactNode;
    height?: "sm" | "md" | "lg";
  };
  sections: ContentSection[];
  tocTitle?: string;
  children: ReactNode;
}

export function ContentPageShell({
  hero,
  sections,
  tocTitle = "In This Guide",
  children,
}: ContentPageShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      <PremiumEmeraldHero {...hero} />

      {/* Floating right-side emerald TOC — fixed, above all sections. */}
      <GuideTableOfContents items={sections} title={tocTitle} />

      {/* Full-width content column; TOC floats over, never shrinks this. */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-16">
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

export default ContentPageShell;
