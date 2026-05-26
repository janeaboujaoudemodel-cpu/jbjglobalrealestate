/**
 * JBJ Locked Document Chrome
 * ---------------------------
 * Premium header + footer used by every document generated through
 * `<DocumentStudio />`. These constants are LOCKED — the AI generator
 * never sees them, the user never edits them, and they are appended
 * around the body whenever the document is printed, exported to PDF,
 * or attached to a branded email.
 *
 * Header  = JBJ monogram + black wordmark + gold "L.L.C · S.O.C" suffix.
 *           NO address / email / phone in the header.
 * Footer  = all gold, centered, single corporate line + contact line.
 *           NO confidentiality boilerplate, NO fake phone number.
 */

// Embedded as a base64 data URI so the locked chrome is fully self-contained
// in PDF / DOCX / print / email exports (no external asset hops).
import monogramSrc from "@/assets/jbj-monogram-letterhead.png";

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
    padding:22px 40px;
    font-family:Inter, system-ui, sans-serif;
    color:${JBJ_GOLD};
  ">
    <div style="display:flex;align-items:center;gap:16px;">
      <img src="${monogramSrc}" alt="JBJ"
        style="width:44px;height:44px;display:block;border:1px solid ${JBJ_GOLD};border-radius:6px;background:#FDFBF7;padding:4px;box-sizing:border-box;object-fit:contain;" />
      <div style="line-height:1.15;">
        <div style="font-size:18px;font-weight:600;letter-spacing:0.01em;color:${JBJ_INK};">
          ${JBJ_BRAND.legalName}
        </div>
        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${JBJ_GOLD};margin-top:4px;">
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
 */
export function wrapWithJbjChrome(bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8" /><title>JBJ Document</title></head>
<body style="margin:0;background:#FDFBF7;font-family:Inter,system-ui,sans-serif;color:${JBJ_INK};">
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
