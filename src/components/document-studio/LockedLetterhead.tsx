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

const FOOTER_ICONS = {
  // Raster PNG data URIs are intentional: html2canvas/jsPDF can re-baseline
  // inline SVGs during PDF export, which made footer icons look erased or
  // shifted on the downloaded last page. These 48px gold PNGs downsample
  // cleanly to the locked 12px slot and preserve preview/export parity.
  location: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABNUlEQVR4nO2YwQ3CMAxFDWI4FmAK5mEKFmA7OEWqqqbJt18oEX43RJ3427HdxixJkqk5jVj09bi9a/9d7090T2yxPadrEGLO0QXMfM5H7JaEIkA4UPBmw50B0vnIei7Vrc32ohmx3eKiPNyiZ/PyDJVB+QjVNlYjV3teFSYJoJxv2Skiwm002suj9mgNrFlGkp7Ahe5Ft9LqOQKKTY9oZBIfCS6gVYD0AMwMHA0uoFV4dDeaPgNSNNRW1zsHvC3UbPAgGzW8loSPULQtRu0lAdQbZMtOyZycAUoE9WaL1kBxKvJFpuIuMtoRM1/Ru4uY7jB/eyvxvxn4FcJRVNohfSlgNvBVYkSX2mL6WwmkBuh7IYXpixgTQF0tqqAZ6HWKnCF5hNbkR73IEAHrKJff3/hGThKRD9Fxo2huXChtAAAAAElFTkSuQmCC",
  phone: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABRklEQVR4nO1Y0Q2FIAzEF4dzAadwHqdwAbfzfZEYA7RX2sJHL/FL0B5XjpaUAoFAINCBRTLpPven9m47LtE3pYB/1gr+DS8iP2QwN3hPsAmgwXuRZRGYceUz1tbLWuCl/B5FklTgGyyyOT1IkQS+QcyWTpALteDt/xlNAhpBWSsmUmCmNFJLoZTKilmnFuxCGSUVRiijpkApeI+NbebpUxZzXHhaKpvAbCdwhlk/kBLPAHrVMj2JOZ3bfe5PfiT/VW0pt+NaKDfS7ujUN3FLCWSVucqICFC57dkvmBRr7/yuzeOMKY3/QsWvURJIeULNUdkDrZRBOrrtuBbUVlVPTKSHRr9jqgD1kx6fp+BioxkWJNyLOW01TAhwUCOC9hXmZW/valMG4Fa3S4hw3MsthVAr5Y4fchlFqTHqkqwbM903BQKBAA9/ZjzP5Qba4jMAAAAASUVORK5CYII=",
  mail: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAA90lEQVR4nO2X6w2DMAyEQ9XhWKBTME+nYAG2o78iVVGwE99VKXDfH5Dy8Dl+RElJCCGEEOK+TC2Ttvdr/7WQI+ZlNTU+vA1Gim+xbzowWnzG0uFG4N85vQNPdAOvyFpAUhWOAFon6HpKCkVFMJoEnEKZLKYlpZjdrTsCnkBPnDfeW1OhFIo6wRafElAD87JOlsFSrCXe28uC0kajJ57XI/YpXSgqgnGH3LuNMgT0tN8a4QgcibcK0hqLHkbIgZqxUlz+L7+1uda+HtCl9C2o1zDLBlzEaCdB18P3wOhX2+kfNNd2gHFTMrB0uBEY7cRo+0IIIYS4NB+Ob4G3KylmggAAAABJRU5ErkJggg==",
  globe: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABH0lEQVR4nO2ZzRHCQAiFV8fibMAqrMcqbMDu9JQLY/h5PDbJhO+8AR6EXTYZo2mapklwYRv8vB5fa839+ab5pRnyBC5hCEkbQAKXZITADzIClyBCroijiuBRu2HF2SZlN3moAlWZz/hxC/AatbLnza7XH9QDe8IlgJX96DqPX7gCzNM0Y88U8C8L7OA1u1YV4ApIw1FRcj26w6kCZm2bFloc4QpUvT6ofXXxXiowxrqwc5wDe6YFbM0t+sDSTNlzQLNRMo2uOWUTta8KqN7zvWhx0Ia5aOYYr+AYDgHIgIWCDI60YS5LyTC3wL4GMi9Ihz8H3AJYVWBfT0MVmLWtRvxAAVUeZtEkQT0w805scd6v05LD/h+QzP5D0zRNsy0/1vSgP5LwO7gAAAAASUVORK5CYII=",
} as const;

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
            paddingRight: 28,
            lineHeight: 1,
            overflow: "visible",
          }}
        >
          <div
            className="font-bold"
            style={{
              display: "block",
              width: "100%",
              fontSize: 25,
              fontWeight: 900,
              color: t.fg,
              letterSpacing: "0.072em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: "scaleX(.94)",
              transformOrigin: "left center",
            }}
          >
            {JBJ_BRAND.legalName}&nbsp;
            <span
              style={{
                letterSpacing: "0.095em",
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
 *
 * Export parity lock: the footer is a fixed-height CSS grid instead of a table.
 * html2canvas can slightly reflow table/inline-flex baselines during raster PDF
 * capture; this pixel-locked grid keeps preview and export identical.
 */
export function LockedFooter({ theme = "champagne" as LetterheadTheme }: { theme?: LetterheadTheme }) {
  const t = footerTokens();
  const phones = JBJ_BRAND.letterheadPhones ?? [JBJ_BRAND.phone];
  const rowStyle = {
    position: "relative" as const,
    height: 14,
    lineHeight: "14px",
    whiteSpace: "nowrap" as const,
    overflow: "visible" as const,
  };
  const iconStyle = {
    position: "absolute" as const,
    left: 0,
    top: 1,
    width: 12,
    height: 12,
    display: "block",
    lineHeight: 0,
    fontSize: 0,
    objectFit: "contain" as const,
  };
  const textAfterIconStyle = {
    position: "absolute" as const,
    left: 18,
    top: 0,
    height: 14,
    lineHeight: "14px",
    display: "block",
    whiteSpace: "nowrap" as const,
  };
  const rightItemStyle = {
    position: "relative" as const,
    height: 14,
    lineHeight: "14px",
    paddingLeft: 18,
    whiteSpace: "nowrap" as const,
  };
  return (
    <footer
      data-jbj-locked-footer="true"
      className="w-full"
      style={{
        background: t.bg,
        borderTop: `1px solid ${t.hairline}`,
        color: t.fg,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "0 28px",
        boxSizing: "border-box",
        height: 58,
        minHeight: 58,
        overflow: "visible",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 58,
          display: "grid",
          gridTemplateColumns: "42% 24% 34%",
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0, paddingRight: 14, fontSize: 8.5, lineHeight: "14px", color: t.fg, WebkitTextFillColor: t.fg, height: 14, whiteSpace: "nowrap" }}>
          <div style={{ ...rowStyle, width: "100%" }}>
            <img alt="" aria-hidden="true" src={FOOTER_ICONS.location} style={iconStyle} />
            <span style={textAfterIconStyle}>{JBJ_BRAND.address}</span>
          </div>
        </div>
        <div style={{ minWidth: 0, padding: "0 8px", fontSize: 9, color: t.fg, WebkitTextFillColor: t.fg, fontWeight: 700, lineHeight: "14px", textAlign: "center" }}>
          {phones.map((p, i) => (
            <div key={p} style={{ ...rowStyle, width: 132, margin: "0 auto", textAlign: "left" }}>
              {i === 0 ? (
                <img alt="" aria-hidden="true" src={FOOTER_ICONS.phone} style={iconStyle} />
              ) : null}
              <span style={textAfterIconStyle}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ minWidth: 0, paddingLeft: 14, fontSize: 8.5, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "right", whiteSpace: "nowrap", height: 14, lineHeight: "14px" }}>
          <div style={{ height: 14, lineHeight: "14px", display: "grid", gridTemplateColumns: "max-content 10px max-content", alignItems: "center", justifyContent: "end", columnGap: 6, width: "100%" }}>
            <span style={rightItemStyle}>
              <img alt="" aria-hidden="true" src={FOOTER_ICONS.mail} style={iconStyle} />
              <a href={`mailto:${JBJ_BRAND.email}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 700, lineHeight: "14px", display: "block" }}>
                {JBJ_BRAND.email.toUpperCase()}
              </a>
            </span>
            <span style={{ color: t.fg, WebkitTextFillColor: t.fg, opacity: 0.5, lineHeight: "14px", display: "block", textAlign: "center" }}>·</span>
            <span style={rightItemStyle}>
              <img alt="" aria-hidden="true" src={FOOTER_ICONS.globe} style={iconStyle} />
              <a href={`https://${JBJ_BRAND.website}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 850, letterSpacing: "0.04em", lineHeight: "14px", display: "block" }}>
                {JBJ_BRAND.website.toUpperCase()}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>

  );
}
