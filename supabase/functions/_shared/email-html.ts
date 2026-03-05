const SITE_URL = "https://jbj.ae";
const ASSET_BASE = "https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets";
const BOOK_MARKET = `${ASSET_BASE}/email-books/market-intelligence-cover.jpg`;
const BOOK_GUIDES = `${ASSET_BASE}/email-books/guides-library-cover.jpg`;

export { SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const MONOGRAM_J = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-label="JBJ Monogram"><defs><linearGradient id="goldGradEmail" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#D4AF37"/><stop offset="35%" style="stop-color:#F5E6C8"/><stop offset="65%" style="stop-color:#E8D5A3"/><stop offset="100%" style="stop-color:#D4AF37"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="#0A0A0A"/><circle cx="60" cy="60" r="56" fill="none" stroke="#C8A766" stroke-width="1.2"/><text x="60" y="82" text-anchor="middle" font-family="'Segoe UI',Arial,sans-serif" font-size="70" font-weight="700" fill="url(#goldGradEmail)">J</text></svg>`;

function monogramSvg(size: number): string {
  return `<span style="display:inline-block;width:${size}px;height:${size}px;line-height:0;">${MONOGRAM_J}</span>`;
}

// ─── Inline SVG Icons (100% inline — no external URLs, guaranteed rendering) ───
const SVG = {
  lock: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10V7a5 5 0 1 1 10 0v3"/><rect x="5" y="10" width="14" height="11" rx="2"/><circle cx="12" cy="15" r="1.5"/><path d="M12 16.5v2"/></svg>`,
  headsetWhite: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  aiTools: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10"/><path d="M9 16v4"/><path d="M15 16v4"/><path d="M8 8h8"/><path d="M8 12h5"/></svg>`,
  guides: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5z"/><path d="M18 6h1a2 2 0 0 1 2 2v9"/><path d="M8 8h6"/><path d="M8 12h6"/><path d="M8 16h4"/></svg>`,
  properties: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/></svg>`,
  instagram: `<svg fill="#111111" role="img" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839"/></svg>`,
  facebook: `<svg fill="#111111" role="img" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>`,
  youtube: `<svg fill="#111111" role="img" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  tiktok: `<svg fill="#111111" role="img" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
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
  return `<tr><td style="background:#000;padding:28px 28px 24px;text-align:center;border-radius:18px 18px 0 0;">
${monogramSvg(84)}
<p style="color:#C8A766;margin:10px 0 0;font-size:13px;font-weight:700;letter-spacing:2.6px;text-transform:uppercase;">JBJ GLOBAL REAL ESTATE</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#C8A766,#B8956E,#A07D4A);padding:20px 26px;text-align:center;border-radius:0;">
<p style="font-size:20px;font-weight:700;color:#fff;margin:0;letter-spacing:1px;">${departmentLabel}</p>
</td></tr>`;
}

// ─── Badges ───
export function monogramBadge(size = 52): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border:1px solid #C8A766;border-radius:${size}px;background:#000;text-align:center;vertical-align:middle;overflow:hidden;">${monogramSvg(Math.round(size * 0.94))}</td></tr></table>`;
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

// ─── Ticket Support ───
export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 24px;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:12px;text-align:center;vertical-align:middle;">${SVG.headsetWhite}</td></tr></table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p>
<a href="${SITE_URL}/contact-support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:13px;">Submit a Ticket</a>
</td></tr></table>`;
}

export function ticketSupportEmbedAr(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 24px;direction:rtl;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:18px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:#dc2626;border-radius:12px;text-align:center;vertical-align:middle;">${SVG.headsetWhite}</td></tr></table>
<p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;letter-spacing:2px;">دعم على مدار الساعة</p>
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">هل تحتاج مساعدة؟ افتح تذكرة دعم</p>
<p style="margin:0 0 14px;font-size:13px;color:#991b1b;">فريقنا يرد عادةً خلال ٢٤ ساعة</p>
<a href="${SITE_URL}/contact-support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:13px;">إرسال تذكرة</a>
</td></tr></table>`;
}

// ─── Recommended Actions (inline SVG icons) ───
function recommendedCard(title: string, href: string, emoji: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:18px 8px;text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;border-collapse:separate;"><tr><td style="width:52px;height:52px;background:radial-gradient(circle at 30% 25%,#ffffff,#f2efe8 55%,#e4dccf 100%);border:1.5px solid #C8A766;border-radius:52px;text-align:center;vertical-align:middle;line-height:52px;font-size:22px;">${emoji}</td></tr></table>
<p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
</td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 18px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, "&#x1F916;")}${recommendedCard("Guides", `${SITE_URL}/guides`, "&#x1F4DA;")}${recommendedCard("Properties", `${SITE_URL}/properties`, "&#x1F3E0;")}</tr></table></td></tr></table>`;
}

// ─── Books (JPG from storage — email clients handle JPGs reliably) ───
function book3dCover(title: string, subtitle: string, href: string, imageUrl: string): string {
  return `<td width="50%" style="vertical-align:top;padding:6px;"><a href="${href}" style="display:block;text-decoration:none;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:0;text-align:center;">
