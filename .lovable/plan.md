

## Shorten & Refine Footer — Classy Corporate Edition

Reduce the footer from ~761 lines / 5 oversized zones to a compact, editorial corporate layout while **preserving every link** (No-Removal Policy). Replace ornamental flourishes (✦, serif display type, gold gradients, dotted dividers) with clean monochrome typography and a single restrained gold hairline accent.

### Visual direction

- Surface: deep obsidian `#0A0908` with **one** subtle top hairline — no radial glow blobs.
- Type: **Inter only** (drop Cormorant/Playfair display serif).
- Accent: a single muted champagne `#C8A766` used sparingly — hairlines, hover, monogram glow only. No gold-on-gold gradients, no ✦ symbols.
- Spacing: tighter vertical rhythm (~40% shorter overall).
- Dividers: thin `rgba(255,255,255,0.08)` lines instead of decorative gradient bars.

### New structure (5 → 3 zones)

```text
┌────────────────────────────────────────────────────────────┐
│  [monogram]  JBJ GLOBAL REAL ESTATE                         │
│  Excellence in Real Estate · Licensed UAE Brokerage         │
│  ─────────────────────────────────────────────────────       │
│  Connect: [socials] [GMB]   |   Mode · Currency · Unit       │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  4-column compact link grid (16 categories merged)          │
│  Properties │ Services │ Guides │ About                     │
│  Sell       │ Investor │ Broker │ Partners                  │
│  Legal      │ Suites   │ Tools  │ AI / Creative / Market    │
│  - plain text links, no card chrome, hover = champagne      │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│  Contact strip:  📍 address  · ☎ phone · ✉ email · WhatsApp  │
│  ─── thin hairline ───                                       │
│  Compact legal (1 EN paragraph + 1 AR paragraph, condensed)  │
│  © 2026 JBJ Global Real Estate · All Rights Reserved         │
│   · Terms · Privacy · Cookies · Disclaimers                  │
└────────────────────────────────────────────────────────────┘
```

### Specific changes

1. **Remove ornaments**: delete every `✦`, all serif `font-family: Cormorant/Playfair`, gradient gold dots, decorative `w-10 h-px` flourishes, double hairlines. Keep one top + one bottom hairline.
2. **Brand crown**: monogram h-16 (was h-40), single-line wordmark in Inter semibold tracking-[0.18em], one-line tagline. Removes ~30 lines of markup.
3. **Newsletter**: move out of footer — `NewsletterBand` already renders above footer globally, so delete the duplicate inside Footer (Zone 2 newsletter block).
4. **License + utility strip**: collapse "Licensed ✦ Buy ✦ Sell ✦ Rent" sentence into one understated line. Combine Connect / Mode / Currency / Unit into a single horizontal row, no card.
5. **Nav grid**: replace `FooterCard` (boxed gold-bordered cards w/ hover-lift) with a clean 4-column text list. Title = uppercase tracking-[0.2em] white 11px; links = `text-white/65 hover:text-white text-[13px]`. All 16 categories preserved, just denser.
6. **Get In Touch**: convert from boxed card → single inline contact bar with icons (no circular gold buttons, just `text-white/70` icons that turn champagne on hover).
7. **Legal**: keep all 4 paragraphs (EN + 2 AR + IP notice) but shrink to `text-[11px] text-white/55 leading-relaxed` and stack tightly. Replace the gold "All Rights Reserved" pill with a plain centered line: `© 2026 JBJ Global Real Estate · All Rights Reserved · [Terms · Privacy · Cookies · Disclaimers · IP · AML · Accessibility · Trust]`.
8. **`FooterCurrencyUnit`**: keep functionality, restyle buttons to flat bordered (no gold tinted backgrounds when inactive).

### Preservation guarantees (No-Removal Policy)

- **Every link** in `propertiesLinks`, `sellLinks`, `servicesLinks`, `investorHubLinks`, `guidesLinks`, `marketIntelLinks`, `aboutLinks`, `careerLinks`, `brokerAcademyLinks`, `partnersLinks`, `legalLinks`, `businessSuitesLinks`, `productivityLinks`, `professionalTools`, AI Tools, Creative Suites, Education Hub — kept verbatim.
- Newsletter still appears site-wide (via existing `NewsletterBand` above footer).
- All contact methods (phone, WhatsApp, email, address, GMB), socials, ModeSwitcher, Currency + Unit switcher — preserved.
- All legal paragraphs (EN, AR ×2, IP notice, FounderContent gating) — preserved, just compacted.

### Files to edit

- `src/components/Footer.tsx` — rewrite presentation layer; keep all link arrays and state hooks intact.

### Memory update

- Add `mem://brand/footer-corporate-standard` recording: monochrome corporate footer, Inter only, no ✦/serif display, single champagne hairline accent, 4-column dense nav, all links preserved.

