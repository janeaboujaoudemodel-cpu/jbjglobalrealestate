/**
 * JBJ Locked Document Chrome
 * ---------------------------
 * Premium header + footer used by every document generated through
 * `<DocumentStudio />`. These constants are LOCKED — the AI generator
 * never sees them, the user never edits them, and they are appended
 * around the body whenever the document is printed, exported to PDF,
 * or attached to a branded email.
 *
 * Header  = transparent JBJ monogram (bigger, no box) + black wordmark
 *           + black "L.L.C · S.O.C" suffix.
 * Footer  = all gold, centered, single corporate line + contact line.
 */

import monogramSrc from "@/assets/jbj-monogram-transparent.png";

export const JBJ_BRAND = {
  legalName: "JBJ GLOBAL REAL ESTATE",
  legalSuffix: "L.L.C · S.O.C",
  shortName: "JBJ GLOBAL REAL ESTATE",
  address: "Dubai, United Arab Emirates",
  email: "contact@jbj.ae",
  website: "www.jbj.ae",
} as const;

export const JBJ_GOLD = "#B89555";
export const JBJ_INK = "#1A1A1A";
export const JBJ_CHAMPAGNE = "#F7F2EA";

export const jbjMonogramSrc = monogramSrc;

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
    padding:16px 40px;
    font-family:Inter, system-ui, sans-serif;
    font-size:10px;
    line-height:1.7;
    color:${JBJ_GOLD};
    text-align:center;
  ">
    <div style="letter-spacing:0.22em;text-transform:uppercase;">
      ${JBJ_BRAND.legalName} · ${JBJ_BRAND.legalSuffix}
    </div>
    <div style="letter-spacing:0.04em;margin-top:2px;">
      ${JBJ_BRAND.address} · ${JBJ_BRAND.email} · ${JBJ_BRAND.website}
    </div>
  </footer>
`;

/**
 * Wrap an AI-generated body in the locked chrome. Used for print, PDF
 * export, and email attachments. The body itself remains the only
 * editable portion.
 *
 * A4 hard sizing: 794px × 1123px @ 96dpi.
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

/**
 * Strip any header/footer/signature artifacts the AI may have produced.
 */
export function stripChromeArtifacts(html: string): string {
  return html
    .replace(/<\/?(html|head|body|header|footer)[^>]*>/gi, "")
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta[^>]*\/?>/gi, "")
    .trim();
}
