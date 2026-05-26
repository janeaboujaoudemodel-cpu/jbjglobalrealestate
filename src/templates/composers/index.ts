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
}

const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const MUTED = "rgba(26,26,26,0.65)";

const todayLong = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

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
    <table style="border-collapse:collapse;width:100%;margin:14px 0 18px;font-family:Inter,system-ui,sans-serif;">
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

export function commissionTable(rows: CommissionRow[]): string {
  const visible = (rows || []).filter(
    (r) => (r.label || "").trim() || (r.rate || "").trim() || (r.trigger || "").trim() || (r.notes || "").trim(),
  );
  if (visible.length === 0) return "";
  const body = visible
    .map(
      (r, i) => `
      <tr style="background:${i % 2 ? "#FDFBF7" : CHAMPAGNE};">
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;font-weight:600;color:${INK};">${esc(r.label) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};white-space:nowrap;">${esc(r.rate) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${INK};">${esc(r.trigger) || "—"}</td>
        <td style="padding:9px 12px;border:1px solid ${GOLD}33;font-size:12px;color:${MUTED};">${esc(r.notes) || ""}</td>
      </tr>`,
    )
    .join("");
  return `
    <table style="border-collapse:collapse;width:100%;margin:6px 0 18px;font-family:Inter,system-ui,sans-serif;">
      <thead>
        <tr>
          <th colspan="4" style="text-align:left;padding:10px 14px;background:${CHAMPAGNE};border:1px solid ${GOLD};color:${INK};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;">
            Commission Structure
          </th>
        </tr>
        <tr style="background:${CHAMPAGNE};">
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Tier</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Rate</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Payout Trigger</th>
          <th style="padding:7px 12px;border:1px solid ${GOLD}33;font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:${INK};text-align:left;">Notes</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

export function signatureBlock(opts: {
  ownerName?: string;
  ownerTitle?: string;
  applicantName?: string;
  applicantLabel?: string;
}): string {
  const oName = esc(opts.ownerName || "");
  const oTitle = esc(opts.ownerTitle || "Director");
  const aName = esc(opts.applicantName || "");
  const aLabel = esc(opts.applicantLabel || "Accepted by Applicant");
  const date = todayLong();

  const cell = (heading: string, name: string, secondLabel: string, secondValue: string) => `
    <td style="width:50%;vertical-align:top;padding:0 8px;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:46px;font-weight:600;">${heading}</div>
      <div style="border-top:1px solid ${INK};padding-top:6px;">
        <div style="font-size:11px;color:${INK};"><strong>Name:</strong> ${name || "________________________"}</div>
        <div style="font-size:11px;color:${INK};margin-top:3px;"><strong>${secondLabel}:</strong> ${secondValue}</div>
        <div style="font-size:11px;color:${INK};margin-top:3px;"><strong>Date:</strong> ____________________</div>
      </div>
    </td>`;

  return `
    <div style="margin-top:36px;page-break-inside:avoid;">
      <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          <tr>
            ${cell("For JBJ GLOBAL REAL ESTATE", oName, "Title", oTitle)}
            ${cell(aLabel, aName, "ID", "____________________")}
          </tr>
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:10px;color:${MUTED};text-align:right;">Issued: ${date}</div>
    </div>`;
}

export function recipientBlock(fields: Record<string, string>): string {
  const name = esc(fields.recipientName);
  const id = esc(fields.idNumber);
  return `
    <div style="margin:8px 0 18px;font-size:12px;color:${INK};line-height:1.6;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:3px;">To</div>
      <div style="font-weight:600;">${name || "—"}</div>
      ${id ? `<div style="color:${MUTED};">ID / Passport: ${id}</div>` : ""}
    </div>`;
}

export function dateLine(): string {
  return `<div style="text-align:right;font-size:11px;color:${MUTED};margin-bottom:6px;">${todayLong()}</div>`;
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
    ["Start Date", f.startDate],
    ["Probation Period", f.probation],
    ["Working Hours", f.workingHours],
    ["Annual Leave", f.annualLeave],
    ["Notice Period", f.noticePeriod],
    ["Base Salary", f.salary],
    ["Allowances", f.allowances],
    ["Benefits", f.benefits],
    ...customRows,
  ];

  return [
    dateLine(),
    recipientBlock(f),
    subjectLine(`Offer of Employment — ${f.jobTitle || "Position"}`),
    paragraphs(input.aiIntro),
    termsTable(termsRows),
    commissionTable(input.commissionRows || []),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle || "Director",
      applicantName: f.recipientName,
      applicantLabel: "Accepted by Applicant",
    }),
  ].join("");
}

function composeGeneric(input: ComposerInput, subject: string): string {
  const f = input.fields;
  const rows: Array<[string, string | undefined]> = [
    ...Object.entries(f).map(([k, v]) => [labelize(k), v] as [string, string | undefined]),
    ...(input.customFields || [])
      .filter((c) => (c.label || "").trim() && (c.value || "").trim())
      .map((c) => [c.label, c.value] as [string, string | undefined]),
  ].filter(([k]) => !["recipientName", "idNumber", "notes"].includes(unlabelize(k)));

  return [
    dateLine(),
    recipientBlock(f),
    subjectLine(subject),
    paragraphs(input.aiIntro),
    termsTable(rows),
    commissionTable(input.commissionRows || []),
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle || "Director",
      applicantName: f.recipientName,
      applicantLabel: "Counterparty Signature",
    }),
  ].join("");
}

function labelize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}
function unlabelize(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1).replace(/\s+(.)/g, (_, c) => c.toUpperCase());
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
    case "nda":
      return composeGeneric(input, `Non-Disclosure Agreement`);
    case "commission_agreement":
      return composeGeneric(input, `Commission Agreement — ${input.fields.recipientName || ""}`);
    case "internship_agreement":
      return composeGeneric(input, `Internship Agreement — ${input.fields.recipientName || ""}`);
    case "hr_letter":
      return composeGeneric(input, `HR Letter — ${input.fields.recipientName || ""}`);
    case "partnership_referral":
      return composeGeneric(input, `Partnership / Referral Agreement`);
    case "form_a":
      return composeGeneric(input, `Form A — Buyer Registration`);
    case "form_f":
      return composeGeneric(input, `Form F — MoU`);
    case "form_i":
      return composeGeneric(input, `Form I — Cancellation`);
    case "paa":
      return composeGeneric(input, `Property Advertising Agreement`);
    case "tenancy_addendum":
      return composeGeneric(input, `Tenancy Contract Addendum`);
    default:
      return composeGeneric(input, input.fields.subject || "Document");
  }
}

/** Pre-seeded commission rows for HR/broker offers. */
export const DEFAULT_BROKER_COMMISSIONS: CommissionRow[] = [
  { label: "Direct deals", rate: "", trigger: "On collected commission", notes: "" },
  { label: "Company-sourced leads", rate: "", trigger: "On collected commission", notes: "" },
];
