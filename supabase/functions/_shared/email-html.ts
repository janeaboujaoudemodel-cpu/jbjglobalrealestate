// Premium Email Template Module — JBJ Global Real Estate
// ALL icons use pure HTML/CSS (no external SVG/PNG) for Gmail iOS compatibility

const SITE_URL = "https://jbj.ae";
const ASSET_BASE = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets";
const LOGO_URL = `${ASSET_BASE}/jbj-monogram-dark.png?v=3`;

export { LOGO_URL, SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── PURE HTML ICON SYSTEM (Gmail-safe, no images) ───

function cssIcon(label: string, bg: string, color: string, size = 36): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;background:${bg};border-radius:${size}px;text-align:center;vertical-align:middle;line-height:${size}px;font-size:${Math.round(size * 0.38)}px;font-weight:800;color:${color};font-family:Arial,sans-serif;">${label}</td></tr></table>`;
}

function iconAiTools(size = 36): string { return cssIcon("AI", "#000", "#C8A766", size); }
function iconGuides(size = 36): string { return cssIcon("G", "#000", "#C8A766", size); }
function iconProperties(size = 36): string { return cssIcon("P", "#000", "#C8A766", size); }
function iconSupport(size = 44): string { return cssIcon("&#9742;", "linear-gradient(135deg,#ef4444,#dc2626)", "#fff", size); }
function iconLock(size = 36): string { return cssIcon("&#9919;", "#fff", "#1a1a1a", size); }

// ─── HEADER ───

export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000;padding:28px 32px 24px;border-radius:24px 24px 0 0;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="180" style="max-width:180px;height:auto;display:block;margin:0 auto 14px;" />
<p style="color:#C8A766;margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:22px 28px;text-align:center;">
<p style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">${departmentLabel}</p>
</td></tr>`;
}

// ─── MONOGRAM / PROFILE BADGES ───

export function monogramBadge(size = 48): string {
  const logoSize = Math.round(size * 0.86);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;background:#000;border-radius:${size}px;text-align:center;vertical-align:middle;overflow:hidden;"><img src="${LOGO_URL}" alt="JBJ" width="${logoSize}" style="width:${logoSize}px;height:${logoSize}px;display:block;margin:0 auto;object-fit:cover;border-radius:${size}px;" /></td></tr></table>`;
}

export function profilePhotoBadge(photoUrl: string, size = 52): string {
  if (!photoUrl || photoUrl === 'null' || photoUrl === 'undefined') return monogramBadge(size);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;overflow:hidden;background:#000;"><img src="${photoUrl}" alt="Profile" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:block;object-fit:cover;border-radius:${size}px;" /></td></tr></table>`;
}

export function lockIconBadge(size = 72): string {
  const inner = Math.round(size * 0.7);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="padding:6px;border:1px solid #C8A766;border-radius:${size + 12}px;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;background:#fff;border:1px solid #C8A76666;border-radius:${size}px;text-align:center;vertical-align:middle;line-height:${size}px;font-size:${inner}px;color:#1a1a1a;">&#128274;</td></tr></table></td></tr></table>`;
}

// ─── INQUIRY BOX ───

export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:24px 0;"><tr><td style="padding:20px 22px;background:#f0fdf4;border:2px solid #bbf7d0;border-radius:18px;text-align:center;"><p style="margin:0;font-size:14px;color:#333;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at<br/><a href="mailto:CONTACT@JBJ.AE" style="color:#1a1a1a;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p></td></tr></table>`;
}

// ─── TICKET SUPPORT (pure HTML icon) ───

