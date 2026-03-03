const SITE_URL = "https://jbj.ae";
const ASSET_BASE = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets";
const LOGO_URL = `${ASSET_BASE}/jbj-monogram-light-on-dark.png`;
const BOOK_MARKET = `${ASSET_BASE}/email-books%2Fmarket-intelligence-cover.jpg`;
const BOOK_GUIDES = `${ASSET_BASE}/email-books%2Fguides-library-cover.jpg`;

export { LOGO_URL, SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ─── Inline SVG Icons (100% inline — no external URLs, guaranteed rendering) ───
const SVG = {
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V7a5 5 0 1 1 10 0v3"/><rect x="5" y="10" width="14" height="11" rx="2"/><circle cx="12" cy="15" r="1.5"/><path d="M12 16.5v2"/></svg>`,
  headsetWhite: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  aiTools: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
  guides: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5z"/><path d="M18 6h1a2 2 0 0 1 2 2v9"/><path d="M8 8h6"/><path d="M8 12h6"/><path d="M8 16h4"/></svg>`,
  properties: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>`,
  review: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A766" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  survey: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  // Social icons (gold stroke for pearl circles)
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.35 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
};

// ─── Dividers ───
function sectionDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 12px;"><tr><td style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,transparent);"></td></tr></table>`;
}

export function goldDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 20px;"><tr><td style="height:3px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);"></td></tr></table>`;
}

export function arabicDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 14px;"><tr><td style="border-top:2px solid #C8A76655;"></td></tr></table>`;
}

// ─── Header ───
export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000;padding:28px 28px 24px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ Global Real Estate" width="190" style="max-width:190px;height:auto;display:block;margin:0 auto 12px;" />
<p style="color:#C8A766;margin:0;font-size:13px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:20px 26px;text-align:center;">
<p style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">${departmentLabel}</p>
</td></tr>`;
}

// ─── Badges ───
export function monogramBadge(size = 52): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;background:#000;text-align:center;vertical-align:middle;overflow:hidden;"><img src="${LOGO_URL}" alt="JBJ" width="${Math.round(size * 0.84)}" style="display:block;width:${Math.round(size * 0.84)}px;height:${Math.round(size * 0.84)}px;margin:0 auto;object-fit:contain;" /></td></tr></table>`;
}

export function profilePhotoBadge(photoUrl: string, size = 52): string {
  if (!photoUrl || photoUrl === "null" || photoUrl === "undefined") return monogramBadge(size);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;overflow:hidden;background:#000;"><img src="${photoUrl}" alt="Profile" width="${size}" height="${size}" style="width:${size}px;height:${size}px;display:block;object-fit:cover;border-radius:${size}px;"/></td></tr></table>`;
}

export function lockIconBadge(size = 74): string {
  const innerSize = Math.round(size * 0.86);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="padding:7px;border-radius:${size + 16}px;border:1px solid #C8A766;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border-radius:${size}px;border:1px solid #C8A76699;background:#fff;text-align:center;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${innerSize}px;height:${innerSize}px;border-radius:${innerSize}px;border:1px solid #E5D2B0;background:#fff;text-align:center;vertical-align:middle;">${SVG.lock}</td></tr></table></td></tr></table></td></tr></table>`;
}

// ─── Inquiry Box ───
export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0 18px;"><tr><td style="padding:18px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;text-align:center;"><p style="margin:0;font-size:14px;color:#1f2937;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at<br/><a href="mailto:CONTACT@JBJ.AE" style="color:#111827;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p></td></tr></table>`;
}

// ─── Ticket Support (white headset inside red circle — INLINE SVG) ───
export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 24px;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:52px;text-align:center;vertical-align:middle;line-height:52px;"><span style="color:#ffffff;font-size:26px;font-weight:700;">☎</span></td></tr></table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p>
<a href="${SITE_URL}/contact-support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:18px;font-weight:700;font-size:13px;">Submit a Ticket</a>
</td></tr></table>`;
}

export function ticketSupportEmbedAr(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 24px;direction:rtl;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:52px;text-align:center;vertical-align:middle;line-height:52px;"><span style="color:#ffffff;font-size:26px;font-weight:700;">☎</span></td></tr></table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;letter-spacing:2px;">دعم على مدار الساعة</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">هل تحتاج مساعدة؟ افتح تذكرة دعم</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">فريقنا يرد عادةً خلال ٢٤ ساعة</p>
<a href="${SITE_URL}/contact-support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:18px;font-weight:700;font-size:13px;">إرسال تذكرة</a>
</td></tr></table>`;
}

