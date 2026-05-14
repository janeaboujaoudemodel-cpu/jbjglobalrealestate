// Shared premium champagne/gold email shell for e-signature emails.
// Used by esign-complete-envelope (owner notification) and
// esign-send-signer-thanks (client notification).

export function premiumShell(innerHtml: string, docNumber: string = ""): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  .jbj-wordmark{font-size:16px;letter-spacing:.18em;}
  @media (max-width:520px){
    .jbj-foot-col{display:block !important;width:100% !important;text-align:center !important;padding:6px 0 !important;}
    .jbj-wordmark{font-size:13px;letter-spacing:.12em !important;}
  }
</style></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;">
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-radius:14px 14px 0 0;padding:22px 28px;border-bottom:none;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td class="jbj-wordmark" style="font-weight:700;color:#1A1A1A;white-space:nowrap;">JBJ GLOBAL REAL ESTATE</td>
            <td align="right" style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;white-space:nowrap;">${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}</td>
          </tr></table>
          <div style="height:1px;background:#B89555;margin-top:14px;"></div>
        </td></tr>
        <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:36px;">${innerHtml}</td></tr>
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;border-radius:0 0 14px 14px;padding:18px 28px;">
          <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;line-height:1.7;"><tr>
            <td class="jbj-foot-col" style="width:42%;vertical-align:top;">
              <div style="font-weight:700;letter-spacing:.14em;white-space:nowrap;">JBJ GLOBAL REAL ESTATE</div>
              <div style="opacity:.7;">Dubai, UAE</div>
            </td>
            <td align="center" class="jbj-foot-col" style="width:32%;vertical-align:top;">
              <div><a href="mailto:contact@jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;">CONTACT@JBJ.AE</a></div>
              <div><a href="https://www.jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;">WWW.JBJ.AE</a></div>
            </td>
            <td align="right" class="jbj-foot-col" style="width:26%;vertical-align:top;">
              <div><a href="tel:+971547167107" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;white-space:nowrap;">+971&nbsp;54&nbsp;716&nbsp;7107</a></div>
            </td>
          </tr></table>
          <div style="text-align:center;font-size:10.5px;color:#1A1A1A;opacity:.55;letter-spacing:.04em;margin-top:14px;">© ${year} JBJ GLOBAL REAL ESTATE</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Owner-only action buttons. NEVER include in client-facing emails — these
 *  link into the private owner backend. */
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
