/**
 * Document Composers
 * ------------------
 * Deterministic HTML builders for each document type. The AI's job is
 * reduced to filling in 2–3 narrative paragraphs; the STRUCTURE
 * (terms tables, commission rows, signature block, dates) is rendered
 * here so every document looks premium, fits A4, and never drifts.
 *
 * Composer contract:
 *   compose(input) → HTML body string (inserted into the locked chrome).
 *
 * NEVER include letterhead, footer, or company NAP here — the chrome
 * wraps that automatically.
 */

import { jbjCompanyStampSrc } from "@/templates/jbjLockedChrome";
import {
  composeFormA,
  composeFormB,
  composeFormF,
  composeFormI,
  composeFormU,
  composeBrokerReferral,
} from "./reraForms";
import {
  composePartnerReferral,
  composePartnerMarketing,
  composePartnerInvestor,
  composePartnerStrategic,
  composePartnerCustom,
} from "./partnersForms";




export type CommissionRow = {
  label?: string;
  rate?: string;
  trigger?: string;
  notes?: string;
};

export type CustomField = { label: string; value: string };

export interface ComposerInput {
  templateId: string;
  /** Raw field values from the form (text fields, dates…). */
  fields: Record<string, string>;
  /** Multi-row commission table (Job Offer / Commission Agreement). */
  commissionRows?: CommissionRow[];
  /** Owner-added "Add field" pairs. */
  customFields?: CustomField[];
  /** Department (staff only). */
  department?: string;
  /** Optional AI narrative (introduction + closing). */
  aiIntro?: string;
  aiClosing?: string;
  /** Owner identity for signature block. */
  ownerName?: string;
  ownerTitle?: string;
  /** Owner signing date (string, ISO or human). Empty → blank line. */
  ownerDate?: string;
  /** Applicant signing date — usually blank (filled on sign). */
  applicantDate?: string;
  /** Additional signatories appended below the main two-column signature block. */
  extraSignatories?: Array<{ name?: string; title?: string; date?: string; label?: string }>;
  /** Custom date for the top-right of the letter. Empty → today. */
  letterDate?: string;
  /** Hide the static letter date entirely (the draggable date chip is in use). */
  hideLetterDate?: boolean;
}

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const MUTED = "rgba(26,26,26,0.65)";

const todayLong = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const formatHumanDate = (raw?: string): string => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