// ─── Recommended Actions (INLINE SVGs in circular frames) ───
function recommendedCard(title: string, href: string, iconEmoji: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:18px 8px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#fff;border:1.5px solid #1a1a1a;border-radius:52px;text-align:center;vertical-align:middle;line-height:52px;"><span style="font-size:23px;line-height:1;">${iconEmoji}</span></td></tr></table>
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
</td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 18px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, "🤖")}${recommendedCard("Guides", `${SITE_URL}/guides`, "📚")}${recommendedCard("Properties", `${SITE_URL}/properties`, "🏠")}</tr></table></td></tr></table>`;
}

// ─── Books (JPG from storage — email clients handle JPGs reliably) ───
function book3dCover(title: string, subtitle: string, href: string, imageUrl: string): string {
  return `<td width="50%" style="vertical-align:top;padding:6px;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:0;text-align:center;">
<img src="${imageUrl}" alt="${title}" width="150" style="width:150px;height:180px;object-fit:cover;display:block;margin:0 auto;border-radius:12px;border:1px solid #C8A766;box-shadow:8px 8px 24px rgba(0,0,0,0.35);" />
<p style="margin:10px 0 2px;color:#1a1a1a;font-size:13px;font-weight:700;">${title}</p>
<p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p>
</td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${book3dCover("Market Intelligence Report", "UAE Real Estate", `${SITE_URL}/market-intelligence`, BOOK_MARKET)}${book3dCover("Guides Library", "2026 Edition", `${SITE_URL}/guides`, BOOK_GUIDES)}</tr></table></td></tr></table>`;
}

// ─── Suggested Actions ───
export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr><td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:700;letter-spacing:0.5px;">Explore Properties</span></td></tr></table></a></td><td width="50%" style="padding:4px;"><a href="${SITE_URL}/my-dashboard" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#1a1a1a;font-weight:700;letter-spacing:0.5px;">Discover More</span></td></tr></table></a></td></tr></table>`;
}

// ─── Feedback ───
export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center">
<p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p>
<p style="color:#888;font-size:13px;margin:0 0 14px;">Help us improve by sharing your experience</p>
<table cellpadding="0" cellspacing="0" align="center"><tr>
<td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td>
<td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:1px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:700;font-size:13px;">Take Survey</a></td>
</tr></table></td></tr></table>`;
}

// ─── Sign Off ───
export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  const base = "JBJ Global Real Estate";
  let teamSuffix = "Team";
  if (teamName.toLowerCase().startsWith(base.toLowerCase())) {
    teamSuffix = teamName.substring(base.length).trim() || "Team";
  } else {
    teamSuffix = teamName;
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;margin-bottom:22px;"><tr><td>
<p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p>
<p style="font-size:19px;color:#C8A766;font-weight:800;margin:0 0 2px;letter-spacing:0.4px;">JBJ GLOBAL REAL ESTATE</p>
<p style="font-size:17px;color:#E7D7B8;font-weight:800;margin:0;letter-spacing:0.6px;text-shadow:0 1px 0 #8f6e3f,0 2px 6px rgba(200,167,102,0.25);">${teamSuffix.toUpperCase()}</p>
</td></tr></table>`;
}

// ─── Ready to Get Started ───
export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:18px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:1px solid #C8A766;border-radius:18px;overflow:hidden;"><tr><td style="padding:24px 18px;text-align:center;">
<p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;color:#1a1a1a;">READY TO GET STARTED?</p>
<p style="color:#666;font-size:13px;margin:0 0 18px;">Connect with our expert team for personalized guidance.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="https://api.whatsapp.com/send?phone=971565911000&text=Hello%20JBJ%20Global%20Real%20Estate" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td>
<td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="tel:+971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td>
</tr><tr><td colspan="2" style="text-align:center;padding:5px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">CONTACT@JBJ.AE</p></td></tr></table></a></td></tr></table>
${sectionDivider()}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;">
<p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;color:#1a1a1a;">STAY IN THE LOOP</p>
<p style="color:#666;font-size:12px;margin:0 0 12px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:1px solid #D7C29A;border-radius:24px;overflow:hidden;background:#fff;"><tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:10px 14px;"><span style="font-size:13px;color:#777;">Enter your email here</span></td><td style="padding:5px;"><a href="${SITE_URL}/#footer" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:10px 18px;border-radius:18px;font-weight:700;font-size:12px;letter-spacing:0.5px;">Continue &#10132;</a></td></tr></table></td></tr></table>
</td></tr></table>
</td></tr></table>`;
}

// ─── Footer (inline SVG social icons) ───
function socialLinksFooter(): string {
  const links: Array<{svg: string; url: string; alt: string}> = [
    { svg: SVG.instagram, url: "https://www.instagram.com/jbj.ae", alt: "Instagram" },
    { svg: SVG.facebook, url: "https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr", alt: "Facebook" },
    { svg: SVG.linkedin, url: "https://www.linkedin.com/company/jbj-global-real-estate/", alt: "LinkedIn" },
    { svg: SVG.youtube, url: "https://youtube.com/@jbjglobalrealestate", alt: "YouTube" },
    { svg: SVG.tiktok, url: "https://www.tiktok.com/@jbj.ae", alt: "TikTok" },
  ];

  const item = (svg: string, url: string) =>
    `<td style="padding:0 5px 8px;"><a href="${url}" style="display:inline-block;width:38px;height:38px;background:radial-gradient(circle at 30% 25%,#ffffff,#f2efe8 55%,#e4dccf 100%);border:1px solid #E7D7B8;border-radius:38px;text-decoration:none;line-height:38px;text-align:center;vertical-align:middle;box-shadow:inset 0 1px 1px rgba(255,255,255,0.9),0 2px 8px rgba(0,0,0,0.2);">${svg}</a></td>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;"><tr>${links.map((l) => item(l.svg, l.url)).join("")}</tr></table>`;
}

