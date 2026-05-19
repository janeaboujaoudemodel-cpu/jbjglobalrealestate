// Branded JBJ broker invitation email — champagne/gold/black/white only.
// Outlook-safe table layout, inline CSS. Goes through `wrapEmailHtml`.
import { wrapEmailHtml } from "./email-shell.ts";

export interface BrokerInviteEmailInput {
  brokerName: string;
  ownerName: string;
  activationUrl: string;
  otp: string;
  expiresInMinutes: number;
}

export function renderBrokerInviteEmail(i: BrokerInviteEmailInput): {
  subject: string;
  html: string;
} {
  const subject = `${i.ownerName} invited you to JBJ Global Real Estate CRM`;
  const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #B89555;border-radius:14px;overflow:hidden">
  <tr>
    <td style="padding:36px 40px 8px;text-align:center;border-bottom:1px solid rgba(184,149,85,0.35)">
      <div style="font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#1A1A1A;opacity:.7">JBJ Global Real Estate</div>
      <div style="font-family:'Inter',Arial,sans-serif;font-size:22px;font-weight:600;color:#1A1A1A;margin-top:14px">Broker Access Invitation</div>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 8px;font-family:'Inter',Arial,sans-serif;color:#1A1A1A;font-size:15px;line-height:1.6">
      <p style="margin:0 0 14px">Dear ${escapeHtml(i.brokerName)},</p>
      <p style="margin:0 0 14px">${escapeHtml(i.ownerName)} has granted you secure access to the JBJ Global Real Estate broker CRM. To activate your account, verify the one-time passcode below and set your private password.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 40px 16px;text-align:center">
      <div style="display:inline-block;padding:18px 36px;background:#FDFBF7;border:1px solid #B89555;border-radius:10px;font-family:'Inter',Arial,sans-serif;font-size:30px;letter-spacing:.6em;font-weight:600;color:#1A1A1A">${i.otp}</div>
      <div style="font-family:'Inter',Arial,sans-serif;font-size:11px;color:#1A1A1A;opacity:.65;margin-top:10px;letter-spacing:.18em;text-transform:uppercase">Expires in ${i.expiresInMinutes} minutes</div>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 40px 28px;text-align:center">
      <a href="${i.activationUrl}" style="display:inline-block;padding:14px 30px;background:#1A1A1A;color:#FFFFFF;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.04em;border-radius:10px;border:1px solid #B89555">Activate broker access</a>
      <div style="font-family:'Inter',Arial,sans-serif;font-size:12px;color:#1A1A1A;opacity:.65;margin-top:14px;word-break:break-all">${i.activationUrl}</div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 28px;font-family:'Inter',Arial,sans-serif;color:#1A1A1A;opacity:.7;font-size:12px;line-height:1.6;border-top:1px solid rgba(184,149,85,0.35);padding-top:18px">
      For your security, this passcode and link can only be used once. If you did not expect this invitation, you can safely ignore this email — no account will be created without your action.
    </td>
  </tr>
  <tr>
    <td style="padding:18px 40px 28px;text-align:center;font-family:'Inter',Arial,sans-serif;color:#1A1A1A;opacity:.5;font-size:11px;letter-spacing:.18em;text-transform:uppercase">
      JBJ Global Real Estate L.L.C S.O.C · jbj.ae
    </td>
  </tr>
</table>`;
  return {
    subject,
    html: wrapEmailHtml({
      innerHtml: inner,
      preheader: `Your JBJ broker access code: ${i.otp}`,
    }),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
