/**
 * JBJ GLOBAL REAL ESTATE — Blank Letter Template
 *
 * Empty A4 letterhead used for AI-generated correspondence (offer letters,
 * warning letters, NOC, salary certificate, VAT exemption, custom). Header
 * and footer match the Property Advertising Agreement so brand chrome stays
 * consistent across every outgoing JBJ document.
 *
 * Values shape (stored in esign_envelopes.template_field_values):
 *   - subject:      string            // displayed below header
 *   - date:         string (any fmt)  // shown right-aligned, defaults to today
 *   - recipient:    string            // "To: …" line
 *   - body_html:    sanitised HTML    // letter body (AI-generated or hand-written)
 *   - signer_name:  string
 *   - signer_title: string
 *   - placed_signature_x / _y: 0-100  // % of body box, optional
 *   - placed_stamp_x / _y:     0-100  // % of body box, optional
 *
 * Signature/stamp PNGs come in via opts.ownerSignatureUrl / ownerStampUrl
 * exactly like the PAA template so the same regenerate pipeline works.
 */
import monogramUrl from "@/assets/jbj-monogram-nobuffer.png";
import {
  TRADE_LICENSE_BRAND,
  TRADE_LICENSE_LEGAL_NAME,
  TRADE_LICENSE_OFFICE,
  COMPANY_CONTACT,
} from "@/config/companyLegal";
import { sanitizeHtml } from "@/utils/contentSanitizer";

export const BLANK_LETTER_LAYOUT_VERSION = 1;
export const BLANK_LETTER_TEMPLATE_KEY = "jbj-blank-letter";

const BRAND = {
  company: TRADE_LICENSE_BRAND,
  legal: TRADE_LICENSE_LEGAL_NAME,
  office: TRADE_LICENSE_OFFICE,
  phone: COMPANY_CONTACT.phone,
  email: COMPANY_CONTACT.email,
  website: COMPANY_CONTACT.website,
  gold: "#B89555",
  ink: "#1A1A1A",
  monogram: monogramUrl,
};

export interface BlankLetterValues {
  doc_number?: string;
  subject?: string;
  date?: string;
  recipient?: string;
  body_html?: string;
  signer_name?: string;
  signer_title?: string;
  placed_signature_x?: string; // "12.5"
  placed_signature_y?: string;
  placed_stamp_x?: string;
  placed_stamp_y?: string;
}

