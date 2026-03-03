const SITE_URL = "https://jbj.ae";
const ASSET_BASE_URL = "https://jbjglobalrealestate.lovable.app";
const LOGO_URL = `${ASSET_BASE_URL}/jbj-monogram-light-on-dark.png`;

export { LOGO_URL, SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Inline SVG Icons (Gmail iOS compatible) ───
// ALL icons are outline-only: fill="none", stroke only, no filled shapes
const SVG_ICONS = {
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V7a5 5 0 1 1 10 0v3"/><rect x="5" y="10" width="14" height="11" rx="2"/><circle cx="12" cy="15" r="1.5"/><path d="M12 16.5v2"/></svg>`,
  // Headset for ticket support: WHITE stroke on red bg
  headsetWhite: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  // All other icons: outline-only, black stroke, NO fill
  aiTools: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
  guides: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h4"/></svg>`,
  properties: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>`,
  survey: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  review: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

function sectionDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 12px;"><tr><td style="height:1px;background:linear-gradient(90deg,transparent,#C8A76640,transparent);"></td></tr></table>`;
}

export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000;padding:28px 28px 24px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="190" style="max-width:190px;height:auto;display:block;margin:0 auto 12px;" />
<p style="color:#C8A766;margin:0;font-size:13px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:20px 26px;text-align:center;">
<p style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">${departmentLabel}</p>
</td></tr>`;
}

export function monogramBadge(size = 52): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;background:#000;text-align:center;vertical-align:middle;overflow:hidden;"><img src="${LOGO_URL}" alt="JBJ" width="${Math.round(size * 0.84)}" style="display:block;width:${Math.round(size * 0.84)}px;height:${Math.round(size * 0.84)}px;margin:0 auto;object-fit:contain;" /></td></tr></table>`;
}

export function profilePhotoBadge(photoUrl: string, size = 52): string {
  if (!photoUrl || photoUrl === "null" || photoUrl === "undefined") return monogramBadge(size);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;overflow:hidden;background:#000;"><img src="${photoUrl}" alt="Profile" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:block;object-fit:cover;border-radius:${size}px;"/></td></tr></table>`;
}

export function lockIconBadge(size = 74): string {
  const innerSize = Math.round(size * 0.86);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="padding:7px;border-radius:${size + 16}px;border:1px solid #C8A766;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border-radius:${size}px;border:1px solid #C8A76699;background:#fff;text-align:center;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${innerSize}px;height:${innerSize}px;border-radius:${innerSize}px;border:1px solid #E5D2B0;background:#fff;text-align:center;vertical-align:middle;">${SVG_ICONS.lock}</td></tr></table></td></tr></table></td></tr></table>`;
}

export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0 16px;"><tr><td style="padding:18px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;text-align:center;"><p style="margin:0;font-size:14px;color:#1f2937;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at<br/><a href="mailto:CONTACT@JBJ.AE" style="color:#111827;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p></td></tr></table>`;
}

// Ticket support: RED filled box with WHITE headset icon
export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 22px;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td style="width:48px;height:48px;background:#dc2626;border-radius:14px;border:2px solid #b91c1c;text-align:center;vertical-align:middle;line-height:48px;">${SVG_ICONS.headsetWhite}</td></tr></table><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">Submit a Ticket</a></td></tr></table>`;
}

export function ticketSupportEmbedAr(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 22px;direction:rtl;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td style="width:48px;height:48px;background:#dc2626;border-radius:14px;border:2px solid #b91c1c;text-align:center;vertical-align:middle;line-height:48px;">${SVG_ICONS.headsetWhite}</td></tr></table><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">دعم على مدار الساعة</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">هل تحتاج مساعدة؟ افتح تذكرة دعم</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">فريقنا يرد عادةً خلال ٢٤ ساعة</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">إرسال تذكرة</a></td></tr></table>`;
}

function recommendedCard(title: string, href: string, iconSvg: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:18px 8px;background:#fff;border:1px solid #1a1a1a;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td style="width:52px;height:52px;background:#fff;border:1.5px solid #1a1a1a;border-radius:52px;text-align:center;vertical-align:middle;">${iconSvg}</td></tr></table><p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p></td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 18px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, SVG_ICONS.aiTools)}${recommendedCard("Guides", `${SITE_URL}/guides`, SVG_ICONS.guides)}${recommendedCard("Properties", `${SITE_URL}/properties`, SVG_ICONS.properties)}</tr></table></td></tr></table>`;
}

