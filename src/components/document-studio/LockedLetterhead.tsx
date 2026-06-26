/**
 * Locked premium letterhead + footer rendered as React components.
 * Mirrors jbjHeaderHtml / jbjFooterHtml so preview === export.
 *
 * Themes:
 *   - "champagne"  → champagne bg, BLACK monogram, INK wordmark (default)
 *   - "emerald"    → dark emerald bg, WHITE monogram, WHITE wordmark
 *
 * Locked invariants:
 *   - Monogram 280×96 (large, premium)
 *   - 8px gutter between monogram and wordmark (tight, balanced)
 *   - Wordmark "L.L.C S.O.C" suffix non-breaking via &nbsp; + whiteSpace:nowrap
 *   - Footer: single hairline divider, charcoal body, no duplicate legal name
 *   - The word "Document" never appears in chrome
 */

import { JBJ_BRAND, JBJ_GOLD, JBJ_CHAMPAGNE, jbjMonogramSrc } from "@/templates/jbjLockedChrome";

export type LetterheadTheme = "champagne" | "emerald";

const tokens = (theme: LetterheadTheme) =>
  theme === "emerald"
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", monoFilter: "brightness(0) invert(1)" }
    : { bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD, monoFilter: "brightness(0)" };

export function LockedLetterhead({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = tokens(theme);
  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "10px 32px 10px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-center min-w-0"
        style={{ gridTemplateColumns: "280px 1px minmax(0,1fr)", columnGap: 8, minHeight: 96 }}
      >
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block object-contain"
          style={{ width: 280, height: 96, background: "transparent", filter: t.monoFilter }}
        />
        <div aria-hidden style={{ width: 1, height: 64, background: t.hairline, opacity: theme === "emerald" ? 0.5 : 0.55 }} />
        <div className="leading-tight min-w-0 text-center" style={{ paddingRight: 18 }}>
          <div
            className="font-bold"
            style={{
              fontSize: 20,
              color: t.fg,
              letterSpacing: "0.045em",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span style={{ letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{JBJ_BRAND.legalSuffix}</span>
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
  const t = tokens(theme);
  return (
    <footer
      className="w-full"
      style={{
        background: t.bg,
        borderTop: `1px solid ${t.hairline}`,
        color: t.fg,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "5px 32px",
        boxSizing: "border-box",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", width: "44%", fontSize: 10, lineHeight: 1.45, color: t.fg, paddingRight: 14 }}>
              {JBJ_BRAND.address}
            </td>
            <td style={{ verticalAlign: "middle", width: "22%", fontSize: 11, color: t.fg, textAlign: "center", padding: "0 8px", fontWeight: 700 }}>
              {JBJ_BRAND.phone}
            </td>
            <td style={{ verticalAlign: "middle", width: "34%", fontSize: 10, color: t.fg, textAlign: "right", paddingLeft: 14 }}>
              <a href={`mailto:${JBJ_BRAND.email}`} style={{ color: t.fg, textDecoration: "none", fontWeight: 700 }}>
                {JBJ_BRAND.email.toUpperCase()}
              </a>
              <span style={{ color: t.fg, opacity: 0.5, margin: "0 6px" }}>·</span>
              <a href={`https://${JBJ_BRAND.website}`} style={{ color: t.fg, textDecoration: "none", fontWeight: 700, letterSpacing: "0.04em" }}>
                {JBJ_BRAND.website.toUpperCase()}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </footer>
  );
}