export function sharedFooterHtml(): string {
  return `<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#000;overflow:hidden;"><tr><td style="padding:40px 26px 30px;text-align:center;">
<img src="${LOGO_URL}" alt="JBJ" width="190" style="width:190px;height:auto;display:block;margin:-8px auto 12px;border-radius:190px;" />
<p style="color:#C8A766;font-size:16px;margin:0 0 8px;font-weight:700;letter-spacing:1.8px;">JBJ Global Real Estate</p>
<table role="presentation" width="220" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 10px;"><tr><td style="border-top:1px solid #C8A76655;"></td></tr></table>
<p style="color:#d8cfbf;font-size:12px;font-style:italic;margin:0 0 16px;">The Only Global AI-Powered Real Estate Intelligence Platform</p>
<p style="color:#C8A766;font-size:20px;font-weight:800;margin:0 0 6px;letter-spacing:0.5px;">175+ Countries &bull; 2,400+ Cities</p>
<p style="color:#C8A766;font-size:20px;font-weight:800;margin:0 0 18px;letter-spacing:0.5px;">&bull; 12,000+ Clients Served</p>
<p style="color:#C8A766;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:0 0 14px;">FOLLOW US &middot; STAY IN THE LOOP</p>
${socialLinksFooter()}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;"><tr>
<td style="padding:0 8px;"><a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;font-size:12px;text-decoration:underline;">Contact Us</a></td>
</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="border-top:1px solid #2f2f2f;"></td></tr></table>
<p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p>
<p style="color:#C8A766;font-size:11px;margin:0 0 4px;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
<p style="color:#9ca3af;font-size:11px;margin:0 0 4px;">Dubai, United Arab Emirates</p>
</td></tr></table></td></tr>`;
}

// ─── Progress Steps ───
export function progressSteps(labels: [string, string, string], active: [boolean, boolean, boolean], checks: [boolean, boolean, boolean] = [false, false, false]): string {
  const makeStep = (num: string, label: string, isActive: boolean, isCheck: boolean) => {
    const bg = isActive ? "background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;" : "background:#e5e5e5;color:#999;";
    const textColor = isActive ? "color:#C8A766;font-weight:600;" : "color:#999;";
    return `<td width="33%" style="text-align:center;vertical-align:top;padding:0 6px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:44px;height:44px;border-radius:44px;${bg}text-align:center;vertical-align:middle;line-height:44px;font-size:18px;font-weight:700;">${isCheck ? "&#10003;" : num}</td></tr></table><p style="font-size:11px;${textColor}text-transform:uppercase;letter-spacing:0.5px;margin:8px 0 0;">${label}</p></td>`;
  };
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>${makeStep("1", labels[0], active[0], checks[0])}${makeStep("2", labels[1], active[1], checks[1])}${makeStep("3", labels[2], active[2], checks[2])}</tr></table>`;
}

// ─── Team Reply Card ───
export function teamReplyCard(teamLabel: string, replyMessage: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;overflow:hidden;"><tr><td style="padding:20px;"><p style="color:#C8A766;margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;">${teamLabel}</p><div style="color:#333;font-size:14px;line-height:1.8;white-space:pre-wrap;background:#fff;padding:18px;border-radius:18px;border:1px solid #ece6db;">${replyMessage}</div></td></tr></table>`;
}

