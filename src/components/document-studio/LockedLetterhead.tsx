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
      <div className="flex items-center gap-[24px]">
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block shrink-0 object-contain"
          style={{ width: 160, height: 160, background: "transparent" }}
        />
        {/* Vertical gold hairline divider between monogram and wordmark */}
        <div
          aria-hidden
          style={{ width: 1, alignSelf: "stretch", background: JBJ_GOLD, opacity: 0.55, margin: "8px 0" }}
        />
        <div className="leading-tight min-w-0 flex-1">
          <div
            className="font-semibold whitespace-nowrap"
            style={{
              fontSize: 26,
              color: JBJ_INK,
              letterSpacing: "0.06em",
              lineHeight: 1.1,
            }}
          >
            {JBJ_BRAND.legalName}
            <span style={{ color: JBJ_GOLD, margin: "0 10px", fontWeight: 400 }}>·</span>
            <span style={{ letterSpacing: "0.16em" }}>{JBJ_BRAND.legalSuffix}</span>
          </div>
        </div>
      </div>

    </header>
  );
}

/**
 * Full-bleed premium footer — edge-to-edge, same vertical rhythm as the
 * header. Company legal name on a single centered line; second row
 * redistributes office / phone / email+website across the full width.
 */
export function LockedFooter() {
  return (
    <footer
      className="w-full"
      style={{
        background: JBJ_CHAMPAGNE,
        borderTop: `1px solid ${JBJ_GOLD}`,
        color: JBJ_INK,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "18px 32px 20px",
        boxSizing: "border-box",
      }}
    >
      {/* Row 1 — Company full legal name, single centered line */}
      <div
        style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: JBJ_INK,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {JBJ_BRAND.legalName} · {JBJ_BRAND.legalSuffix}
      </div>

      {/* Hairline gold separator */}
      <div
        aria-hidden
        style={{
          height: 1,
          background: JBJ_GOLD,
          opacity: 0.45,
          margin: "10px 0 12px",
        }}
      />

      {/* Row 2 — Office · Phone · Email + Website redistributed full width */}
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td
              style={{
                verticalAlign: "top",
                width: "44%",
                fontSize: 10.5,
                lineHeight: 1.55,
                color: JBJ_INK,
                opacity: 0.88,
                paddingRight: 14,
              }}
            >
              <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65, marginBottom: 2 }}>Office</div>
              {JBJ_BRAND.address}
            </td>
            <td
              style={{
                verticalAlign: "top",
                width: "22%",
                fontSize: 11,
                color: JBJ_INK,
                textAlign: "center",
                paddingLeft: 8,
                paddingRight: 8,
              }}
            >
              <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65, marginBottom: 2 }}>Phone</div>
              <div style={{ fontWeight: 700 }}>{JBJ_BRAND.phone}</div>
            </td>
            <td
              style={{
                verticalAlign: "top",
                width: "34%",
                fontSize: 11,
                color: JBJ_INK,
                textAlign: "right",
                paddingLeft: 14,
              }}
            >
              <div style={{ fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.65, marginBottom: 2 }}>Contact</div>
              <a
                href={`mailto:${JBJ_BRAND.email}`}
                style={{ color: JBJ_GOLD, textDecoration: "none", fontWeight: 700 }}
              >
                {JBJ_BRAND.email}
              </a>
              <span style={{ color: JBJ_INK, opacity: 0.4, margin: "0 6px" }}>·</span>
              <a
                href={`https://${JBJ_BRAND.website}`}
                style={{ color: JBJ_GOLD, textDecoration: "none", fontWeight: 700, letterSpacing: "0.04em" }}
              >
                {JBJ_BRAND.website}
              </a>
              <div style={{ fontSize: 9.5, color: JBJ_INK, opacity: 0.6, marginTop: 3 }}>
                Trade Licence {JBJ_BRAND.tradeLicense}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  );
}
