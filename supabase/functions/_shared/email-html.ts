const SITE_URL = "https://jbj.ae";
const ASSET_BASE_URL = "https://jbjglobalrealestate.lovable.app";
const LOGO_URL = `${ASSET_BASE_URL}/jbj-monogram-light-on-dark.png`;
const ICON_BASE_URL = `${ASSET_BASE_URL}/email-icons`;
const BOOK_BASE_URL = `${ASSET_BASE_URL}/email-books`;

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
  aiTools: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
  guides: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h4"/></svg>`,
  properties: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>`,
  survey: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  review: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  // Social media icons — gold champagne stroke, no fill
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.35 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
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

// Ticket support: RED filled CIRCLE with WHITE headset icon
export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 22px;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:52px;text-align:center;vertical-align:middle;"><img src="${ICON_BASE_URL}/headphones-white.svg" alt="Support" width="24" height="24" style="display:block;width:24px;height:24px;margin:14px auto;" /></td></tr></table><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">Submit a Ticket</a></td></tr></table>`;
}

export function ticketSupportEmbedAr(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 22px;direction:rtl;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:52px;text-align:center;vertical-align:middle;"><img src="${ICON_BASE_URL}/headphones-white.svg" alt="الدعم" width="24" height="24" style="display:block;width:24px;height:24px;margin:14px auto;" /></td></tr></table><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">دعم على مدار الساعة</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">هل تحتاج مساعدة؟ افتح تذكرة دعم</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">فريقنا يرد عادةً خلال ٢٤ ساعة</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">إرسال تذكرة</a></td></tr></table>`;
}

// Recommended cards: circle icon frame only, NO square border around card
function recommendedCard(title: string, href: string, iconPath: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:18px 8px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#fff;border:1.5px solid #1a1a1a;border-radius:52px;text-align:center;vertical-align:middle;"><img src="${iconPath}" alt="${title}" width="24" height="24" style="display:block;width:24px;height:24px;margin:14px auto;" /></td></tr></table><p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p></td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 18px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, `${ICON_BASE_URL}/ai-tools.svg`)}${recommendedCard("Guides", `${SITE_URL}/guides`, `${ICON_BASE_URL}/guides.svg`)}${recommendedCard("Properties", `${SITE_URL}/properties`, `${ICON_BASE_URL}/properties.svg`)}</tr></table></td></tr></table>`;
}

function book3dCover(title: string, subtitle: string, href: string, imageUrl: string): string {
  return `<td width="50%" style="vertical-align:top;padding:6px;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:0;text-align:center;"><img src="${imageUrl}" alt="${title}" width="140" style="width:140px;height:170px;object-fit:cover;display:block;margin:0 auto;border-radius:8px;border:1px solid #C8A766;box-shadow:8px 8px 24px rgba(0,0,0,0.35);" /><p style="margin:10px 0 2px;color:#1a1a1a;font-size:13px;font-weight:700;">${title}</p><p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p></td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${book3dCover("Market Intelligence Report", "UAE Real Estate", `${SITE_URL}/market-intelligence`, `${BOOK_BASE_URL}/market-intelligence-cover.jpg`)}${book3dCover("Guides Library", "2026 Edition", `${SITE_URL}/guides`, `${BOOK_BASE_URL}/guides-library-cover.jpg`)}</tr></table></td></tr></table>`;
}

export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr><td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#000;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#C8A766;font-weight:700;letter-spacing:0.5px;">Explore Properties</span></td></tr></table></a></td><td width="50%" style="padding:4px;"><a href="${SITE_URL}/my-dashboard" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:700;letter-spacing:0.5px;">Discover More</span></td></tr></table></a></td></tr></table>`;
}

export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center"><p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p><p style="color:#888;font-size:13px;margin:0 0 14px;">Help us improve by sharing your experience</p><table cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">${SVG_ICONS.review} Leave a Review</a></td><td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:1px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:700;font-size:13px;">${SVG_ICONS.survey} Take Survey</a></td></tr></table></td></tr></table>`;
}

/**
 * signOffHtml — Company name on line 1, team name on line 2.
 * RULE: "JBJ Global Real Estate" always on its own line. The department/team goes on the next line.
 */
