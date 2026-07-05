# Tier 1 · Bayut — Agency Profile Claim / Creation

**Target:** https://www.bayut.com/agencies/
**Goal:** Claim (or create) the JBJ Global Real Estate agency profile → dofollow link to https://www.jbj.ae
**Owner:** Jane Bou Jaoude · Effort: Low · Expected AS gain: High
**Anchor asset for editorial fields:** https://www.jbj.ae/insights/future-of-real-estate-2026

---

## 1. Pre-flight checklist (have these open in tabs)

- [ ] Trade License PDF — DED No. **1591031**, issued 13/01/2026, valid 12/01/2027
- [ ] RERA / DLD broker license number(s) for the agency
- [ ] Company logo (square PNG, min 500×500, transparent bg) — `/logo.png`
- [ ] Office photo (exterior + reception) — landscape JPG ≥ 1600×900
- [ ] Founder photo — Jane Bou Jaoude, portrait 1200×1500
- [ ] Company email on the trade-license domain: **contact@jbj.ae**
- [ ] Verified UAE mobile: **+971 54 716 7107**

---

## 2. Step-by-step claim flow

1. Go to https://www.bayut.com/agencies/ → search "JBJ Global Real Estate".
2. **If a stub profile exists:** click *Claim this agency* (top-right of the profile). Bayut sends a verification email to a `@jbj.ae` address on file with DED; if none is on file, use the "Contact us" fallback (Section 4).
3. **If no profile exists:** contact Bayut agency onboarding directly using the email in Section 4 — they create the profile after verifying the trade license.
4. Once the claim link arrives, log in and complete every field in Section 3 verbatim (NAP consistency = #1 local-SEO signal).
5. Upload logo, cover photo, at least 6 team headshots, and 3 office photos.
6. Publish 5 real listings within 48h so the profile isn't flagged as empty (Bayut deprioritises empty agency pages).
7. Screenshot the live profile + the dofollow website link (use `curl -sI` or view-source to confirm `rel="dofollow"` is absent → dofollow by default).

---

## 3. Profile fields — copy verbatim (single source of truth)

| Field | Value |
|---|---|
| Agency name | JBJ Global Real Estate |
| Legal name | J B J GLOBAL REAL ESTATE L.L.C S.O.C |
| Trade license | 1591031 (Dubai DED, issued 13/01/2026) |
| DCCI membership | 666113 |
| Commercial register | 2789619 |
| Office address | Office SM1-195, Port Saeed, Deira, Dubai, UAE |
| Service area | Dubai · Abu Dhabi · Sharjah · Ajman · RAK · Fujairah · UAQ |
| Phone | +971 54 716 7107 |
| WhatsApp | +971 54 716 7107 |
| Email | contact@jbj.ae |
| Website | https://www.jbj.ae |
| Opening hours | Mon–Sat 09:00–21:00 (closed Sunday) |
| Languages | English, Arabic, French |
| Specialties | Off-plan, luxury apartments, villas, penthouses, investor advisory |

### Short bio (≤ 400 chars — Bayut cap)

> JBJ Global Real Estate is a RERA-licensed Dubai brokerage founded by Jane Bou Jaoude. We help investors and end-buyers acquire luxury apartments, villas, penthouses and off-plan properties across Dubai and the wider UAE — with data-driven advisory, direct developer access, and full end-to-end concierge from viewing to handover.

### Long bio (≤ 2,000 chars — for the About tab)

> JBJ Global Real Estate is a Dubai-based, RERA-licensed brokerage founded by Jane Bou Jaoude, headquartered in Deira and operating across all seven emirates. Our practice combines direct-developer relationships with the Emaar, DAMAC, Sobha, Nakheel, Meraas, Danube, Azizi and Binghatti channel-partner networks, and a proprietary market-intelligence stack that surfaces off-plan launches, resale opportunities, and rental-yield hotspots before they reach the open portals.
>
> We specialise in three client journeys: (1) international investors seeking off-plan capital growth and post-handover payment plans; (2) end-users buying luxury apartments, penthouses and villas in Dubai Marina, Palm Jumeirah, Downtown, Business Bay and emerging communities such as Dubai South and MBR City; and (3) HNW sellers who need discreet, valuation-led disposal.
>
> Every engagement is led by a named senior broker, backed by an in-house research desk that publishes Dubai market briefings, rental-yield guides and neighbourhood analyses at https://www.jbj.ae/insights. Our 2026 flagship outlook — *The Future of Real Estate: 5 Trends to Watch in 2026* (https://www.jbj.ae/insights/future-of-real-estate-2026) — is cited as reference material by regional media.
>
> Contact: contact@jbj.ae · +971 54 716 7107 · Office SM1-195, Port Saeed, Deira, Dubai.

---

## 4. Fallback contact — if the claim button is missing / verification email never arrives

**Email:** `agencies@bayut.com`
**Cc:** `support@bayut.com`
**Subject:** Agency profile claim — JBJ Global Real Estate (DED 1591031)

> Hello Bayut Agency Team,
>
> I'm writing to claim / create the agency profile for **JBJ Global Real Estate** on Bayut.
>
> - Legal name: J B J GLOBAL REAL ESTATE L.L.C S.O.C
> - DED trade license: **1591031** (issued 13/01/2026, valid 12/01/2027)
> - DCCI membership: 666113
> - Office: SM1-195, Port Saeed, Deira, Dubai
> - Website: https://www.jbj.ae
> - Primary contact: Jane Bou Jaoude, Founder & CEO — contact@jbj.ae · +971 54 716 7107
>
> Our trade license and RERA broker card are attached. Please confirm the claim and share the login link so we can complete the profile, upload our first batch of verified listings, and connect our XML feed.
>
> Kind regards,
> **Jane Bou Jaoude**
> Founder & CEO, JBJ Global Real Estate
> https://www.jbj.ae · +971 54 716 7107

**Attachments to include:** trade-license PDF, Jane's Emirates ID (redact ID number), RERA broker card, logo PNG.

---

## 5. Post-claim verification (within 24h of the profile going live)

- [ ] Confirm the website field renders as a clickable `https://www.jbj.ae` link
- [ ] Confirm it's dofollow: `curl -sL "https://www.bayut.com/agencies/<slug>/" | grep -o '<a[^>]*jbj\.ae[^>]*>' ` — must **not** contain `rel="nofollow"` or `rel="ugc"`
- [ ] Add the live profile URL to `.lovable/backlink-prospects.md` under Tier 1 · row 6 as **CLAIMED — <date>**
- [ ] Screenshot for the outreach evidence folder
- [ ] Kick off Semrush rescan in 7 days to confirm the referring domain lands
