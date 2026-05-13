// Client-side mirror of supabase/functions/_shared/envelope-email-html.ts.
// MUST stay byte-for-byte identical so the in-app preview iframe renders the
// exact HTML the recipient receives. If you edit one, edit the other.

export const JBJ_LOGO_URL = "https://www.jbj.ae/jbj-monogram-dark-on-light.png";
export const DOCUSIGN_APP_STORE = "https://apps.apple.com/app/docusign/id474990205";
export const DOCUSIGN_PLAY_STORE = "https://play.google.com/store/apps/details?id=com.docusign.ink";
// Faster, deterministic DocuSign web entry — `apps.docusign.com` was loading
// to a long blank page; `account.docusign.com` is the production sign-in
// surface and resolves instantly.
export const DOCUSIGN_WEB = "https://account.docusign.com/";
export const DOCUSIGN_SIGNUP = "https://account.docusign.com/signup";
export const SIGNED_RETURN_EMAIL = "contact@jbj.ae";

export interface BuildEnvelopeEmailArgs {
  subject: string;
  bodyHtml: string;
  docNumber?: string;
  senderName?: string;
  senderTitle?: string;
  year?: number;
  docusignUrl?: string;
  attachmentName?: string;
  /** When provided, the "PDF attached" chip becomes a clickable download link. */
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

export function buildSenderSignatureHtml(senderName: string, senderTitle: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:6px;">
    <span style="font-family:'Cormorant Garamond','Playfair Display',Georgia,serif;font-style:italic;font-weight:500;font-size:28px;color:#1A1A1A;letter-spacing:.01em;line-height:1;">${escapeHtml(senderName)}</span>
  </td></tr>
  <tr><td style="padding:6px 0 12px;"><div style="width:72px;height:1px;background:#B89555;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  <tr><td style="font-size:10.5px;font-weight:700;letter-spacing:.18em;color:#B89555;text-transform:uppercase;padding-bottom:8px;">${escapeHtml(senderTitle)}</td></tr>
  <tr><td style="font-size:11px;font-weight:700;letter-spacing:.22em;color:#1A1A1A;text-transform:uppercase;padding-bottom:3px;">JBJ GLOBAL REAL ESTATE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">Dubai, UAE</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;padding-bottom:1px;">CONTACT@JBJ.AE &nbsp;·&nbsp; +971 54 716 7107</td></tr>
  <tr><td style="font-size:10.5px;color:#1A1A1A;opacity:.7;letter-spacing:.04em;">WWW.JBJ.AE</td></tr>
</table>`;
}

export function buildEnvelopeEmailHtml(args: BuildEnvelopeEmailArgs): string {
  const subject = escapeHtml(args.subject || "");
  const bodyHtml = args.bodyHtml || "";
  void args.docNumber; // intentionally unused — DOC NO. lives on the PDF, not in the email header
  const year = args.year ?? new Date().getFullYear();
  const docusignUrl = (args.docusignUrl || "").trim();
  const attachmentName = args.attachmentName ? escapeHtml(args.attachmentName) : "";
  const attachmentUrl = (args.attachmentUrl || "").trim();

  const ctaHref = docusignUrl || DOCUSIGN_WEB;
  const hasDownload = Boolean(attachmentUrl && attachmentName);

  const buttonStyle = (bg: string, fg: string) =>
    `display:block;width:100%;box-sizing:border-box;padding:16px 22px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.22em;color:${fg};background:${bg};text-decoration:none;text-transform:uppercase;text-align:center;border:1px solid #B89555;border-radius:2px;`;
  const stepLabel = (n: number, label: string) =>
    `<div style="font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:.28em;color:#B89555;text-transform:uppercase;text-align:center;margin:0 0 8px;">Step ${n} · ${label}</div>`;

  const downloadBlock = hasDownload
    ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:380px;margin:24px auto 0;border-collapse:collapse;">
          <tr><td style="padding-bottom:8px;">${stepLabel(1, "Download your agreement")}</td></tr>
          <tr><td>
            <a href="${escapeHtml(attachmentUrl)}" target="_blank" rel="noopener" download="${attachmentName}" style="${buttonStyle("#F7F2EA", "#1A1A1A")}">
              ⬇ &nbsp; Download PDF
            </a>
          </td></tr>
          <tr><td align="center" style="padding-top:8px;font-family:Inter,Arial,sans-serif;font-size:10.5px;color:#1A1A1A;opacity:.6;line-height:1.5;">
            Also attached to this email · <strong style="font-weight:600;">${attachmentName}</strong>
          </td></tr>
        </table>`
    : "";

  const ctaBlock = `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:380px;margin:${hasDownload ? "18px" : "26px"} auto 0;border-collapse:collapse;">
          <tr><td style="padding-bottom:8px;">${stepLabel(hasDownload ? 2 : 1, "Sign with DocuSign")}</td></tr>
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

  

  // Mobile-responsive shell — the @media block stacks the header columns,
  // forces the wordmark on a single line, and turns the 3-column footer into
  // a single centered column so links never collide on phones.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>
    .jbj-wordmark{font-size:16px;}
    @media (max-width:520px){
      .jbj-outer-pad{padding:16px 8px !important;}
      .jbj-card{border-left-width:1px;border-right-width:1px;}
      .jbj-body{padding:22px 18px 18px !important;}
      .jbj-head-pad{padding:16px 16px 12px !important;}
      .jbj-foot-pad{padding:14px 16px !important;}
      .jbj-doc-no{display:block !important;text-align:left !important;padding-top:8px !important;}
      .jbj-foot-col{display:block !important;width:100% !important;text-align:center !important;padding:6px 0 !important;}
      .jbj-foot-col a{display:inline-block;padding:2px 0;}
      .jbj-wordmark{font-size:14px;letter-spacing:.14em !important;}
    }
  </style></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" class="jbj-outer-pad" style="padding:40px 16px;">
    <table role="presentation" class="jbj-card" style="width:100%;max-width:640px;border-collapse:collapse;">
      <tr><td class="jbj-head-pad" style="background:#F7F2EA;border:1px solid #B89555;padding:22px 24px 18px;border-bottom:none;">
        <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
          <td style="vertical-align:middle;width:64px;padding-right:16px;">
            <img src="${JBJ_LOGO_URL}" alt="JBJ" width="56" height="56" style="display:block;border:0;outline:none;height:56px;width:56px;"/>
          </td>
          <td class="jbj-wordmark" style="vertical-align:middle;font-weight:700;letter-spacing:.18em;color:#1A1A1A;line-height:1.2;white-space:nowrap;">
            JBJ GLOBAL REAL ESTATE
          </td>
        </tr></table>
        <div style="height:1px;background:#B89555;margin-top:14px;"></div>
      </td></tr>
      <tr><td class="jbj-body" style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:32px 32px 24px;">
        <h2 style="margin:0 0 18px;color:#1A1A1A;font-size:20px;font-weight:700;line-height:1.3;">${subject}</h2>
        <div style="color:#1A1A1A;line-height:1.7;font-size:14px;">${bodyHtml}</div>
        ${ctaBlock}
        <p style="margin:18px 0 0;color:#1A1A1A;opacity:.55;font-size:11px;line-height:1.55;">Replies to this email are routed to <a href="mailto:contact@jbj.ae" style="color:#B89555;text-decoration:none;font-weight:600;">contact@jbj.ae</a> and answered by our team.</p>
      </td></tr>
      <tr><td class="jbj-foot-pad" style="background:#F7F2EA;border:1px solid #B89555;border-top:none;padding:18px 24px;">
        <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
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
        <div style="height:1px;background:#B89555;margin:14px 0 10px;"></div>
        <div style="text-align:center;font-size:10.5px;color:#1A1A1A;opacity:.55;letter-spacing:.04em;">© ${year} JBJ Global Real Estate</div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}