export interface BuildBlankLetterOptions {
  ownerSignatureUrl?: string | null;
  ownerStampUrl?: string | null;
  renderMode?: "edit" | "final";
  // Allow PAA opts pass-through to keep call sites simple — we ignore them.
  chrome?: any;
  clientSignatureUrl?: string | null;
  hiddenFields?: string[];
  category?: string;
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const telHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, "")}`;
const mailHref = (raw: string) => `mailto:${raw.trim()}`;
const webHref = (raw: string) => {
  const t = raw.trim();
  return /^https?:/i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
};

const goldGradient = (accent: string) =>
  `background:linear-gradient(90deg, ${accent}00 0%, ${accent} 12%, ${accent} 88%, ${accent}00 100%);height:1.5px;`;

const formatDate = (raw?: string) => {
  if (!raw) {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  const t = Date.parse(raw);
  if (!isFinite(t)) return raw;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const headerHtml = (docNumber: string) => {
  const docBadge = docNumber
    ? `<div style="font-size:10.5px;letter-spacing:.18em;color:${BRAND.ink};font-weight:600;">${esc(docNumber)}</div>`
    : "";
  const contactStack = `
    <div style="margin-top:6px;font-size:9.5px;line-height:1.55;text-align:right;">
      <div><a href="${telHref(BRAND.phone)}" style="color:${BRAND.ink};text-decoration:none;font-weight:600;">${esc(BRAND.phone)}</a></div>
      <div><a href="${mailHref(BRAND.email)}" style="color:${BRAND.gold};text-decoration:none;">${esc(BRAND.email)}</a></div>
      <div><a href="${webHref(BRAND.website)}" target="_blank" rel="noopener" style="color:${BRAND.gold};text-decoration:none;font-weight:600;letter-spacing:.04em;">${esc(BRAND.website)}</a></div>
    </div>`;
  return `
    <div style="margin-bottom:18px;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <img src="${BRAND.monogram}" alt="JBJ" crossorigin="anonymous" style="width:54px;height:54px;object-fit:contain;display:block;flex:0 0 auto;" />
        <div style="width:1px;align-self:stretch;background:${BRAND.gold};opacity:.7;"></div>
        <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-size:13px;font-weight:700;letter-spacing:.20em;color:${BRAND.ink};text-transform:uppercase;line-height:1.2;">
            ${esc(BRAND.legal)}
          </div>
        </div>
        <div style="flex:0 0 auto;text-align:right;min-width:140px;">${docBadge}${contactStack}</div>
      </div>
      <div style="margin-top:10px;${goldGradient(BRAND.gold)}"></div>
    </div>`;
};

const footerHtml = () => `
  <div style="margin-top:14px;${goldGradient(BRAND.gold)}"></div>
  <table style="margin-top:8px;width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px;color:${BRAND.ink};line-height:1.5;">
    <tr>
      <td style="vertical-align:top;width:34%;padding-right:10px;">
        <div style="font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${BRAND.ink};">${esc(BRAND.legal)}</div>
        <div style="margin-top:3px;"><a href="${telHref(BRAND.phone)}" style="color:${BRAND.ink};text-decoration:none;font-weight:600;">${esc(BRAND.phone)}</a></div>
      </td>
      <td style="vertical-align:top;text-align:center;width:36%;padding:0 8px;color:${BRAND.ink};opacity:.9;">
        ${BRAND.office ? esc(BRAND.office) : ""}
      </td>
      <td style="vertical-align:top;text-align:right;width:30%;padding-left:10px;">
        <div><a href="${mailHref(BRAND.email)}" style="color:${BRAND.ink};text-decoration:none;">${esc(BRAND.email)}</a></div>
        <div style="margin-top:3px;"><a href="${webHref(BRAND.website)}" target="_blank" rel="noopener" style="color:${BRAND.gold};text-decoration:none;font-weight:600;letter-spacing:.04em;">${esc(BRAND.website)}</a></div>
      </td>
    </tr>
  </table>`;

export function buildBlankLetterHtml(
  values: BlankLetterValues = {},
  opts: BuildBlankLetterOptions = {},
): string {
  const v = values || {};
  const docNumber = v.doc_number || "";
  const subject = v.subject || "";
  const date = formatDate(v.date);
  const recipient = v.recipient || "";
  const bodyHtml = v.body_html
    ? sanitizeHtmlContent(v.body_html)
    : (opts.renderMode === "final"
        ? ""
        : `<p style="opacity:.45;font-style:italic;">Use the AI prompt above to draft this letter, or type your own content here…</p>`);
  const signerName = v.signer_name || "";
  const signerTitle = v.signer_title || "";

  // Optional placed assets
  const sigUrl = opts.ownerSignatureUrl || "";
  const stampUrl = opts.ownerStampUrl || "";
  const sigX = parseFloat(v.placed_signature_x || "");
  const sigY = parseFloat(v.placed_signature_y || "");
  const stX = parseFloat(v.placed_stamp_x || "");
  const stY = parseFloat(v.placed_stamp_y || "");

  const placedSignature = sigUrl && isFinite(sigX) && isFinite(sigY)
    ? `<img src="${esc(sigUrl)}" alt="Signature" crossorigin="anonymous" style="position:absolute;left:${sigX}%;top:${sigY}%;max-width:200px;max-height:80px;object-fit:contain;pointer-events:none;" />`
    : "";
  const placedStamp = stampUrl && isFinite(stX) && isFinite(stY)
    ? `<img src="${esc(stampUrl)}" alt="Stamp" crossorigin="anonymous" style="position:absolute;left:${stX}%;top:${stY}%;width:120px;height:120px;object-fit:contain;mix-blend-mode:multiply;opacity:.85;pointer-events:none;" />`
    : "";

  // Default signature block at bottom (only when not placed elsewhere)
  const sigBlock = `
    <div style="margin-top:32px;">
      <div style="display:flex;align-items:flex-end;gap:24px;">
        <div style="flex:1 1 auto;">
          ${sigUrl && !placedSignature ? `<img src="${esc(sigUrl)}" alt="Signature" crossorigin="anonymous" style="max-height:60px;max-width:220px;object-fit:contain;display:block;margin-bottom:4px;" />` : `<div style="height:60px;border-bottom:1px solid ${BRAND.gold};margin-bottom:4px;"></div>`}
          <div style="font-size:11.5px;font-weight:700;color:${BRAND.ink};">${esc(signerName)}</div>
          <div style="font-size:10px;color:${BRAND.ink};opacity:.75;letter-spacing:.04em;text-transform:uppercase;">${esc(signerTitle)}</div>
        </div>
        ${stampUrl && !placedStamp ? `<div style="flex:0 0 auto;"><img src="${esc(stampUrl)}" alt="Stamp" crossorigin="anonymous" style="width:110px;height:110px;object-fit:contain;mix-blend-mode:multiply;opacity:.85;" /></div>` : ""}
      </div>
    </div>`;

  return `
<div style="font-family:Inter,Arial,sans-serif;color:${BRAND.ink};background:#FFFFFF;padding:24px 36px 14px;max-width:794px;margin:0 auto;line-height:1.55;font-size:12px;min-height:1123px;display:flex;flex-direction:column;box-sizing:border-box;position:relative;">
  <div style="flex:0 0 auto;">${headerHtml(docNumber)}</div>

  <div style="flex:1 1 auto;display:flex;flex-direction:column;position:relative;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;font-size:11.5px;">
      <div>
        ${recipient ? `<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">To</div><div style="font-weight:600;margin-top:2px;">${esc(recipient)}</div>` : ""}
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">Date</div>
        <div style="font-weight:600;margin-top:2px;">${esc(date)}</div>
      </div>
    </div>

    ${subject ? `<div style="margin:6px 0 14px;"><span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">Subject</span><div style="font-size:14px;font-weight:700;color:${BRAND.ink};margin-top:2px;letter-spacing:.01em;">${esc(subject)}</div></div>` : ""}

    <div data-letter-body style="flex:1 1 auto;font-size:12px;line-height:1.65;color:${BRAND.ink};">${bodyHtml}</div>

    ${sigBlock}
    ${placedSignature}
    ${placedStamp}
  </div>

  <div style="flex:0 0 auto;">${footerHtml()}</div>
</div>`;
}
