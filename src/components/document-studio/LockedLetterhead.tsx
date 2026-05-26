/**
 * Locked premium letterhead + footer rendered as React components.
 *
 * Header: JBJ monogram tile + black wordmark + gold "L.L.C · S.O.C" line.
 *         No address / email / phone (those live in the footer only).
 * Footer: All gold, centered, two short lines. No confidentiality
 *         boilerplate, no fake phone number.
 */

import { JBJ_BRAND, JBJ_GOLD, JBJ_INK, JBJ_CHAMPAGNE, jbjMonogramSrc } from "@/templates/jbjLockedChrome";

export function LockedLetterhead() {
  return (
    <header
      className="relative w-full px-10 py-5"
      style={{
        background: JBJ_CHAMPAGNE,
        borderBottom: `1px solid ${JBJ_GOLD}`,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div className="flex items-center gap-4">
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block shrink-0 object-contain"
          style={{
            width: 44,
            height: 44,
            border: `1px solid ${JBJ_GOLD}`,
            borderRadius: 6,
            background: "#FDFBF7",
            padding: 4,
            boxSizing: "border-box",
          }}
        />
        <div className="leading-tight min-w-0">
          <div
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: 18, color: JBJ_INK, letterSpacing: "0.01em" }}
          >
            {JBJ_BRAND.legalName}
          </div>
          <div
            className="uppercase mt-1"
            style={{ fontSize: 10, letterSpacing: "0.22em", color: JBJ_GOLD }}
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