function book3dCover(title: string, subtitle: string, href: string, accentColor: string): string {
  return `<td width="50%" style="vertical-align:top;padding:6px;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:0;text-align:center;">
<div style="display:inline-block;position:relative;width:140px;height:170px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;width:140px;height:170px;">
<tr><td style="background:linear-gradient(135deg,#1a1a1a,#111,#1a1a1a);border:1px solid #C8A766;border-radius:8px;padding:0;vertical-align:top;position:relative;box-shadow:8px 8px 24px rgba(0,0,0,0.5),-2px -2px 8px rgba(200,167,102,0.08);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;background:linear-gradient(90deg,#C8A766,#B8956E);border-radius:8px 8px 0 0;"></td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:16px 12px 10px;text-align:center;">
<p style="margin:0 0 4px;font-size:9px;color:#C8A766;text-transform:uppercase;letter-spacing:2px;font-weight:700;">★ 2026 Edition</p>
<p style="margin:0 0 6px;font-size:14px;color:#fff;font-weight:800;line-height:1.2;">${title}</p>
<p style="margin:0 0 8px;font-size:13px;color:${accentColor};font-weight:700;line-height:1.2;">${subtitle}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:30px;height:2px;background:linear-gradient(90deg,#C8A766,#B8956E);"></td></tr></table>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:6px 12px 12px;text-align:center;">
<p style="margin:0;font-size:8px;color:#666;text-transform:uppercase;letter-spacing:1.5px;">JBJ Global Real Estate</p>
</td></tr></table>
</td></tr>
</table>
</div>
<p style="margin:10px 0 2px;color:#1a1a1a;font-size:13px;font-weight:700;">${title}</p>
<p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p>
</td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${book3dCover("UAE Real Estate", "Market Intelligence", `${SITE_URL}/market-intelligence/reports`, "#C8A766")}${book3dCover("Expert Knowledge", "Guides Library", `${SITE_URL}/guides`, "#C8A766")}</tr></table></td></tr></table>`;
}

export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr><td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#000;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#C8A766;font-weight:700;letter-spacing:0.5px;">Explore Properties</span></td></tr></table></a></td><td width="50%" style="padding:4px;"><a href="${SITE_URL}/my-dashboard" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:700;letter-spacing:0.5px;">Discover More</span></td></tr></table></a></td></tr></table>`;
}

export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center"><p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p><p style="color:#888;font-size:13px;margin:0 0 14px;">Help us improve by sharing your experience</p><table cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">${SVG_ICONS.review} Leave a Review</a></td><td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:1px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:700;font-size:13px;">${SVG_ICONS.survey} Take Survey</a></td></tr></table></td></tr></table>`;
}

export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr><td><p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p><p style="font-size:19px;color:#C8A766;font-weight:800;margin:0;letter-spacing:0.4px;">${teamName.toUpperCase()}</p></td></tr></table>`;
}

export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:1px solid #C8A766;border-radius:18px;overflow:hidden;"><tr><td style="padding:24px 18px;text-align:center;"><p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;color:#1a1a1a;">READY TO GET STARTED?</p><p style="color:#666;font-size:13px;margin:0 0 18px;">Connect with our expert team for personalized guidance.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="https://wa.me/971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="tel:+971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td></tr><tr><td colspan="2" style="text-align:center;padding:5px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">CONTACT@JBJ.AE</p></td></tr></table></a></td></tr></table>${sectionDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;"><p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;color:#1a1a1a;">STAY IN THE LOOP</p><p style="color:#666;font-size:12px;margin:0 0 12px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:1px solid #D7C29A;border-radius:24px;overflow:hidden;background:#fff;"><tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:10px 14px;"><span style="font-size:13px;color:#777;">Enter your email here</span></td><td style="padding:5px;"><a href="${SITE_URL}/#ready-to-get-started" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:10px 18px;border-radius:18px;font-weight:700;font-size:12px;letter-spacing:0.5px;">Continue &#10132;</a></td></tr></table></td></tr></table></td></tr></table></td></tr></table>`;
}

export function doNotReplyNotice(): string {
  return `<tr><td style="padding:10px 0 0;text-align:center;"><p style="margin:0;font-size:11px;color:#8a8a8a;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p></td></tr>`;
}

