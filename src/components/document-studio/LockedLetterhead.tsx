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
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", jColor: "#FFFFFF", bColor: "#FFFFFF" }
    : { bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD, jColor: "#1A1A1A", bColor: JBJ_GOLD };

const footerTokens = () => ({ bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD });

/**
 * Monogram layering — the asset is a single "JBJ" PNG. The two outer J
 * glyphs are painted in BLACK (or white on emerald) and the middle B is
 * painted in GOLD. We achieve this by stacking three identical masked
 * layers and clip-pathing each to the column that contains its letter.
 * Bounds were measured from /src/assets/jbj-monogram-cropped.png
 * (356×458, letters at x≈24-88 / 140-222 / 271-331), then mapped to a
 * 118×118 rendered box with `mask-size: contain` (centered).
 */
function MaskedMonogramLayer({ color, clip }: { color: string; clip: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background: color,
        WebkitMaskImage: `url(${jbjMonogramSrc})`,
        maskImage: `url(${jbjMonogramSrc})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        clipPath: clip,
        WebkitClipPath: clip,
      }}
    />
  );
}

export function LockedLetterhead({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = tokens(theme);
  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "4px 24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-start min-w-0"
        style={{ gridTemplateColumns: "132px minmax(0,1fr)", columnGap: 14, minHeight: 118 }}
      >
          <div
            aria-label="JBJ"
            role="img"
            style={{
              position: "relative",
              width: 118,
              height: 118,
              marginTop: -6,
              justifySelf: "center",
            }}
          >
            {/* Middle B stays gold (champagne) or white (emerald) */}
            <MaskedMonogramLayer color={t.bColor} clip="inset(0% 30% 0% 30%)" />
            {/* Outer J letters painted black (or white on emerald) */}
            <MaskedMonogramLayer color={t.jColor} clip="inset(0% 69.5% 0% 13%)" />
            <MaskedMonogramLayer color={t.jColor} clip="inset(0% 13% 0% 69.5%)" />
          </div>

        <div className="min-w-0 text-left" style={{ height: "100%", display: "flex", alignItems: "flex-start", justifyContent: "stretch", paddingRight: 56, paddingTop: 14, lineHeight: 1, overflow: "visible" }}>

          <div
            className="font-bold"
            style={{
              display: "block",
              width: "100%",
              fontSize: 26,
              fontWeight: 900,
              color: t.fg,
              // Open the wordmark so it occupies the full right column —
              // previous tight tracking left a visible empty band on the
              // right edge of the letterhead.
              letterSpacing: "0.08em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: "scaleX(1.12)",
              transformOrigin: "left center",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span style={{ letterSpacing: "0.12em", whiteSpace: "nowrap", color: t.fg, WebkitTextFillColor: t.fg }}>{JBJ_BRAND.legalSuffix}</span>
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
        padding: "12px 28px",
        boxSizing: "border-box",
        minHeight: 46,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: "middle", width: "44%", fontSize: 8.5, lineHeight: 1.25, color: t.fg, WebkitTextFillColor: t.fg, paddingRight: 14 }}>
              {JBJ_BRAND.address}
            </td>
            <td style={{ verticalAlign: "middle", width: "22%", fontSize: 9, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "center", padding: "0 8px", fontWeight: 700, lineHeight: 1.35 }}>
              {(JBJ_BRAND.letterheadPhones ?? [JBJ_BRAND.phone]).map((p, i) => (
                <div key={p} style={{ whiteSpace: "nowrap" }}>{p}</div>
              ))}
            </td>
            <td style={{ verticalAlign: "middle", width: "34%", fontSize: 8.5, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "right", paddingLeft: 14 }}>
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
