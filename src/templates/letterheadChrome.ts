/**
 * JBJ GLOBAL REAL ESTATE — Shared Letterhead Chrome
 *
 * Single source of truth for the champagne header + footer band used by:
 *   - Property Advertising Agreement (PAA)
 *   - JBJ Letterhead (Leasing + Blank fillable)
 *
 * Any document that uses this chrome gets identical pixels in the on-screen
 * preview AND in the html2canvas PDF export — so "preview != download" can
 * never happen on letterhead documents.
 */
// monogram inlined as a base64 data URI so it renders identically in the
// preview iframe (srcDoc), html2canvas PDF export, and any new-tab print
// window — eliminating the broken-image placeholder seen when fetching
// the asset over the network.
import monogramUrl from "@/assets/jbj-monogram-nobuffer.png?inline";
import {
  TRADE_LICENSE_LEGAL_NAME,
  TRADE_LICENSE_OFFICE,
  COMPANY_CONTACT,
} from "@/config/companyLegal";

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#FBF7EE";

const esc = (s: string) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

const telHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, "")}`;
const mailHref = (raw: string) => `mailto:${raw.trim()}`;
const webHref = (raw: string) => {
  const t = raw.trim();
  return /^https?:/i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
};

// goldGradient removed — header/footer use a single full-width hairline only.

export interface LetterheadHeaderOpts {
  docNumber?: string;
  /** Optional document title shown in the centered band (e.g. "OFFICIAL CORRESPONDENCE"). Omit to hide the band. */
  title?: string;
  reraPermit?: string;
}

export function buildLetterheadHeader(opts: LetterheadHeaderOpts = {}): string {
  const docNumber = opts.docNumber || "";
  const title = opts.title || "";
  const docBadge = docNumber
    ? `<div style="font-size:10.5px;letter-spacing:.18em;color:${INK};font-weight:600;">${esc(docNumber)}</div>`
    : "";
  const reraLine = opts.reraPermit
    ? `<div style="font-size:10px;letter-spacing:.1em;color:${INK};opacity:.75;margin-top:3px;">RERA Permit · ${esc(opts.reraPermit)}</div>`
    : "";
  // Office line intentionally removed from header — shown only in footer per branding decision.
  const officeLine = "";
  const contactStack = `
    <div style="font-size:9.5px;line-height:1.6;text-align:right;">
      <div style="margin-bottom:1px;"><a href="${telHref(COMPANY_CONTACT.phone)}" style="color:${INK};text-decoration:none;font-weight:600;">${esc(COMPANY_CONTACT.phone)}</a></div>
      <div style="margin-bottom:1px;"><a href="${mailHref(COMPANY_CONTACT.email)}" style="color:${GOLD};text-decoration:none;">${esc(COMPANY_CONTACT.email)}</a></div>
      <div><a href="${webHref(COMPANY_CONTACT.website)}" target="_blank" rel="noopener" style="color:${GOLD};text-decoration:none;font-weight:600;letter-spacing:.04em;">${esc(COMPANY_CONTACT.website)}</a></div>
    </div>`;
  const docBadgeBlock = docBadge ? `<div style="margin-bottom:6px;">${docBadge}</div>` : "";
  const titleBlock = title
    ? `
      <div style="margin-top:14px;text-align:center;">
        <div style="font-size:14px;font-weight:800;letter-spacing:.22em;color:${INK};text-transform:uppercase;">
          ${esc(title)}
        </div>
      </div>`
    : ``;
  return `
    <style>
      @media (max-width:520px){
        .jbj-lh-row{display:block !important;}
        .jbj-lh-row > *{display:block !important;text-align:left !important;min-width:0 !important;width:100% !important;padding:6px 0 !important;}
        .jbj-lh-contact{text-align:left !important;}
        .jbj-lh-brand{font-size:13px !important;letter-spacing:.14em !important;}
      }
    </style>
    <div style="margin:-24px -36px 14px;background:${CHAMPAGNE};padding:16px 36px 14px;border-bottom:1px solid ${GOLD};">
      <div class="jbj-lh-row" style="display:flex;align-items:center;gap:14px;min-height:58px;">
        <img src="${monogramUrl}" alt="JBJ Global Real Estate" style="width:58px;height:58px;object-fit:contain;display:block;flex:0 0 auto;" />
        <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;min-width:0;padding-left:14px;">
          <div class="jbj-lh-brand" style="font-size:15px;font-weight:700;letter-spacing:.20em;color:${INK};text-transform:uppercase;line-height:1.15;white-space:nowrap;">
            ${esc(TRADE_LICENSE_LEGAL_NAME)}
          </div>
          ${officeLine}
          ${reraLine}
        </div>
        <div class="jbj-lh-contact" style="flex:0 0 auto;text-align:right;min-width:150px;">
          ${docBadgeBlock}
          ${contactStack}
        </div>
      </div>
      ${titleBlock}
    </div>`;
}

export interface LetterheadFooterOpts {
  /** Owner-only opt-in. When false (default) the trade-license office line
   *  is omitted from the footer middle cell across every letterhead doc. */
  showOffice?: boolean;
}

export function buildLetterheadFooter(opts: LetterheadFooterOpts = {}): string {
  const officeCell = opts.showOffice && TRADE_LICENSE_OFFICE ? esc(TRADE_LICENSE_OFFICE) : "";
  return `
    <style>
      @media (max-width:520px){
        .jbj-lf-cell{display:block !important;width:100% !important;text-align:center !important;padding:6px 0 !important;}
      }
    </style>
    <div style="margin:14px -36px 0;background:${CHAMPAGNE};border-top:1px solid ${GOLD};padding:14px 36px 14px;">
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.5px;color:${INK};line-height:1.55;">
        <tr>
          <td class="jbj-lf-cell" style="vertical-align:top;width:32%;padding-right:10px;">
            <div style="font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${INK};">${esc(TRADE_LICENSE_LEGAL_NAME)}</div>
            <div style="margin-top:3px;"><a href="${telHref(COMPANY_CONTACT.phone)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${esc(COMPANY_CONTACT.phone)}</a></div>
          </td>
          <td class="jbj-lf-cell" style="vertical-align:top;text-align:center;width:38%;padding:0 8px;color:${INK};opacity:.85;">
            ${officeCell}
          </td>
          <td class="jbj-lf-cell" style="vertical-align:top;text-align:right;width:30%;padding-left:10px;">
            <div><a href="${mailHref(COMPANY_CONTACT.email)}" style="color:${GOLD};text-decoration:none;font-weight:600;">${esc(COMPANY_CONTACT.email)}</a></div>
            <div style="margin-top:3px;"><a href="${webHref(COMPANY_CONTACT.website)}" target="_blank" rel="noopener" style="color:${GOLD};text-decoration:none;font-weight:600;letter-spacing:.04em;">${esc(COMPANY_CONTACT.website)}</a></div>
          </td>
        </tr>
      </table>
    </div>`;
}

/** A4 page wrapper used by every letterhead document — open / close pair. */
export const LETTERHEAD_PAGE_OPEN =
  `<div dir="ltr" style="direction:ltr;unicode-bidi:isolate;writing-mode:horizontal-tb;transform:none;font-family:Inter,Arial,sans-serif;color:${INK};background:#FFFFFF;padding:24px 36px 0;max-width:794px;margin:0 auto;line-height:1.55;font-size:12px;min-height:1123px;display:flex;flex-direction:column;box-sizing:border-box;position:relative;">`;
export const LETTERHEAD_PAGE_CLOSE = `</div>`;
