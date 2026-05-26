/**
 * JBJ Locked Document Chrome
 * ---------------------------
 * Premium header + footer used by every document generated through
 * `<DocumentStudio />`. These constants are LOCKED — the AI generator
 * never sees them, the user never edits them, and they are appended
 * around the body whenever the document is printed, exported to PDF,
 * or attached to a branded email.
 *
 * Brand guard:
 *  - Champagne band (#F7F2EA) + 1px gold hairline (#B89555)
 *  - Inter font, ink text (#1A1A1A)
 *  - Legal name "JBJ GLOBAL REAL ESTATE" — never abbreviated
 */

export const JBJ_BRAND = {
  legalName: "JBJ GLOBAL REAL ESTATE LLC SOC",
  shortName: "JBJ GLOBAL REAL ESTATE",
  address: "Dubai, United Arab Emirates",
  phone: "+971 4 000 0000",
  email: "contact@jbj.ae",
  website: "www.jbj.ae",
  rera: "ORN — see official record",
} as const;

export const jbjHeaderHtml = (): string => `
  <header style="
    width:100%;
    background:#F7F2EA;
    border-bottom:1px solid #B89555;
    padding:24px 40px;
    font-family:Inter, system-ui, sans-serif;
    color:#1A1A1A;
  ">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
      <div>
        <p style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#1A1A1A;opacity:0.6;margin:0 0 4px;">
          ${JBJ_BRAND.shortName}
        </p>
        <p style="font-size:18px;font-weight:600;margin:0;color:#1A1A1A;">
          ${JBJ_BRAND.legalName}
        </p>
      </div>
      <div style="text-align:right;font-size:11px;line-height:1.5;color:#1A1A1A;opacity:0.7;">
        <div>${JBJ_BRAND.address}</div>
        <div>${JBJ_BRAND.email} · ${JBJ_BRAND.website}</div>
      </div>
    </div>
  </header>
`;

export const jbjFooterHtml = (): string => `
  <footer style="
    width:100%;
    background:#F7F2EA;
    border-top:1px solid #B89555;
    padding:18px 40px;
    margin-top:32px;
    font-family:Inter, system-ui, sans-serif;
    font-size:10px;
    line-height:1.6;
    color:#1A1A1A;
    opacity:0.7;
    text-align:center;
  ">
    <div style="letter-spacing:0.18em;text-transform:uppercase;margin-bottom:4px;">
      ${JBJ_BRAND.shortName}
    </div>
    <div>${JBJ_BRAND.address} · ${JBJ_BRAND.phone} · ${JBJ_BRAND.email}</div>
    <div style="margin-top:4px;opacity:0.7;">
      This document is issued by ${JBJ_BRAND.legalName} and is confidential.
    </div>
  </footer>
`;

/**
 * Wrap an AI-generated body in the locked chrome. Used for print, PDF
 * export, and email attachments. The body itself remains the only
 * editable portion.
 */
export function wrapWithJbjChrome(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>JBJ Document</title></head>
<body style="margin:0;background:#FDFBF7;font-family:Inter,system-ui,sans-serif;color:#1A1A1A;">
  ${jbjHeaderHtml()}
  <main style="max-width:780px;margin:0 auto;padding:40px;background:#FDFBF7;">
    ${bodyHtml}
  </main>
  ${jbjFooterHtml()}
</body></html>`;
}

/**
 * Strip any header/footer/signature artifacts the AI may have produced.
 * The locked chrome is the single source of truth — body content must
 * never duplicate company NAP or letterhead markup.
 */
export function stripChromeArtifacts(html: string): string {
  return html
    .replace(/<\/?(html|head|body|header|footer)[^>]*>/gi, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]*\/?>/gi, "")
    .trim();
}
