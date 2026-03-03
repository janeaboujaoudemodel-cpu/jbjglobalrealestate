const SITE_URL = "https://jbj.ae";
const ASSET_BASE_URL = "https://jbjglobalrealestate.lovable.app";
const LOGO_URL = `${ASSET_BASE_URL}/jbj-monogram-light-on-dark.png`;

const ICONS = {
  lock: `${ASSET_BASE_URL}/email-icons/lock.svg`,
  support: `${ASSET_BASE_URL}/email-icons/headphones.svg`,
  aiTools: `${ASSET_BASE_URL}/email-icons/ai-tools.svg`,
  guides: `${ASSET_BASE_URL}/email-icons/guides.svg`,
  properties: `${ASSET_BASE_URL}/email-icons/properties.svg`,
};

const BOOKS = {
  market: `${ASSET_BASE_URL}/email-books/market-intelligence-cover.jpg`,
  guides: `${ASSET_BASE_URL}/email-books/guides-library-cover.jpg`,
};

export { LOGO_URL, SITE_URL };

export function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function imgIcon(src: string, alt: string, size = 28): string {
  return `<img src="${src}" alt="${alt}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px;object-fit:contain;border:0;outline:none;text-decoration:none;"/>`;
}

function sectionDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 18px;border-collapse:separate;border-spacing:0;"><tr><td style="height:1px;background:#C8A76655;"></td><td style="width:38px;text-align:center;vertical-align:middle;"><span style="display:inline-block;color:#C8A766;font-size:15px;line-height:1;">&#10022;</span></td><td style="height:1px;background:#C8A76655;"></td></tr></table>`;
}

export function sharedHeader(departmentLabel: string): string {
  return `<tr><td style="background:#000;padding:28px 28px 24px;border-radius:24px 24px 0 0;text-align:center;">
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
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="padding:7px;border-radius:${size + 16}px;border:1px solid #C8A766;background:linear-gradient(135deg,#fdfbf7,#f5f0e6);"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="width:${size}px;height:${size}px;border-radius:${size}px;border:1px solid #C8A76699;background:#fff;text-align:center;vertical-align:middle;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;"><tr><td style="width:${innerSize}px;height:${innerSize}px;border-radius:${innerSize}px;border:1px solid #E5D2B0;background:#fff;text-align:center;vertical-align:middle;">${imgIcon(ICONS.lock, "Security lock", Math.round(size * 0.44))}</td></tr></table></td></tr></table></td></tr></table>`;
}

export function inquiryBox(contextLabel: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:20px 0 16px;"><tr><td style="padding:18px 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:18px;text-align:center;"><p style="margin:0;font-size:14px;color:#1f2937;line-height:1.7;">For inquiries about your ${contextLabel}, contact us at<br/><a href="mailto:CONTACT@JBJ.AE" style="color:#111827;font-weight:700;text-decoration:underline;">CONTACT@JBJ.AE</a></p></td></tr></table>`;
}

export function ticketSupportEmbed(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 22px;"><tr><td style="padding:24px 20px;background:linear-gradient(135deg,#fff5f5,#ffe9e9);border:1px solid #ef4444;border-radius:20px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td style="width:48px;height:48px;background:#fff;border-radius:48px;border:1px solid #fecaca;text-align:center;vertical-align:middle;">${imgIcon(ICONS.support, "Ticket support", 24)}</td></tr></table><p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:2px;">24/7 SUPPORT</p><p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#7f1d1d;">Need Help? Open a Support Ticket</p><p style="margin:0 0 14px;font-size:13px;color:#991b1b;">Our team typically responds within 24 hours</p><a href="${SITE_URL}/support" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;text-decoration:none;padding:12px 30px;border-radius:12px;font-weight:700;font-size:13px;">Submit a Ticket</a></td></tr></table>`;
}

function recommendedCard(title: string, href: string, iconSrc: string, iconAlt: string): string {
  return `<td width="33%" style="text-align:center;padding:4px;vertical-align:top;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:16px 8px;background:#fff;border:1px solid #C8A766;border-radius:18px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:10px;"><tr><td>${imgIcon(iconSrc, iconAlt, 28)}</td></tr></table><p style="margin:0;font-size:12px;color:#1a1a1a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${title}</p></td></tr></table></a></td>`;
}

export function recommendedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 18px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 14px;">Recommended For You</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${recommendedCard("AI Tools", `${SITE_URL}/ai-tools`, ICONS.aiTools, "AI tools")}${recommendedCard("Guides", `${SITE_URL}/guides`, ICONS.guides, "Guides")}${recommendedCard("Properties", `${SITE_URL}/properties`, ICONS.properties, "Properties")}</tr></table></td></tr></table>`;
}

