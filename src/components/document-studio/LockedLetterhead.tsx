/**
 * Locked premium letterhead + footer rendered as React components.
 * Mirrors jbjHeaderHtml / jbjFooterHtml so preview === export.
 *
 * Themes:
 *   - "champagne"  → champagne bg, BLACK monogram, INK wordmark (default)
 *   - "emerald"    → dark emerald bg, WHITE monogram, WHITE wordmark
 *
 * Locked invariants:
 *   - Monogram + wordmark VERTICALLY centered inside the chrome band
 *   - Monogram renders full asset (top + bottom dividers around the gold B)
 *   - "B going inside" 3D engraved effect via stacked shadow/highlight masks
 *   - Wordmark "L.L.C S.O.C" suffix non-breaking via &nbsp; + whiteSpace:nowrap
 *   - Footer: single hairline divider, charcoal body, no duplicate legal name
 */

import { JBJ_BRAND, JBJ_GOLD, JBJ_CHAMPAGNE, jbjMonogramSrc } from "@/templates/jbjLockedChrome";

export type LetterheadTheme = "champagne" | "emerald";

const tokens = (theme: LetterheadTheme) =>
  theme === "emerald"
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", jColor: "#FFFFFF", bColor: "#FFFFFF" }
    : { bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD, jColor: "#1A1A1A", bColor: JBJ_GOLD };

const footerTokens = () => ({ bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD });

export function LockedLetterhead({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = tokens(theme);

  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        // Header band runs from page top to the gold divider; content is centered in that full height.
        padding: "0 22px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-center min-w-0"
      style={{ gridTemplateColumns: "210px minmax(0,1fr)", columnGap: 16, minHeight: 210, height: 210 }}
      >
        <div
          style={{
            width: 200,
            height: 210,
            justifySelf: "center",
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={jbjMonogramSrc}
            alt="JBJ"
            aria-label="JBJ"
            role="img"
            style={{
              width: 184,
              height: 184,
              objectFit: "contain",
              display: "block",
              filter: theme === "emerald"
                ? "brightness(0) invert(1) drop-shadow(0 1px 1px rgba(0,0,0,.18))"
                : "saturate(1.12) contrast(1.06) drop-shadow(0 1px 0 rgba(255,255,255,.82)) drop-shadow(0 1.4px 1.4px rgba(72,48,15,.18))",
            }}
          />
        </div>

        <div
          className="min-w-0 text-left"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: 210,
            paddingLeft: 0,
            paddingRight: 30,
            lineHeight: 1,
            overflow: "visible",
          }}
        >
          <div
            className="font-bold"
            style={{
              display: "block",
              width: "100%",
              fontSize: 34,
              fontWeight: 900,
              color: t.fg,
              letterSpacing: "0.104em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: "scaleX(.985)",
              transformOrigin: "left center",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span
              style={{
                letterSpacing: "0.125em",
                whiteSpace: "nowrap",
                color: t.fg,
                WebkitTextFillColor: t.fg,
              }}
            >
              {JBJ_BRAND.legalSuffix}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Ultra-compact footer — single divider, charcoal body, single info row.
 * No duplicated legal name. Height capped via padding.
 */
export function LockedFooter({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = footerTokens();
  return (
    <footer
      className="w-full"
      style={{
        background: t.bg,
        borderTop: `1px solid ${t.hairline}`,
        color: t.fg,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "0 28px",
        boxSizing: "border-box",
        minHeight: 58,
      }}
    >
      <table style={{ width: "100%", height: 58, borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", width: "44%", fontSize: 8.5, lineHeight: 1.25, color: t.fg, WebkitTextFillColor: t.fg, padding: "0 14px 0 0" }}>
              {JBJ_BRAND.address}
            </td>
            <td style={{ verticalAlign: "middle", width: "22%", fontSize: 9, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "center", padding: "0 8px", fontWeight: 700, lineHeight: 1.35 }}>
              {(JBJ_BRAND.letterheadPhones ?? [JBJ_BRAND.phone]).map((p) => (
                <div key={p} style={{ whiteSpace: "nowrap" }}>{p}</div>
              ))}
            </td>
            <td style={{ verticalAlign: "middle", width: "34%", fontSize: 8.5, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "right", padding: "0 0 0 14px" }}>
              <a href={`mailto:${JBJ_BRAND.email}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 700 }}>
                {JBJ_BRAND.email.toUpperCase()}
              </a>
              <span style={{ color: t.fg, WebkitTextFillColor: t.fg, opacity: 0.5, margin: "0 6px" }}>·</span>
              <a href={`https://${JBJ_BRAND.website}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 850, letterSpacing: "0.04em" }}>
                {JBJ_BRAND.website.toUpperCase()}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  );
}
