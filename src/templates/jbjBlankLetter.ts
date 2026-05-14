/**
 * JBJ GLOBAL REAL ESTATE — Letterhead Template (Blank + Leasing variants)
 *
 * Uses the SHARED letterhead chrome (champagne header + champagne footer band)
 * so the saved letterhead matches the Property Advertising Agreement pixel-
 * for-pixel. Body is **plain text** — not HTML — so users can fill in a
 * normal text area at any time and the document renders identically.
 *
 * Values shape (stored in esign_envelopes.template_field_values):
 *   - subject:      string
 *   - date:         string (any fmt) — defaults to today
 *   - recipient:    string
 *   - body_text:    plain text (preserves line breaks)
 *   - signer_name:  string
 *   - signer_title: string
 *
 * Legacy `body_html` is still accepted for back-compat — sanitised on read —
 * but the editor now writes `body_text` only.
 */
import {
  buildLetterheadHeader,
  buildLetterheadFooter,
  LETTERHEAD_PAGE_OPEN,
  LETTERHEAD_PAGE_CLOSE,
} from "./letterheadChrome";
import { sanitizeHtml } from "@/utils/contentSanitizer";

export const BLANK_LETTER_LAYOUT_VERSION = 2;
export const BLANK_LETTER_TEMPLATE_KEY = "jbj-blank-letter";
export const LETTERHEAD_LEASING_KEY = "jbj-letterhead-leasing";
export const LETTERHEAD_BLANK_KEY = "jbj-letterhead-blank";

const GOLD = "#B89555";
const INK = "#1A1A1A";

export interface BlankLetterValues {
  doc_number?: string;
  subject?: string;
  date?: string;
  recipient?: string;
  /** Preferred — plain text. Line breaks preserved. */
  body_text?: string;
  /** Legacy HTML body (back-compat only — sanitised). */
  body_html?: string;
  signer_name?: string;
  signer_title?: string;
  placed_signature_x?: string;
  placed_signature_y?: string;
  placed_stamp_x?: string;
  placed_stamp_y?: string;
}

