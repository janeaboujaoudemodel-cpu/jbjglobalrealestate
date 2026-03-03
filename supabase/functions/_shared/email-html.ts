// Unified Email Template Module — JBJ Global Real Estate
// All user-facing emails MUST import from here to ensure consistent branding.

const LOGO_URL = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/jbj-monogram-dark.png?v=3";
const SITE_URL = "https://jbj.ae";

export { LOGO_URL, SITE_URL };

/* ── HTML Minifier — strips comments, collapses whitespace to reduce Gmail clipping ── */
export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n\s*\n/g, '\n')
    .replace(/>\s{2,}</g, '> <')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ── Shared Header — Black with 180px centered monogram + wordmark ── */
export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000000;padding:28px 40px 24px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 14px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:24px 32px;text-align:center;">
<p style="font-size:20px;font-weight:bold;color:#fff;margin:0 0 6px;letter-spacing:1px;">${departmentLabel}</p>
<table role="presentation" width="60%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:8px;">
<tr><td style="height:2px;background:rgba(255,255,255,0.4);border-radius:2px;"></td></tr>
</table>
</td></tr>`;
}

/* ── Reusable Monogram Badge (profile circles — zoomed/full-fit) ── */
export function monogramBadge(size = 48, ringColor = "#C8A766", bgColor = "#000000"): string {
  const logoSize = Math.round(size * 0.88);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="width:${size}px;height:${size}px;background:${bgColor};border:2px solid ${ringColor};border-radius:50%;text-align:center;vertical-align:middle;overflow:hidden;">
<img src="${LOGO_URL}" alt="JBJ" width="${logoSize}" style="width:${logoSize}px;height:${logoSize}px;display:block;margin:0 auto;object-fit:cover;" />
</td></tr>
</table>`;
}

/* ── Premium Lock Icon (for password/security emails) ── */
export function lockIconBadge(size = 60): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:50%;text-align:center;vertical-align:middle;line-height:${size}px;">
<span style="font-size:${Math.round(size * 0.45)}px;color:#C8A766;">&#128274;</span>
</td></tr>
</table>`;
}

/* ── Inquiry Contact Box (green border, rounded) ── */
export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
<tr><td style="padding:20px 24px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:16px;text-align:center;">
<p style="margin:0;font-size:15px;color:#333;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at<br/><a href="mailto:CONTACT@JBJ.AE" style="color:#1a1a1a;font-weight:700;text-decoration:underline;font-size:16px;">CONTACT@JBJ.AE</a></p>
</td></tr>
</table>`;
}

/* ── Ticket Support Embed (RED style — matching website SupportTicketBox with headphones icon) ── */
export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
<tr><td style="padding:24px;background:linear-gradient(135deg,#fff5f5,#ffe8e8,#fef2f2);border:2px solid #e74c3c;border-radius:16px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;">
<tr><td style="width:50px;height:50px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50%;text-align:center;vertical-align:middle;line-height:50px;">
<span style="font-size:22px;color:#ffffff;">&#127911;</span>
</td></tr>
</table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#e74c3c;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p>
<a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-weight:700;font-size:13px;">Submit a Ticket</a>
</td></tr>
</table>`;
}

/* ── Recommended For You — 3-card row with GOLD border only, NO black inner borders, NO emojis ── */
export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;border-top:2px solid #C8A76633;padding-top:20px;">
<tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/ai-tools" style="display:block;padding:18px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">AI Tools</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/guides" style="display:block;padding:18px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Guides</p>
</a>
</td>
<td width="33%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/properties" style="display:block;padding:18px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Properties</p>
</a>
</td>
</tr>
</table>
</td></tr>
</table>`;
}

/* ── Books Showcase — Market Report + Library ── */
export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
<tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="50%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/market-intelligence" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<p style="margin:0 0 4px;font-size:13px;color:#1a1a1a;font-weight:700;">Market Intelligence</p>
<p style="margin:0;font-size:11px;color:#888;">Reports &amp; Analytics</p>
</a>
</td>
<td width="50%" style="text-align:center;padding:4px;">
<a href="${SITE_URL}/buyer-guide" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:12px;text-decoration:none;">
<p style="margin:0 0 4px;font-size:13px;color:#1a1a1a;font-weight:700;">Buyer Guide</p>
<p style="margin:0;font-size:11px;color:#888;">Library &amp; Resources</p>
</a>
</td>
</tr>
</table>
</td></tr>
</table>`;
}

/* ── Suggested Actions Row ── */
export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
<tr>
<td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;padding:12px 8px;background:#fff;border:1px solid #C8A76650;border-radius:10px;text-decoration:none;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:600;">Explore Properties</span></a></td>
<td width="50%" style="padding:4px;"><a href="${SITE_URL}/ai-tools" style="display:block;padding:12px 8px;background:#fff;border:1px solid #C8A76650;border-radius:10px;text-decoration:none;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:600;">AI Tools</span></a></td>
</tr>
</table>`;
}

/* ── Feedback Section — Review + Survey with extra spacing before sign-off ── */
export function feedbackHtml(context: string = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #C8A76633;padding-top:20px;margin-top:12px;">
<tr><td align="center">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 4px;">We Value Your Feedback</p>
<p style="color:#888;font-size:13px;margin:0 0 16px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center">
<tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:700;font-size:13px;">Take Survey</a></td>
</tr>
</table>
</td></tr>
</table>`;
}

/* ── Sign-off — Bigger text, extra spacing above ── */
export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;">
<tr><td>
<p style="font-size:16px;color:#333;margin:0 0 4px;font-weight:600;">Best Regards,</p>
<p style="font-size:17px;color:#C8A766;font-weight:700;margin:0;">${teamName}</p>
</td></tr>
</table>`;
}

