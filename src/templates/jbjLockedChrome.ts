/**
 * JBJ Locked Document Chrome — premium header + footer used by every
 * document generated through `<DocumentStudio />`. Locked: AI never sees
 * it, owner never edits it; appended around the body in preview, PDF
 * export, print, and branded emails.
 */

import monogramSrc from "@/assets/jbj-monogram-letterhead.png";
import companyStampSrc from "@/assets/jbj-company-stamp-transparent.png?inline";
import {
  TRADE_LICENSE_OFFICE,
  TRADE_LICENSE_NUMBER,
  COMPANY_CONTACT,
} from "@/config/companyLegal";

export const JBJ_BRAND = {
  legalName: "JBJ GLOBAL REAL ESTATE",
  legalSuffix: "L.L.C S.O.C",
  shortName: "JBJ GLOBAL REAL ESTATE",
  address: TRADE_LICENSE_OFFICE,
  phone: COMPANY_CONTACT.phone,
  // Two-line direct dial shown in the locked letterhead/footer only.
  letterheadPhones: COMPANY_CONTACT.letterheadPhones as readonly string[],
  email: COMPANY_CONTACT.email.toLowerCase(),
  website: COMPANY_CONTACT.website,
  tradeLicense: TRADE_LICENSE_NUMBER,
} as const;

export const JBJ_GOLD = "#B89555";
export const JBJ_INK = "#1A1A1A";
export const JBJ_CHAMPAGNE = "#F7F2EA";

export const jbjMonogramSrc = monogramSrc;
export const jbjCompanyStampSrc = companyStampSrc;

/**
 * Canonical JBJ party block (Name of Establishment / Address / Contact /
 * Registered Agent). Re-used by every RERA + Partner composer to prefill
 * whichever side JBJ sits on. Returns inline HTML rows for a 2-column
 * RERA-style table cell. `agentLabel` is "A" or "B".
 */
export function jbjPartyBlockHtml(agentLabel: "A" | "B" = "A"): string {
  return `
    <div style="font-size:11px;line-height:1.55;color:${JBJ_INK};">
      <div style="margin:0 0 6px;"><strong>NAME OF ESTABLISHMENT:</strong> ${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}</div>
      <div style="margin:0 0 6px;"><strong>ADDRESS:</strong> ${JBJ_BRAND.address}</div>
      <div style="margin:6px 0 0;font-weight:700;letter-spacing:.06em;font-size:10.5px;text-transform:uppercase;">Official Contact Details</div>
      <div>PH: ${JBJ_BRAND.phone} &nbsp; FAX: —</div>
      <div>EMAIL: ${JBJ_BRAND.email.toLowerCase()}</div>
      <div>ORN: 41486 &nbsp; DED LISC: ${JBJ_BRAND.tradeLicense}</div>
      <div>P.O. BOX: —</div>
      <div style="margin:10px 0 4px;font-weight:700;letter-spacing:.06em;font-size:10.5px;text-transform:uppercase;">The Registered Agent &ldquo;${agentLabel}&rdquo;</div>
      <div>NAME: Jane Bou Jaoude</div>
      <div>BRN: 44750 &nbsp; DATE ISSUED: 24 / 05 / 2024</div>
      <div>MOBILE: ${JBJ_BRAND.phone}</div>
      <div>EMAIL: ${JBJ_BRAND.email.toLowerCase()}</div>
    </div>`;
}

/** Inline JBJ company stamp overlay for a RERA signature cell. */
export function jbjStampOverlayHtml(): string {
  return `<img src="${companyStampSrc}" alt="JBJ Company Stamp" aria-hidden="true"
    style="position:absolute;right:8px;bottom:4px;width:140px;height:140px;
           object-fit:contain;opacity:0.94;mix-blend-mode:multiply;
            transform:rotate(0deg);pointer-events:none;user-select:none;" />`;
}

/**
 * Compact letterhead. Theme switchable: "champagne" (default, black mono +
 * black wordmark on champagne) or "emerald" (white mono + white wordmark
 * on dark emerald). Generated-date stamp is rendered OUTSIDE the chrome
 * by DocumentStudio — never inside.
 */
export type JbjChromeTheme = "champagne" | "emerald";

const themeTokens = (theme: JbjChromeTheme) =>
  theme === "emerald"
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", jColor: "#FFFFFF", bColor: "#FFFFFF" }
    : { bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD, jColor: "#1A1A1A", bColor: JBJ_GOLD };

