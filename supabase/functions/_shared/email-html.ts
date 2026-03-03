// Unified Email Template Module — JBJ Global Real Estate

const ASSET_BASE = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets";
const LOGO_URL = `${ASSET_BASE}/jbj-monogram-dark.png?v=3`;
const SITE_URL = "https://jbj.ae";

const ICON_AI_TOOLS = `${ASSET_BASE}/email-icons/ai-tools.svg`;
const ICON_GUIDES = `${ASSET_BASE}/email-icons/guides.svg`;
const ICON_PROPERTIES = `${ASSET_BASE}/email-icons/properties.svg`;
const ICON_LOCK = `${ASSET_BASE}/email-icons/lock.svg`;
const ICON_HEADPHONES = `${ASSET_BASE}/email-icons/headphones.svg`;

const BOOK_MARKET_REPORT = `${ASSET_BASE}/email-books/market-report-book.jpg`;
const BOOK_GUIDES_LIBRARY = `${ASSET_BASE}/email-books/guides-library-book.jpg`;

export { LOGO_URL, SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000;padding:28px 32px 24px;border-radius:24px 24px 0 0;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 14px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:22px 28px;text-align:center;">
<p style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">${departmentLabel}</p>
</td></tr>`;
}

/**
 * Monogram badge — CIRCLE only, thin 1px gold border, no square borders.
 */
export function monogramBadge(size = 48, ringColor = "#C8A766", bgColor = "#000000"): string {
  const logoSize = Math.round(size * 0.86);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:${size}px;height:${size}px;background:${bgColor};border:1px solid ${ringColor};border-radius:999px;text-align:center;vertical-align:middle;overflow:hidden;"><img src="${LOGO_URL}" alt="JBJ" width="${logoSize}" style="width:${logoSize}px;height:${logoSize}px;display:block;margin:0 auto;object-fit:cover;border-radius:999px;" /></td></tr></table>`;
}

/**
 * Profile photo badge — ALWAYS circle, thin 1px gold border ONLY.
 * NEVER square. NEVER thick borders. Circular frame only.
 * Includes fallback monogram if image fails.
 */
export function profilePhotoBadge(photoUrl: string, size = 52): string {
  if (!photoUrl || photoUrl === 'null' || photoUrl === 'undefined') {
    return monogramBadge(size);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:999px;overflow:hidden;background:#000;"><img src="${photoUrl}" alt="Profile" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:block;object-fit:cover;border-radius:999px;" onerror="this.style.display='none';" /></td></tr></table>`;
}

export function lockIconBadge(size = 64): string {
  const iconSize = Math.round(size * 0.44);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:999px;text-align:center;vertical-align:middle;"><img src="${ICON_LOCK}" alt="Security" width="${iconSize}" height="${iconSize}" style="width:${iconSize}px;height:${iconSize}px;display:block;margin:0 auto;" /></td></tr></table>`;
}

export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="padding:20px 22px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:18px;text-align:center;"><p style="margin:0;font-size:14px;color:#333;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#1a1a1a;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p></td></tr></table>`;
}

export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="padding:24px;background:linear-gradient(135deg,#fff5f5,#ffe8e8,#fef2f2);border:2px solid #e74c3c;border-radius:18px;text-align:center;"><img src="${ICON_HEADPHONES}" alt="Support" width="30" height="30" style="display:block;margin:0 auto 10px;" /><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#e74c3c;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">Submit a Ticket</a></td></tr></table>`;
}

function recommendedCard(title: string, href: string, iconUrl: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-decoration:none;box-shadow:0 6px 16px rgba(200,167,102,0.2),0 2px 4px rgba(0,0,0,0.05);"><img src="${iconUrl}" alt="${title}" width="28" height="28" style="display:block;margin:0 auto 10px;" /><p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 28px;"><tr><td style="padding-top:34px;border-top:2px solid #C8A76633;text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 18px;line-height:1.4;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, ICON_AI_TOOLS)}${recommendedCard("Guides", `${SITE_URL}/guides`, ICON_GUIDES)}${recommendedCard("Properties", `${SITE_URL}/properties`, ICON_PROPERTIES)}</tr></table></td></tr></table>`;
}

