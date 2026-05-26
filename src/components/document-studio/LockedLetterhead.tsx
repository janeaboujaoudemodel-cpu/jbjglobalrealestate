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
      className="relative w-full py-5"
      style={{
        background: JBJ_CHAMPAGNE,
        borderBottom: `1px solid ${JBJ_GOLD}`,
        fontFamily: "Inter, system-ui, sans-serif",
        paddingLeft: 24,
        paddingRight: 40,
      }}
    >
      <div className="flex items-center gap-[20px]">
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block shrink-0 object-contain"
          style={{
            width: 96,
            height: 96,
            background: "transparent",
          }}
        />
        <div className="leading-tight min-w-0">
          <div
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 19, color: JBJ_INK, letterSpacing: "0.01em" }}
          >
            {JBJ_BRAND.legalName}
          </div>
          <div
            className="font-semibold whitespace-nowrap mt-0.5"
            style={{ fontSize: 13, color: JBJ_INK, letterSpacing: "0.04em" }}
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
