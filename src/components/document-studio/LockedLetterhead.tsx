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

/**
 * Single masked layer of the JBJ monogram. `clip` restricts the painted
 * area to one column (outer J / dividers+B / outer J). `filter` is used
 * for the engraved drop-shadow / highlight stack on the middle B.
 */
function MaskedMonogramLayer({
  color,
  clip,
  filter,
  blendMode,
}: {
  color: string;
  clip?: string;
  filter?: string;
  blendMode?: React.CSSProperties["mixBlendMode"];
}) {
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
        ...(clip ? { clipPath: clip, WebkitClipPath: clip } : null),
        ...(filter ? { filter } : null),
        ...(blendMode ? { mixBlendMode: blendMode } : null),
      }}
    />
  );
}

export function LockedLetterhead({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = tokens(theme);
  // Widened middle clip so the slim vertical dividers above AND below the
  // gold B remain fully visible (previous 30%/30% clip cropped the bars).
  const bClip = "inset(0% 26% 0% 26%)";
  // Engraved B: dark shadow pushed DOWN-RIGHT to read as recessed, a soft
  // highlight UP-LEFT (screen-blended on champagne, plain on emerald),
  // body champagne/white on top.
  const bShadow = theme === "emerald"
    ? "drop-shadow(0 0.5px 0 rgba(0,0,0,.55)) drop-shadow(0 1.5px 1.8px rgba(0,0,0,.45))"
    : "drop-shadow(0.5px 1px 0 rgba(60,40,10,.55)) drop-shadow(0 2px 2.2px rgba(60,40,10,.35))";
  const bHighlight = theme === "emerald"
    ? "drop-shadow(0 -0.5px 0 rgba(255,255,255,.6))"
    : "drop-shadow(-0.5px -0.5px 0 rgba(255,255,255,.85))";

  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        // Equal top/bottom padding so the letterhead chrome is vertically
        // centered around its 118px monogram height.
        padding: "12px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-center min-w-0"
        style={{ gridTemplateColumns: "128px minmax(0,1fr)", columnGap: 8, minHeight: 118 }}
      >
        <div
          aria-label="JBJ"
          role="img"
          style={{
            position: "relative",
            width: 118,
            height: 118,
            justifySelf: "center",
          }}
        >
          {/* Outer J letters — painted black (or white on emerald) */}
          <MaskedMonogramLayer color={t.jColor} clip="inset(0% 69.5% 0% 13%)" />
          <MaskedMonogramLayer color={t.jColor} clip="inset(0% 13% 0% 69.5%)" />
          {/* Engraved B — three stacked passes: dark recess, light edge, body */}
          <MaskedMonogramLayer
            color={theme === "emerald" ? "#03281D" : "#5C3F18"}
            clip={bClip}
            filter={bShadow}
          />
          <MaskedMonogramLayer
            color={theme === "emerald" ? "#0E6B52" : "#F2DFAA"}
            clip={bClip}
            filter={bHighlight}
            blendMode={theme === "champagne" ? "screen" : undefined}
          />
          <MaskedMonogramLayer color={t.bColor} clip={bClip} />
        </div>

        <div
          className="min-w-0 text-left"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingLeft: 4,
            // Pull the wordmark back ~1cm from the right edge so it doesn't
            // stretch flush against the page border.
            paddingRight: 64,
            lineHeight: 1,
            overflow: "visible",
          }}
        >
          <div
            className="font-bold"
            style={{
              display: "block",
              width: "100%",
              fontSize: 26,
              fontWeight: 900,
              color: t.fg,
              letterSpacing: "0.06em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: "scaleX(1.02)",
              transformOrigin: "left center",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span
              style={{
                letterSpacing: "0.1em",
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
              {(JBJ_BRAND.letterheadPhones ?? [JBJ_BRAND.phone]).map((p) => (
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