/**
 * Books showcase — NO borders around books. 3D shadow style. Side by side aligned.
 */
function bookCard(title: string, subtitle: string, href: string, img: string): string {
  return `<td width="50%" style="text-align:center;padding:6px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;"><img src="${img}" alt="${title}" width="130" style="width:130px;max-width:100%;height:auto;display:block;margin:0 auto 10px;border-radius:8px;box-shadow:8px 10px 24px rgba(0,0,0,0.22),2px 2px 8px rgba(0,0,0,0.1);transform:perspective(400px) rotateY(-3deg);" /><p style="margin:0 0 3px;font-size:13px;color:#1a1a1a;font-weight:700;">${title}</p><p style="margin:0;font-size:11px;color:#777;">${subtitle}</p></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 24px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 14px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${bookCard("Market Report", "Real Estate Intelligence", `${SITE_URL}/market-intelligence/reports`, BOOK_MARKET_REPORT)}${bookCard("Guides Library", "Expert Knowledge Hub", `${SITE_URL}/guides`, BOOK_GUIDES_LIBRARY)}</tr></table></td></tr></table>`;
}

export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;"><tr><td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;padding:12px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-decoration:none;text-align:center;box-shadow:0 4px 12px rgba(200,167,102,0.15);"><span style="font-size:13px;color:#1a1a1a;font-weight:600;">Explore Properties</span></a></td><td width="50%" style="padding:4px;"><a href="${SITE_URL}/ai-tools" style="display:block;padding:12px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-decoration:none;text-align:center;box-shadow:0 4px 12px rgba(200,167,102,0.15);"><span style="font-size:13px;color:#1a1a1a;font-weight:600;">AI Tools</span></a></td></tr></table>`;
}

export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:34px;"><tr><td style="padding-top:30px;border-top:2px solid #C8A76633;" align="center"><p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p><p style="color:#888;font-size:13px;margin:0 0 18px;">Help us improve by sharing your experience</p><table cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 26px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td><td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:10px 24px;border-radius:12px;font-weight:700;font-size:13px;">Take Survey</a></td></tr></table></td></tr></table>`;
}

export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:44px;"><tr><td><p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p><p style="font-size:19px;color:#C8A766;font-weight:800;margin:0;letter-spacing:0.4px;">${teamName.toUpperCase()}</p></td></tr></table>`;
}

/**
 * Ready to Get Started — matches website exactly: champagne/pearl/gold background,
 * 3-column contact (WhatsApp/Call/Email), Stay in the Loop with newsletter input link.
 */
