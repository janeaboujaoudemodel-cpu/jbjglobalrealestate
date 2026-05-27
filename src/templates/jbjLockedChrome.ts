/**
 * JBJ Locked Document Chrome — premium header + footer used by every
 * document generated through `<DocumentStudio />`. Locked: AI never sees
 * it, owner never edits it; appended around the body in preview, PDF
 * export, print, and branded emails.
 */

import monogramSrc from "@/assets/jbj-monogram-transparent.png";
import companyStampSrc from "@/assets/jbj-company-stamp.png?inline";
import {
  TRADE_LICENSE_OFFICE,
  TRADE_LICENSE_NUMBER,
  COMPANY_CONTACT,
} from "@/config/companyLegal";

export const JBJ_BRAND = {
  legalName: "JBJ GLOBAL REAL ESTATE",
  legalSuffix: "L.L.C · S.O.C",
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

export const jbjHeaderHtml = (): string => `
  <header style="
    width:100%;
    background:${JBJ_CHAMPAGNE};
    border-bottom:1px solid ${JBJ_GOLD};
    padding:22px 40px 22px 24px;
    font-family:Inter, system-ui, sans-serif;
    color:${JBJ_INK};
  ">
    <div style="display:flex;align-items:center;gap:20px;">
      <img src="${monogramSrc}" alt="JBJ"
        style="width:96px;height:96px;display:block;object-fit:contain;background:transparent;" />
      <div style="line-height:1.15;">
        <div style="font-size:19px;font-weight:600;letter-spacing:0.01em;color:${JBJ_INK};">
          ${JBJ_BRAND.legalName}
        </div>
        <div style="font-size:13px;letter-spacing:0.04em;color:${JBJ_INK};margin-top:2px;font-weight:600;">
          ${JBJ_BRAND.legalSuffix}
        </div>
      </div>
    </div>
  </header>
`;

export const jbjFooterHtml = (): string => `
  <footer style="
    width:100%;
    background:${JBJ_CHAMPAGNE};
    border-top:1px solid ${JBJ_GOLD};
    padding:14px 36px;
    font-family:Inter, system-ui, sans-serif;
    font-size:10px;
    line-height:1.6;
    color:${JBJ_INK};
  ">
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="vertical-align:top;width:34%;padding-right:14px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.20em;text-transform:uppercase;color:${JBJ_INK};">
            ${JBJ_BRAND.legalName}
          </div>
          <div style="font-size:9.5px;letter-spacing:0.10em;color:${JBJ_INK};opacity:.75;margin-top:2px;">
            ${JBJ_BRAND.legalSuffix}
          </div>
          <div style="font-size:9.5px;color:${JBJ_INK};opacity:.7;margin-top:4px;">
            Trade Licence ${JBJ_BRAND.tradeLicense}
          </div>
        </td>
        <td style="vertical-align:top;width:36%;text-align:center;padding:0 10px;color:${JBJ_INK};opacity:.85;">
          ${JBJ_BRAND.address}
        </td>
        <td style="vertical-align:top;width:30%;text-align:right;padding-left:14px;">
          <div style="color:${JBJ_INK};font-weight:600;">${JBJ_BRAND.phone}</div>
          <div style="margin-top:2px;"><a href="mailto:${JBJ_BRAND.email}" style="color:${JBJ_GOLD};text-decoration:none;font-weight:600;">${JBJ_BRAND.email}</a></div>
          <div style="margin-top:2px;"><a href="https://${JBJ_BRAND.website}" style="color:${JBJ_GOLD};text-decoration:none;font-weight:600;letter-spacing:.04em;">${JBJ_BRAND.website}</a></div>
        </td>
      </tr>
    </table>
  </footer>
`;

/**
 * Wrap an AI-generated body in the locked chrome. Used for print, PDF
 * export, and email attachments.
 */
export function wrapWithJbjChrome(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>JBJ Document</title>
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
