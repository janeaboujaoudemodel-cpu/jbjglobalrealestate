// Branded birthday email template — champagne ink-on-cream, 1px gold hairline.
export function birthdayEmail(opts: {
  firstName: string;
  fromName?: string;
  signatureName?: string;
  signatureRole?: string;
  unsubscribeUrl?: string;
  brandHomepage?: string;
}): { subject: string; html: string } {
  const first = (opts.firstName || "").trim() || "there";
  const sigName = opts.signatureName || "Amanda Clarke";
  const sigRole = opts.signatureRole || "Executive Assistant";
  const unsub = opts.unsubscribeUrl || "https://www.jbj.ae/unsubscribe";
  const home = opts.brandHomepage || "https://www.jbj.ae";

  const subject = `Happy birthday, ${first} — from JBJ GLOBAL REAL ESTATE`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0"
             style="background:#F7F2EA;border:1px solid rgba(184,149,85,0.35);border-radius:8px;padding:40px 36px;">
        <tr><td align="center" style="padding-bottom:18px;">
          <div style="font-size:11px;letter-spacing:0.32em;color:#1A1A1A;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</div>
          <div style="height:1px;background:#B89555;width:48px;margin:14px auto 0;"></div>
        </td></tr>

        <tr><td style="padding-top:8px;font-size:22px;line-height:1.35;font-weight:600;color:#1A1A1A;">
          Happy birthday, ${first}.
        </td></tr>

        <tr><td style="padding-top:14px;font-size:15px;line-height:1.65;color:#1A1A1A;">
          On behalf of the entire team at JBJ GLOBAL REAL ESTATE, I wanted to send a quiet note
          wishing you a wonderful day and a year ahead full of good news, sound investments,
          and time well spent with the people who matter most.
        </td></tr>

        <tr><td style="padding-top:16px;font-size:15px;line-height:1.65;color:#1A1A1A;">
          We are grateful for our relationship and remain at your service whenever you need us.
        </td></tr>

        <tr><td style="padding-top:28px;font-size:14px;line-height:1.6;color:#1A1A1A;">
          Warm regards,<br/>
          <strong style="color:#1A1A1A;">${sigName}</strong><br/>
          <span style="color:#1A1A1A;opacity:0.7;">${sigRole}, JBJ GLOBAL REAL ESTATE</span>
        </td></tr>

        <tr><td style="padding-top:28px;">
          <div style="height:1px;background:rgba(184,149,85,0.35);width:100%;"></div>
        </td></tr>

        <tr><td align="center" style="padding-top:18px;font-size:11px;color:#1A1A1A;opacity:0.7;line-height:1.6;">
          <a href="${home}" style="color:#1A1A1A;text-decoration:none;">jbj.ae</a>
          &nbsp;·&nbsp;
          <a href="${unsub}" style="color:#1A1A1A;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html };
}