function bookCard(imageSrc: string, alt: string, title: string, subtitle: string, href: string): string {
  return `<td width="50%" style="vertical-align:top;padding:6px;"><a href="${href}" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:0;text-align:center;"><img src="${imageSrc}" alt="${alt}" width="250" style="width:100%;max-width:250px;height:170px;display:block;object-fit:cover;border-radius:14px;border:0;"/><p style="margin:10px 0 2px;color:#1a1a1a;font-size:13px;font-weight:700;">${title}</p><p style="margin:0;color:#8b7355;font-size:11px;letter-spacing:1px;text-transform:uppercase;">${subtitle}</p></td></tr></table></a></td>`;
}

export function booksShowcaseHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 16px;"><tr><td style="text-align:center;"><p style="color:#1a1a1a;font-size:14px;font-weight:700;margin:0 0 12px;">Explore Our Library</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${bookCard(BOOKS.market, "Market Intelligence Book", "Market Intelligence", "Dubai Reports", `${SITE_URL}/market-intelligence/reports`)}${bookCard(BOOKS.guides, "Guides Library Book", "Guides Library", "Expert Knowledge", `${SITE_URL}/guides`)}</tr></table></td></tr></table>`;
}

export function suggestedActionsHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0;"><tr><td width="50%" style="padding:4px;"><a href="${SITE_URL}/properties" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:12px 8px;background:#fff;border:1px solid #C8A766;border-radius:16px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:6px;"><tr><td>${imgIcon(ICONS.properties, "Properties", 20)}</td></tr></table><span style="font-size:13px;color:#1a1a1a;font-weight:600;">Explore Properties</span></td></tr></table></a></td><td width="50%" style="padding:4px;"><a href="${SITE_URL}/ai-tools" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:12px 8px;background:#fff;border:1px solid #C8A766;border-radius:16px;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:6px;"><tr><td>${imgIcon(ICONS.aiTools, "AI tools", 20)}</td></tr></table><span style="font-size:13px;color:#1a1a1a;font-weight:600;">AI Tools</span></td></tr></table></a></td></tr></table>`;
}

export function feedbackHtml(context = "general"): string {
  const reviewUrl = `${SITE_URL}/reviews?source=${context}&mode=quick`;
  const surveyUrl = `${SITE_URL}/ticket-survey?source=${context}&context=${context}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td align="center"><p style="color:#1a1a1a;font-size:16px;font-weight:700;line-height:1.4;margin:0 0 8px;">We Value Your Feedback</p><p style="color:#888;font-size:13px;margin:0 0 14px;">Help us improve by sharing your experience</p><table cellpadding="0" cellspacing="0" align="center"><tr><td style="padding:0 6px;"><a href="${reviewUrl}" style="display:inline-block;background:#000;color:#C8A766;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid #C8A76650;">Leave a Review</a></td><td style="padding:0 6px;"><a href="${surveyUrl}" style="display:inline-block;background:#FDFBF7;border:1px solid #C8A766;color:#1a1a1a;text-decoration:none;padding:11px 20px;border-radius:12px;font-weight:700;font-size:13px;">Take Survey</a></td></tr></table></td></tr></table>`;
}

export function signOffHtml(teamName = "JBJ Global Real Estate Team"): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr><td><p style="font-size:18px;color:#333;margin:0 0 6px;font-weight:700;">BEST REGARDS,</p><p style="font-size:19px;color:#C8A766;font-weight:800;margin:0;letter-spacing:0.4px;">${teamName.toUpperCase()}</p></td></tr></table>`;
}

export function readyToGetStartedHtml(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:16px 0 0;background:linear-gradient(135deg,#FDFBF7,#F5F0E6,#EDE4D3);border:1px solid #C8A766;border-radius:22px;overflow:hidden;"><tr><td style="padding:24px 18px;text-align:center;"><p style="font-size:22px;font-weight:800;margin:0 0 6px;letter-spacing:1px;color:#1a1a1a;">READY TO GET STARTED?</p><p style="color:#666;font-size:13px;margin:0 0 18px;">Connect with our expert team for personalized guidance.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="https://wa.me/971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:16px;text-align:center;"><p style="color:#25d366;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">WhatsApp</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td><td width="50%" style="text-align:center;padding:5px;vertical-align:top;"><a href="tel:+971565911000" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:16px;text-align:center;"><p style="color:#3b82f6;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Call Us</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">+971 56 591 1000</p></td></tr></table></a></td></tr><tr><td colspan="2" style="text-align:center;padding:5px;"><a href="mailto:CONTACT@JBJ.AE" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:14px 8px;background:#fff;border:1px solid #C8A766;border-radius:16px;text-align:center;"><p style="color:#C8A766;font-size:10px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 6px;font-weight:700;">Email</p><p style="color:#1a1a1a;font-size:12px;margin:0;font-weight:600;line-height:1.4;">CONTACT@JBJ.AE</p></td></tr></table></a></td></tr></table>${sectionDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="text-align:center;"><p style="font-size:16px;font-weight:800;letter-spacing:2px;margin:0 0 6px;color:#1a1a1a;">STAY IN THE LOOP</p><p style="color:#666;font-size:12px;margin:0 0 12px;line-height:1.6;">Be the first to access new listings, market updates, and personalized broker guidance.</p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:separate;border:1px solid #D7C29A;border-radius:24px;overflow:hidden;background:#fff;"><tr><td style="padding:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:10px 14px;border-right:1px solid #E8DCC8;"><span style="font-size:13px;color:#777;">Enter your email here</span></td><td style="padding:5px;"><a href="${SITE_URL}/#ready-to-get-started" style="display:block;background:#000;color:#C8A766;text-decoration:none;padding:10px 18px;border:1px solid #D7C29A;border-radius:18px;font-weight:700;font-size:12px;letter-spacing:0.5px;">Continue &#10132;</a></td></tr></table></td></tr></table></td></tr></table></td></tr></table>`;
}