<img src="${imageUrl}" alt="${title}" width="150" style="width:150px;height:220px;object-fit:cover;display:block;margin:0 auto;border-radius:12px;border:1px solid #C8A766;box-shadow:8px 8px 24px rgba(0,0,0,0.35);" />
<p style="margin:10px 0 2px;color:#1a1a1a;font-size:13px;font-weight:700;">${title}</p>
<p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p>
</td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${book3dCover("Market Intelligence Report", "UAE Real Estate", `${SITE_URL}/market-intelligence`, BOOK_MARKET)}${book3dCover("Guides Library", "2026 Edition", `${SITE_URL}/guides`, BOOK_GUIDES)}</tr></table></td></tr></table>`;
}

// ─── Suggested Actions ───
export function suggestedActionsHtml(): string {
  const actionCell = (label: string, href: string) => `<td width="50%" style="padding:4px;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:linear-gradient(135deg,#C8A766,#B8956E);border:1px solid #A98956;border-radius:18px;text-align:center;"><span style="font-size:13px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">${label}</span></td></tr></table></a></td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr>${actionCell("Explore Properties", `${SITE_URL}/properties`)}${actionCell("Discover More", `${SITE_URL}/my-dashboard`)}</tr></table>`;
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

function normalizeTeamName(teamName: string): string {
  const base = (teamName || "").trim();
  if (!base) return "JBJ Team";
  const cleaned = base
    .replace(/JBJ\s+GLOBAL\s+REAL\s+ESTATE\s*/i, "JBJ ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned;
}

export function signOffHtml(teamName = "JBJ Team"): string {
  const normalized = normalizeTeamName(teamName);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;margin-bottom:18px;"><tr><td>
<p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p>
<p style="font-size:19px;color:#C8A766;font-weight:800;margin:0;letter-spacing:0.4px;text-shadow:0 1px 2px rgba(0,0,0,0.08),0 0 4px rgba(200,167,102,0.15);">${normalized.toUpperCase()}</p>
</td></tr></table>`;
}

// ─── Ready to Get Started ───
export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:18px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:1px solid #C8A766;border-radius:18px;"><tr><td style="padding:24px 18px;text-align:center;">
<p style="font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:0.08em;text-transform:uppercase;color:#1a1a1a;">Ready to Get Started?</p>
<p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 18px;">Connect with our expert team for personalized guidance.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px;max-width:520px;">
<tr>
<td width="50%" style="padding:5px;"><a href="https://api.whatsapp.com/send?phone=971565911000&text=Hello%20JBJ%20Global%20Real%20Estate" style="display:block;text-decoration:none;padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:14px;text-align:center;"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:700;line-height:1.4;">+971 56 591 1000</p></a></td>
<td width="50%" style="padding:5px;"><a href="tel:+971565911000" style="display:block;text-decoration:none;padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:14px;text-align:center;"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:700;line-height:1.4;">+971 56 591 1000</p></a></td>
</tr>
<tr>
<td colspan="2" style="padding:5px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:14px;text-align:center;"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.2px;margin:0 0 6px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:700;line-height:1.4;">CONTACT@JBJ.AE</p></a></td>
</tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;padding-top:4px;">
<p style="font-size:15px;font-weight:800;letter-spacing:0.12em;margin:0 0 8px;color:#1a1a1a;text-transform:uppercase;">Stay in the Loop</p>
<p style="color:#666;font-size:12px;margin:0 0 12px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:1px solid #D7C29A;border-radius:24px;overflow:hidden;background:#fff;"><tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:10px 14px;"><span style="font-size:13px;color:#777;">Enter your email here</span></td><td style="padding:5px;"><a href="${SITE_URL}/#footer" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:10px 18px;border-radius:18px;font-weight:700;font-size:12px;letter-spacing:0.5px;">Continue &#10132;</a></td></tr></table></td></tr></table>
</td></tr></table>
</td></tr></table>`;
}

function socialLinksFooter(): string {
  const links: Array<{ svg: string; url: string; alt: string }> = [
    { svg: SVG.instagram, url: "https://www.instagram.com/jbj.ae", alt: "Instagram" },
    { svg: SVG.facebook, url: "https://www.facebook.com/share/1G7CgSaV2L/?mibextid=wwXIfr", alt: "Facebook" },
    { svg: SVG.tiktok, url: "https://www.tiktok.com/@jbj.ae", alt: "TikTok" },
    { svg: SVG.youtube, url: "https://youtube.com/@jbjglobalrealestate", alt: "YouTube" },
  ];

  const item = (svg: string, url: string, alt: string) =>
    `<td style="padding:0 6px 8px;"><a href="${url}" aria-label="${alt}" style="display:inline-block;width:38px;height:38px;background:#ffffff;border:1.5px solid #C8A766;border-radius:38px;text-decoration:none;text-align:center;line-height:38px;">${svg}</a></td>`;

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:12px;"><tr>${links.map((l) => item(l.svg, l.url, l.alt)).join("")}</tr></table>`;
}

