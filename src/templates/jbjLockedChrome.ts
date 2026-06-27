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
  const iconStyle = "position:absolute;left:0;top:3px;width:12px;height:12px;display:block;line-height:0;font-size:0;vertical-align:top;object-fit:contain;";
  const textAfterIconStyle = "position:absolute;left:18px;top:0;height:14px;line-height:14px;display:block;white-space:nowrap;";
  const rightItemStyle = "position:relative;height:14px;line-height:14px;padding-left:18px;white-space:nowrap;";
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
        <div style="${rowStyle}width:100%;">
          <img alt="" aria-hidden="true" src="${FOOTER_ICONS.location}" style="${iconStyle}" />
          <span style="${textAfterIconStyle}">${JBJ_BRAND.address}</span>
        </div>
      </div>
      <div style="min-width:0;padding:0 8px;font-size:9px;color:${t.fg};-webkit-text-fill-color:${t.fg};font-weight:700;line-height:14px;text-align:center;">
        ${phones.map((p, i) => `<div style="${rowStyle}width:132px;margin:0 auto;text-align:left;">${i === 0 ? `<img alt="" aria-hidden="true" src="${FOOTER_ICONS.phone}" style="${iconStyle}" />` : ``}<span style="${textAfterIconStyle}">${p}</span></div>`).join("")}
      </div>
      <div style="min-width:0;padding-left:14px;font-size:8.5px;color:${t.fg};-webkit-text-fill-color:${t.fg};text-align:right;white-space:nowrap;height:14px;line-height:14px;">
        <div style="height:14px;line-height:14px;display:grid;grid-template-columns:max-content 10px max-content;align-items:center;justify-content:end;column-gap:6px;width:100%;">
          <span style="${rightItemStyle}">
            <img alt="" aria-hidden="true" src="${FOOTER_ICONS.mail}" style="${iconStyle}" />
            <a href="mailto:${JBJ_BRAND.email}" style="color:${t.fg};-webkit-text-fill-color:${t.fg};text-decoration:none;font-weight:700;line-height:14px;display:block;">${JBJ_BRAND.email.toUpperCase()}</a>
          </span>
          <span style="color:${t.fg};-webkit-text-fill-color:${t.fg};opacity:.5;line-height:14px;display:block;text-align:center;">·</span>
          <span style="${rightItemStyle}">
            <img alt="" aria-hidden="true" src="${FOOTER_ICONS.globe}" style="${iconStyle}" />
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
