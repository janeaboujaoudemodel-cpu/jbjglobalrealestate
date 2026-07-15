import { type ReactNode } from "react";

/**
 * BrandPageShell — the locked emerald+champagne brand shell used by services
 * pages (ServicePageTemplate). Extracted so Company / Legal / Help / Guides /
 * Insights / My Account hub pages inherit the exact same contrast, panel
 * treatment, and FAQ hover/active behavior.
 *
 * Usage:
 *   <BrandPageShell slug="about">
 *     <BrandPanel eyebrow="..." title="..." text="...">...</BrandPanel>
 *   </BrandPageShell>
 */

const INK = "#1A1A1A";
const INK_SOFT = "rgba(26,26,26,0.74)";
const EMERALD = "#064E3B";
const EMERALD_DARK = "#042C1C";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const CHAMPAGNE = "#F7F2EA";
const CHAMPAGNE_DEEP = "#EFE3CF";
export const EMERALD_GRADIENT = `linear-gradient(135deg, ${EMERALD} 0%, ${EMERALD_DARK} 58%, ${BLACK} 100%)`;
export const PANEL_GRADIENT = "linear-gradient(160deg, #FFFDF8 0%, #F7F2EA 48%, #EFE3CF 100%)";
export const BRAND_TOKENS = { INK, INK_SOFT, EMERALD, EMERALD_DARK, WHITE, CHAMPAGNE, CHAMPAGNE_DEEP };

export function BrandPageShell({
  slug,
  children,
  className = "",
}: {
  slug: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-service-page={slug}
      data-pm-page
      className={className}
      style={{ background: CHAMPAGNE }}
    >
      <style>{`
        [data-pm-page], [data-pm-page] * { box-sizing: border-box; }
        [data-pm-page] { background: ${CHAMPAGNE} !important; }
        [data-pm-page] main[data-service-body] {
          background: ${CHAMPAGNE} !important;
          background-image: linear-gradient(180deg, ${CHAMPAGNE} 0%, ${CHAMPAGNE_DEEP} 100%) !important;
        }
        [data-pm-page] [data-pm-panel],
        [data-pm-page] [data-pm-panel] *:not(svg):not(path):not(line):not(polyline):not(circle):not(rect):not([data-pm-emerald]):not([data-pm-emerald] *):not([data-pm-toc-button]):not([data-pm-toc-button] *) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-pm-emerald],
        [data-pm-page] [data-pm-emerald] *:not(input):not(textarea),
        [data-pm-page] [data-pm-toc-button],
        [data-pm-page] [data-pm-toc-button] * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-emerald] svg,
        [data-pm-page] [data-pm-emerald] path,
        [data-pm-page] [data-pm-emerald] line,
        [data-pm-page] [data-pm-emerald] polyline,
        [data-pm-page] [data-pm-emerald] circle,
        [data-pm-page] [data-pm-emerald] rect,
        [data-pm-page] [data-pm-toc-button] svg,
        [data-pm-page] [data-pm-toc-button] path,
        [data-pm-page] [data-pm-toc-button] line,
        [data-pm-page] [data-pm-toc-button] polyline,
        [data-pm-page] [data-pm-toc-button] circle,
        [data-pm-page] [data-pm-toc-button] rect {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald],
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(*, h1, h2, h3, h4, h5, h6, p, span, div, small, strong, em, b, label),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button],
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(*, h1, h2, h3, h4, h5, h6, p, span, div, small, strong, em, b, label) {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          text-shadow: none !important;
          opacity: 1 !important;
        }
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-emerald] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]) *,
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]),
        html body #root [data-pm-page] [data-pm-panel] [data-pm-toc-button] :is(svg, path, line, polyline, polygon, circle, rect, [class*="lucide"]) * {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          stroke: ${WHITE} !important;
          opacity: 1 !important;
        }
        [data-pm-page] [data-pm-faq-item] {
          background: rgba(255,253,248,0.72);
          transition: background 200ms ease, border-color 200ms ease;
        }
        [data-pm-page] [data-pm-faq-trigger],
        [data-pm-page] [data-pm-faq-trigger] *:not(svg):not(path) {
          color: ${INK} !important;
          -webkit-text-fill-color: ${INK} !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"],
        [data-pm-page] [data-pm-faq-item]:hover,
        [data-pm-page] [data-pm-faq-item]:focus-within {
          background: ${EMERALD_GRADIENT} !important;
          border-color: rgba(255,255,255,0.22) !important;
        }
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] *,
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer],
        html body #root [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer] *,
        html body #root [data-pm-page] [data-pm-faq-item]:hover *,
        html body #root [data-pm-page] [data-pm-faq-item]:hover [data-pm-faq-answer],
        html body #root [data-pm-page] [data-pm-faq-item]:hover [data-pm-faq-answer] *,
        html body #root [data-pm-page] [data-pm-faq-item]:focus-within *,
        html body #root [data-pm-page] [data-pm-faq-item]:focus-within [data-pm-faq-answer] {
          color: ${WHITE} !important;
          -webkit-text-fill-color: ${WHITE} !important;
          opacity: 1 !important;
          text-shadow: none !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"] svg,
        [data-pm-page] [data-pm-faq-item][data-state="open"] path,
        [data-pm-page] [data-pm-faq-item]:hover svg,
        [data-pm-page] [data-pm-faq-item]:hover path {
          color: ${WHITE} !important;
          stroke: ${WHITE} !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer] {
          position: relative;
          margin-top: 8px;
          padding-top: 14px !important;
        }
        [data-pm-page] [data-pm-faq-item][data-state="open"] [data-pm-faq-answer]::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 20%, rgba(255,255,255,0.55) 80%, rgba(255,255,255,0) 100%);
        }
      `}</style>
      {children}
    </div>
  );
}

export function BrandPanel({
  id,
  eyebrow,
  title,
  text,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-28 py-6 md:py-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          data-pm-panel
          className="rounded-3xl border p-6 md:p-9"
          style={{
            background: PANEL_GRADIENT,
            borderColor: "rgba(184,149,85,0.42)",
            boxShadow: "0 24px 56px -36px rgba(44,31,13,0.34), inset 0 1px 0 rgba(255,255,255,0.78)",
          }}
        >
          {(eyebrow || title || text) && (
            <div className="mb-7">
              {eyebrow ? (
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: EMERALD }}>
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h2
                  className="text-3xl font-semibold leading-tight md:text-4xl"
                  style={{ color: INK, fontFamily: '"Cormorant Garamond", serif' }}
                >
                  {title}
                </h2>
              ) : null}
              {text ? (
                <p className="mt-3 max-w-3xl text-base leading-relaxed" style={{ color: INK_SOFT }}>
                  {text}
                </p>
              ) : null}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

export function EmeraldTile({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-pm-emerald
      data-surface="emerald"
      data-no-section-frame
      className={`rounded-2xl border p-5 ${className}`}
      style={{
        background: EMERALD_GRADIENT,
        borderColor: "rgba(255,255,255,0.22)",
        boxShadow: "0 18px 38px -28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.13)",
        color: WHITE,
      }}
    >
      {children}
    </div>
  );
}

export function EmeraldIcon({
  icon: Icon,
  large = false,
}: {
  icon: import("lucide-react").LucideIcon;
  large?: boolean;
}) {
  return (
    <span
      data-pm-emerald
      className={`${large ? "h-14 w-14" : "h-11 w-11"} inline-flex shrink-0 items-center justify-center rounded-full`}
      style={{ background: EMERALD_GRADIENT, color: WHITE }}
    >
      <Icon className={large ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.2} />
    </span>
  );
}
