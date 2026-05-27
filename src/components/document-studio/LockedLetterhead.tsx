/**
 * Locked premium letterhead + footer rendered as React components.
 * Mirrors `jbjFooterHtml()` byte-for-byte so preview === export.
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
          style={{ width: 132, height: 132, background: "transparent" }}
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
      className="w-full"
      style={{
        background: JBJ_CHAMPAGNE,
        borderTop: `1px solid ${JBJ_GOLD}`,
        color: JBJ_INK,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 10,
        lineHeight: 1.6,
        padding: "14px 36px",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "top", width: "34%", paddingRight: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.20em", textTransform: "uppercase", color: JBJ_INK }}>
                {JBJ_BRAND.legalName}
              </div>
              <div style={{ fontSize: 9.5, letterSpacing: "0.10em", color: JBJ_INK, opacity: 0.75, marginTop: 2 }}>
                {JBJ_BRAND.legalSuffix}
              </div>
              <div style={{ fontSize: 9.5, color: JBJ_INK, opacity: 0.7, marginTop: 4 }}>
                Trade Licence {JBJ_BRAND.tradeLicense}
              </div>
            </td>
            <td style={{ verticalAlign: "top", width: "36%", textAlign: "center", padding: "0 10px", color: JBJ_INK, opacity: 0.85 }}>
              {JBJ_BRAND.address}
            </td>
            <td style={{ verticalAlign: "top", width: "30%", textAlign: "right", paddingLeft: 14 }}>
              <div style={{ color: JBJ_INK, fontWeight: 600 }}>{JBJ_BRAND.phone}</div>
              <div style={{ marginTop: 2 }}>
                <a href={`mailto:${JBJ_BRAND.email}`} style={{ color: JBJ_GOLD, textDecoration: "none", fontWeight: 600 }}>
                  {JBJ_BRAND.email}
                </a>
              </div>
              <div style={{ marginTop: 2 }}>
                <a href={`https://${JBJ_BRAND.website}`} style={{ color: JBJ_GOLD, textDecoration: "none", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {JBJ_BRAND.website}
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  );
}