export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:24px 0;"><tr><td style="padding:24px;background:linear-gradient(135deg,#fff5f5,#ffe8e8,#fef2f2);border:2px solid #e74c3c;border-radius:18px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td>${iconSupport(44)}</td></tr></table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#e74c3c;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p>
<a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">Submit a Ticket</a>
</td></tr></table>`;
}

// ─── RECOMMENDED CARDS (pure HTML icons) ───

function recommendedCard(title: string, href: string, iconHtml: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:16px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-align:center;box-shadow:0 6px 16px rgba(200,167,102,0.2),0 2px 4px rgba(0,0,0,0.05);">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td>${iconHtml}</td></tr></table>
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
</td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 28px;"><tr><td style="padding-top:34px;border-top:2px solid #C8A76633;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 18px;line-height:1.4;">Recommended For You</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, iconAiTools(28))}
${recommendedCard("Guides", `${SITE_URL}/guides`, iconGuides(28))}
${recommendedCard("Properties", `${SITE_URL}/properties`, iconProperties(28))}
</tr></table>
</td></tr></table>`;
}

// ─── BOOKS SHOWCASE (pure HTML, no images) ───

function bookCardHtml(title: string, subtitle: string, href: string, accentColor: string): string {
  return `<td width="50%" style="text-align:center;padding:6px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="background:linear-gradient(160deg,#1a1a1a 0%,#2a2a2a 60%,#333 100%);border-radius:10px;padding:28px 14px 24px;text-align:center;box-shadow:8px 10px 24px rgba(0,0,0,0.25),2px 2px 8px rgba(0,0,0,0.12);">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:40px;height:4px;background:${accentColor};border-radius:2px;"></td></tr></table>
<p style="margin:0 0 4px;font-size:14px;color:#fff;font-weight:800;letter-spacing:0.5px;line-height:1.3;">${title}</p>
<p style="margin:0;font-size:10px;color:${accentColor};font-weight:600;text-transform:uppercase;letter-spacing:1.5px;">${subtitle}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;border-collapse:separate;"><tr><td style="padding:4px 14px;border:1px solid ${accentColor}50;border-radius:10px;"><p style="margin:0;font-size:9px;color:${accentColor};font-weight:700;letter-spacing:1px;">EXPLORE</p></td></tr></table>
</td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:12px 0 24px;"><tr><td style="text-align:center;">
<p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 14px;">Explore Our Library</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
${bookCardHtml("Market<br/>Intelligence", "Dubai Reports", `${SITE_URL}/market-intelligence/reports`, "#C8A766")}
${bookCardHtml("Guides<br/>Library", "Expert Knowledge", `${SITE_URL}/guides`, "#8BB5E0")}
</tr></table>
</td></tr></table>`;
}

// ─── SUGGESTED ACTIONS ───

export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;"><tr>
<td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:12px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-align:center;box-shadow:0 4px 12px rgba(200,167,102,0.15);">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:6px;"><tr><td>${iconProperties(20)}</td></tr></table>
<span style="font-size:13px;color:#1a1a1a;font-weight:600;">Explore Properties</span>
</td></tr></table></a></td>
<td width="50%" style="padding:4px;"><a href="${SITE_URL}/ai-tools" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:12px 8px;background:#fff;border:2px solid #C8A766;border-radius:18px;text-align:center;box-shadow:0 4px 12px rgba(200,167,102,0.15);">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:6px;"><tr><td>${iconAiTools(20)}</td></tr></table>
<span style="font-size:13px;color:#1a1a1a;font-weight:600;">AI Tools</span>
</td></tr></table></a></td>
</tr></table>`;
}

// ─── FEEDBACK ───

export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:34px;"><tr><td style="padding-top:30px;border-top:2px solid #C8A76633;" align="center">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p>
<p style="color:#888;font-size:13px;margin:0 0 18px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center"><tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 26px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:2px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:10px 24px;border-radius:12px;font-weight:700;font-size:13px;">Take Survey</a></td>
</tr></table>
</td></tr></table>`;
}

// ─── SIGN OFF ───