export interface BuildBlankLetterOptions {
  ownerSignatureUrl?: string | null;
  ownerStampUrl?: string | null;
  renderMode?: "edit" | "final";
  /** Optional title strip in the header band (e.g. "Official Correspondence — Leasing"). */
  letterheadTitle?: string;
  // Pass-through to keep call sites simple — ignored.
  chrome?: any;
  clientSignatureUrl?: string | null;
  hiddenFields?: string[];
  category?: string;
  templateKey?: string;
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDate = (raw?: string) => {
  if (!raw) {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }
  const t = Date.parse(raw);
  if (!isFinite(t)) return raw;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export function buildBlankLetterHtml(
  values: BlankLetterValues = {},
  opts: BuildBlankLetterOptions = {},
): string {
  const v = values || {};
  const docNumber = v.doc_number || "";
  const subject = v.subject || "";
  const date = formatDate(v.date);
  const recipient = v.recipient || "";

  // Body: prefer plain text. Fall back to legacy sanitised HTML for old envelopes.
  const hasText = (v.body_text || "").trim().length > 0;
  const hasLegacyHtml = !hasText && (v.body_html || "").trim().length > 0;
  const bodyRendered = hasText
    ? `<div style="white-space:pre-wrap;font-family:Inter,Arial,sans-serif;font-size:12.5px;line-height:1.75;color:${INK};">${esc(v.body_text!)}</div>`
    : hasLegacyHtml
      ? `<div style="font-family:Inter,Arial,sans-serif;font-size:12.5px;line-height:1.75;color:${INK};">${sanitizeHtml(v.body_html!)}</div>`
      : (opts.renderMode === "final"
          ? ""
          : `<p style="opacity:.45;font-style:italic;">Type the letter body here…</p>`);

  const signerName = v.signer_name || "";
  const signerTitle = v.signer_title || "Founder & CEO";

  // Optional placed assets — when the user drags signature/stamp on the canvas
  const sigUrl = opts.ownerSignatureUrl || "";
  const stampUrl = opts.ownerStampUrl || "";
  const sigX = parseFloat(v.placed_signature_x || "");
  const sigY = parseFloat(v.placed_signature_y || "");
  const stX = parseFloat(v.placed_stamp_x || "");
  const stY = parseFloat(v.placed_stamp_y || "");

  const placedSignature = sigUrl && isFinite(sigX) && isFinite(sigY)
    ? `<img src="${esc(sigUrl)}" alt="Signature" crossorigin="anonymous" style="position:absolute;left:${sigX}%;top:${sigY}%;max-width:220px;max-height:88px;object-fit:contain;pointer-events:none;" />`
    : "";
  const placedStamp = stampUrl && isFinite(stX) && isFinite(stY)
    ? `<img src="${esc(stampUrl)}" alt="Stamp" crossorigin="anonymous" style="position:absolute;left:${stX}%;top:${stY}%;width:130px;height:130px;object-fit:contain;mix-blend-mode:multiply;opacity:.9;pointer-events:none;" />`
    : "";

  // Default signature row: signature line + Founder & CEO on left, stamp on right
  const sigBlock = `
    <div style="margin-top:34px;display:flex;align-items:flex-end;justify-content:space-between;gap:32px;flex:0 0 auto;">
      <div style="flex:0 1 320px;min-width:220px;">
        ${sigUrl && !placedSignature ? `<img src="${esc(sigUrl)}" alt="Signature" crossorigin="anonymous" style="max-height:64px;max-width:240px;object-fit:contain;display:block;margin-bottom:6px;" />` : `<div style="height:48px;"></div>`}
        <div style="border-top:1px solid ${INK};padding-top:6px;">
          <div style="font-size:12px;font-weight:700;color:${INK};letter-spacing:.02em;">${esc(signerName)}</div>
          <div style="font-size:10.5px;color:${INK};opacity:.78;letter-spacing:.06em;text-transform:uppercase;margin-top:2px;">${esc(signerTitle)}</div>
        </div>
      </div>
      <div style="flex:0 0 auto;text-align:right;min-height:120px;display:flex;align-items:flex-end;justify-content:flex-end;">
        ${stampUrl && !placedStamp ? `<img src="${esc(stampUrl)}" alt="Stamp" crossorigin="anonymous" style="width:128px;height:128px;object-fit:contain;mix-blend-mode:multiply;opacity:.9;" />` : `<div style="width:128px;height:128px;border:1px dashed ${GOLD};border-radius:6px;display:flex;align-items:center;justify-content:center;color:${INK};opacity:.35;font-size:9px;letter-spacing:.18em;text-transform:uppercase;">Stamp</div>`}
      </div>
    </div>`;

  return `
${LETTERHEAD_PAGE_OPEN}
  <div style="flex:0 0 auto;">${buildLetterheadHeader({ docNumber, title: opts.letterheadTitle })}</div>

  <div style="flex:1 1 auto;display:flex;flex-direction:column;position:relative;min-height:0;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;font-size:11.5px;">
      <div>
        ${recipient ? `<div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">To</div><div style="font-weight:600;margin-top:2px;">${esc(recipient)}</div>` : ""}
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">Date</div>
        <div style="font-weight:600;margin-top:2px;">${esc(date)}</div>
      </div>
    </div>

    ${subject ? `<div style="margin:6px 0 14px;"><span style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.65;">Subject</span><div style="font-size:14px;font-weight:700;color:${INK};margin-top:2px;letter-spacing:.01em;">${esc(subject)}</div></div>` : ""}

    <div data-letter-body style="flex:1 1 auto;min-height:420px;font-size:12px;line-height:1.65;color:${INK};">${bodyRendered}</div>

    ${sigBlock}
    ${placedSignature}
    ${placedStamp}
  </div>

  <div style="flex:0 0 auto;">${buildLetterheadFooter()}</div>
${LETTERHEAD_PAGE_CLOSE}`;
}