export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#000;overflow:hidden;"><tr><td style="padding:30px 26px 28px;text-align:center;"><img src="${LOGO_URL}" alt="JBJ" width="130" style="width:130px;height:auto;display:block;margin:0 auto 12px;border-radius:130px;" /><p style="color:#C8A766;font-size:16px;margin:0 0 6px;font-weight:700;letter-spacing:1.8px;">JBJ GLOBAL REAL ESTATE</p><p style="color:#9ca3af;font-size:12px;margin:0 0 16px;">Your Trusted Partner in Dubai Real Estate</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="border-top:1px solid #2f2f2f;"></td></tr></table><p style="margin:0 0 14px;"><a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">+971 56 591 1000</a><span style="color:#4b5563;margin:0 12px;">|</span><a href="mailto:CONTACT@JBJ.AE" style="color:#fff;text-decoration:underline;font-size:14px;font-weight:600;">CONTACT@JBJ.AE</a></p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;"><tr><td style="padding:0 8px;"><a href="https://www.instagram.com/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a></td><td style="padding:0 8px;"><a href="https://www.linkedin.com/company/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">LinkedIn</a></td><td style="padding:0 8px;"><a href="https://www.facebook.com/jbjglobalrealestate" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Facebook</a></td></tr></table><p style="color:#9ca3af;font-size:11px;margin:0 0 8px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p><p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p></td></tr></table></td></tr>`;
}

export function progressSteps(labels: [string, string, string], active: [boolean, boolean, boolean], checks: [boolean, boolean, boolean] = [false, false, false]): string {
  const makeStep = (num: string, label: string, isActive: boolean, isCheck: boolean) => {
    const bg = isActive ? "background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;" : "background:#e5e5e5;color:#999;";
    const textColor = isActive ? "color:#C8A766;font-weight:600;" : "color:#999;";
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:44px;height:44px;border-radius:44px;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:700;">${isCheck ? "&#10003;" : num}</td></tr></table><p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p></td>`;
  };
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>${makeStep("1", labels[0], active[0], checks[0])}${makeStep("2", labels[1], active[1], checks[1])}${makeStep("3", labels[2], active[2], checks[2])}</tr></table>`;
}

export function arabicDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 14px;"><tr><td style="border-top:2px solid #C8A76655;"></td></tr></table>`;
}

export function goldDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 16px;"><tr><td style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,transparent);"></td></tr></table>`;
}

export function teamReplyCard(teamLabel: string, replyMessage: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${teamLabel}</p><div style="color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:18px;border-radius:14px;border:1px solid #ece6db;">${replyMessage}</div></td></tr></table>`;
}

export function inquiryStages(currentStage: "received" | "reviewing" | "responded"): string {
  const stages: [boolean, boolean, boolean] = [
    true,
    currentStage === "reviewing" || currentStage === "responded",
    currentStage === "responded",
  ];
  return progressSteps(["Received", "Reviewing", "Responded"], stages, stages);
}

export function ticketSummaryCard(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const valueStyle = r.highlight
        ? "padding:7px 0 7px 12px;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;"
        : "padding:7px 0 7px 12px;color:#1a1a1a;font-weight:600;font-size:13px;";
      return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-right:1px solid #C8A76630;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Summary</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>`;
}

export function ticketSummaryCardAr(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const valueStyle = r.highlight
        ? "padding:7px 12px 7px 0;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;"
        : "padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;";
      return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-left:1px solid #C8A76630;padding-left:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;direction:rtl;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">ملخص</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>`;
}

/**
 * LOCKED GLOBAL SECTIONS — identical across ALL emails.
 * Structure: Gold divider → Green inquiry box → Support ticket → Recommended → Books → Suggested → Feedback → Ready to start → Sign off
 */
export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `${goldDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction:ltr;text-align:left;"><tr><td>${inquiryBox(context)}${ticketSupportEmbed()}${recommendedActionsHtml()}${booksShowcaseHtml()}${suggestedActionsHtml()}${feedbackHtml(context)}${readyToGetStartedHtml()}${signOffHtml(teamName)}</td></tr></table>`;
}

/**
 * emailShell — ONE single unified layout.
 * Header + Body + Footer in ONE continuous card with no visual breaks.
 * The entire email sits in a single wrapper table — no splits, no gaps.
 * Footer flows edge-to-edge at the bottom of the same card.
 */
export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}img{display:block;border:0;outline:none;text-decoration:none;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:22px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:22px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:18px;overflow:hidden;">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