export function doNotReplyNotice(): string {
  return `<tr><td style="padding:10px 24px 14px;text-align:center;"><p style="margin:0;font-size:11px;color:#8a8a8a;line-height:1.5;">This is an automated message. Please do not reply directly to this email.<br/>For any inquiries, contact us at <a href="mailto:CONTACT@JBJ.AE" style="color:#C8A766;text-decoration:underline;font-weight:600;">CONTACT@JBJ.AE</a></p></td></tr>`;
}

export function sharedFooterHtml(): string {
  return `${doNotReplyNotice()}<tr><td style="padding:0 20px 20px;background:transparent;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;background:#000;border-radius:22px;overflow:hidden;"><tr><td style="padding:30px 26px 28px;text-align:center;"><img src="${LOGO_URL}" alt="JBJ" width="94" style="width:94px;height:auto;display:block;margin:0 auto 12px;border-radius:94px;" /><p style="color:#C8A766;font-size:16px;margin:0 0 6px;font-weight:700;letter-spacing:1.8px;">JBJ GLOBAL REAL ESTATE</p><p style="color:#9ca3af;font-size:12px;margin:0 0 16px;">Your Trusted Partner in Dubai Real Estate</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="border-top:1px solid #2f2f2f;"></td></tr></table><p style="margin:0 0 14px;"><a href="tel:+971565911000" style="color:#fff;text-decoration:none;font-size:14px;font-weight:600;">+971 56 591 1000</a><span style="color:#4b5563;margin:0 12px;">|</span><a href="mailto:CONTACT@JBJ.AE" style="color:#fff;text-decoration:underline;font-size:14px;font-weight:600;">CONTACT@JBJ.AE</a></p><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:14px;"><tr><td style="padding:0 8px;"><a href="https://www.instagram.com/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Instagram</a></td><td style="padding:0 8px;"><a href="https://www.linkedin.com/company/jbjglobalrealestate/" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">LinkedIn</a></td><td style="padding:0 8px;"><a href="https://www.facebook.com/jbjglobalrealestate" style="color:#C8A766;text-decoration:none;font-size:12px;font-weight:600;">Facebook</a></td></tr></table><p style="color:#9ca3af;font-size:11px;margin:0 0 8px;">Developed, Created &amp; Implemented by The Founder &amp; CEO, <span style="color:#C8A766;">Jane Bou Jaoude</span></p><p style="color:#C8A766;font-size:11px;margin:0;font-weight:600;">&copy; ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p></td></tr></table></td></tr>`;
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

export function sharedSections(context: string, teamName = "JBJ Global Real Estate Team"): string {
  return `${sectionDivider()}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="direction:ltr;text-align:left;"><tr><td>${inquiryBox(context)}${ticketSupportEmbed()}${recommendedActionsHtml()}${booksShowcaseHtml()}${suggestedActionsHtml()}${feedbackHtml(context)}${readyToGetStartedHtml()}${signOffHtml(teamName)}</td></tr></table>`;
}

export function emailShell(departmentLabel: string, bodyContent: string): string {
  const raw = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>body{margin:0;padding:0;background:#ffffff;font-family:'Segoe UI',Arial,sans-serif;}table{border-collapse:collapse;}img{display:block;border:0;outline:none;text-decoration:none;}@media only screen and (max-width:620px){.wrapper{width:100%!important;}.content-pad{padding:22px 16px!important;}}</style></head><body style="margin:0;padding:0;background:#fff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;"><tr><td align="center" style="padding:22px 12px;"><table role="presentation" class="wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#F5F0E6,#F0EBE0,#EDE4D3);border-radius:24px;overflow:hidden;">${sharedHeader(departmentLabel)}${bodyContent}${sharedFooterHtml()}</table></td></tr></table></body></html>`;
  return minifyHtml(raw);
}