const monogramImgStyle = (theme: JbjChromeTheme) =>
  theme === "emerald"
    ? "filter:brightness(0) invert(1) drop-shadow(0 1px 1px rgba(0,0,0,.18));"
    : "filter:saturate(1.12) contrast(1.06) drop-shadow(0 1px 0 rgba(255,255,255,.82)) drop-shadow(0 1.4px 1.4px rgba(72,48,15,.18));";

const footerTokens = () => ({ bg: JBJ_CHAMPAGNE, fg: JBJ_INK, hairline: JBJ_GOLD });

// Premium footer icons — outline-only gold inline SVGs. Rasterize identically in
// preview and html2canvas/jspdf export (no absolute-positioned spans, no glyph fonts).
export const FOOTER_ICON_SVG: Record<"location" | "phone" | "mail" | "globe", string> = {
  // Hollow map pin — no fill, crisp gold stroke matching the signature frame
  location: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;overflow:visible;shape-rendering:geometricPrecision;color:${JBJ_GOLD}!important;stroke:${JBJ_GOLD}!important;"><path d="M8 14.25s5-4.45 5-8.05A5 5 0 0 0 3 6.2c0 3.6 5 8.05 5 8.05Z" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.35px;" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="6.25" r="1.72" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.2px;"/></svg>`,
  // Hollow handset — elegant single-line construction
  phone: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;overflow:visible;shape-rendering:geometricPrecision;color:${JBJ_GOLD}!important;stroke:${JBJ_GOLD}!important;"><path d="M4.08 2.05 5.9 4.5c.3.4.24.96-.13 1.3l-.9.83a.56.56 0 0 0-.12.66 9.05 9.05 0 0 0 3.96 3.96c.23.11.5.06.66-.12l.83-.9a.96.96 0 0 1 1.3-.13l2.45 1.82c.43.32.52.93.2 1.36l-.63.84c-.56.75-1.54 1.05-2.43.75-4.6-1.53-8.4-5.33-9.93-9.93-.3-.89 0-1.87.75-2.43l.84-.63c.43-.32 1.04-.23 1.36.2Z" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.35px;" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // Hollow envelope — kept refined, now outline-only for parity with the other icons
  mail: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;overflow:visible;shape-rendering:geometricPrecision;color:${JBJ_GOLD}!important;stroke:${JBJ_GOLD}!important;"><rect x="1.75" y="3.5" width="12.5" height="9" rx="1.35" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.3px;"/><path d="M2.55 4.55 8 8.42l5.45-3.87" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.25px;" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // Hollow globe with meridians + equator
  globe: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;overflow:visible;shape-rendering:geometricPrecision;color:${JBJ_GOLD}!important;stroke:${JBJ_GOLD}!important;"><circle cx="8" cy="8" r="6.15" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.25px;"/><ellipse cx="8" cy="8" rx="2.55" ry="6.15" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.05px;"/><path d="M2.15 8h11.7M3.75 4.55h8.5M3.75 11.45h8.5" style="fill:none!important;stroke:${JBJ_GOLD}!important;stroke-width:1.05px;" stroke-linecap="round"/></svg>`,
};

const footerIconHtml = (type: "location" | "phone" | "mail" | "globe") => FOOTER_ICON_SVG[type];

export const jbjHeaderHtml = (theme: JbjChromeTheme = "champagne"): string => {
  const t = themeTokens(theme);
  const monogram = `<img src="${monogramSrc}" alt="JBJ" aria-label="JBJ" role="img" style="width:184px;height:184px;object-fit:contain;display:block;${monogramImgStyle(theme)}" />`;
  return `
  <header style="
    width:100%;
    background:${t.bg};
    border-bottom:1px solid ${t.hairline};
    padding:0 22px;
    font-family:Inter, system-ui, sans-serif;
    color:${t.fg};
    box-sizing:border-box;
  ">
    <div style="display:grid;grid-template-columns:210px minmax(0,1fr);align-items:center;column-gap:16px;min-height:210px;height:210px;">
      <div style="height:210px;width:200px;display:flex;align-items:center;justify-content:center;justify-self:center;align-self:center;">
        ${monogram}
      </div>

      <div style="height:210px;display:flex;align-items:center;justify-content:flex-start;line-height:1;text-align:left;min-width:0;padding-left:0;padding-right:28px;overflow:visible;">
        <div style="display:block;width:100%;font-size:25px;font-weight:900;letter-spacing:0.072em;color:${t.fg};white-space:nowrap;transform:scaleX(.94);transform-origin:left center;">
          ${JBJ_BRAND.legalName}&nbsp;<span style="letter-spacing:0.095em;white-space:nowrap;color:${t.fg};-webkit-text-fill-color:${t.fg};">${JBJ_BRAND.legalSuffix}</span>
        </div>
      </div>
    </div>
  </header>`;
};

