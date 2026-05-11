// Shared premium champagne/gold email shell for e-signature emails.
// Used by esign-complete-envelope and esign-send-signer-thanks.

export function premiumShell(innerHtml: string, docNumber: string = ""): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-radius:14px 14px 0 0;padding:22px 28px;border-bottom:none;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td style="font-size:20px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</td>
            <td align="right" style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;">${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}</td>
          </tr></table>
          <div style="height:1px;background:#B89555;margin-top:14px;"></div>
        </td></tr>
        <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:36px;">${innerHtml}</td></tr>
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;border-radius:0 0 14px 14px;padding:18px 28px;">
          <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;"><tr>
            <td style="opacity:.85;"><strong style="letter-spacing:.14em;">JBJ GLOBAL REAL ESTATE</strong><br/><span style="opacity:.7;">Private Office · Dubai, UAE</span></td>
            <td align="center" style="opacity:.85;">CONTACT@JBJ.AE<br/>WWW.JBJ.AE</td>
            <td align="right" style="opacity:.85;">+971 54 716 7107</td>
          </tr></table>
        </td></tr>
        <tr><td style="text-align:center;padding-top:14px;font-size:11px;color:#1A1A1A;opacity:.55;">© ${new Date().getFullYear()} JBJ Global Real Estate · Electronically signed &amp; legally binding</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function actionButtons(opts: {
  viewUrl: string;
  signedPdfUrl?: string | null;
  certificateUrl?: string | null;
}): string {
  const { viewUrl, signedPdfUrl, certificateUrl } = opts;
  return `
      <div style="text-align:center;margin:32px 0 12px;">
        <a href="${viewUrl}" style="display:inline-block;background:#1A1A1A;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:.06em;border:1px solid #B89555;">VIEW SIGNED DOCUMENT</a>
      </div>
      ${signedPdfUrl ? `<div style="text-align:center;margin-top:8px;">
        <a href="${signedPdfUrl}" style="display:inline-block;background:#FDFBF7;color:#1A1A1A;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:.06em;border:1px solid #B89555;">⬇ DOWNLOAD SIGNED PDF</a>
      </div>` : ""}
      ${certificateUrl ? `<div style="text-align:center;margin-top:8px;">
        <a href="${certificateUrl}" style="display:inline-block;background:#FDFBF7;color:#1A1A1A;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:.06em;border:1px solid #B89555;">📋 DOWNLOAD AUDIT CERTIFICATE</a>
      </div>` : ""}`;
}
