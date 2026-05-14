// Client-side mirror of supabase/functions/_shared/envelope-email-html.ts.
// MUST stay byte-for-byte identical so the in-app preview iframe renders the
// exact HTML the recipient receives. If you edit one, edit the other.

export const JBJ_LOGO_URL = "https://www.jbj.ae/jbj-monogram-dark-on-light.png";
export const DOCUSIGN_APP_STORE = "https://apps.apple.com/app/docusign/id474990205";
export const DOCUSIGN_PLAY_STORE = "https://play.google.com/store/apps/details?id=com.docusign.ink";
// account.docusign.com is the production sign-in surface — `apps.docusign.com`
// loaded into a long blank "You need to enable JavaScript" page.
export const DOCUSIGN_WEB = "https://account.docusign.com/";
export const DOCUSIGN_SIGNUP = "https://account.docusign.com/signup";
export const SIGNED_RETURN_EMAIL = "contact@jbj.ae";

export interface BuildEnvelopeEmailArgs {
  subject: string;
  bodyHtml: string;
  /** Rendered as a separate block AFTER the CTA stack — never inside body. */
  signatureHtml?: string;
  docNumber?: string;
  senderName?: string;
  senderTitle?: string;
  year?: number;
  docusignUrl?: string;
  attachmentName?: string;
  /** When provided, the Download PDF CTA appears as Step 1. */
  attachmentUrl?: string;
}

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Force the brand token "JBJ" to uppercase wherever it appears in display text. */
function upperJbj(s: string): string {
  return String(s ?? "").replace(/jbj/gi, "JBJ");
}

