/**
 * Shared premium branded email template for meeting bookings.
 * Used by submit-meeting-booking, meeting-booking-action, and process-meeting-reminders.
 *
 * Design constraints:
 *  - Champagne header band + JBJ wordmark
 *  - Status ticket pill (gold/ink — never grey)
 *  - Gold footer rule + "Warm regards, JBJ Global Real Estate Team" in gold
 *  - All links point to https://www.jbj.ae — never lovable.app / lovable.dev
 */

const SITE = "https://www.jbj.ae";
const BRAND = "JBJ GLOBAL REAL ESTATE";
const GOLD = "#B89555";
const INK = "#1A1A1A";
const CHAMPAGNE = "#F7F2EA";
const PAGE = "#FDFBF7";
const CREAM = "#EFE6D6";

export function htmlEscape(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export interface BrandedEmailOptions {
  preheader?: string;
  title: string;
  status: "RECEIVED" | "PENDING" | "APPROVED" | "DECLINED" | "RESCHEDULED" | "REMINDER";
  greeting: string;
  intro: string;
  detailRows?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaUrl?: string;
  closing?: string;
  ownerControls?: { approveUrl: string; declineUrl: string; rescheduleUrl: string }; // owner email only
  ownerNotes?: string; // raw HTML allowed (escaped at call site if user-supplied)
}

function statusPill(status: string): string {
  // gold ring + ink text on cream; never grey
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${CREAM};border:1px solid ${GOLD};color:${INK};font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;">${status}</span>`;
}

export function renderBrandedEmail(o: BrandedEmailOptions): string {
  const detail = (o.detailRows ?? [])
    .map(
      (r) =>
        `<tr><td style="padding:6px 0;color:${INK};font-size:13px;width:38%;"><strong>${htmlEscape(r.label)}</strong></td><td style="padding:6px 0;color:${INK};font-size:13px;">${htmlEscape(r.value)}</td></tr>`,
    )
    .join("");

  const cta =
    o.ctaText && o.ctaUrl
      ? `<div style="text-align:center;margin:28px 0 8px;">
           <a href="${o.ctaUrl}" style="display:inline-block;padding:13px 28px;background:${INK};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;letter-spacing:.04em;border:1px solid ${GOLD};">${htmlEscape(o.ctaText)}</a>
         </div>`
      : "";

  const ownerCtl = o.ownerControls
    ? `<div style="margin:24px 0;padding:16px;background:${PAGE};border:1px solid ${GOLD}33;border-radius:12px;">
         <p style="margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.16em;color:${GOLD};">Your decision</p>
         <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;"><tr>
           <td style="padding:4px;"><a href="${o.ownerControls.approveUrl}" style="display:block;text-align:center;padding:12px;background:${INK};color:#ffffff;text-decoration:none;border-radius:8px;border:1px solid ${GOLD};font-size:13px;">✓ Approve</a></td>
           <td style="padding:4px;"><a href="${o.ownerControls.rescheduleUrl}" style="display:block;text-align:center;padding:12px;background:${CREAM};color:${INK};text-decoration:none;border-radius:8px;border:1px solid ${GOLD};font-size:13px;">↻ Reschedule</a></td>
           <td style="padding:4px;"><a href="${o.ownerControls.declineUrl}" style="display:block;text-align:center;padding:12px;background:#ffffff;color:${INK};text-decoration:none;border-radius:8px;border:1px solid ${GOLD};font-size:13px;">✕ Decline</a></td>
         </tr></table>
         <p style="margin:10px 0 0;font-size:11px;color:${INK}99;text-align:center;">Each link is signed — only valid once.</p>
       </div>`
    : "";

  const ownerNotesBlock = o.ownerNotes
    ? `<div style="margin:16px 0;padding:14px;background:${CHAMPAGNE};border-radius:10px;border-left:3px solid ${GOLD};font-size:13px;color:${INK};line-height:1.55;">${o.ownerNotes}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${htmlEscape(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};font-family:Inter,Arial,sans-serif;color:${INK};">
${o.preheader ? `<div style="display:none;opacity:0;max-height:0;overflow:hidden;">${htmlEscape(o.preheader)}</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${PAGE};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border:1px solid ${GOLD}33;border-radius:16px;overflow:hidden;">

      <!-- HEADER -->
      <tr><td style="background:${CHAMPAGNE};padding:22px 28px;border-bottom:1px solid ${GOLD}55;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <div style="font-family:'Times New Roman',Georgia,serif;font-size:18px;letter-spacing:.18em;color:${INK};font-weight:600;">JBJ</div>
              <div style="font-size:10px;letter-spacing:.32em;color:${GOLD};margin-top:2px;">GLOBAL REAL ESTATE</div>
            </td>
            <td align="right" style="vertical-align:middle;">${statusPill(o.status)}</td>
          </tr>
        </table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:32px 28px 12px;">
        <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${INK};font-weight:600;">${htmlEscape(o.title)}</h1>
        <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:${INK};">${htmlEscape(o.greeting)}</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${INK};">${htmlEscape(o.intro)}</p>

        ${ownerNotesBlock}

        ${
          detail
            ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 4px;background:${CHAMPAGNE};border:1px solid ${GOLD}33;border-radius:12px;padding:0;">
                 <tr><td style="padding:14px 18px;"><table style="width:100%;border-collapse:collapse;">${detail}</table></td></tr>
               </table>`
            : ""
        }

        ${cta}
        ${ownerCtl}

        ${o.closing ? `<p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:${INK};">${htmlEscape(o.closing)}</p>` : ""}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:8px 28px 28px;">
        <div style="height:1px;background:${GOLD};opacity:.5;margin:18px 0;"></div>
        <p style="margin:0;font-size:14px;color:${GOLD};font-weight:600;">Warm regards,</p>
        <p style="margin:2px 0 14px;font-size:14px;color:${GOLD};font-weight:600;">The ${BRAND} Team</p>
        <p style="margin:0;font-size:11px;color:${INK}99;line-height:1.6;">
          ${BRAND}<br>
          Dubai, United Arab Emirates · <a href="${SITE}" style="color:${INK};text-decoration:underline;text-decoration-color:${GOLD};">www.jbj.ae</a>
        </p>
        <p style="margin:10px 0 0;font-size:10px;color:${INK}66;">This message was sent because you submitted a meeting request at ${SITE}/book.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}

export function statusLabel(s: string): string {
  return ({
    received: "RECEIVED",
    pending: "PENDING",
    approved: "APPROVED",
    declined: "DECLINED",
    rescheduled: "RESCHEDULED",
  } as Record<string, BrandedEmailOptions["status"]>)[s] ?? "PENDING";
}

export const BRAND_NAME = BRAND;
export const SITE_URL = SITE;
