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
  const aLabel = esc(opts.applicantLabel || "Accepted by Applicant");

  const row = (label: string, value: string, fallbackDots = true) => `
    <div style="font-size:11px;color:${INK};margin-top:4px;">
      <strong style="font-weight:600;">${label}:</strong>
      <span style="margin-left:4px;">${value || (fallbackDots ? "____________________" : "")}</span>
    </div>`;

  const stampOverlay = `
    <img src="${jbjCompanyStampSrc}" alt="JBJ Company Stamp" aria-hidden="true"
      style="position:absolute;right:-6px;bottom:-6px;width:118px;height:118px;
             object-fit:contain;opacity:0.92;mix-blend-mode:multiply;
             transform:rotate(-6deg);pointer-events:none;user-select:none;" />`;

  const cell = (sigId: string, heading: string, lines: string, withStamp = false) => `
    <td data-sig-id="${sigId}" style="width:44%;vertical-align:top;padding:0 28px;position:relative;">
      <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};margin-bottom:36px;font-weight:600;">${heading}</div>
      <div style="border-top:1px solid ${INK};padding-top:10px;position:relative;min-height:120px;">
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

  const applicantLines = [
    row("Name", aName),
    row("Date", aDate),
  ].join("");

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

  return `
    <div data-signature-block="1" data-pdf-section="signature" style="margin-top:36px;page-break-inside:avoid;break-inside:avoid;">
      <table style="width:100%;border-collapse:collapse;font-family:Inter,system-ui,sans-serif;">
        <tbody>
          <tr>
            ${cell("owner", "JBJ GLOBAL REAL ESTATE", ownerLines, true)}
            ${gapCell}
            ${cell("recipient", aLabel, applicantLines)}
          </tr>
          ${extraRows.join("")}
        </tbody>
      </table>
    </div>`;
}

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

export function dateLine(custom?: string): string {
  return `<div style="text-align:right;font-size:11px;color:${MUTED};margin:24px 0 18px;">${esc(formatHumanDate(custom) || todayLong())}</div>`;
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

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f, { greeting: true }),
    subjectLine(`Offer of Employment${f.jobTitle ? ` — ${f.jobTitle}` : ""}`),
    paragraphs(input.aiIntro),
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

function composeGeneric(input: ComposerInput, subject: string): string {
  const f = input.fields;
  const rows: Array<[string, string | undefined]> = [
    ...Object.entries(f).map(([k, v]) => [labelize(k), v] as [string, string | undefined]),
    ...(input.customFields || [])
      .filter((c) => (c.label || "").trim() && (c.value || "").trim())
      .map((c) => [c.label, c.value] as [string, string | undefined]),
  ].filter(([k]) => !["recipientName", "idNumber", "notes"].includes(unlabelize(k)));

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    recipientBlock(f),
    subjectLine(subject),
    paragraphs(input.aiIntro),
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

  const guestName = esc(f.recipientName || "Valued Guest");
  const greeting = `
    <div style="margin:8px 0 16px;font-size:12.5px;color:${INK};line-height:1.7;">
      <p style="margin:0 0 10px;">Dear ${guestName},</p>
      <p style="margin:0 0 10px;"><strong>Greetings from JBJ GLOBAL REAL ESTATE.</strong> Thank you for choosing our residence for your stay — it is our privilege to host you.</p>
      <p style="margin:0 0 10px;">We sincerely hope you enjoy your time with us. Please find your full booking details, itemised quotation and the binding terms of your reservation below.</p>
    </div>`;

  const summaryHeading = `
    <div style="margin:14px 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;">
      Booking Details
    </div>`;

  // Pre-filled premium T&Cs — NON-refundable, JBJ liability fully waived,
  // strengthened damage / overstay / guest-conduct / policy-adherence clauses.
  const terms = `
    <div style="margin:18px 0 8px;">
      <div data-pdf-section="terms-heading" style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${INK};font-weight:600;border-bottom:1px solid ${GOLD};padding-bottom:6px;margin-bottom:10px;page-break-after:avoid;break-after:avoid;">
        Terms &amp; Conditions — Guest Declaration
      </div>
      <ol style="margin:0;padding-left:20px;font-size:11.5px;line-height:1.7;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Non-Refundable Booking.</strong> The Guest acknowledges that the total amount paid above is <strong>strictly non-refundable</strong> under any circumstances, including but not limited to cancellation, no-show, early check-out, travel disruption, visa issues, illness, change of plans or force-majeure events. The unit has been reserved and removed from public availability solely for the Guest.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>No Refund · No Credit.</strong> No partial refund, monetary credit, date change, transfer, or substitution will be issued once payment is received. The Guest expressly waives any right to claim a refund.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Full Release of Liability.</strong> The Guest hereby <strong>fully releases, indemnifies and holds harmless JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>, its owners, officers, employees, agents and affiliates from any and all liability, claims, damages, losses, theft, personal injury, property damage, illness, or any consequential loss arising before, during or after the stay. JBJ GLOBAL REAL ESTATE acts solely as a booking facilitator and assumes <strong>no responsibility</strong> for the condition, suitability, services, utilities, neighbours, building management, or any incident occurring on the premises.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Damage &amp; Property Condition.</strong> The Guest is <strong>fully liable for the full cost of repair or replacement</strong> of any damage, breakage, loss or theft affecting the unit, furniture, appliances, fixtures, finishes or common areas — whether caused by the Guest, their co-occupants, their visitors, or any person admitted by the Guest. Damages are charged at full market / replacement cost <strong>plus a 15% handling fee</strong>, deducted from the security deposit and, where insufficient, invoiced separately and payable within seven (7) days.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Overstay &amp; Unauthorised Occupation.</strong> If the Guest fails to vacate at the agreed check-out time without prior written extension, the Guest shall pay (i) <strong>AED 1,500 per day or 2× the nightly rate, whichever is higher</strong>, as liquidated damages, and (ii) all legal, eviction, locksmith and enforcement costs. The Guest <strong>expressly consents to JBJ initiating eviction, police and Dubai Courts proceedings</strong>, and acknowledges that overstaying constitutes unlawful occupation under UAE law.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Conduct of Guests &amp; Visitors.</strong> The Guest is <strong>fully responsible for the conduct, safety and compliance of every co-occupant and visitor</strong> admitted to the property, and indemnifies JBJ against any claim arising from their actions. Maximum occupancy stated above may not be exceeded; subletting, re-listing or commercial use is strictly prohibited.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>House Rules &amp; Policy Adherence.</strong> The Guest agrees to <strong>read, respect and abide by all house rules, building by-laws, community regulations and UAE laws</strong> at all times. No parties, no events, no smoking indoors, no unregistered guests, no pets unless explicitly approved in writing. Quiet hours 10:00 PM – 8:00 AM. Violations result in immediate eviction with no refund and full liability for any resulting damages.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Check-in / Check-out.</strong> Check-in 3:00 PM · Check-out 12:00 PM. Late check-out is charged at one (1) additional night. Keys must be returned in person or via the secure key-box. Lost keys / access cards are charged at cost.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Security Deposit.</strong> A refundable security deposit (where collected) is returned within fourteen (14) days post check-out subject to inspection and deduction of any damages, missing items, cleaning fees or unpaid charges.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This Agreement is governed by the laws of the United Arab Emirates and the Emirate of Dubai. Any dispute is subject to the exclusive jurisdiction of Dubai Courts.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Acknowledgement.</strong> By signing below, the Guest confirms they have <strong>read, understood and accepted</strong> all terms above, and that payment has been made <strong>voluntarily and irrevocably</strong>.</li>
      </ol>
    </div>`;


  // Final guest acknowledgement — name synced live from the left-rail input.
  const guestLegalName = esc((f.recipientName || "").trim() || "[Guest Full Name]");
  const acknowledgement = `
    <div data-pdf-section="acknowledgement" style="margin:18px 0 6px;padding:14px 16px;border:1px solid ${GOLD};background:${CHAMPAGNE};page-break-inside:avoid;break-inside:avoid;">
      <p style="margin:0;font-size:12px;line-height:1.7;color:${INK};">
        I, <strong>${guestLegalName}</strong>, hereby agree to all the terms and conditions provided by
        <strong>JBJ GLOBAL REAL ESTATE L.L.C — S.O.C</strong>. I confirm that I have fully read and understood
        every clause above, that I am <strong>solely responsible</strong> for reading and understanding them,
        and that I sign below with my <strong>full, free and informed decision and consent</strong>.
      </p>
    </div>`;

  return [
    input.hideLetterDate ? "" : dateLine(input.letterDate),
    subjectLine(`Holiday Home Booking Agreement — ${bookingId}`),
    greeting,
    summaryHeading,
    termsTable(summaryRows),
    quotation,
    terms,
    acknowledgement,
    paragraphs(input.aiClosing),
    signatureBlock({
      ownerName: input.ownerName,
      ownerTitle: input.ownerTitle,
      ownerDate: input.ownerDate,
      applicantName: f.recipientName,
      applicantDate: input.applicantDate,
      applicantLabel: "Client Signature",
      extraSignatories: input.extraSignatories,
    }),
  ].join("");
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
      <ol style="margin:0;padding-left:20px;font-size:11.5px;line-height:1.7;color:${INK};">
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Appointment.</strong> The Client appoints JBJ GLOBAL REAL ESTATE L.L.C — S.O.C as the exclusive facility manager of the Property for the term stated above.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Services.</strong> Services are delivered as per the Scope above, in accordance with industry best practices and UAE regulations.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Fees &amp; Payment.</strong> The monthly management fee is due in advance per the Payment Terms. Late payments accrue 2% per month. Out-of-scope works are quoted separately and require written approval before commencement.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Vendor Coordination.</strong> JBJ coordinates third-party vendors (cleaning, MEP, security) on the Client's behalf. The Client remains responsible for vendor fees at cost plus any agreed management margin.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Reporting.</strong> Monthly performance reports including financials, maintenance tickets and SLA compliance are issued within seven (7) business days of month-end.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Liability.</strong> JBJ's aggregate liability is capped at three (3) months' management fees. JBJ is not liable for force-majeure events, pre-existing defects, or acts of third-party vendors beyond reasonable supervision.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Term &amp; Termination.</strong> Either party may terminate with sixty (60) days' written notice. Outstanding fees and reimbursables remain payable upon termination.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Confidentiality.</strong> Both parties maintain strict confidentiality of commercial and tenant information shared during the engagement.</li>
        <li data-pdf-section="term" style="margin-bottom:6px;page-break-inside:avoid;break-inside:avoid;"><strong>Governing Law.</strong> This Agreement is governed by the laws of the UAE and the Emirate of Dubai. Disputes fall under the exclusive jurisdiction of Dubai Courts.</li>
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
    case "commission_invoice":
      return composeCommissionInvoice(input);
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
    case "holiday_home_agreement":
      return composeHolidayHome(input);
    case "facility_management_agreement":
      return composeFacilityManagement(input);
    default:
      return composeGeneric(input, input.fields.subject || "Document");
  }
}


/** Pre-seeded commission rows for HR/broker offers. */
export const DEFAULT_BROKER_COMMISSIONS: CommissionRow[] = [
  { label: "Direct deals", rate: "", trigger: "Paid after the firm receives cleared commission", notes: "" },
  { label: "Company-sourced leads", rate: "", trigger: "Paid after the firm receives cleared commission", notes: "" },
];
