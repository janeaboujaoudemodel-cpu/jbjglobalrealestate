/**
 * Locked premium letterhead + footer rendered as React components.
 *
 * Header: transparent JBJ monogram (bigger, no box) + black wordmark
 *         + BLACK "L.L.C · S.O.C" line. No address/email/phone here.
 * Footer: All gold, centered, two short lines.
 */

import { JBJ_BRAND, JBJ_GOLD, JBJ_INK, JBJ_CHAMPAGNE, jbjMonogramSrc } from "@/templates/jbjLockedChrome";

export function LockedLetterhead() {
  return (
    <header
      className="relative w-full py-6"
      style={{
        background: JBJ_CHAMPAGNE,
        borderBottom: `1px solid ${JBJ_GOLD}`,
        fontFamily: "Inter, system-ui, sans-serif",
        paddingLeft: 32,
        paddingRight: 48,
      }}
    >
      <div className="flex items-center gap-[28px]">
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block shrink-0 object-contain"
          style={{
            width: 132,
            height: 132,
            background: "transparent",
          }}
        />
        <div className="leading-tight min-w-0 flex-1">
          <div
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 30, color: JBJ_INK, letterSpacing: "0.015em", lineHeight: 1.1 }}
          >
            {JBJ_BRAND.legalName}
          </div>
          <div
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 17, color: JBJ_INK, letterSpacing: "0.18em", marginTop: 6 }}
          >
            {JBJ_BRAND.legalSuffix}
          </div>
        </div>
      </div>
    </header>
  );
}

export function LockedFooter() {
  return (
    <footer
      className="w-full px-10 py-4 text-center"
      style={{
        background: JBJ_CHAMPAGNE,
        borderTop: `1px solid ${JBJ_GOLD}`,
        color: JBJ_GOLD,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 10,
        lineHeight: 1.7,
      }}
    >
      <div className="uppercase" style={{ letterSpacing: "0.22em" }}>
        {JBJ_BRAND.legalName} · {JBJ_BRAND.legalSuffix}
      </div>
      <div style={{ letterSpacing: "0.04em", marginTop: 2 }}>
        {JBJ_BRAND.address} · {JBJ_BRAND.email} · {JBJ_BRAND.website}
      </div>
    </footer>
  );
}