export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:44px;"><tr><td>
<p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p>
<p style="font-size:19px;color:#C8A766;font-weight:800;margin:0;letter-spacing:0.4px;">${teamName.toUpperCase()}</p>
</td></tr></table>`;
}

// ─── READY TO GET STARTED ───

export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:18px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:2px solid #C8A766;border-radius:22px;overflow:hidden;box-shadow:0 10px 30px rgba(200,167,102,0.22),0 2px 8px rgba(0,0,0,0.08);">
<tr><td style="padding:28px 22px;text-align:center;">
<p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;color:#1a1a1a;">READY TO GET STARTED?</p>
<p style="color:#666;font-size:13px;margin:0 0 20px;">Connect with our expert team for personalized guidance.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="33%" style="text-align:center;padding:5px;vertical-align:top;"><a href="https://wa.me/971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;min-height:78px;background:#fff;border:2px solid #C8A766;border-radius:18px;box-shadow:0 7px 18px rgba(200,167,102,0.22),0 2px 4px rgba(0,0,0,0.06);text-align:center;">
<p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;font-weight:700;">WhatsApp</p>
<p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p>
</td></tr></table></a></td>
<td width="33%" style="text-align:center;padding:5px;vertical-align:top;"><a href="tel:+971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;min-height:78px;background:#fff;border:2px solid #C8A766;border-radius:18px;box-shadow:0 7px 18px rgba(200,167,102,0.22),0 2px 4px rgba(0,0,0,0.06);text-align:center;">
<p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;font-weight:700;">Call Us</p>
<p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p>
</td></tr></table></a></td>
<td width="33%" style="text-align:center;padding:5px;vertical-align:top;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;min-height:78px;background:#fff;border:2px solid #C8A766;border-radius:18px;box-shadow:0 7px 18px rgba(200,167,102,0.22),0 2px 4px rgba(0,0,0,0.06);text-align:center;">
<p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;font-weight:700;">Email</p>
<p style="color:#1a1a1a;font-size:11px;margin:0;font-weight:600;line-height:1.4;">CONTACT@JBJ.AE</p>
</td></tr></table></a></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td style="border-top:1px solid #C8A76650;"></td><td style="width:34px;text-align:center;"><span style="color:#C8A766;font-size:14px;">&#10022;</span></td><td style="border-top:1px solid #C8A76650;"></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr><td style="text-align:center;">
<p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;color:#1a1a1a;">&#10022; STAY IN THE LOOP &#10022;</p>
<p style="color:#666;font-size:12px;margin:0 0 14px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:2px solid #D7C29A;border-radius:30px;overflow:hidden;background:#fff;box-shadow:0 5px 14px rgba(200,167,102,0.16);"><tr>
<td style="padding:5px 8px 5px 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border:1px solid #E7D8BE;border-radius:20px;"><tr><td style="padding:8px 12px;"><span style="font-size:13px;color:#777;">Enter your email here</span></td></tr></table></td>
<td style="padding:4px 6px 4px 0;"><a href="${SITE_URL}/#ready-to-get-started" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:11px 18px;border:1px solid #D7C29A;border-radius:20px;font-weight:700;font-size:12px;letter-spacing:0.6px;">Continue &#10140;</a></td>
</tr></table>
</td></tr></table>
</td></tr></table>`;
}

// ─── DO NOT REPLY ───

export function doNotReplyNotice(): string {
  return `<tr><td style="padding:0 32px 16px;text-align:center;"><p style="margin:0;font-size:11px;color:#999;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p></td></tr>`;
}

// ─── PREMIUM FOOTER ───