const esc = (s?: string) =>
  (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

/* ───────────── Shared building blocks ───────────── */

export function termsTable(rows: Array<[string, string | undefined]>): string {
  const visible = rows.filter(([, v]) => (v || "").trim());
  if (visible.length === 0) return "";
  const body = visible
    .map(
      ([k, v], i) => `
      <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="padding:9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:12px;">${esc(k)}</td>
        <td style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;">${esc(v)}</td>
      </tr>`,
    )
    .join("");
  return `
    <table data-pdf-section="terms" style="border-collapse:collapse;width:100%;margin:14px 0 18px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="2" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Terms of Employment
          </th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;

}

export function identityTable(rows: Array<[string, string | undefined]>): string {
  const visible = rows.filter(([, v]) => (v || "").trim());
  if (visible.length === 0) return "";
  const body = visible
    .map(
      ([k, v], i) => `
      <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="padding:8px 12px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:34%;font-size:11.5px;vertical-align:top;">${esc(k)}</td>
        <td style="padding:8px 12px;border:1px solid ${GOLD}33;color:${INK};font-size:11.5px;vertical-align:top;">${esc(v)}</td>
      </tr>`,
    )
    .join("");
  return `
    <table data-pdf-section="identity" style="border-collapse:collapse;width:100%;margin:10px 0 16px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="2" style="text-align:left;padding:9px 12px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Applicant Identity & Contact Details
          </th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;

}

export function commissionTable(rows: CommissionRow[]): string {
  const visible = (rows || []).filter(
    (r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim(),
  );
  if (visible.length === 0) return "";
  const body = visible
    .map(
      (r, i) => `
      <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;font-weight:600;color:${INK};">${esc(r.label) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};white-space:nowrap;">${esc(r.rate) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};">${esc(r.trigger) || "—"}</td>
      </tr>`,
    )
    .join("");
  return `
    <table data-pdf-section="commission" style="border-collapse:collapse;width:100%;margin:6px 0 8px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="3" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Commission Structure
          </th>
        </tr>
        <tr style="background:${CHAMPAGNE};">
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Tier</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Rate</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">When Paid</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    <div data-pdf-section="commission-note" style="font-size:10.5px;color:${MUTED};margin:0 0 18px;font-style:italic;page-break-inside:avoid;break-inside:avoid;">
      Commissions are released once the brokerage has actually received the cleared funds from the buyer or developer.
    </div>`;

}

export function signatureBlock(opts: {
  ownerName?: string;
  ownerTitle?: string;
  ownerDate?: string;
  applicantName?: string;
  applicantDate?: string;
  applicantLabel?: string;
  extraSignatories?: Array<{ name?: string; title?: string; date?: string; label?: string }>;
}): string {
  const oName = esc(opts.ownerName || "Jane Bou Jaoude");
  const oTitle = esc(opts.ownerTitle || "Founder & CEO");
  const oDate = esc(formatHumanDate(opts.ownerDate) || todayLong());
  const aName = esc(opts.applicantName || "");
  const aDate = esc(formatHumanDate(opts.applicantDate));
  // Recipient cell title is template-aware (Second Party / Client / Guest /
  // Counterparty …) — NEVER the literal word "Recipient" and NEVER the
  // recipient's own name (the name already prints inside the cell).
  const aLabel = esc(opts.applicantLabel || "Second Party");
  const shortLine = (value?: string) => `
    <span style="display:inline-block;vertical-align:baseline;width:168px;border-bottom:1px solid ${INK};min-height:18px;position:relative;margin-left:6px;">
      ${value ? `<span style="position:absolute;left:6px;bottom:1px;font-size:11px;font-family:Inter,system-ui,sans-serif;font-weight:500;letter-spacing:0;color:${INK};white-space:nowrap;max-width:156px;overflow:hidden;text-overflow:ellipsis;">${value}</span>` : ""}
    </span>`;

  const row = (label: string, value: string, fallbackDots = true) => `
    <div style="font-size:11px;color:${INK};margin-top:4px;">
      <strong style="font-weight:600;">${label}:</strong>
      ${value ? `<span style="margin-left:4px;">${value}</span>` : (fallbackDots ? shortLine() : "")}
    </div>`;

  // Stamp — stretched larger (was 150×150, now 180×180) so seal text reads
  // clearly without looking squeezed. Anchored well below + right of the
  // signature box so it never overlaps any heading/label text above.
  const stampOverlay = `
    <img src="${jbjCompanyStampSrc}" alt="JBJ Company Stamp" aria-hidden="true"
      style="position:absolute;right:-70px;bottom:-32px;width:220px;height:185px;
             object-fit:contain;opacity:0.95;mix-blend-mode:multiply;background:transparent;
             transform:rotate(-7deg);pointer-events:none;user-select:none;" />`;

  const cell = (sigId: string, heading: string, lines: string, withStamp = false) => `
    <td data-sig-id="${sigId}" style="width:44%;vertical-align:top;padding:0 28px;position:relative;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:36px;font-weight:600;">${heading}</div>
      <div style="border-top:1px solid ${INK};padding-top:10px;position:relative;min-height:120px;overflow:visible;">
        ${lines}
        ${withStamp ? stampOverlay : ""}
      </div>
    </td>`;
  const gapCell = `<td style="width:12%;"></td>`;

  const ownerLines = [
    row("Name", oName),
    row("Title", oTitle),
    row("Date", oDate),
  ].join("");

  // Recipient cell: the cell's top border IS the signature line (user signs
  // ON it). Below it we only print Name (typed legal name) and Date — the
  // literal "Signature:" row was removed to avoid a duplicate signature
  // request inside the cell.
  const applicantLines = `
    <div style="font-size:11px;color:${INK};margin-top:4px;"><strong style="font-weight:600;">Name:</strong>${shortLine(aName)}</div>
    <div style="font-size:11px;color:${INK};margin-top:8px;"><strong style="font-weight:600;">Date:</strong>${shortLine(aDate)}</div>
  `;

  const extras = (opts.extraSignatories || []).filter(
    (s) => (s?.name || "").trim() || (s?.title || "").trim() || (s?.date || "").trim(),
  );
  const extraRows: string[] = [];
  for (let i = 0; i < extras.length; i += 2) {
    const a = extras[i];
    const b = extras[i + 1];
    const aLines = [row("Name", esc(a?.name || "")), row("Title", esc(a?.title || "")), row("Date", esc(formatHumanDate(a?.date)))].join("");
    const bLines = b
      ? [row("Name", esc(b?.name || "")), row("Title", esc(b?.title || "")), row("Date", esc(formatHumanDate(b?.date)))].join("")
      : "";
    extraRows.push(`<tr><td colspan="3" style="height:32px;"></td></tr><tr>${cell(`extra-${i}`, esc(a?.label || "Additional Signatory"), aLines)}${gapCell}${b ? cell(`extra-${i + 1}`, esc(b?.label || "Additional Signatory"), bLines) : `<td style="width:44%;"></td>`}</tr>`);
  }

  // Owner heading is the signatory ROLE (e.g. "Authorised Signatory"),
  // NEVER the company name — the company is already in the header/footer.
  return `
    <div data-signature-block="1" data-pdf-section="signature" style="margin-top:auto;padding-top:36px;page-break-inside:avoid;break-inside:avoid;">
      <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          <tr>
            ${cell("owner", "Authorised Signatory", ownerLines, true)}
            ${gapCell}
            ${cell("recipient", aLabel, applicantLines)}
          </tr>
          ${extraRows.join("")}
        </tbody>
      </table>
    </div>`;
}

/**
 * GLOBAL PAGE SIGNATURE RULE (locked):
 * DocumentStudio injects a slim user signature field on EVERY exported page.
 * Legacy composer strips use the same layout and are stripped before render so
 * they never duplicate the global per-page field:
 *   1. Cursive live name (Dancing Script) — the visible signature mark.
 *   2. 1px ink signature line directly underneath.
 *   3. Uppercase legal name (as per ID/passport) under the line as the caption.
 *   4. A SEPARATE 1px gold hairline page-divider rendered AFTER the strip — so
 *      the divider closes the page and nothing can be appended below.
 *
 * The literal words "Client" / "Guest" / "Initials" / "Signature" NEVER appear
 * as the label — the applicant's legal name IS the identity caption.
 *
 * The authorised signatory + stamp appear ONLY on the last page. The
 * "Page X of Y" indicator is NOT rendered inside the page — DocumentStudio
 * prints it in the champagne gap between sheets.
 *
 * `clientSignatureStrip` (alias `clientInitialsStrip` kept for back-compat) is
 * retained for old explicit-page composers; DocumentStudio is the global source
 * of truth for every current/future template.
 */
export function clientSignatureStrip(opts: {
  applicantName?: string;
  page: number;
  totalPages: number;
  /** @deprecated label is ignored — the applicant's legal name is the caption. */
  label?: string;
}): string {
  if (opts.page >= opts.totalPages) return "";
  const legalName = esc((opts.applicantName || "").trim());
  return `
    <div data-pdf-section="client-signature" data-client-signature-strip="1"
         style="margin-top:auto;padding:12px 8px 14px;
                display:flex;justify-content:flex-end;align-items:flex-end;
                font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <div style="width:310px;margin-right:18px;color:${INK};">
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;margin-bottom:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Name:</div><div style="height:20px;border-bottom:1px solid ${INK};position:relative;"><span style="position:absolute;left:6px;bottom:1px;font-size:12px;font-family:Inter,system-ui,sans-serif;font-weight:500;letter-spacing:0.01em;color:${INK};white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${legalName}</span></div></div>
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;margin-bottom:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Signature:</div><div style="height:22px;border-bottom:1px solid ${INK};"></div></div>
        <div style="display:grid;grid-template-columns:96px 1fr;align-items:end;gap:8px;font-size:10px;line-height:1.2;"><div style="font-weight:700;letter-spacing:0.14em;text-transform:uppercase;white-space:nowrap;">Date:</div><div style="height:18px;border-bottom:1px solid ${INK};"></div></div>
      </div>
    </div>
    <div data-page-divider="1" style="border-top:1px solid ${GOLD}B3;height:0;margin:0 8px;page-break-inside:avoid;break-inside:avoid;"></div>`;
}

// Back-compat alias — old composers import `clientInitialsStrip`.
export const clientInitialsStrip = clientSignatureStrip;



export function recipientBlock(fields: Record<string, string>, opts?: { greeting?: boolean }): string {
  const name = esc(fields.recipientName);
  if (opts?.greeting) {
    return `
      <div style="margin:6px 0 14px;font-size:12.5px;color:${INK};line-height:1.6;">
        <div style="font-weight:600;">Dear ${name || "Candidate"},</div>
      </div>`;
  }
  return `
    <div style="margin:8px 0 18px;font-size:12px;color:${INK};line-height:1.6;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:3px;">To</div>
      <div style="font-weight:600;">${name || "—"}</div>
    </div>`;
}

export function dateLine(_custom?: string): string {
  // 🔒 LOCKED — intentionally returns empty string.
  // DocumentStudio chrome already prints "Generated DD Month YYYY" in the
  // top-right corner of EVERY page (see renderPageGeneratedDate). Emitting
  // a second date in the body caused two dates to overlap at the top of
  // page 2+ (owner complaint 2026-05-28). Keep the export for backward
  // compatibility with composers that still call it.
  return "";
}


export function subjectLine(text: string): string {
  return `<div style="margin:14px 0 14px;font-size:13px;font-weight:600;color:${INK};border-bottom:1px solid ${GOLD};padding-bottom:6px;">${esc(text)}</div>`;
}

export function paragraphs(text?: string): string {
  if (!text) return "";
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 12px;line-height:1.65;font-size:12.5px;color:${INK};">${esc(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/* ───────────── Per-template composers ───────────── */

function composeJobOffer(input: ComposerInput): string {
  const f = input.fields;
  const customRows: Array<[string, string | undefined]> = (input.customFields || [])
    .filter((c) => (c.label || "").trim() && (c.value || "").trim())
    .map((c) => [c.label, c.value]);

  const termsRows: Array<[string, string | undefined]> = [
    ["Position", f.jobTitle],
    ["Department", input.department],
    ["Reporting To", f.reportingTo],
    ["Start Date", formatHumanDate(f.startDate) || f.startDate],
    ["Probation Period", f.probation],
    ["Working Hours", f.workingHours],
    ["Annual Leave", f.annualLeave],
    ["Notice Period", f.noticePeriod],
    ["Base Salary", f.salary],
    ["Allowances", f.allowances],
    ["Benefits", f.benefits],
    ...customRows,
  ];

  const identityRows: Array<[string, string | undefined]> = [
    ["Full Name as per ID", f.recipientName],
    ["Emirates ID Number", f.emiratesId || f.idNumber || f.emirates_id || f.eid_number],
    ["Passport Number", f.passportNumber || f.passport_number || f.passportNo || f.passport],
    ["Home Address", f.homeAddress || f.address || f.home_address || f.residentialAddress],
    ["Email Address", f.recipientEmail || f.email || f.email_address],
    ["Phone / WhatsApp", f.recipientPhone || f.phone || f.mobile || f.mobile_number],
  ];

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f, { greeting: true }),
    subjectLine(`Offer of Employment${f.jobTitle ? ` — ${f.jobTitle}` : ""}`),
    paragraphs(input.aiIntro),
    identityTable(identityRows),
    termsTable(termsRows),
    commissionTable(input.commissionRows || []),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Accepted by Applicant",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

/* ───────────── Termination Letter ───────────── */

function composeTerminationLetter(input: ComposerInput): string {
  const f = input.fields;

  const termRows: Array<[string, string | undefined]> = [
    ["Employee Name", f.recipientName],
    ["Employee ID", f.employeeId],
    ["Position", f.jobTitle],
    ["Termination Effective Date", formatHumanDate(f.terminationDate) || f.terminationDate],
    ["Last Working Day", formatHumanDate(f.lastWorkingDay) || f.lastWorkingDay],
    ["Notice Period", f.noticePeriod],
    ["Reason for Termination", f.reason ? f.reason.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : undefined],
  ];

  const standardClauses = `
    <div style="margin:18px 0 8px;">
      <div data-pdf-section="std-terms-heading" style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;page-break-after:avoid;break-after:avoid;">
        Standard Terms
      </div>
      <ol style="margin:0;padding-left:20px;font-size:12.6px;line-height:1.68;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Notice &amp; Effective Date.</strong> The termination takes effect on the date stated above. Where notice period is served, the Employee shall continue duties until the last working day. Where payment in lieu of notice is made, the equivalent salary shall be included in the final settlement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Final Settlement.</strong> Within fourteen (14) calendar days of the last working day, JBJ GLOBAL REAL ESTATE shall settle all outstanding remuneration, end-of-service gratuity (if applicable under UAE Labour Law), and accrued leave balance, subject to lawful deductions.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Return of Property.</strong> The Employee must return all company property — including but not limited to access cards, keys, laptops, mobile devices, vehicles, and confidential documents — before the final settlement is released.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Confidentiality.</strong> All confidentiality, non-disclosure and non-compete obligations under the Employment Contract and any separate NDA remain in full force and effect notwithstanding termination.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>References.</strong> JBJ GLOBAL REAL ESTATE will provide factual employment verification upon written request. No detailed reference will be issued without the Employee's prior consent.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This notice is issued under UAE Federal Decree-Law No. 33 of 2021 on the Regulation of Labour Relations and the relevant Executive Regulations.</li>
      </ol>
    </div>`;

  const propertySection = (f.returnOfProperty || "").trim()
    ? `<div data-pdf-section="return-property" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Return of Company Property</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.returnOfProperty)}</p>
       </div>`
    : "";

  const settlementSection = (f.finalSettlement || "").trim()
    ? `<div data-pdf-section="final-settlement" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Final Settlement Notes</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.finalSettlement)}</p>
       </div>`
    : "";

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f),
    subjectLine(`Notice of Termination${f.recipientName ? ` — ${f.recipientName}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(termRows),
    settlementSection,
    propertySection,
    standardClauses,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Acknowledged by Employee",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

function composeGeneric(input: ComposerInput, subject: string): string {
  const f = input.fields;
  const identityKeys = new Set(["emiratesId", "passportNumber", "homeAddress", "recipientEmail", "recipientPhone", "idNumber", "emirates_id", "eid_number", "passport_number", "passportNo", "passport", "address", "home_address", "residentialAddress", "email", "email_address", "phone", "mobile", "mobile_number"]);
  const identityRows: Array<[string, string | undefined]> = [
    ["Full Name as per ID", f.recipientName],
    ["Emirates ID Number", f.emiratesId || f.idNumber || f.emirates_id || f.eid_number],
    ["Passport Number", f.passportNumber || f.passport_number || f.passportNo || f.passport],
    ["Home Address", f.homeAddress || f.address || f.home_address || f.residentialAddress],
    ["Email Address", f.recipientEmail || f.email || f.email_address],
    ["Phone / WhatsApp", f.recipientPhone || f.phone || f.mobile || f.mobile_number],
  ];
  const rows: Array<[string, string | undefined]> = [
    ...Object.entries(f).map(([k, v]) => [labelize(k), v] as [string, string | undefined]),
    ...(input.customFields || [])
      .filter((c) => (c.label || "").trim() && (c.value || "").trim())
      .map((c) => [c.label, c.value] as [string, string | undefined]),
  ].filter(([k]) => !["recipientName", "notes"].includes(unlabelize(k)) && !identityKeys.has(unlabelize(k)));

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f),
    subjectLine(subject),
    paragraphs(input.aiIntro),
    identityTable(identityRows),
    termsTable(rows),
    commissionTable(input.commissionRows || []),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Counterparty Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function unlabelize(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
}

/* ───────────── Commission Invoice (auto-calc) ───────────── */

function composeCommissionInvoice(input: ComposerInput): string {
  const f = input.fields;
  const parseNum = (v?: string) => {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const aed = (n: number) =>
    new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 2 }).format(n);

  const dealValue = parseNum(f.dealValue);
  const ratePct = parseNum(f.commissionRate); // % e.g. 2
  const vatPct = f.vatRate !== undefined && f.vatRate !== "" ? parseNum(f.vatRate) : 5;
  const commission = +(dealValue * (ratePct / 100)).toFixed(2);
  const vat = +(commission * (vatPct / 100)).toFixed(2);
  const total = +(commission + vat).toFixed(2);

  const calcRows = `
    <table style="border-collapse:collapse;width:100%;margin:14px 0 18px;font-family:Inter,system-ui,sans-serif;">
      <thead>
        <tr><th colspan="2" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">Invoice Calculation</th></tr>
      </thead>
      <tbody>
        ${[
          ["Deal Value", aed(dealValue)],
          [`Commission Rate`, `${ratePct}%`],
          ["Commission (Net)", aed(commission)],
          [`VAT (${vatPct}%)`, aed(vat)],
        ].map(([k, v], i) => `
          <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
            <td style="padding:9px 14px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:60%;font-size:12px;">${k}</td>
            <td style="padding:9px 14px;border:1px solid ${GOLD}33;color:${INK};font-size:12px;text-align:right;">${v}</td>
          </tr>`).join("")}
        <tr style="background:${GOLD}1A;">
          <td style="padding:11px 14px;border:1px solid ${GOLD};font-weight:700;color:${INK};font-size:13px;">Total Due</td>
          <td style="padding:11px 14px;border:1px solid ${GOLD};color:${INK};font-size:13px;text-align:right;font-weight:700;">${aed(total)}</td>
        </tr>
      </tbody>
    </table>`;

  const meta: Array<[string, string | undefined]> = [
    ["Invoice No.", f.invoiceNumber],
    ["Invoice Date", formatHumanDate(f.invoiceDate) || f.invoiceDate],
    ["Bill To", f.recipientName],
    ["Property / Deal", f.propertyRef],
    ["Payment Terms", f.paymentTerms],
  ];

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine(`Commission Invoice${f.invoiceNumber ? ` — ${f.invoiceNumber}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(meta),
    calcRows,
    paragraphs(input.aiClosing || "Kindly remit the total due to the brokerage bank account on file. Thank you for your business."),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Acknowledged by Client",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

/* ───────────── Holiday Home Booking (premium, non-refundable) ───────────── */

const fmtAED = (n: number) =>
  new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2 }).format(n);

const parseNum = (v?: string) => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const generateBookingId = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Array.from({ length: 4 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
  return `JBJ-HH-${ymd}-${rand}`;
};

function composeHolidayHome(input: ComposerInput): string {
  const f = input.fields;
  const nights = parseNum(f.nights);
  const checkIn = formatHumanDate(f.checkIn) || f.checkIn || "";
  const checkOut = formatHumanDate(f.checkOut) || f.checkOut || "";
  const bookingId = (f.bookingRef && f.bookingRef.trim()) || generateBookingId();

  // ── Booking Summary (compact 2-col)
  const summaryRows: Array<[string, string | undefined]> = [
    ["Booking ID", bookingId],
    ["Booking Source", f.bookingSource],
    ["External Reference", f.externalRef],
    ["Property", f.propertyName],
    ["Address", f.propertyAddress],
    ["Unit Type", f.roomType],
    ["Unit Size", f.unitSize ? `${f.unitSize} sq ft` : undefined],
    ["Guest Name", f.recipientName],
    ["Phone / WhatsApp", f.guestPhone],
    ["Number of Guests", f.guestsCount],
  ];

  // ── Stay & Quotation (5-col itemized) — fully auto-calculated.
  const nightlyRate = parseNum(f.nightlyRate);
  const accommodation = nightlyRate * nights;
  const cleaning = parseNum(f.cleaningFee);
  const deposit = parseNum(f.securityDeposit);
  const subtotal = accommodation + cleaning + deposit;

  // Auto-compute amountPaid from paymentStatus — no manual entry needed.
  const status = (f.paymentStatus || "").trim();
  let amountPaid = 0;
  if (status === "Paid in Full") amountPaid = subtotal;
  else if (status === "Partial Payment") amountPaid = parseNum(f.paidNow);
  else amountPaid = 0; // Pending / unset
  const balance = Math.max(0, subtotal - amountPaid);

  const qRow = (item: string, dates: string, qty: string, rate: string, amount: string, opts?: { strong?: boolean; accent?: boolean }) => {
    const bg = opts?.accent ? `${GOLD}1A` : "#FDFBF7";
    const fw = opts?.strong ? "700" : "400";
    return `
      <tr style="background:${bg};">
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11.5px;color:${INK};font-weight:${opts?.strong ? "700" : "600"};">${esc(item)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};">${esc(dates)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};text-align:center;">${esc(qty)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11px;color:${INK};text-align:right;">${esc(rate)}</td>
        <td style="padding:8px 10px;border:1px solid ${GOLD}33;font-size:11.5px;color:${INK};text-align:right;font-weight:${fw};">${esc(amount)}</td>
      </tr>`;
  };

  const quotation = `
    <table data-pdf-section="quotation" style="border-collapse:collapse;width:100%;margin:6px 0 18px;font-family:Inter,system-ui,sans-serif;page-break-inside:avoid;break-inside:avoid;">
      <thead>
        <tr>
          <th colspan="5" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Stay &amp; Quotation
          </th>
        </tr>
        <tr style="background:${CHAMPAGNE};">
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:left;">Item</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:left;">Dates</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:center;">Qty</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:right;">Rate (AED)</th>
          <th style="padding:7px 10px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:${INK};text-align:right;">Amount (AED)</th>
        </tr>
      </thead>
      <tbody>
        ${qRow(
          "Accommodation",
          checkIn && checkOut ? `${checkIn} → ${checkOut}` : "—",
          nights ? `${nights} ${nights === 1 ? "night" : "nights"}` : "—",
          nightlyRate ? fmtAED(nightlyRate) : "—",
          accommodation ? fmtAED(accommodation) : "—",
        )}
        ${cleaning ? qRow("Cleaning Fee", "—", "—", "—", fmtAED(cleaning)) : ""}
        ${deposit ? qRow("Security Deposit (refundable)", "—", "—", "—", fmtAED(deposit)) : ""}
        ${qRow("Total Invoice", "", "", "", fmtAED(subtotal), { strong: true })}
        ${qRow(
          "Amount Paid",
          [
            formatHumanDate(f.paymentDate) || f.paymentDate || "",
            f.paymentMethod ? `via ${f.paymentMethod}` : "",
            status || "Pending",
          ].filter(Boolean).join(" · ") || "—",
          "",
          "",
          amountPaid ? `(${fmtAED(amountPaid)})` : "—",
          { strong: true },
        )}
        ${qRow(
          "Balance Due",
          f.balanceDueDate ? `due ${formatHumanDate(f.balanceDueDate) || f.balanceDueDate}` : (balance ? "due on arrival" : "—"),
          "",
          "",
          fmtAED(balance),
          { strong: true, accent: true },
        )}
      </tbody>
    </table>`;

  const guestName = esc(f.recipientName || "");
  const idType = esc(f.idType || "Emirates ID Holder");
  const idNumber = esc(f.idNumber || "784-XXXX-XXXXXXX-X");
  const nationality = esc(f.nationality || "—");
  const bookingDateStr = formatHumanDate(f.bookingDate) || formatHumanDate(new Date().toISOString()) || "—";

  const pageFrame = (children: string, page: 1 | 2 | 3) => `
    <div data-holiday-page="${page}" style="height:100%;display:flex;flex-direction:column;justify-content:space-between;gap:${page === 1 ? 16 : 14}px;">
      ${children}
    </div>`;


  const guestCard = `
    <div data-pdf-section="guest-card" style="margin:0;border:1px solid ${GOLD};background:${CHAMPAGNE};">
      <div style="padding:12px 16px;border-bottom:1px solid ${GOLD}66;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;">
        Guest &amp; Booking Profile
      </div>
      <table style="border-collapse:collapse;width:100%;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          ${(() => {
            const rows: Array<[string, string]> = [
              ["Booking ID", bookingId],
              ["Guest Full Name", f.recipientName || "—"],
              ["ID Type", idType],
              ["ID Number", idNumber],
              ["Nationality", nationality],
              ["Phone / WhatsApp", f.guestPhone || "—"],
              ["Date of Booking", bookingDateStr],
              ["Property / Unit", [f.propertyName, f.roomType].filter(Boolean).join(" — ") || "—"],
              ["Check-in", checkIn || "—"],
              ["Check-out", checkOut || "—"],
              ["Nights", nights ? String(nights) : "—"],
              ["Guests", f.guestsCount || "—"],
            ];
            const pairs: string[] = [];
            for (let i = 0; i < rows.length; i += 2) {
              const a = rows[i]; const b = rows[i + 1];
              pairs.push(`
                <tr style="background:${(i / 2) % 2 ? "#FDFBF7" : "transparent"};">
                  <td style="padding:7px 12px;font-size:9.2px;text-transform:uppercase;letter-spacing:0.13em;color:${INK};opacity:.68;width:20%;">${esc(a[0])}</td>
                  <td style="padding:7px 12px;font-size:11.4px;color:${INK};font-weight:650;width:30%;">${esc(a[1])}</td>
                  <td style="padding:7px 12px;font-size:9.2px;text-transform:uppercase;letter-spacing:0.13em;color:${INK};opacity:.68;width:20%;border-left:1px solid ${GOLD}33;">${b ? esc(b[0]) : ""}</td>
                  <td style="padding:7px 12px;font-size:11.4px;color:${INK};font-weight:650;width:30%;">${b ? esc(b[1]) : ""}</td>
                </tr>`);
            }
            return pairs.join("");
          })()}
        </tbody>
      </table>
    </div>`;

  const termClauses = [
    `<strong>Non-Refundable Booking.</strong> The Guest acknowledges that the total amount paid above is <strong>strictly non-refundable</strong> under any circumstances, including cancellation, no-show, early check-out, travel disruption, visa issues, illness, change of plans or force-majeure events. The unit has been reserved and removed from public availability solely for the Guest.`,
    `<strong>No Refund · No Credit.</strong> No partial refund, monetary credit, date change, transfer, or substitution will be issued once payment is received. The Guest expressly waives any right to claim a refund.`,
    `<strong>Full Release of Liability.</strong> The Guest hereby <strong>fully releases, indemnifies and holds harmless JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>, its owners, officers, employees, agents and affiliates from any and all liability, claims, damages, losses, theft, personal injury, property damage, illness, or consequential loss arising before, during or after the stay. JBJ acts solely as booking facilitator and assumes <strong>no responsibility</strong> for the condition, suitability, services, utilities, neighbours, building management, or any incident occurring on the premises.`,
    `<strong>Damage &amp; Property Condition.</strong> The Guest is <strong>fully liable for the full cost of repair or replacement</strong> of any damage, breakage, loss or theft affecting the unit, furniture, appliances, fixtures, finishes or common areas — whether caused by the Guest, co-occupants, visitors, or any person admitted by the Guest. Damages are charged at full market / replacement cost <strong>plus a 15% handling fee</strong>.`,
    `<strong>Overstay &amp; Unauthorised Occupation.</strong> If the Guest fails to vacate at the agreed check-out time without prior written extension, the Guest shall pay <strong>AED 1,500 per day or 2× the nightly rate, whichever is higher</strong>, plus all legal, eviction, locksmith and enforcement costs.`,
    `<strong>Conduct of Guests &amp; Visitors.</strong> The Guest is <strong>fully responsible for the conduct, safety and compliance of every co-occupant and visitor</strong> admitted to the property, and indemnifies JBJ against any claim arising from their actions. Maximum occupancy may not be exceeded; subletting, re-listing or commercial use is strictly prohibited.`,
    `<strong>House Rules &amp; Policy Adherence.</strong> The Guest agrees to <strong>read, respect and abide by all house rules, building by-laws, community regulations and UAE laws</strong> at all times. No parties, no events, no smoking indoors, no unregistered guests, and no pets unless explicitly approved in writing. Quiet hours are 10:00 PM – 8:00 AM.`,
    `<strong>Check-in / Check-out.</strong> Check-in 3:00 PM · Check-out 12:00 PM. Late check-out is charged at one (1) additional night. Keys must be returned in person or via the secure key-box. Lost keys / access cards are charged at cost.`,
    `<strong>Security Deposit.</strong> A refundable security deposit, where collected, is returned within fourteen (14) days post check-out subject to inspection and deduction of any damages, missing items, cleaning fees or unpaid charges.`,
    `<strong>Governing Law.</strong> This Agreement is governed by the laws of the United Arab Emirates and the Emirate of Dubai. Any dispute is subject to the exclusive jurisdiction of Dubai Courts.`,
    `<strong>Acknowledgement.</strong> By signing below, the Guest confirms they have <strong>read, understood and accepted</strong> all terms above, and that payment has been made <strong>voluntarily and irrevocably</strong>.`,
  ];
  const allTerms = `
    <div data-pdf-section="terms" style="margin:0;">
      <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:8px;margin-bottom:14px;">
        Terms &amp; Conditions — Booking, Payment, Liability &amp; Stay Rules
      </div>
      <ol start="1" style="margin:0;padding-left:22px;font-size:12.4px;line-height:1.62;color:${INK};">
        ${termClauses.map((clause, i) => `<li style="margin-bottom:${i === termClauses.length - 1 ? 0 : 8}px;">${clause}</li>`).join("")}
      </ol>
    </div>`;

  const guestLegalName = esc((f.recipientName || "").trim() || "[FULL NAME AS PER ID / PASSPORT]");
  const acknowledgement = `
    <div data-pdf-section="acknowledgement" style="margin:0;padding:18px 22px;border:1px solid ${GOLD};background:${CHAMPAGNE};">
      <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;margin-bottom:12px;text-align:center;">Acknowledgement &amp; Declaration</div>
      <p style="margin:0;font-size:12.4px;line-height:1.7;color:${INK};text-align:center;">
        I, <strong>${guestLegalName}</strong>, hereby agree to all the terms and conditions provided by
        <strong>JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>. I confirm that I have fully read and understood
        every clause above, that I am <strong>solely responsible</strong> for reading and understanding them,
        and that I sign below with my <strong>full, free and informed decision and consent</strong>.
      </p>
    </div>`;

  const signature = signatureBlock({
    ownerName: input.ownerName,
    ownerTitle: input.ownerTitle,
    ownerDate: input.ownerDate,
    applicantName: f.recipientName,
    applicantDate: input.applicantDate,
    applicantLabel: "Guest Signature",
    extraSignatories: input.extraSignatories,
  });

  const welcome = `
    <div data-pdf-section="welcome" style="margin:0;font-size:13.5px;color:${INK};line-height:1.78;">
      <p style="margin:0 0 14px;font-size:15px;"><strong>Dear ${guestName || "Distinguished Guest"},</strong></p>
      <p style="margin:0 0 13px;">On behalf of the entire team at <strong>JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>, it is our distinct privilege to welcome you to one of Dubai's most refined holiday residences. We are deeply honoured by the trust you have placed in us and remain wholeheartedly committed to ensuring that every detail of your stay reflects the quiet excellence, comfort and discretion our guests expect of the JBJ name.</p>
      <p style="margin:0 0 13px;">The pages that follow set out, in full transparency, the profile of your reservation, the financial summary of your stay, the obligations applicable to your residency, and the formal declaration required to confirm your booking.</p>
      <p style="margin:0;">Should you require any assistance at any moment of your stay, our concierge team is at your full disposal — 24 hours a day — through the contact channels printed in the footer of this document.</p>
    </div>`;

  // ── Locked 3-page layout. Page 1 = letter + guest profile + quotation only.
  //    Page 2 = full terms & conditions only. Page 3 = acknowledgement/disclaimer
  //    centered, then aligned authorised-signatory + guest signature side-by-side
  //    with company stamp. Footer renders on the final page only.
  // The `data-locked-pages="1"` flag on the first section instructs the global
  // Document Studio auto-paginator to honour these explicit pages verbatim.
  const page1 = `
    <section data-pdf-page="1" data-locked-pages="1">
      ${pageFrame(`${input.hideLetterDate ? "" : dateLine(input.letterDate)}${subjectLine(`Holiday Home Booking Agreement — ${bookingId}`)}${welcome}${guestCard}${quotation}`, 1)}
    </section>`;

  const page2 = `
    <section data-pdf-page="2">
      ${pageFrame(`<div style="display:flex;flex-direction:column;gap:18px;">${allTerms}</div>`, 2)}
    </section>`;

  const page3 = `
    <section data-pdf-page="3">
      ${pageFrame(`<div style="display:flex;flex-direction:column;gap:26px;justify-content:center;flex:1;">${acknowledgement}${signature}${paragraphs(input.aiClosing)}</div>`, 3)}
    </section>`;

  return [page1, page2, page3].join("");
}




/* ───────────── Facility Management Agreement ───────────── */

function composeFacilityManagement(input: ComposerInput): string {
  const f = input.fields;

  const contractRows: Array<[string, string | undefined]> = [
    ["Client / Owner", f.recipientName],
    // ID / Trade Licence intentionally removed from body — captured in email only
    ["Property", f.propertyName],
    ["Address", f.propertyAddress],
    ["Units Under Management", f.unitsCount],
    ["Total Managed Area", f.totalArea ? `${f.totalArea} sq ft` : undefined],
    ["Start Date", formatHumanDate(f.startDate) || f.startDate],
    ["End Date", formatHumanDate(f.endDate) || f.endDate],
    ["Contract Term", f.term],
    ["Monthly Management Fee", f.monthlyFee ? `AED ${f.monthlyFee}` : undefined],
    ["Payment Terms", f.paymentTerms],
    ["Emergency Response SLA", f.responseTime],
  ];

  const scope = (f.scope || "").trim()
    ? `<div data-pdf-section="scope" style="margin:14px 0 8px;page-break-inside:avoid;break-inside:avoid;">
         <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;">Scope of Services</div>
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.scope)}</p>
       </div>`
    : "";

  const standardTerms = `
    <div style="margin:18px 0 8px;">
      <div data-pdf-section="std-terms-heading" style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;page-break-after:avoid;break-after:avoid;">
        Standard Terms
      </div>
      <ol style="margin:0;padding-left:20px;font-size:12.6px;line-height:1.68;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Appointment.</strong> The Client appoints JBJ GLOBAL REAL ESTATE L.L.C — S.O.C as the exclusive facility manager of the Property for the term stated above.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Services.</strong> Services are delivered as per the Scope above, in accordance with industry best practices and UAE regulations.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Fees &amp; Payment.</strong> The monthly management fee is due in advance per the Payment Terms. Late payments accrue 2% per month. Out-of-scope works are quoted separately and require written approval before commencement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Vendor Coordination.</strong> JBJ coordinates third-party vendors (cleaning, MEP, security) on the Client's behalf. The Client remains responsible for vendor fees at cost plus any agreed management margin.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Reporting.</strong> Monthly performance reports including financials, maintenance tickets and SLA compliance are issued within seven (7) business days of month-end.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Liability.</strong> JBJ's aggregate liability is capped at three (3) months' management fees. JBJ is not liable for force-majeure events, pre-existing defects, or acts of third-party vendors beyond reasonable supervision.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Term &amp; Termination.</strong> Either party may terminate with sixty (60) days' written notice. Outstanding fees and reimbursables remain payable upon termination.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Confidentiality.</strong> Both parties maintain strict confidentiality of commercial and tenant information shared during the engagement.</li>
        <li data-pdf-section="term" style="margin-bottom:9px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This Agreement is governed by the laws of the UAE and the Emirate of Dubai. Disputes fall under the exclusive jurisdiction of Dubai Courts.</li>
      </ol>
    </div>`;



  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine(`Facility Management Agreement${f.propertyName ? ` — ${f.propertyName}` : ""}`),
    paragraphs(input.aiIntro),
    termsTable(contractRows),
    scope,
    standardTerms,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Accepted by Client",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
}

/* ───────────── Candidate CV (locked recruiting template) ───────────── */

function composeCandidateCv(input: ComposerInput): string {
  const f = input.fields;
  const name = esc(f.candidateName || f.recipientName || "Candidate");
  const position = esc(f.positionApplied || "");
  const contactBits = [
    f.email && `<a href="mailto:${esc(f.email)}" style="color:${INK};text-decoration:none;">${esc(f.email)}</a>`,
    f.phoneE164 && esc(f.phoneE164),
    f.location && esc(f.location),
    f.nationality && esc(f.nationality),
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  const header = `
    <div data-pdf-section="cv-header" style="margin:0 0 18px;padding:0 0 14px;border-bottom:1px solid ${GOLD};page-break-inside:avoid;break-inside:avoid;">
      <div style="font-size:22px;font-weight:700;color:${INK};letter-spacing:0.02em;line-height:1.15;">${name}</div>
      ${position ? `<div style="margin-top:4px;font-size:12px;color:${MUTED};letter-spacing:0.16em;text-transform:uppercase;">Applied for · ${position}</div>` : ""}
      ${contactBits ? `<div style="margin-top:10px;font-size:11.5px;color:${INK};line-height:1.55;">${contactBits}</div>` : ""}
    </div>`;

  const sectionHeading = (label: string) => `
    <div style="font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD}55;padding-bottom:4px;margin:0 0 8px;">${esc(label)}</div>`;

  const summary = (f.aiSummary || input.aiIntro || "").trim()
    ? `<div data-pdf-section="cv-summary" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
         ${sectionHeading("Executive Summary")}
         <p style="margin:0;font-size:12px;line-height:1.65;color:${INK};">${esc(f.aiSummary || input.aiIntro || "").replace(/\n/g, "<br/>")}</p>
       </div>`
    : "";

  const meta: Array<[string, string | undefined]> = [
    ["Years of Experience", f.experienceYears],
    ["Languages", f.languages],
  ];
  const metaRows = meta.filter(([, v]) => (v || "").trim());
  const facts = metaRows.length > 0
    ? `<div data-pdf-section="cv-facts" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
         ${sectionHeading("Snapshot")}
         <table style="border-collapse:collapse;width:100%;font-family:Inter,system-ui,sans-serif;">
           <tbody>${metaRows.map(([k, v], i) => `
             <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
               <td style="padding:7px 12px;border:1px solid ${GOLD}33;font-weight:600;color:${INK};width:38%;font-size:11.5px;">${esc(k)}</td>
               <td style="padding:7px 12px;border:1px solid ${GOLD}33;color:${INK};font-size:11.5px;">${esc(v!)}</td>
             </tr>`).join("")}</tbody>
         </table>
       </div>`
    : "";

  const renderSkills = (raw?: string) => {
    if (!raw || !raw.trim()) return "";
    const items = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (!items.length) return "";
    return `<div data-pdf-section="cv-skills" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
      ${sectionHeading("Key Skills")}
      <div style="display:flex;flex-wrap:wrap;gap:6px;">
        ${items.map(s => `<span style="display:inline-block;padding:4px 10px;border:1px solid ${GOLD}66;border-radius:999px;font-size:11px;color:${INK};background:${CHAMPAGNE};">${esc(s)}</span>`).join("")}
      </div>
    </div>`;
  };

  const renderParagraphs = (label: string, raw?: string, anchor = "cv-experience") => {
    if (!raw || !raw.trim()) return "";
    const blocks = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    if (!blocks.length) return "";
    return `<div data-pdf-section="${anchor}-wrap" style="margin:0 0 18px;page-break-inside:avoid;break-inside:avoid;">
      ${sectionHeading(label)}
      ${blocks.map(b => `<div data-pdf-section="${anchor}" style="margin:0 0 10px;padding:0;font-size:12px;line-height:1.6;color:${INK};page-break-inside:avoid;break-inside:avoid;">${esc(b).replace(/\n/g, "<br/>")}</div>`).join("")}
    </div>`;
  };

  const refLink = (f.referenceCvUrl || "").trim()
    ? `<div data-pdf-section="cv-source" style="margin:14px 0 0;padding:10px 14px;border:1px dashed ${GOLD}66;background:${CHAMPAGNE};font-size:11px;color:${MUTED};page-break-inside:avoid;break-inside:avoid;">
         Source CV on file: <a href="${esc(f.referenceCvUrl)}" style="color:${INK};">${esc(f.referenceCvUrl)}</a>
       </div>`
    : "";

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    header,
    summary,
    facts,
    renderParagraphs("Experience", f.experienceHistory, "cv-experience"),
    renderSkills(f.skills),
    renderParagraphs("Education", f.education, "cv-education"),
    paragraphs(input.aiClosing),
    refLink,
  ].join("");
}

/* ───────────── Dispatcher ───────────── */

export function compose(input: ComposerInput): string {
  switch (input.templateId) {
    case "job_offer":
      return composeJobOffer(input);
    case "employment_contract":
      return composeGeneric(input, `Employment Contract — ${input.fields.jobTitle || ""}`);
    case "warning_letter":
      return composeGeneric(input, `Formal Notice — ${input.fields.recipientName || ""}`);
    case "termination_letter":
      return composeTerminationLetter(input);
    case "nda":
      return composeGeneric(input, `Non-Disclosure Agreement`);
    case "commission_agreement":
      return composeGeneric(input, `Commission Agreement — ${input.fields.recipientName || ""}`);
    case "commission_invoice":
      return composeCommissionInvoice(input);
    case "internship_agreement":
      return composeGeneric(input, `Internship Agreement — ${input.fields.recipientName || ""}`);
    case "hr_letter":
      return composeGeneric(input, `HR Letter — ${input.fields.recipientName || ""}`);
    case "partnership_referral":
      return composeGeneric(input, `Partnership / Referral Agreement`);
    case "candidate_cv":
      return composeCandidateCv(input);
    case "form_a":
      return composeFormA(input);
    case "form_b":
      return composeFormB(input);
    case "form_f":
      return composeFormF(input);
    case "form_i":
      return composeFormI(input);
    case "form_u":
      return composeFormU(input);
    case "broker_referral":
      return composeBrokerReferral(input);
    case "paa":
      return composeGeneric(input, `Property Advertising Agreement`);
    case "tenancy_addendum":
      return composeGeneric(input, `Tenancy Contract Addendum`);
    case "holiday_home_agreement":
      return composeHolidayHome(input);
    case "facility_management_agreement":
      return composeFacilityManagement(input);
    case "partner_referral":
      return composePartnerReferral(input);
    case "partner_marketing":
      return composePartnerMarketing(input);
    case "partner_investor":
      return composePartnerInvestor(input);
    case "partner_strategic":
      return composePartnerStrategic(input);
    case "partner_custom":
      return composePartnerCustom(input);
    default:
      return composeGeneric(input, input.fields.subject || "Document");
  }
}



/** Pre-seeded commission rows for HR/broker offers. */
export const DEFAULT_BROKER_COMMISSIONS: CommissionRow[] = [
  { label: "Direct deals", rate: "", trigger: "Paid after JBJ Global Real Estate LLC SOC receives the cleared commission", notes: "" },
  { label: "Company-sourced leads", rate: "", trigger: "Paid after JBJ Global Real Estate LLC SOC receives the cleared commission", notes: "" },
];
