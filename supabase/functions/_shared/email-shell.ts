/**
 * Cross-client email shell — Outlook-safe table layout, inline CSS,
 * web-safe font stack, dark-mode meta, hidden preheader.
 *
 * Wraps an inner HTML body with a frame that renders consistently across
 * Gmail, Outlook (Win + Web + Mac), Apple Mail, iCloud, Yahoo, Hotmail,
 * Android Mail. NEVER reflowed by the send pipeline — the output of
 * `wrapEmailHtml` IS the bytes delivered to the recipient.
 */

const FONT_STACK = `'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif`;

export interface EmailShellInput {
  innerHtml: string;
  preheader?: string;
  brandColor?: string; // hairline accent (default gold)
  bgPage?: string;     // page bg (default champagne)
  bgCard?: string;     // card bg (default white)
  textColor?: string;  // body text (default ink)
}

export function wrapEmailHtml(input: EmailShellInput): string {
  const {
    innerHtml,
    preheader = "",
    brandColor = "#B89555",
    bgPage = "#FDFBF7",
    bgCard = "#FFFFFF",
    textColor = "#1A1A1A",
  } = input;

  const safePreheader = preheader.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<meta charset="utf-8"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light only"/>
<title>&nbsp;</title>
<!--[if mso]>
<style type="text/css">
table,td,div,p,a {font-family:Arial,Helvetica,sans-serif !important;}
</style>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
<style type="text/css">
@media only screen and (max-width:620px){
  .container{width:100% !important;max-width:100% !important;}
  .px{padding-left:20px !important;padding-right:20px !important;}
}
a{color:${textColor};text-decoration:underline;}
</style>
</head>
<body style="margin:0;padding:0;background:${bgPage};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:transparent;">${safePreheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${bgPage};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:${bgCard};border:1px solid ${brandColor}33;border-collapse:separate;">
<tr><td class="px" style="padding:32px 40px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${textColor};">
${innerHtml}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Deterministic plain-text mirror of an HTML email body.
 * Strips tags, collapses whitespace, preserves links as `text (url)`.
 */
export function htmlToPlainText(html: string): string {
  let s = html;
  // Preserve <br> and block boundaries as newlines
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\/(p|div|tr|h[1-6]|li|section|article|header|footer)\s*>/gi, "\n\n");
  // Convert anchors to "text (href)"
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
    const t = text.replace(/<[^>]+>/g, "").trim();
    return t && t !== href ? `${t} (${href})` : href;
  });
  // Strip remaining tags
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<[^>]+>/g, "");
  // Decode common entities
  s = s.replace(/&nbsp;/g, " ")
       .replace(/&amp;/g, "&")
       .replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  // Collapse whitespace
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}

/**
 * Canonical JSON for hashing — keys sorted, stable.
 */
function canonicalJSON(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  return JSON.stringify(keys.reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = obj[k];
    return acc;
  }, {}));
}

export async function computePayloadHash(p: {
  from_email: string;
  from_name: string;
  reply_to: string;
  recipient_email: string;
  cc_emails: string[];
  subject: string;
  html: string;
  plain_text: string;
}): Promise<string> {
  const data = new TextEncoder().encode(canonicalJSON({
    ...p,
    cc_emails: [...p.cc_emails].sort(),
  }));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