export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}<tr><td style="background:#000;padding:36px 34px 32px;border-radius:0 0 24px 24px;text-align:center;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;">
<img src="${LOGO_URL}" alt="JBJ" width="60" style="width:60px;height:auto;display:block;margin:0 auto 14px;border-radius:60px;" />
<p style="color:#C8A766;font-size:16px;margin:0 0 6px;font-weight:700;letter-spacing:2px;">JBJ GLOBAL REAL ESTATE</p>
<p style="color:#888;font-size:12px;margin:0 0 18px;">Your Trusted Partner in Dubai Real Estate</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;"><tr><td style="border-top:1px solid #333;"></td></tr></table>
<p style="color:#C8A766;font-size:15px;margin:0 0 14px;font-weight:600;">Need assistance? We're here to help.</p>
<p style="margin:0 0 16px;"><a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">+971 56 591 1000</a><span style="color:#444;margin:0 14px;">|</span><a href="mailto:CONTACT@JBJ.AE" style="color:#fff;text-decoration:underline;font-size:14px;font-weight:600;">CONTACT@JBJ.AE</a></p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:16px;"><tr>
<td style="padding:0 8px;"><a href="https://www.instagram.com/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a></td>
<td style="padding:0 8px;"><a href="https://www.linkedin.com/company/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">LinkedIn</a></td>
<td style="padding:0 8px;"><a href="https://www.facebook.com/jbjglobalrealestate" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Facebook</a></td>
</tr></table>
<p style="color:#888;font-size:11px;margin:0 0 8px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
</td></tr>`;
}

// ─── PROGRESS STEPS ───

export function progressSteps(labels: [string, string, string], active: [boolean, boolean, boolean], checks: [boolean, boolean, boolean] = [false, false, false]): string {
  const makeStep = (num: string, label: string, isActive: boolean, isCheck: boolean) => {
    const bg = isActive ? "background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;" : "background:#e5e5e5;color:#999;";
    const textColor = isActive ? "color:#C8A766;font-weight:600;" : "color:#999;";
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:44px;height:44px;border-radius:44px;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:700;">${isCheck ? "&#10003;" : num}</td></tr></table><p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p></td>`;
  };
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>${makeStep("1", labels[0], active[0], checks[0])}${makeStep("2", labels[1], active[1], checks[1])}${makeStep("3", labels[2], active[2], checks[2])}</tr></table>`;
}

// ─── ARABIC DIVIDER ───

export function arabicDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 8px;"><tr><td style="border-top:2px solid #C8A76650;"></td></tr></table>`;
}

// ─── TEAM REPLY CARD ───

export function teamReplyCard(teamLabel: string, replyMessage: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${teamLabel}</p>
<div style="color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:18px;border-radius:14px;border:1px solid #e8e8e8;">${replyMessage}</div>
</td></tr></table>`;
}

// ─── INQUIRY STAGES ───

export function inquiryStages(currentStage: 'received' | 'reviewing' | 'responded'): string {
  const stages: [boolean, boolean, boolean] = [
    true,
    currentStage === 'reviewing' || currentStage === 'responded',
    currentStage === 'responded',
  ];
  return progressSteps(['Received', 'Reviewing', 'Responded'], stages, stages);
}

// ─── TICKET SUMMARY CARD ───

export function ticketSummaryCard(rows: Array<{label: string; value: string; highlight?: boolean}>): string {
  const rowsHtml = rows.map(r => {
    const valueStyle = r.highlight
      ? "padding:7px 0 7px 12px;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;"
      : "padding:7px 0 7px 12px;color:#1a1a1a;font-weight:600;font-size:13px;";
    return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-right:1px solid #C8A76630;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:2px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:20px;">
<p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Summary</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table>
</td></tr></table>`;
}

// ─── SHARED SECTIONS (appears ONCE after Arabic, always LTR) ───
// CRITICAL: This wraps in its own <tr><td> with explicit LTR direction
// so it renders correctly regardless of parent context.

export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `</td></tr>
<tr><td class="content-pad" style="padding:0 32px 32px;direction:ltr;text-align:left;">
${inquiryBox(context)}
${ticketSupportEmbed()}
${recommendedActionsHtml()}
${booksShowcaseHtml()}
${suggestedActionsHtml()}
${feedbackHtml(context)}
${readyToGetStartedHtml()}
${signOffHtml(teamName)}
</td></tr>`;
}

// ─── EMAIL SHELL ───

export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:24px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:24px;overflow:hidden;box-shadow:0 8px 32px rgba(200,167,102,0.22);">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
