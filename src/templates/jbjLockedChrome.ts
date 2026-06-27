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

// Premium footer icons — solid gold inline SVGs. Rasterize identically in
// preview and html2canvas/jspdf export (no absolute-positioned spans, no glyph fonts).
// Keep the SVG viewport 14px high but the drawing box 12px tall, centered by
// the parent grid/flex cell. This prevents html2canvas from lifting icons above
// the text baseline during PDF rasterization.
export const FOOTER_ICON_SVG: Record<"location" | "phone" | "mail" | "globe", string> = {
  // Refined map pin with hollow ring center
  location: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;"><path d="M8 1.4c-2.76 0-5 2.18-5 4.86 0 3.55 4.34 8 4.52 8.19a.66.66 0 0 0 .96 0C8.66 14.26 13 9.81 13 6.26 13 3.58 10.76 1.4 8 1.4Z" fill="${JBJ_GOLD}"/><circle cx="8" cy="6.2" r="1.75" fill="${JBJ_CHAMPAGNE}"/></svg>`,
  // Classic handset silhouette
  phone: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;"><path d="M3.62 1.6a1.4 1.4 0 0 1 1.96.32l1.3 1.8a1.4 1.4 0 0 1-.18 1.83l-.86.8a.5.5 0 0 0-.1.6 8.6 8.6 0 0 0 3.3 3.3.5.5 0 0 0 .6-.1l.8-.86a1.4 1.4 0 0 1 1.83-.18l1.8 1.3a1.4 1.4 0 0 1 .32 1.96l-.6.84a2.3 2.3 0 0 1-2.5.9C7.4 12.92 3.08 8.6 1.88 4.3a2.3 2.3 0 0 1 .9-2.5l.84-.2Z" fill="${JBJ_GOLD}"/></svg>`,
  // Envelope (kept — user said email is okay)
  mail: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;"><rect x="1.6" y="3.6" width="12.8" height="8.8" rx="1.2" fill="${JBJ_GOLD}"/><path d="M2.4 4.6 8 8.6l5.6-4" stroke="${JBJ_CHAMPAGNE}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  // Premium globe with meridians + equator
  globe: `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;width:12px;height:12px;flex:0 0 12px;"><circle cx="8" cy="8" r="6.2" fill="${JBJ_GOLD}"/><ellipse cx="8" cy="8" rx="2.6" ry="6.2" fill="none" stroke="${JBJ_CHAMPAGNE}" stroke-width="0.9"/><line x1="1.8" y1="8" x2="14.2" y2="8" stroke="${JBJ_CHAMPAGNE}" stroke-width="0.9"/><line x1="8" y1="1.8" x2="8" y2="14.2" stroke="${JBJ_CHAMPAGNE}" stroke-width="0.9"/></svg>`,
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
  const iconSlotStyle = "width:12px;height:14px;line-height:14px;display:flex;align-items:center;justify-content:center;overflow:visible;transform:translateY(4px);";
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
          <span data-jbj-footer-icon="location" style="${iconSlotStyle}">${footerIconHtml("location")}</span>
          <span style="${textAfterIconStyle}">${JBJ_BRAND.address}</span>
        </div>
      </div>
      <div style="min-width:0;padding:0 8px;font-size:9px;color:${t.fg};-webkit-text-fill-color:${t.fg};font-weight:700;line-height:14px;text-align:center;">
        ${phones.map((p, i) => `<div style="${rowStyle}${iconRowStyle}width:132px;margin:0 auto;text-align:left;">${i === 0 ? `<span data-jbj-footer-icon="phone" style="${iconSlotStyle}">${footerIconHtml("phone")}</span>` : `<span aria-hidden="true" style="width:12px;height:14px;display:block;"></span>`}<span style="${textAfterIconStyle}">${p}</span></div>`).join("")}
      </div>
      <div style="min-width:0;padding-left:14px;font-size:8.5px;color:${t.fg};-webkit-text-fill-color:${t.fg};text-align:right;white-space:nowrap;height:14px;line-height:14px;">
        <div style="height:14px;line-height:14px;display:grid;grid-template-columns:max-content 10px max-content;align-items:center;justify-content:end;column-gap:6px;width:100%;">
          <span style="${rightItemStyle}">
            <span data-jbj-footer-icon="mail" style="${iconSlotStyle}">${footerIconHtml("mail")}</span>
            <a href="mailto:${JBJ_BRAND.email}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:700;line-height:14px;display:block;">${JBJ_BRAND.email.toUpperCase()}</a>
          </span>
          <span style="color:${t.fg};-webkit-text-fill-color:${t.fg};opacity:.5;line-height:14px;display:block;text-align:center;">·</span>
          <span style="${rightItemStyle}">
            <span data-jbj-footer-icon="globe" style="${iconSlotStyle}">${footerIconHtml("globe")}</span>
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