// ─── Inquiry Stages ───
export function inquiryStages(currentStage: "received" | "reviewing" | "responded"): string {
  const stages: [boolean, boolean, boolean] = [
    true,
    currentStage === "reviewing" || currentStage === "responded",
    currentStage === "responded",
  ];
  return progressSteps(["Received", "Reviewing", "Responded"], stages, stages);
}

// ─── Ticket Summary Card (EN) — with gold divider under Summary heading ───
export function ticketSummaryCard(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const valueStyle = r.highlight
        ? "padding:7px 0 7px 12px;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;direction:ltr;unicode-bidi:plaintext;"
        : "padding:7px 0 7px 12px;color:#1a1a1a;font-weight:600;font-size:13px;direction:ltr;unicode-bidi:plaintext;";
      return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-right:1px solid #C8A76630;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:14px;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Summary</p><div style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);margin:0 0 10px;"></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
}

// ─── Ticket Summary Card (AR) — RTL with gold divider ───
export function ticketSummaryCardAr(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const hasLatin = /[A-Za-z]/.test(r.value || "");
      const valueStyle = r.highlight
        ? "padding:7px 12px 7px 0;color:#C8A766;font-weight:700;font-size:14px;font-family:'Courier New',monospace;letter-spacing:2px;direction:ltr;unicode-bidi:plaintext;text-align:left;"
        : `padding:7px 12px 7px 0;color:#1a1a1a;font-weight:600;font-size:13px;direction:${hasLatin ? "ltr" : "rtl"};unicode-bidi:plaintext;text-align:${hasLatin ? "left" : "right"};`;
      return `<tr><td style="padding:7px 0;color:#666;font-size:13px;width:40%;border-left:1px solid #C8A76630;padding-left:12px;text-align:right;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:14px;direction:rtl;"><tr><td style="padding:20px;"><p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">ملخص</p><div style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);margin:0 0 10px;"></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
}

// ─── Rate Experience Card (EN + AR) ───
export function rateExperienceCard(surveyLink: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:24px;">
<tr><td style="padding:24px;text-align:center;">
<p style="color:#1a1a1a;font-size:16px;font-weight:bold;margin:0 0 8px;">Rate Your Experience</p>
<p style="color:#666;font-size:13px;margin:0 0 16px;">Help us improve by sharing your feedback</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
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
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=1" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=2" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=3" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=4" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
<td style="padding:0 4px;"><a href="${surveyLink}&rating=5" style="font-size:28px;text-decoration:none;color:#C8A766;">&#9733;</a></td>
</tr></table>
<p style="margin:12px 0 0;"><a href="${surveyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#C8A766,#B8956E);color:#fff;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;">أكمل الاستبيان واحصل على ٥٠ نقطة</a></p>
</td></tr></table>`;
}

// ─── Issue Not Resolved (EN + AR) ───
export function issueNotResolvedCard(reopenUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:10px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dotted #ef4444;border-radius:14px;"><tr><td style="padding:16px;text-align:center;">
    <p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">Issue Not Resolved?</p>
    <p style="color:#666;font-size:13px;margin:0 0 15px;">If your issue persists, you can reopen this ticket anytime.</p>
    <a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
  </td></tr></table>
</td></tr></table>`;
}

export function issueNotResolvedCardAr(reopenUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0;direction:rtl;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:10px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dotted #ef4444;border-radius:14px;"><tr><td style="padding:16px;text-align:center;">
    <p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">المشكلة لم تُحل؟</p>
    <p style="color:#666;font-size:13px;margin:0 0 15px;">إذا استمرت المشكلة، يمكنك إعادة فتح هذه التذكرة في أي وقت.</p>
    <a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">إعادة فتح التذكرة</a>
  </td></tr></table>
</td></tr></table>`;
}

// ─── Shared Sections (unified global block) ───
// Layout: Gold divider → Inquiry Box → Ticket Support → Recommended → Books → Divider → Suggested Actions → Divider → Feedback → Divider → Ready to Get Started → Sign Off
export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `${goldDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction:ltr;text-align:left;"><tr><td>
${inquiryBox(context)}
${ticketSupportEmbed()}
${recommendedActionsHtml()}
${booksShowcaseHtml()}
${goldDivider()}
${suggestedActionsHtml()}
${goldDivider()}
${feedbackHtml(context)}
${goldDivider()}
${readyToGetStartedHtml()}
${signOffHtml(teamName)}
</td></tr></table>`;
}

// ─── Email Shell ───
export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}img{display:block;border:0;outline:none;text-decoration:none;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:22px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:22px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:18px;overflow:hidden;">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
