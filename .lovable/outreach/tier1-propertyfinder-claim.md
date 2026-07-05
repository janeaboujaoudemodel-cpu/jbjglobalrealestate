# Tier 1 · Property Finder — Broker/Agency Profile Claim

**Target:** https://www.propertyfinder.ae/en/broker
**Goal:** Claim (or create) the JBJ Global Real Estate broker profile → dofollow link to https://www.jbj.ae
**Owner:** Jane Bou Jaoude · Effort: Low · Expected AS gain: High
**Anchor asset for editorial fields:** https://www.jbj.ae/insights/future-of-real-estate-2026

---

## 1. Pre-flight checklist

- [ ] Trade License PDF — DED No. **1591031** (13/01/2026 → 12/01/2027)
- [ ] RERA / DLD broker card for every agent to be listed
- [ ] Company logo (square PNG ≥ 500×500) + cover banner (1920×480 JPG)
- [ ] 5 real off-plan or ready listings ready to publish (PF flags empty profiles)
- [ ] Email on the trade-license domain: **contact@jbj.ae**
- [ ] Verified UAE mobile: **+971 54 716 7107**
- [ ] Bank IBAN for the PF invoicing account (paid subscription required for listing feed; profile creation itself is free)

---

## 2. Step-by-step claim flow

1. Open https://www.propertyfinder.ae/en/broker and search "JBJ Global Real Estate".
2. **Stub exists** → click *Claim broker* (top-right); PF sends verification to the trade-license email on file. If it's not `@jbj.ae`, jump to Section 4.
3. **No stub** → PF requires broker signup via https://www.propertyfinder.ae/en/broker/join. Fill the intake form with the values in Section 3.
4. Attach trade license + RERA card. PF's compliance team responds within 2 working days.
5. Once approved, complete all profile fields in Section 3, upload the media assets, invite each RERA-licensed agent by email so their individual broker pages inherit our agency link.
6. Publish 5 listings in the first 48h; empty profiles get deprioritised in PF search.
7. Verify the profile URL and the outbound website link (Section 5).

---

## 3. Profile fields — copy verbatim (must match Bayut / GBP / DED exactly)

| Field | Value |
|---|---|
| Broker / agency name | JBJ Global Real Estate |
| Legal name | J B J GLOBAL REAL ESTATE L.L.C S.O.C |
| DED trade license | 1591031 |
| DCCI membership | 666113 |
| Commercial register | 2789619 |
| Head-office address | Office SM1-195, Port Saeed, Deira, Dubai, UAE |
| Service area | Dubai · Abu Dhabi · Sharjah · Ajman · RAK · Fujairah · UAQ |
| Phone | +971 54 716 7107 |
| WhatsApp | +971 54 716 7107 |
| Email | contact@jbj.ae |
| Website | https://www.jbj.ae |
| Opening hours | Mon–Sat 09:00–21:00, closed Sunday |
| Languages | English, Arabic, French |
| Founder | Jane Bou Jaoude — Founder & CEO |
| Specialties | Off-plan · Luxury resale · Investor advisory · Concierge handover |

### Short description (≤ 300 chars — PF cap)

> RERA-licensed Dubai brokerage. Off-plan, luxury apartments, villas, penthouses across the UAE — with direct-developer access (Emaar, DAMAC, Sobha, Nakheel, Meraas) and data-led investor advisory. Founded by Jane Bou Jaoude.

### About the agency (≤ 3,000 chars)

> JBJ Global Real Estate is a Dubai-headquartered, RERA-licensed brokerage founded by Jane Bou Jaoude and operating across all seven emirates. We pair direct-developer relationships (Emaar, DAMAC, Sobha, Nakheel, Meraas, Danube, Azizi, Binghatti) with an in-house research desk that publishes market briefings, rental-yield guides and community analyses at https://www.jbj.ae/insights.
>
> Our three practice lines are:
>
> • **Off-plan investor advisory** — early access to launches, side-by-side ROI modelling, post-handover payment plans, and end-to-end DLD paperwork.
>
> • **Luxury resale and end-user sales** — apartments, villas, and penthouses in Palm Jumeirah, Downtown Dubai, Dubai Marina, Business Bay, Emirates Hills, Dubai Hills and MBR City.
>
> • **Discreet HNW disposal** — off-market valuations, targeted buyer matching, and confidential viewings.
>
> Every mandate is led by a named senior broker and audited against our 2026 outlook, *The Future of Real Estate: 5 Trends to Watch in 2026* (https://www.jbj.ae/insights/future-of-real-estate-2026).
>
> Talk to us: contact@jbj.ae · +971 54 716 7107 · Office SM1-195, Port Saeed, Deira, Dubai.

---

## 4. Fallback contact — if claim / signup stalls

**Email:** `brokersupport@propertyfinder.ae`
**Cc:** `partners@propertyfinder.ae`
**Subject:** Broker profile claim / creation — JBJ Global Real Estate (DED 1591031)

> Hello Property Finder Broker Support,
>
> I'd like to claim / create the broker profile for **JBJ Global Real Estate** on Property Finder.
>
> - Legal name: J B J GLOBAL REAL ESTATE L.L.C S.O.C
> - DED trade license: **1591031** (issued 13/01/2026, valid 12/01/2027)
> - DCCI membership: 666113
> - Head office: SM1-195, Port Saeed, Deira, Dubai
> - Website: https://www.jbj.ae
> - Primary contact: Jane Bou Jaoude, Founder & CEO — contact@jbj.ae · +971 54 716 7107
>
> Trade license, RERA broker card and DCCI certificate are attached. Please confirm the profile and share onboarding steps for our listing subscription so we can publish our first batch of verified listings and connect our XML feed.
>
> Kind regards,
> **Jane Bou Jaoude**
> Founder & CEO, JBJ Global Real Estate
> https://www.jbj.ae · +971 54 716 7107

**Attachments:** trade-license PDF, Jane's Emirates ID (redact ID digits), RERA card, DCCI certificate, logo PNG.

---

## 5. Post-claim verification

- [ ] Live profile URL captured and logged in `.lovable/backlink-prospects.md` (Tier 1 · row 7) as **CLAIMED — <date>**
- [ ] Website field renders as clickable `https://www.jbj.ae`
- [ ] Dofollow check: `curl -sL "<profile-url>" | grep -o '<a[^>]*jbj\.ae[^>]*>'` — must not carry `rel="nofollow"` or `rel="ugc"` (PF historically ships broker-website links as dofollow; confirm each time)
- [ ] All active RERA agents invited and their individual broker pages linked back to the agency profile
- [ ] Screenshot for outreach evidence folder
- [ ] Semrush rescan queued for 7 days out

---

## 6. NAP consistency guardrail (do this before hitting *Submit* on either portal)

Bayut and Property Finder profiles must match **byte-for-byte** the values in `src/config/companyNAP.ts` and `src/config/companyLegal.ts`, and the Google Business Profile. Any drift (e.g. "Deira, Dubai" vs "Dubai, Deira", or "+971547167107" vs "+971 54 716 7107") kills the local-SEO signal. Use only the strings printed in Section 3 of each doc.
