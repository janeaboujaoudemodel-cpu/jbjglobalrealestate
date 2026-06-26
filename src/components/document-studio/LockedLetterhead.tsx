/**
 * Locked premium letterhead + footer rendered as React components.
 * Mirrors jbjHeaderHtml / jbjFooterHtml so preview === export.
 *
 * Themes:
 *   - "champagne"  → champagne bg, BLACK monogram, BLACK wordmark (default)
 *   - "emerald"    → dark emerald bg, WHITE monogram, WHITE wordmark
 */

import { JBJ_BRAND, JBJ_GOLD, JBJ_CHAMPAGNE, jbjMonogramSrc } from "@/templates/jbjLockedChrome";

export type LetterheadTheme = "champagne" | "emerald";

const tokens = (theme: LetterheadTheme) =>
  theme === "emerald"
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", monoFilter: "brightness(0) invert(1)" }
    : { bg: JBJ_CHAMPAGNE, fg: "#000000", hairline: JBJ_GOLD, monoFilter: "brightness(0)" };

export function LockedLetterhead({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = tokens(theme);
  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "8px 32px 8px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-center min-w-0"
        style={{ gridTemplateColumns: "240px 1px minmax(0,1fr)", columnGap: 14, minHeight: 72 }}
      >
        <img
          src={jbjMonogramSrc}
          alt="JBJ"
          className="block object-contain"
          style={{ width: 220, height: 72, background: "transparent", filter: t.monoFilter }}
        />
        <div aria-hidden style={{ width: 1, height: 52, background: t.hairline, opacity: theme === "emerald" ? 0.5 : 0.55 }} />
        <div className="leading-tight min-w-0 text-center" style={{ paddingRight: 18 }}>
          <div
            className="font-bold whitespace-nowrap"
            style={{
              fontSize: 19,
              color: t.fg,
              letterSpacing: "0.045em",
              lineHeight: 1.1,
            }}
          >
            {JBJ_BRAND.legalName} <span style={{ letterSpacing: "0.12em" }}>{JBJ_BRAND.legalSuffix}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Ultra-compact footer — single divider, single info row.
 * No duplicated legal name. ~80% smaller than the previous version.
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
        padding: "6px 32px",
        boxSizing: "border-box",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", width: "44%", fontSize: 10, lineHeight: 1.5, color: t.fg, opacity: 0.92, paddingRight: 14 }}>
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