export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  const base = "JBJ Global Real Estate";
  let teamSuffix = "Team";
  if (teamName.toLowerCase().startsWith(base.toLowerCase())) {
    teamSuffix = teamName.substring(base.length).trim() || "Team";
  } else {
    teamSuffix = teamName;
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;margin-bottom:22px;"><tr><td><p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p><p style="font-size:19px;color:#C8A766;font-weight:800;margin:0 0 2px;letter-spacing:0.4px;">JBJ GLOBAL REAL ESTATE</p><p style="font-size:16px;color:#C8A766;font-weight:700;margin:0;letter-spacing:0.4px;">${teamSuffix.toUpperCase()}</p></td></tr></table>`;
}

export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:1px solid #C8A766;border-radius:18px;overflow:hidden;"><tr><td style="padding:24px 18px;text-align:center;"><p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;color:#1a1a1a;">READY TO GET STARTED?</p><p style="color:#666;font-size:13px;margin:0 0 18px;">Connect with our expert team for personalized guidance.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="https://wa.me/971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="tel:+971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td></tr><tr><td colspan="2" style="text-align:center;padding:5px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">CONTACT@JBJ.AE</p></td></tr></table></a></td></tr></table>${sectionDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;"><p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;color:#1a1a1a;">STAY IN THE LOOP</p><p style="color:#666;font-size:12px;margin:0 0 12px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:1px solid #D7C29A;border-radius:24px;overflow:hidden;background:#fff;"><tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:10px 14px;"><span style="font-size:13px;color:#777;">Enter your email here</span></td><td style="padding:5px;"><a href="${SITE_URL}/#ready-to-get-started" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:10px 18px;border-radius:18px;font-weight:700;font-size:12px;letter-spacing:0.5px;">Continue &#10132;</a></td></tr></table></td></tr></table></td></tr></table></td></tr></table>`;
}

export function doNotReplyNotice(): string {
  return `<tr><td style="padding:10px 0 0;text-align:center;"><p style="margin:0;font-size:11px;color:#8a8a8a;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p></td></tr>`;
}

/**
 * LOCKED FOOTER — Social links with gold champagne SVG icons on black background.
 * Instagram, Facebook, LinkedIn, YouTube, TikTok — each with its own SVG icon.
 * Gold borders, gold icons. This footer is LOCKED and must appear on ALL emails.
 */
function socialLinksFooter(): string {
  const links = [
    { label: "Instagram", icon: `${ICON_BASE_URL}/social-instagram.svg`, url: "https://www.instagram.com/jbj.ae" },
    { label: "Facebook", icon: `${ICON_BASE_URL}/social-facebook.svg`, url: "https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr" },
    { label: "LinkedIn", icon: `${ICON_BASE_URL}/social-linkedin.svg`, url: "https://www.linkedin.com/company/jbj-global-real-estate/" },
    { label: "YouTube", icon: `${ICON_BASE_URL}/social-youtube.svg`, url: "https://youtube.com/@jbjglobalrealestate" },
    { label: "TikTok", icon: `${ICON_BASE_URL}/social-tiktok.svg`, url: "https://www.tiktok.com/@jbj.ae" },
  ];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;"><tr>${links.map(l => `<td style="padding:0 4px;"><a href="${l.url}" style="display:inline-block;background:#f5f0e6;padding:6px 10px;border-radius:999px;text-decoration:none;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding-right:5px;"><img src="${l.icon}" alt="${l.label}" width="14" height="14" style="display:block;width:14px;height:14px;" /></td><td style="color:#8b6a3d;font-size:10px;font-weight:700;letter-spacing:0.4px;">${l.label}</td></tr></table></a></td>`).join("")}</tr></table>`;
}