export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#F0EBE0);border:1px solid #C8A76640;border-radius:20px;overflow:hidden;">
<tr><td style="padding:28px 22px;text-align:center;">
<p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;background:linear-gradient(135deg,#1a1a1a 0%,#333 30%,#D4AF37 50%,#333 70%,#1a1a1a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">READY TO GET STARTED?</p>
<p style="color:#666;font-size:13px;margin:0 0 20px;">Connect with our expert team for personalized guidance.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="33%" style="text-align:center;padding:4px;"><a href="https://wa.me/971565911000" style="display:block;padding:14px 4px;background:#fff;border:2px solid #C8A766;border-radius:16px;text-decoration:none;box-shadow:0 4px 12px rgba(200,167,102,0.15);"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;">+971 56 591 1000</p></a></td>
<td width="33%" style="text-align:center;padding:4px;"><a href="tel:+971565911000" style="display:block;padding:14px 4px;background:#fff;border:2px solid #C8A766;border-radius:16px;text-decoration:none;box-shadow:0 4px 12px rgba(200,167,102,0.15);"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;">+971 56 591 1000</p></a></td>
<td width="33%" style="text-align:center;padding:4px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;padding:14px 4px;background:#fff;border:2px solid #C8A766;border-radius:16px;text-decoration:none;box-shadow:0 4px 12px rgba(200,167,102,0.15);"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;">CONTACT@JBJ.AE</p></a></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #C8A76640;"></td><td style="width:30px;text-align:center;"><span style="color:#C8A76660;font-size:12px;">&#10022;</span></td><td style="border-top:1px solid #C8A76640;"></td></tr></table></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr><td style="text-align:center;">
<p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;background:linear-gradient(135deg,#1a1a1a 0%,#333 30%,#D4AF37 50%,#333 70%,#1a1a1a 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">&#10022; STAY IN THE LOOP &#10022;</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;">Be the first to access new listings, market updates, and personalized guidance.</p>
<a href="${SITE_URL}/#ready-to-get-started" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;font-size:13px;border:1px solid #C8A76650;border-radius:999px;padding:10px 28px;font-weight:700;letter-spacing:0.5px;">Subscribe to Updates</a>
</td></tr></table>
</td></tr></table>`;
}

export function doNotReplyNotice(): string {
  return `<tr><td style="padding:0 32px 16px;text-align:center;"><p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p></td></tr>`;
}

export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}<tr><td style="background:#000;padding:30px 34px;border-radius:0 0 24px 24px;text-align:center;"><p style="color:#C8A766;font-size:15px;margin:0 0 14px;font-weight:600;">Need assistance? We're here to help.</p><p style="margin:0 0 16px;"><a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">+971 56 591 1000</a><span style="color:#444;margin:0 14px;">|</span><a href="mailto:CONTACT@JBJ.AE" style="color:#fff;text-decoration:underline;font-size:14px;font-weight:600;">CONTACT@JBJ.AE</a></p><p style="color:#C8A766;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Follow Us</p><p style="color:#888;font-size:11px;margin:0 0 12px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p><p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p></td></tr>`;
}

export function progressSteps(labels: [string, string, string], active: [boolean, boolean, boolean], checks: [boolean, boolean, boolean] = [false, false, false]): string {
  const makeStep = (num: string, label: string, isActive: boolean, isCheck: boolean) => {
    const bg = isActive ? "background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;" : "background:#e5e5e5;color:#999;";
    const textColor = isActive ? "color:#C8A766;font-weight:600;" : "color:#999;";
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:44px;height:44px;border-radius:999px;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:700;">${isCheck ? "&#10003;" : num}</td></tr></table><p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p></td>`;
  };

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>${makeStep("1", labels[0], active[0], checks[0])}${makeStep("2", labels[1], active[1], checks[1])}${makeStep("3", labels[2], active[2], checks[2])}</tr></table>`;
}

export function arabicDivider(): string {
  return `<tr><td style="padding:44px 32px 8px;text-align:center;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table></td></tr>`;
}

/**
 * JBJ Team Reply card — LOCKED premium style. 18px rounded borders.
 * Reuse this for ALL team replies: support, HR, partnerships, career, etc.
 */
export function teamReplyCard(teamLabel: string, replyMessage: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${teamLabel}</p>
<div style="color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:18px;border-radius:14px;border:1px solid #e8e8e8;">${replyMessage}</div>
</td></tr></table>`;
}

/**
 * Inquiry stages for user inquiry tracking emails
 */
export function inquiryStages(currentStage: 'received' | 'reviewing' | 'responded'): string {
  const stages: [boolean, boolean, boolean] = [
    true,
    currentStage === 'reviewing' || currentStage === 'responded',
    currentStage === 'responded',
  ];
  return progressSteps(['Received', 'Reviewing', 'Responded'], stages, stages);
}

/**
 * Ticket summary card with thin vertical divider between label and value.
 * Premium rounded styling.
 */
export function ticketSummaryCard(rows: Array<{label: string; value: string; highlight?: boolean}>): string {
  const rowsHtml = rows.map(r => {
    const valueStyle = r.highlight
      ? "padding:7px 0 7px 12px;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;"
      : "padding:7px 0 7px 12px;color:#1a1a1a;font-weight:600;font-size:13px;";
    return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-right:1px solid #C8A76630;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
  }).join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Summary</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table>
</td></tr></table>`;
}

export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `${inquiryBox(context)}${ticketSupportEmbed()}${recommendedActionsHtml()}${booksShowcaseHtml()}${suggestedActionsHtml()}${feedbackHtml(context)}${readyToGetStartedHtml()}${signOffHtml(teamName)}`;
}

export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:24px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#fff,#FDFBF7,#F5F0E6);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.18);">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
