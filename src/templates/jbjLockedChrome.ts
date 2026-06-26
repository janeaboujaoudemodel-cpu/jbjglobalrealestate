/**
 * JBJ Locked Document Chrome — premium header + footer used by every
 * document generated through `<DocumentStudio />`. Locked: AI never sees
 * it, owner never edits it; appended around the body in preview, PDF
 * export, print, and branded emails.
 */

import monogramSrc from "@/assets/jbj-monogram-cropped.png";
import companyStampSrc from "@/assets/jbj-company-stamp.png?inline";
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
           transform:rotate(-8deg);pointer-events:none;user-select:none;" />`;
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
    ? { bg: "#064E3B", fg: "#FFFFFF", hairline: "#FFFFFF", monoFilter: "brightness(0) invert(1)" }
    : { bg: JBJ_CHAMPAGNE, fg: "#1A1A1A", hairline: JBJ_GOLD, monoFilter: "brightness(0)" };

const footerTokens = () => ({ bg: JBJ_CHAMPAGNE, fg: JBJ_INK, hairline: JBJ_GOLD });

export const jbjHeaderHtml = (theme: JbjChromeTheme = "champagne"): string => {
  const t = themeTokens(theme);
  return `
  <header style="
    width:100%;
    background:${t.bg};
    border-bottom:1px solid ${t.hairline};
    padding:14px 24px;
    font-family:Inter, system-ui, sans-serif;
    color:${t.fg};
    box-sizing:border-box;
  ">
    <div style="display:grid;grid-template-columns:132px minmax(0,1fr);align-items:center;gap:14px;min-height:132px;">
      <img src="${monogramSrc}" alt="JBJ"
        style="width:118px;height:118px;display:block;object-fit:contain;background:transparent;margin:auto;filter:${t.monoFilter};align-self:center;justify-self:center;" />
      <div style="height:100%;display:flex;align-items:center;justify-content:flex-start;line-height:1;text-align:left;min-width:0;padding-right:0;overflow:visible;">
        <div style="display:block;width:100%;font-size:26px;font-weight:900;letter-spacing:-0.015em;color:${t.fg};white-space:nowrap;transform:scaleX(1.04);transform-origin:left center;">
          ${JBJ_BRAND.legalName}&nbsp;<span style="letter-spacing:0.03em;white-space:nowrap;color:${t.fg};-webkit-text-fill-color:${t.fg};">${JBJ_BRAND.legalSuffix}</span>
        </div>
      </div>
    </div>
  </header>`;
};

export const jbjFooterHtml = (theme: JbjChromeTheme = "champagne"): string => {
  const t = footerTokens();
  return `
  <footer style="
    width:100%;
    background:${t.bg};
    border-top:1px solid ${t.hairline};
    padding:12px 28px;
    min-height:46px;
    font-family:Inter, system-ui, sans-serif;
    font-size:8.5px;
    line-height:1.15;
    color:${t.fg};
    box-sizing:border-box;
  ">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="vertical-align:middle;width:44%;padding-right:14px;color:${t.fg};-webkit-text-fill-color:${t.fg};opacity:.92;font-size:8.5px;line-height:1.25;">
          ${JBJ_BRAND.address}
        </td>
        <td style="vertical-align:middle;width:22%;text-align:center;padding:0 8px;color:${t.fg};-webkit-text-fill-color:${t.fg};font-size:9px;font-weight:700;">
          ${JBJ_BRAND.phone}
        </td>
        <td style="vertical-align:middle;width:34%;text-align:right;padding-left:14px;color:${t.fg};-webkit-text-fill-color:${t.fg};font-size:8.5px;">
          <a href="mailto:${JBJ_BRAND.email}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:700;">${JBJ_BRAND.email.toUpperCase()}</a>
          <span style="color:${t.fg};-webkit-text-fill-color:${t.fg};opacity:.5;margin:0 6px;">·</span>
          <a href="https://${JBJ_BRAND.website}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:700;letter-spacing:.04em;">${JBJ_BRAND.website.toUpperCase()}</a>
        </td>
      </tr>
    </table>
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