/* ── Ready to Get Started / Contact Section (matches website) ── */
export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;background:linear-gradient(135deg,#000,#1a1a1a);border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 24px;text-align:center;">
<p style="color:#C8A766;font-size:18px;font-weight:700;margin:0 0 8px;">Ready to Get Started?</p>
<p style="color:#aaa;font-size:13px;margin:0 0 20px;">Reach out to us anytime — we're here to help.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="50%" style="text-align:center;padding:8px;vertical-align:top;">
<p style="color:#C8A766;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Email</p>
<a href="mailto:CONTACT@JBJ.AE" style="color:#fff;text-decoration:none;font-size:13px;font-weight:600;">CONTACT@JBJ.AE</a>
</td>
<td width="50%" style="text-align:center;padding:8px;vertical-align:top;">
<p style="color:#C8A766;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Phone</p>
<a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:13px;font-weight:600;">+971 56 591 1000</a>
</td>
</tr>
</table>
</td></tr>
</table>`;
}

/* ── Do-Not-Reply Notice ── */
export function doNotReplyNotice(): string {
  return `<tr><td style="padding:0 32px 16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p>
</td></tr>`;
}

/* ── Unified Footer — edge-to-edge ── */
export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}
<tr><td style="background:#000000;padding:30px 40px;text-align:center;">
<p style="color:#C8A766;font-size:15px;margin:0 0 16px;font-weight:600;">Need assistance? We're here to help.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr><td align="center" style="padding:14px 0;">
<a href="tel:+971565911000" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">+971 56 591 1000</a>
<span style="color:#444;margin:0 14px;">|</span>
<a href="mailto:CONTACT@JBJ.AE" style="color:#ffffff;text-decoration:underline;font-size:14px;font-weight:600;">CONTACT@JBJ.AE</a>
</td></tr>
</table>
<p style="color:#C8A766;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Follow Us &middot; Stay in the Loop</p>
<table cellpadding="0" cellspacing="0" align="center" style="margin-bottom:16px;">
<tr>
<td style="padding:0 4px;"><a href="https://www.instagram.com/jbj.ae" style="display:inline-block;padding:10px 16px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">Instagram</a></td>
<td style="padding:0 4px;"><a href="https://www.facebook.com/share/1G7CgSaV2L/" style="display:inline-block;padding:10px 16px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">Facebook</a></td>
<td style="padding:0 4px;"><a href="https://www.linkedin.com/company/jbj-global-real-estate/" style="display:inline-block;padding:10px 16px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">LinkedIn</a></td>
<td style="padding:0 4px;"><a href="https://youtube.com/@jbjglobalrealestate" style="display:inline-block;padding:10px 16px;background:linear-gradient(135deg,#FDFBF7,#F5EBD7);border:1px solid #C8A766;border-radius:6px;color:#1a1a1a;text-decoration:none;font-size:11px;font-weight:600;">YouTube</a></td>
</tr>
</table>
<p style="color:#C8A766;font-size:13px;margin:0 0 4px;font-weight:600;">JBJ Global Real Estate</p>
<p style="color:#777;font-size:11px;margin:0 0 8px;">First Global Real Estate Platform of Its Kind</p>
<p style="color:#888;font-size:10px;margin:0 0 12px;white-space:nowrap;">
Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span>
</p>
<p style="color:#C8A766;font-size:11px;margin:12px 0 0;font-weight:600;">
&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
</p>
</td></tr>`;
}

/* ── Progress Steps (3-step tracker) ── */
export function progressSteps(
  labels: [string, string, string],
  active: [boolean, boolean, boolean],
  checks: [boolean, boolean, boolean] = [false, false, false]
): string {
  const makeStep = (num: string, label: string, isActive: boolean, isCheck: boolean) => {
    const bg = isActive ? 'background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;' : 'background:#e5e5e5;color:#999;';
    const textColor = isActive ? 'color:#C8A766;font-weight:600;' : 'color:#999;';
    const icon = isCheck ? '&#10003;' : num;
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr><td style="width:44px;height:44px;border-radius:50%;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:bold;">${icon}</td></tr>
</table>
<p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p>
</td>`;
  };

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
<tr>${makeStep('1', labels[0], active[0], checks[0])}${makeStep('2', labels[1], active[1], checks[1])}${makeStep('3', labels[2], active[2], checks[2])}</tr>
</table>`;
}

/* ── Arabic Divider — clean gold line with proper padding, NO "Arabic Version" text ── */
export function arabicDivider(): string {
  return `<tr><td style="padding:32px 32px 0;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table>
</td></tr>`;
}

/* ── Shared sections block (used inside every email body) ── */
export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `${inquiryBox(context)}
${ticketSupportEmbed()}
${recommendedActionsHtml()}
${booksShowcaseHtml()}
${suggestedActionsHtml()}
${feedbackHtml(context)}
${readyToGetStartedHtml()}
${signOffHtml(teamName)}`;
}

/* ── Email Shell — white background, single-card container, with minifier ── */
export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:24px 16px!important;}}</style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#FFFFFF,#FDFBF7,#F5F0E6);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">
${sharedHeader(departmentLabel)}
${bodyContent}
${sharedFooterHtml()}
</table>
</td></tr>
</table>
</body></html>`;
  return minifyHtml(raw);
}
