import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";
import PortalHeroArt, { type PortalKind } from "./PortalHeroArt";

/**
 * PortalShowcaseCard — single canonical homepage card used to advertise
 * every JBJ portal (Broker / Developer / Careers / Owner / Investor).
 *
 * Update this file and every portal showcase across the homepage updates.
 *
 * Brand-locked:
 *  - champagne plate on navy frame
 *  - 1px gold hairline accents (no gold fills)
 *  - ink editorial typography
 *  - navy CTA (#102540) with white text — repaint guard friendly
 *  - hero artwork = purposeful SVG via <PortalHeroArt />, NOT a lucide icon
 *  - no decorative Roman serials, no "Est · MMXXV", no bag emblems
 */
export interface PortalShowcaseCardProps {
  kind: PortalKind;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  features: { label: string; icon: LucideIcon }[];
  /** Optional helper line shown under the CTA. */
  helper?: string;
}

const DEFAULT_HELPER =
  "Secure sign-in with your JBJ account — your workspace, personalized.";

export default function PortalShowcaseCard({
  kind,
  eyebrow,
  title,
  description,
  cta,
  href,
  features,
  helper = DEFAULT_HELPER,
}: PortalShowcaseCardProps) {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Navy backing frame — gold hairline, premium shadow */}
      <div
        data-surface="dark"
        data-on-dark
        data-no-contrast-guard
        className="allow-white pointer-events-none absolute inset-x-1 md:inset-x-3 inset-y-2 md:inset-y-3 rounded-[2.5rem] bg-[#102540] border border-[#B89555]/55 shadow-[0_30px_80px_-40px_rgba(16,37,64,0.65)]"
      />

      <div className="w-full px-1 md:px-3 relative">
        {/* Champagne plate */}
        <div
          data-surface="page"
          className="group/portal relative rounded-[2rem] border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-8 sm:p-10 md:p-16 lg:p-20 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55),0_2px_0_rgba(255,255,255,0.9)_inset] hover:shadow-[0_40px_100px_-40px_rgba(16,37,64,0.45),0_2px_0_rgba(255,255,255,0.95)_inset,0_0_0_1px_rgba(184,149,85,0.35)] hover:-translate-y-0.5 overflow-hidden m-1 md:m-2 transition-all duration-500"
        >
          {/* Inner wash */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,149,85,0.10),transparent_55%)]" />

          <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center">
            {/* LEFT — editorial copy */}
            <div className="min-w-0">
              {/* Eyebrow plaque */}
              <div className="inline-flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/55 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_6px_18px_-12px_rgba(184,149,85,0.45)] mb-6">
                <span className="relative inline-flex items-center justify-center w-4 h-4">
                  <span className="absolute inset-0 rotate-45 rounded-[3px] border border-[#B89555]/70" aria-hidden="true" />
                  <span className="w-1 h-1 rounded-full bg-[#B89555]" aria-hidden="true" />
                </span>
                <span className="text-[10.5px] font-semibold tracking-[0.28em] uppercase text-[#1A1A1A]">
                  {eyebrow}
                </span>
              </div>

              {/* Display title */}
              <h2 className="text-3xl md:text-[2.6rem] lg:text-[3.1rem] font-serif font-bold text-[#1A1A1A] leading-[1.02] tracking-[-0.018em]">
                {title}
              </h2>
              <div className="mt-4 flex items-center gap-3" aria-hidden="true">
                <span className="block h-px w-10 bg-gradient-to-r from-[#B89555]/80 to-transparent" />
                <span className="block w-1 h-1 rotate-45 bg-[#B89555]/70" />
                <span className="block h-px w-3 bg-[#B89555]/40" />
              </div>

              {/* Body */}
              <p className="text-[#1A1A1A]/80 text-[15.5px] md:text-[17px] mt-5 leading-[1.75] max-w-[58ch]">
                {description}
              </p>

              {/* Feature chips */}
              <ul className="flex flex-wrap gap-2.5 mt-8 list-none p-0">
                {features.map((f) => (
                  <li key={f.label}>
                    <span className="group/chip inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/40 text-[12.5px] font-semibold text-[#1A1A1A] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-8px_rgba(184,149,85,0.35)] hover:border-[#B89555]/75 hover:shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_20px_-10px_rgba(184,149,85,0.55)] transition-all duration-300">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FDFBF7] border border-[#B89555]/45 group-hover/chip:border-[#B89555]/75 transition-colors">
                        <f.icon className="w-3 h-3 text-[#1A1A1A]" strokeWidth={2.2} />
                      </span>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA row */}
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  to={href}
                  data-surface="dark"
                  data-on-dark
                  data-no-contrast-guard
                  data-allow-dark-cta
                  className="allow-white group inline-flex items-center gap-3 pl-7 pr-3 py-3 rounded-2xl bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/65 text-white hover:text-white [&_*]:hover:!text-white [&_svg]:hover:!stroke-white text-[15px] font-bold tracking-tight shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_34px_-14px_rgba(16,37,64,0.6)] hover:shadow-[0_1px_0_rgba(255,255,255,0.10)_inset,0_22px_56px_-16px_rgba(16,37,64,0.75)] hover:-translate-y-0.5 transition-all duration-300"
                  style={{ color: "#FFFFFF" }}
                >
                  <span className="allow-white" data-no-contrast-guard style={{ color: "#FFFFFF" }}>{cta}</span>
                  <span className="w-9 h-9 rounded-full bg-[#1a3d63] border border-[#B89555]/60 flex items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4 allow-white" data-no-contrast-guard style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.4} />
                  </span>
                </Link>
                {helper && (
                  <span className="inline-flex items-center gap-3 text-[12.5px] text-[#1A1A1A]/75 font-medium">
                    <span className="hidden sm:block h-4 w-px bg-[#B89555]/45" aria-hidden="true" />
                    <span className="italic font-normal">{helper}</span>
                  </span>
                )}
              </div>
            </div>

            {/* RIGHT — purposeful editorial hero artwork */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-[300px] h-[320px] flex items-center justify-center">
                {/* Soft champagne glow */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(184,149,85,0.12),transparent_70%)]"
                />
                {/* Vertical hairline rails */}
                <div aria-hidden="true" className="absolute left-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/35 to-transparent" />
                <div aria-hidden="true" className="absolute right-0 top-8 bottom-8 w-px bg-gradient-to-b from-transparent via-[#B89555]/35 to-transparent" />

                {/* Plate */}
                <div className="relative w-[220px] h-[290px] rounded-[28px] bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/55 shadow-[0_30px_70px_-28px_rgba(16,37,64,0.35),0_1px_0_rgba(255,255,255,0.95)_inset] p-6 transition-transform duration-500 group-hover/portal:scale-[1.02]">
                  <PortalHeroArt kind={kind} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
