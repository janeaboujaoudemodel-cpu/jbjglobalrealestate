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

  return (
    <header
      className="relative w-full"
      style={{
        background: t.bg,
        borderBottom: `1px solid ${t.hairline}`,
        fontFamily: "Inter, system-ui, sans-serif",
        // Equal top/bottom padding so the monogram and wordmark are vertically centered.
        padding: "10px 22px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="grid items-center min-w-0"
        style={{ gridTemplateColumns: "142px minmax(0,1fr)", columnGap: 10, minHeight: 138 }}
      >
        <div
          style={{
            width: 138,
            height: 138,
            justifySelf: "center",
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {theme === "emerald" ? (
            <div
              aria-label="JBJ"
              role="img"
              style={{
                width: 126,
                height: 126,
                position: "relative",
                background: t.jColor,
                WebkitMaskImage: `url(${jbjMonogramSrc})`,
                maskImage: `url(${jbjMonogramSrc})`,
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                filter: "drop-shadow(0 1px 0 rgba(0,0,0,.45))",
              }}
            />
          ) : (
            <img
              src={jbjMonogramSrc}
              alt="JBJ"
              style={{
                width: 126,
                height: 126,
                objectFit: "contain",
                display: "block",
                filter: "contrast(1.08) saturate(1.05) drop-shadow(0 1.4px 1.8px rgba(60,40,10,.18))",
              }}
            />
          )}
        </div>

        <div
          className="min-w-0 text-left"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: 138,
            paddingLeft: 2,
            paddingRight: 48,
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
              letterSpacing: "0.075em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: "scaleX(1.01)",
              transformOrigin: "left center",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span
              style={{
                letterSpacing: "0.115em",
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