export function sharedFooterHtml(): string {
  return `<tr><td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#000;border-radius:0 0 18px 18px;"><tr><td style="padding:34px 18px 34px;text-align:center;">
${monogramSvg(72)}
<p style="color:#C8A766;font-size:16px;margin:10px 0 12px;font-weight:700;letter-spacing:1.8px;text-align:center;">JBJ Global Real Estate</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 12px;"><tr><td style="border-top:1px solid #C8A76655;"></td></tr></table>
<p style="color:#d8cfbf;font-size:12px;font-style:italic;margin:0 0 16px;">The Premier Global Real Estate Intelligence &amp; Advisory Platform</p>
<p style="color:#C8A766;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">Connect with us on social media</p>
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

export function ticketSummaryCard(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const valueStyle = r.highlight
        ? "padding:8px 0 8px 12px;color:#8B6914;font-weight:800;font-size:15px;font-family:'Courier New',monospace;letter-spacing:1.6px;direction:ltr;unicode-bidi:plaintext;"
        : "padding:8px 0 8px 12px;color:#1a1a1a;font-weight:600;font-size:13px;direction:ltr;unicode-bidi:plaintext;";
      return `<tr><td style="padding:8px 0;color:#555;font-size:13px;width:40%;border-right:1px solid #C8A76655;padding-right:12px;">${r.label}</td><td style="${valueStyle}">${r.value}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:14px;"><tr><td style="padding:20px;"><p style="color:#1a1a1a;font-size:18px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1.6px;font-weight:800;text-align:center;text-shadow:0 1px 0 #fff,0 1px 2px rgba(0,0,0,0.1);">Ticket Summary</p><div style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);margin:0 0 12px;"></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
}

export function ticketSummaryCardAr(rows: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rowsHtml = rows
    .map((r) => {
      const hasLatin = /[A-Za-z]/.test(r.value || "");
      const renderedValue = r.highlight
        ? `${r.value} <span aria-label="Copy ticket number" style="display:inline-block;margin-inline-start:6px;color:#8B6914;font-size:12px;">📋</span>`
        : r.value;
      const valueStyle = r.highlight
        ? "padding:8px 12px 8px 0;color:#8B6914;font-weight:800;font-size:15px;font-family:'Courier New',monospace;letter-spacing:1.6px;direction:ltr;unicode-bidi:plaintext;text-align:left;"
        : `padding:8px 12px 8px 0;color:#1a1a1a;font-weight:600;font-size:13px;direction:${hasLatin ? "ltr" : "rtl"};unicode-bidi:plaintext;text-align:${hasLatin ? "left" : "right"};`;
      return `<tr><td style="padding:8px 0;color:#555;font-size:13px;width:40%;border-left:1px solid #C8A76655;padding-left:12px;text-align:right;">${r.label}</td><td style="${valueStyle}">${renderedValue}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);border:1px solid #C8A766;border-radius:18px;margin-bottom:14px;direction:rtl;"><tr><td style="padding:20px;"><p style="color:#1a1a1a;font-size:18px;margin:0 0 10px;letter-spacing:1.4px;font-weight:800;text-align:center;text-shadow:0 1px 0 #fff,0 1px 2px rgba(0,0,0,0.1);">ملخص التذكرة</p><div style="height:2px;background:linear-gradient(90deg,transparent,#C8A766,#C8A766,transparent);margin:0 0 12px;"></div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rowsHtml}</table></td></tr></table>${goldDivider()}`;
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
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:16px;text-align:center;">
  <p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">Issue Not Resolved?</p>
  <p style="color:#666;font-size:13px;margin:0 0 15px;">If your issue persists, you can reopen this ticket anytime.</p>
  <a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">Reopen This Ticket</a>
</td></tr></table>`;
}

export function issueNotResolvedCardAr(reopenUrl: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0;direction:rtl;">
<tr><td style="background:linear-gradient(135deg,#fff5f5,#fff0f0);border:1px solid #ef4444;border-radius:18px;padding:16px;text-align:center;">
  <p style="color:#c0392b;margin:0 0 10px;font-size:16px;font-weight:bold;">المشكلة لم تُحل؟</p>
  <p style="color:#666;font-size:13px;margin:0 0 15px;">إذا استمرت المشكلة، يمكنك إعادة فتح هذه التذكرة في أي وقت.</p>
  <a href="${reopenUrl}" style="display:inline-block;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;text-decoration:none;padding:14px 30px;border-radius:12px;font-weight:bold;font-size:14px;">إعادة فتح التذكرة</a>
</td></tr></table>`;
}

// ─── Shared Sections (unified global block) ───
export function sharedSections(context: string, teamName = "JBJ Team"): string {
  return `${goldDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction:ltr;text-align:left;"><tr><td>
${inquiryBox(context)}
${ticketSupportEmbed()}
${readyToGetStartedHtml()}
${signOffHtml(teamName)}
</td></tr></table>`;
}

// ─── Email Shell ───
// 🔒 LOCKED: Outer shell with rounded wrapper, header rounded top, footer rounded bottom
export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}img{display:block;border:0;outline:none;text-decoration:none;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:22px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:22px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:18px;overflow:hidden;">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
