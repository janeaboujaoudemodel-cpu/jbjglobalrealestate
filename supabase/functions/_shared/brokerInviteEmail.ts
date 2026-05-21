// Branded JBJ broker invitation email — champagne/gold/black/white only.
// One unified rounded container, premium header with monogram, Outlook-safe inline CSS.
import { wrapEmailHtml } from "./email-shell.ts";

const MONOGRAM_URL = "https://jbj.ae/jbj-monogram-dark-on-light.png";

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
  // Cleaner, less spam-pattern subject. Personalised + short = better Gmail inboxing.
  const firstName = (i.brokerName || "there").split(/\s+/)[0];
  const subject = `${firstName}, your JBJ broker access — code ${i.otp}`;
  const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #B89555;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(26,26,26,0.06);font-family:'Inter','Helvetica Neue',Arial,sans-serif">
  <tr>
    <td align="center" style="padding:36px 40px 24px;background:#F7F2EA;border-bottom:1px solid rgba(184,149,85,0.45)">
      <img src="${MONOGRAM_URL}" alt="JBJ" width="56" height="56" style="display:block;margin:0 auto 14px;border:0;outline:none" />
      <div style="font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#1A1A1A">JBJ Global Real Estate</div>
      <div style="height:1px;width:42px;background:#B89555;margin:14px auto 0"></div>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 44px 8px;color:#1A1A1A">
      <div style="font-size:22px;font-weight:600;letter-spacing:-0.01em;margin:0 0 18px">Broker Access Invitation</div>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#1A1A1A">Dear ${escapeHtml(i.brokerName)},</p>
      <p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#1A1A1A">${escapeHtml(i.ownerName)} has granted you secure access to the JBJ Global Real Estate broker CRM. To activate your account, verify the one-time passcode below and set your private password.</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:26px 44px 8px">
      <div style="display:inline-block;padding:20px 38px;background:#EFE6D6;border:1px solid #B89555;border-radius:12px;font-size:30px;letter-spacing:.6em;font-weight:600;color:#1A1A1A">${i.otp}</div>
      <div style="font-size:11px;color:#1A1A1A;opacity:.65;margin-top:12px;letter-spacing:.2em;text-transform:uppercase">Expires in ${i.expiresInMinutes} minutes</div>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:22px 44px 8px">
      <a href="${i.activationUrl}" style="display:inline-block;padding:14px 32px;background:#EFE6D6;color:#1A1A1A;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:.04em;border-radius:10px;border:1px solid #B89555">Activate broker access</a>
      <div style="font-size:11px;color:#1A1A1A;opacity:.55;margin-top:14px;word-break:break-all;line-height:1.5">${i.activationUrl}</div>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 44px 8px">
      <div style="height:1px;background:rgba(184,149,85,0.45);margin:0 0 16px"></div>
      <p style="margin:0;font-size:12px;line-height:1.7;color:#1A1A1A;opacity:.7">For your security, this passcode and link can only be used once. If you did not expect this invitation, you can safely ignore this email — no account will be created without your action.</p>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:22px 44px 30px;background:#FDFBF7;color:#1A1A1A;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;opacity:.55">
      JBJ Global Real Estate L.L.C S.O.C &nbsp;&middot;&nbsp; jbj.ae
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
