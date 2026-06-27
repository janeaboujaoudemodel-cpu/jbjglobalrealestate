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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B89555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ display: "inline-block", verticalAlign: "middle", lineHeight: "14px" }}>{JBJ_BRAND.address}</span>
        </div>
        <div style={{ minWidth: 0, padding: "0 8px", fontSize: 9, color: t.fg, WebkitTextFillColor: t.fg, fontWeight: 700, lineHeight: "14px", textAlign: "center" }}>
          {phones.map((p, i) => (
            <div key={p} style={{ whiteSpace: "nowrap", height: 14, lineHeight: "14px" }}>
              {i === 0 ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B89555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ) : (
                <span style={{ display: "inline-block", width: 10, height: 10, verticalAlign: "middle", marginRight: 5 }} />
              )}
              <span style={{ display: "inline-block", verticalAlign: "middle", lineHeight: "14px" }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ minWidth: 0, paddingLeft: 14, fontSize: 8.5, color: t.fg, WebkitTextFillColor: t.fg, textAlign: "right", whiteSpace: "nowrap", height: 14, lineHeight: "14px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B89555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5 }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
          <a href={`mailto:${JBJ_BRAND.email}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 700, lineHeight: "14px", display: "inline-block", verticalAlign: "middle" }}>
            {JBJ_BRAND.email.toUpperCase()}
          </a>
          <span style={{ color: t.fg, WebkitTextFillColor: t.fg, opacity: 0.5, lineHeight: "14px", display: "inline-block", verticalAlign: "middle", margin: "0 6px" }}>·</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B89555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 5 }}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <a href={`https://${JBJ_BRAND.website}`} style={{ color: t.fg, WebkitTextFillColor: t.fg, textDecoration: "none", fontWeight: 850, letterSpacing: "0.04em", lineHeight: "14px", display: "inline-block", verticalAlign: "middle" }}>
            {JBJ_BRAND.website.toUpperCase()}
          </a>
        </div>
      </div>
    </footer>

  );
}