export const jbjFooterHtml = (theme: JbjChromeTheme = "champagne"): string => {
  const t = footerTokens();
  const phones = JBJ_BRAND.letterheadPhones ?? [JBJ_BRAND.phone];
  const rowStyle = "position:relative;height:14px;line-height:14px;white-space:nowrap;overflow:visible;";
  const iconRowStyle = "height:14px;line-height:14px;display:grid;grid-template-columns:12px minmax(0,1fr);column-gap:6px;align-items:center;";
  const textAfterIconStyle = "min-width:0;height:14px;line-height:14px;display:block;white-space:nowrap;";
  const rightItemStyle = "display:grid;grid-template-columns:12px max-content;column-gap:6px;align-items:center;height:14px;line-height:14px;white-space:nowrap;";
  return `
  <footer data-jbj-locked-footer="true" style="
    width:100%;
    background:${t.bg};
    border-top:1px solid ${t.hairline};
    padding:0 28px;
    height:58px;
    min-height:58px;
    overflow:visible;
    font-family:Inter, system-ui, sans-serif;
    font-size:8.5px;
    line-height:1.25;
    color:${t.fg};
    box-sizing:border-box;
  ">
    <div style="width:100%;height:58px;display:grid;grid-template-columns:42% 24% 34%;align-items:center;">
      <div style="min-width:0;padding-right:14px;font-size:8.5px;line-height:14px;height:14px;color:${t.fg};-webkit-text-fill-color:${t.fg};white-space:nowrap;">
        <div style="${rowStyle}${iconRowStyle}width:100%;">
          ${footerIconHtml("location")}
          <span style="${textAfterIconStyle}">${JBJ_BRAND.address}</span>
        </div>
      </div>
      <div style="min-width:0;padding:0 8px;font-size:9px;color:${t.fg};-webkit-text-fill-color:${t.fg};font-weight:700;line-height:14px;text-align:center;">
        ${phones.map((p, i) => `<div style="${rowStyle}${iconRowStyle}width:132px;margin:0 auto;text-align:left;">${i === 0 ? footerIconHtml("phone") : `<span aria-hidden="true" style="width:12px;height:14px;display:block;"></span>`}<span style="${textAfterIconStyle}">${p}</span></div>`).join("")}
      </div>
      <div style="min-width:0;padding-left:14px;font-size:8.5px;color:${t.fg};-webkit-text-fill-color:${t.fg};text-align:right;white-space:nowrap;height:14px;line-height:14px;">
        <div style="height:14px;line-height:14px;display:grid;grid-template-columns:max-content 10px max-content;align-items:center;justify-content:end;column-gap:6px;width:100%;">
          <span style="${rightItemStyle}">
            ${footerIconHtml("mail")}
            <a href="mailto:${JBJ_BRAND.email}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:700;line-height:14px;display:block;">${JBJ_BRAND.email.toUpperCase()}</a>
          </span>
          <span style="color:${t.fg};-webkit-text-fill-color:${t.fg};opacity:.5;line-height:14px;display:block;text-align:center;">·</span>
          <span style="${rightItemStyle}">
            ${footerIconHtml("globe")}
            <a href="https://${JBJ_BRAND.website}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:850;letter-spacing:.04em;line-height:14px;display:block;">${JBJ_BRAND.website.toUpperCase()}</a>
          </span>
        </div>
      </div>

    </div>
  </footer>`;
};

/**
 * Wrap an AI-generated body in the locked chrome. Used for print, PDF
 * export, and email attachments.
 */
export function wrapWithJbjChrome(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>JBJ</title>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin:0; padding:0; }
  body { background:#FDFBF7; font-family:Inter,system-ui,sans-serif; color:${JBJ_INK}; }
  .jbj-page { width:794px; min-height:1123px; margin:0 auto; background:#FDFBF7; display:flex; flex-direction:column; }
  .jbj-page main { flex:1; padding:32px 56px; }
  @media print { .jbj-page { box-shadow:none; } }
</style>
</head>
<body>
  <div class="jbj-page">
    ${jbjHeaderHtml()}
    <main>${bodyHtml}</main>
    ${jbjFooterHtml()}
  </div>
</body></html>`;
}

/** Strip any header/footer/signature artifacts the AI may have produced. */
export function stripChromeArtifacts(html: string): string {
  return html
    .replace(/<\/?(html|head|body|header|footer)[^>]*>/gi, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]*\/?>/gi, "")
    .trim();
}
