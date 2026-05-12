// Shared renderer for the JBJ-branded e-signature cover email.
// Used by esign-send-for-signature and esign-send-test-email so the test
// inbox, the live preview iframe, and the real recipient inbox all see
// byte-for-byte the same HTML. NO signing button — DocuSign handles signing.

export const JBJ_LOGO_URL = "https://www.jbj.ae/jbj-monogram-dark-on-light.png";

export const DOCUSIGN_APP_STORE = "https://apps.apple.com/app/docusign/id474990205";
export const DOCUSIGN_PLAY_STORE = "https://play.google.com/store/apps/details?id=com.docusign.ink";
export const DOCUSIGN_WEB = "https://apps.docusign.com/";
export const SIGNED_RETURN_EMAIL = "contracts@jbj.ae";

export interface BuildEnvelopeEmailArgs {
  subject: string;          // already interpolated, plain text
  bodyHtml: string;         // already interpolated, sanitized HTML (recipient-ready)
  docNumber?: string;
  senderName?: string;
  senderTitle?: string;
  year?: number;
  /** Optional DocuSign envelope URL — when present, a CTA button is rendered. */
  docusignUrl?: string;
  /** Attachment filename shown in the "PDF attached" chip. */
  attachmentName?: string;
}

export function buildSenderSignatureHtml(senderName: string, senderTitle: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:6px;">
    <span style="font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:28px;color:#1A1A1A;letter-spacing:.01em;line-height:1;">${escapeHtml(senderName)}</span>
  </td></tr>
  <tr><td style="padding:6px 0 12px;"><div style="width:72px;height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  <tr><td style="font-size:10.5px;font-weight:500;letter-spacing:.16em;color:#1A1A1A;text-transform:uppercase;padding-bottom:8px;">${escapeHtml(senderTitle)}</td></tr>
  <tr><td style="font-size:11px;font-weight:700;letter-spacing:.22em;color:#1A1A1A;text-transform:uppercase;padding-bottom:3px;">JBJ GLOBAL REAL ESTATE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">Downtown Dubai, UAE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">CONTACT@JBJ.AE &nbsp;·&nbsp; +971 54 716 7107</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;">WWW.JBJ.AE</td></tr>
</table>`;
}

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEnvelopeEmailHtml(args: BuildEnvelopeEmailArgs): string {
  const subject = escapeHtml(args.subject || "");
  const bodyHtml = args.bodyHtml || "";
  const docNumber = args.docNumber ? escapeHtml(args.docNumber) : "";
  const year = args.year ?? new Date().getFullYear();
  const docusignUrl = (args.docusignUrl || "").trim();
  const attachmentName = args.attachmentName ? escapeHtml(args.attachmentName) : "";

  const ctaBlock = docusignUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px;border-collapse:collapse;">
          <tr><td align="center" style="border-radius:2px;background:#1A1A1A;">
            <a href="${escapeHtml(docusignUrl)}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.22em;color:#FDFBF7;text-decoration:none;text-transform:uppercase;border:1px solid #B89555;">
              OPEN IN DOCUSIGN &nbsp;→
            </a>
          </td></tr>
          <tr><td align="center" style="padding-top:10px;font-size:11px;color:#1A1A1A;opacity:.65;line-height:1.5;font-family:Inter,Arial,sans-serif;">
            DocuSign is the only e-signature platform officially recognised by UAE authorities.<br/>
            Don't have the app? <a href="${DOCUSIGN_APP_STORE}" style="color:#1A1A1A;">App Store</a> · <a href="${DOCUSIGN_PLAY_STORE}" style="color:#1A1A1A;">Google Play</a>
          </td></tr>
        </table>` : "";

  const attachmentChip = attachmentName ? `
        <div style="margin:18px 0 0;padding:10px 12px;border:1px solid #B89555;background:#F7F2EA;display:inline-block;font-family:Inter,Arial,sans-serif;font-size:11.5px;color:#1A1A1A;letter-spacing:.04em;">
          📎 &nbsp;PDF attached: <strong>${attachmentName}</strong>
        </div>` : "";

  const footerNote = docusignUrl
    ? `Tap the button above to open the agreement in DocuSign and complete the signature. Once signed, a copy will be returned to ${SIGNED_RETURN_EMAIL}.`
    : `The signed agreement is attached as a PDF. A separate signing request will be delivered to you via DocuSign — once signed, please return the signed copy to ${SIGNED_RETURN_EMAIL}.`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;">
      <!-- Header with monogram -->
      <tr><td style="background:#F7F2EA;border:1px solid #B89555;padding:20px 24px;border-bottom:none;">
        <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
          <td style="vertical-align:middle;width:64px;padding-right:14px;">
            <img src="${JBJ_LOGO_URL}" alt="JBJ" width="56" height="56" style="display:block;border:0;outline:none;height:56px;width:56px;"/>
          </td>
          <td style="vertical-align:middle;font-size:18px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;line-height:1.2;">
            JBJ GLOBAL REAL ESTATE
          </td>
          <td align="right" style="vertical-align:middle;font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;white-space:nowrap;">
            ${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}
          </td>
        </tr></table>
        <div style="height:1px;background:#B89555;margin-top:14px;"></div>
      </td></tr>
      <!-- Body -->
      <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:32px 32px 24px;">
        <h2 style="margin:0 0 18px;color:#1A1A1A;font-size:20px;font-weight:700;line-height:1.3;">${subject}</h2>
        <div style="color:#1A1A1A;line-height:1.7;font-size:14px;">${bodyHtml}</div>
        ${ctaBlock}
        ${attachmentChip}
        <p style="margin:24px 0 0;color:#1A1A1A;opacity:.6;font-size:11px;line-height:1.55;">${footerNote}</p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;padding:18px 24px;">
        <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;line-height:1.55;"><tr>
          <td style="width:42%;vertical-align:top;">
            <div style="font-weight:700;letter-spacing:.14em;white-space:nowrap;">JBJ GLOBAL REAL ESTATE</div>
            <div style="opacity:.7;white-space:nowrap;">Downtown Dubai, UAE</div>
          </td>
          <td align="center" style="width:32%;vertical-align:top;">
            <div style="white-space:nowrap;"><a href="mailto:contact@jbj.ae" style="color:#1A1A1A;text-decoration:none;">CONTACT@JBJ.AE</a></div>
            <div style="white-space:nowrap;"><a href="https://www.jbj.ae" style="color:#1A1A1A;text-decoration:none;">WWW.JBJ.AE</a></div>
          </td>
          <td align="right" style="width:26%;vertical-align:top;">
            <div style="white-space:nowrap;"><a href="tel:+971547167107" style="color:#1A1A1A;text-decoration:none;">+971&nbsp;54&nbsp;716&nbsp;7107</a></div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="text-align:center;padding-top:14px;font-size:11px;color:#1A1A1A;opacity:.55;">© ${year} JBJ Global Real Estate</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