export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#000;overflow:hidden;"><tr><td style="padding:32px 26px 28px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ" width="130" style="width:130px;height:auto;display:block;margin:0 auto 12px;border-radius:130px;" />
<p style="color:#C8A766;font-size:16px;margin:0 0 4px;font-weight:700;letter-spacing:1.8px;">JBJ Global Real Estate</p>
<p style="color:#9ca3af;font-size:12px;font-style:italic;margin:0 0 16px;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#C8A766;font-size:20px;font-weight:800;margin:0 0 6px;letter-spacing:0.5px;">175+ Countries &bull; 2,400+ Cities</p>
<p style="color:#C8A766;font-size:20px;font-weight:800;margin:0 0 18px;letter-spacing:0.5px;">&bull; 12,000+ Clients Served</p>
<p style="color:#C8A766;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">FOLLOW US &middot; STAY IN THE LOOP</p>
${socialLinksFooter()}
<p style="color:#9ca3af;font-size:12px;margin:0 0 4px;line-height:1.6;">You can turn email notifications on/off anytime from your account settings.</p>
<p style="color:#9ca3af;font-size:12px;margin:0 0 14px;line-height:1.6;">You can unsubscribe or resubscribe anytime.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;"><tr>
<td style="padding:0 8px;"><a href="${SITE_URL}/unsubscribe" style="color:#C8A766;font-size:12px;text-decoration:underline;">Unsubscribe</a></td>
<td style="color:#4b5563;font-size:12px;">|</td>
<td style="padding:0 8px;"><a href="${SITE_URL}/email-preferences" style="color:#C8A766;font-size:12px;text-decoration:underline;">Manage Preferences</a></td>
<td style="color:#4b5563;font-size:12px;">|</td>
<td style="padding:0 8px;"><a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;font-size:12px;text-decoration:underline;">Contact Us</a></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="border-top:1px solid #2f2f2f;"></td></tr></table>
<p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:0 0 4px;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
<p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">Dubai, United Arab Emirates</p>
<p style="color:#9ca3af;font-size:10px;margin:0;">You are receiving this email because you opted in on <a href="${SITE_URL}" style="color:#C8A766;text-decoration:underline;">jbj.ae</a>.</p>
</td></tr></table></td></tr>`;
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
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 18px;"><tr><td style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);"></td></tr></table>`;
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

/**
 * Ticket summary card with a gold divider after it.
 */
export function ticketSummaryCard(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const valueStyle = r.highlight
        ? "padding:7px 0 7px 12px;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;"
        : "padding:7px 0 7px 12px;color:#1a1a1a;font-weight:600;font-size:13px;";
      return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-right:1px solid #C8A76630;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:16px;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Summary</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
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
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:16px;direction:rtl;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">ملخص</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
}

/**
 * Rate Your Experience card — ROUNDED borders matching summary card style.
 */
export function rateExperienceCard(surveyLink: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">Rate Your Experience</p>
<p style="color:#666;font-size:13px;margin:0 0 16px;">Help us improve by sharing your feedback</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
</tr></table>
<p style="margin:12px 0 0;"><a href="${surveyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">Complete Survey &amp; Earn 50 Points</a></p>
</td></tr></table>`;
}

export function rateExperienceCardAr(surveyLink: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;direction:rtl;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">قيّم تجربتك</p>
<p style="color:#666;font-size:13px;margin:0 0 16px;">ساعدنا في التحسين من خلال مشاركة ملاحظاتك</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
<tr>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
</tr></table>
<p style="margin:12px 0 0;"><a href="${surveyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">أكمل الاستبيان واحصل على ٥٠ نقطة</a></p>
</td></tr></table>`;
}

/**
 * Issue Not Resolved card — ROUNDED borders (18px), matching summary card style.
 */
export function issueNotResolvedCard(reopenUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:25px;text-align:center;">
<p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">Issue Not Resolved?</p>
<p style="color:#666;font-size:13px;margin:0 0 15px;">If your issue persists, you can reopen this ticket anytime.</p>
<a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
</td></tr></table>`;
}

export function issueNotResolvedCardAr(reopenUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0;direction:rtl;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:25px;text-align:center;">
<p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">المشكلة لم تُحل؟</p>
<p style="color:#666;font-size:13px;margin:0 0 15px;">إذا استمرت المشكلة، يمكنك إعادة فتح هذه التذكرة في أي وقت.</p>
<a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">إعادة فتح التذكرة</a>
</td></tr></table>`;
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
 * Header + Body + LOCKED Footer in ONE continuous card with no visual breaks.
 * The LOCKED footer MUST appear on every email. No exceptions.
 */
export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}img{display:block;border:0;outline:none;text-decoration:none;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:22px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:22px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:18px;overflow:hidden;">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
