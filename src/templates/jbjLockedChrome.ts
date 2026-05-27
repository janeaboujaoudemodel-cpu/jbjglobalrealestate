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

export const jbjHeaderHtml = (): string => `
  <header style="
    width:100%;
    background:${JBJ_CHAMPAGNE};
    border-bottom:1px solid ${JBJ_GOLD};
    padding:20px 42px 20px 32px;
    font-family:Inter, system-ui, sans-serif;
    color:${JBJ_INK};
    box-sizing:border-box;
  ">
    <div style="display:grid;grid-template-columns:184px 1px 1fr;align-items:center;gap:26px;min-height:152px;">
      <img src="${monogramSrc}" alt="JBJ"
        style="width:160px;height:160px;display:block;object-fit:contain;background:transparent;margin:0 auto;" />
      <div aria-hidden="true" style="width:1px;height:128px;background:${JBJ_GOLD};opacity:.55;"></div>
      <div style="line-height:1.1;text-align:center;min-width:0;">
        <div style="font-size:24px;font-weight:700;letter-spacing:0.045em;color:${JBJ_INK};white-space:nowrap;">
          ${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}
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
    padding:16px 32px 18px;
    font-family:Inter, system-ui, sans-serif;
    font-size:10px;
    line-height:1.6;
    color:${JBJ_INK};
    box-sizing:border-box;
  ">
    <div style="text-align:center;font-size:11.5px;line-height:1.35;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:${JBJ_INK};white-space:nowrap;">
      ${JBJ_BRAND.legalName} ${JBJ_BRAND.legalSuffix}
    </div>
    <div aria-hidden="true" style="height:1px;background:${JBJ_GOLD};opacity:.45;margin:10px 0 12px;"></div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="vertical-align:top;width:44%;padding-right:14px;color:${JBJ_INK};opacity:.88;">
          <div style="font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;opacity:.65;margin-bottom:2px;">Office</div>
          ${JBJ_BRAND.address}
        </td>
        <td style="vertical-align:top;width:22%;text-align:center;padding:0 8px;color:${JBJ_INK};">
          <div style="font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;opacity:.65;margin-bottom:2px;">Phone</div>
          <div style="font-size:11px;font-weight:700;">${JBJ_BRAND.phone}</div>
        </td>
        <td style="vertical-align:top;width:34%;text-align:right;padding-left:14px;color:${JBJ_INK};">
          <div style="font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;opacity:.65;margin-bottom:2px;">Contact</div>
          <a href="mailto:${JBJ_BRAND.email}" style="color:${JBJ_GOLD};text-decoration:none;font-weight:700;">${JBJ_BRAND.email.toUpperCase()}</a>
          <span style="color:${JBJ_INK};opacity:.4;margin:0 6px;">·</span>
          <a href="https://${JBJ_BRAND.website}" style="color:${JBJ_GOLD};text-decoration:none;font-weight:700;letter-spacing:.04em;">${JBJ_BRAND.website.toUpperCase()}</a>
          <div style="font-size:9.5px;color:${JBJ_INK};opacity:.6;margin-top:3px;">Trade Licence ${JBJ_BRAND.tradeLicense}</div>
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
