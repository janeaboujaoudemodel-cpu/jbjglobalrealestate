# Google Business Profile Alignment Checklist
**JBJ Global Real Estate** — keep every field below identical between the website (`src/config/companyNAP.ts`) and the live Google Business Profile.

Mismatched Name / Address / Phone (NAP) across sources is the single largest local-SEO penalty. After any change, re-run the SEO scan.

---

## 1. Identity
- **Business name (exact):** `JBJ Global Real Estate`
- **No keyword stuffing** (e.g. "JBJ Global Real Estate Dubai Luxury Brokerage" is a TOS violation).

## 2. Primary category
- `Real estate agency`

## 3. Additional categories (recommended)
- `Property management company`
- `Real estate consultant`
- `Real estate developer` (only if accurate)
- `Real estate rental agency`

## 4. Address
- `Business Bay, Dubai, United Arab Emirates`
- Match `src/config/companyNAP.ts` → `address` exactly.
- If you operate from a coworking / virtual address, mark **Service-area business** in GBP.

## 5. Service areas
Add each emirate listed in `COMPANY_NAP.areaServed`:
Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain.

## 6. Phone number
- Primary: `+971 54 716 7107`
- E.164 in tel: links: `+971547167107`
- WhatsApp: same number, linked in GBP "messaging".

## 7. Website
- `https://www.jbj.ae`
- Make sure GBP uses the **www** host (matches canonical).

## 8. Opening hours
| Day | Hours |
|---|---|
| Monday | 09:00 – 21:00 |
| Tuesday | 09:00 – 21:00 |
| Wednesday | 09:00 – 21:00 |
| Thursday | 09:00 – 21:00 |
| Friday | 09:00 – 21:00 |
| Saturday | 09:00 – 21:00 |
| Sunday | Closed |

## 9. Attributes (enable all that apply)
- Online appointments
- Identifies as women-owned
- Online estimates
- Wheelchair accessible entrance
- Free Wi-Fi (if applicable)
- Languages spoken: English, Arabic, French

## 10. Logo & cover
- **Logo:** square PNG, 720×720+, transparent background → use `/public/jbj-monogram-dark-on-light.png`.
- **Cover:** 16:9, ≥1200×675 → use `/public/og-image.jpg` or a hero shot.
- **Additional photos:** 10+ photos (office, team, property highlights, founder portrait).

## 11. Social profiles (must match `COMPANY_NAP.sameAs`)
- Instagram: https://www.instagram.com/jbjglobalrealestate
- LinkedIn: https://www.linkedin.com/company/jbjglobalrealestate
- Facebook: https://www.facebook.com/jbjglobalrealestate
- YouTube: https://www.youtube.com/@jbjglobalrealestate
- TikTok: https://www.tiktok.com/@jbjglobalrealestate

## 12. Services list (mirror site)
Add each as a separate GBP Service entry:
- Buy property
- Sell property
- Rent property
- Holiday homes / short-term rentals
- Property management
- Off-plan investment advisory
- Mortgage advisory
- Snagging
- Interior design
- Fit-out
- Legal & conveyancing

## 13. Q&A (seed at least 5)
Pre-post the most common questions on your GBP listing so Google can rank them as rich answers:
1. *Are you RERA licensed?*
2. *Do you work with foreign buyers / Golden Visa applicants?*
3. *What areas do you cover?*
4. *Do you handle off-plan resale?*
5. *What's your commission structure?*

## 14. Review acquisition
- Send a short post-deal email/WhatsApp with the GBP review link to every closed client.
- Reply to **every** review (positive and negative) within 24h, in the same language as the reviewer.
- Target: 4.8+ rating with 100+ reviews in 12 months.

## 15. Posts cadence
- Weekly GBP Post (offer, new listing, market update).
- Use the `/news` URL as the destination link.

## 16. Verify in Google Search Console
- Property: `https://www.jbj.ae`
- Submit sitemap: `https://www.jbj.ae/sitemap.xml`
- Request re-indexing for the homepage and key landing pages.

---

**Owner:** keep this file in sync with `src/config/companyNAP.ts`. If you change a phone number, email, or address, update both — the website, JSON-LD, footer, and GBP must always show the same string.