export function buildSenderSignatureHtml(senderName: string, senderTitle: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" data-jbj-sig-table="1" style="margin-top:8px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:14px;"><div style="width:100%;max-width:380px;height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  <tr><td style="font-size:14px;font-weight:700;color:#1A1A1A;letter-spacing:.02em;padding-bottom:2px;">${escapeHtml(senderName)}</td></tr>
  <tr><td style="font-style:italic;font-size:12px;color:#B89555;letter-spacing:.06em;padding-bottom:6px;">${escapeHtml(senderTitle)}</td></tr>
  <tr><td style="font-size:11px;font-weight:700;color:#1A1A1A;letter-spacing:.16em;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</td></tr>
  <tr><td style="font-size:11px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-top:4px;">Dubai, UAE</td></tr>
  <tr><td style="font-size:11px;color:#B89555;letter-spacing:.04em;padding-top:2px;font-weight:600;">CONTACT@JBJ.AE &nbsp;·&nbsp; +971 54 716 7107</td></tr>
  <tr><td style="font-size:11px;color:#B89555;letter-spacing:.04em;padding-top:2px;font-weight:600;">WWW.JBJ.AE</td></tr>
</table>`;
}

export function buildEnvelopeEmailHtml(args: BuildEnvelopeEmailArgs): string {
  const subject = upperJbj(escapeHtml(args.subject || ""));
  const bodyHtml = args.bodyHtml || "";
  const signatureHtml = args.signatureHtml || "";
  const docNumber = args.docNumber ? escapeHtml(args.docNumber) : "";
  const year = args.year ?? new Date().getFullYear();
  const docusignUrl = (args.docusignUrl || "").trim();
  const attachmentName = args.attachmentName ? escapeHtml(args.attachmentName) : "";
  void args.attachmentUrl;

  const ctaHref = docusignUrl || DOCUSIGN_WEB;
  const referenceLine = "";

  // Visible "PDF attached" strip rendered at the bottom of the email so the
  // recipient sees the file is attached to this same message — not behind a
  // separate broken download link.
  const attachmentStrip = "";

  const buttonStyle = (bg: string, fg: string) =>
    `display:block;width:100%;box-sizing:border-box;padding:16px 22px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.22em;color:${fg};background:${bg};text-decoration:none;text-transform:uppercase;text-align:center;border:1px solid #B89555;border-radius:2px;`;
  const stepLabel = (label: string) =>
    `<div style="font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:.28em;color:#B89555;text-transform:uppercase;text-align:center;margin:0 0 8px;">${label}</div>`;

  const ctaBlock = `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:380px;margin:26px auto 28px;border-collapse:collapse;">
          <tr><td style="padding-bottom:8px;">${stepLabel("Sign with DocuSign (optional)")}</td></tr>
          <tr><td>
            <a href="${escapeHtml(ctaHref)}" target="_blank" rel="noopener" style="${buttonStyle("#1A1A1A", "#FDFBF7")}">
              Open in DocuSign &nbsp;→
            </a>
          </td></tr>
          <tr><td align="center" style="padding-top:10px;font-family:Inter,Arial,sans-serif;font-size:10.5px;color:#1A1A1A;opacity:.65;line-height:1.6;">
            UAE-recognised e-signature platform.<br/>
            <a href="${DOCUSIGN_SIGNUP}" style="color:#B89555;text-decoration:none;">Create a free account</a>
            &nbsp;·&nbsp; <a href="${DOCUSIGN_APP_STORE}" style="color:#B89555;text-decoration:none;">App Store</a>
            &nbsp;·&nbsp; <a href="${DOCUSIGN_PLAY_STORE}" style="color:#B89555;text-decoration:none;">Google Play</a>
          </td></tr>
        </table>`;

  // Signature block — ALWAYS rendered AFTER the CTA stack so it sits at the
  // very bottom of the message. Only one signature is ever rendered.
  const signatureBlock = signatureHtml
    ? `<div data-jbj-sig-final="1" style="margin-top:18px;">${signatureHtml}</div>`
    : "";

  // Mobile-responsive shell
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
    .jbj-wordmark{font-size:16px;}
    @media (max-width:520px){
      .jbj-outer-pad{padding:16px 8px !important;}
      .jbj-card{border-left-width:1px;border-right-width:1px;}
      .jbj-body{padding:22px 18px 18px !important;}
      .jbj-head-pad{padding:14px 16px 0 !important;}
      .jbj-foot-pad{padding:0 16px 14px !important;}
      .jbj-foot-col{display:block !important;width:100% !important;text-align:center !important;padding:6px 0 !important;}
      .jbj-foot-col a{display:inline-block;padding:2px 0;}
      .jbj-wordmark{font-size:14px;letter-spacing:.14em !important;}
    }
  </style></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <div style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;">${attachmentName ? `Your document ${attachmentName} is attached. ` : ""}Please review, sign and reply to this email.</div>
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" class="jbj-outer-pad" style="padding:40px 16px;">
    <table role="presentation" class="jbj-card" style="width:100%;max-width:640px;border-collapse:collapse;">
      <tr><td class="jbj-head-pad" style="background:#F7F2EA;border:1px solid #B89555;border-bottom:none;padding:18px 24px 0;">
        <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
          <td style="vertical-align:middle;width:64px;padding-right:14px;">
            <img src="${JBJ_LOGO_URL}" alt="JBJ" width="56" height="56" style="display:block;border:0;outline:none;height:56px;width:56px;"/>
          </td>
          <td class="jbj-wordmark" style="vertical-align:middle;font-weight:700;letter-spacing:.18em;color:#1A1A1A;line-height:1.2;white-space:nowrap;">
            JBJ GLOBAL REAL ESTATE
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="background:#F7F2EA;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:14px 0 0;line-height:0;font-size:0;">
        <div style="height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div>
      </td></tr>
      <tr><td class="jbj-body" style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:32px 32px 28px;">
        <h2 style="margin:0 0 14px;color:#1A1A1A;font-size:20px;font-weight:700;line-height:1.3;">${subject}</h2>
        ${referenceLine}
        <div style="color:#1A1A1A;line-height:1.7;font-size:14px;">${bodyHtml}</div>
        ${ctaBlock}
        ${signatureBlock}
        ${attachmentStrip}
        <p style="margin:22px 0 0;color:#1A1A1A;opacity:.55;font-size:11px;line-height:1.55;">Replies to this email are routed to <a href="mailto:contact@jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;">CONTACT@JBJ.AE</a> and answered by our team.</p>
      </td></tr>
      <tr><td style="background:#F7F2EA;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:0 0 14px;line-height:0;font-size:0;">
        <div style="height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div>
      </td></tr>
      <tr><td class="jbj-foot-pad" style="background:#F7F2EA;border:1px solid #B89555;border-top:none;padding:18px 24px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;line-height:1.7;"><tr>
          <td class="jbj-foot-col" style="width:42%;vertical-align:top;">
            <div style="font-weight:700;letter-spacing:.14em;">JBJ GLOBAL REAL ESTATE</div>
            <div style="opacity:.7;">Dubai, UAE</div>
          </td>
          <td align="center" class="jbj-foot-col" style="width:32%;vertical-align:top;">
            <div><a href="mailto:contact@jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;">CONTACT@JBJ.AE</a></div>
            <div><a href="https://www.jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;">WWW.JBJ.AE</a></div>
          </td>
          <td align="right" class="jbj-foot-col" style="width:26%;vertical-align:top;">
            <div><a href="tel:+971547167107" style="color:#B89555;text-decoration:none;font-weight:600;letter-spacing:.04em;">+971&nbsp;54&nbsp;716&nbsp;7107</a></div>
          </td>
        </tr></table>
        <div style="text-align:center;font-size:10.5px;color:#1A1A1A;opacity:.55;letter-spacing:.04em;margin-top:14px;">© ${year} JBJ GLOBAL REAL ESTATE</div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
