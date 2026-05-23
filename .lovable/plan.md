## Diagnosis

Two structural issues are responsible for the "boxed / disconnected / unorganized" look across the site, and one specific one on Guides:

1. **`.jj-layer-2` is a boxed container, not a band.** It ships with side margins (`mx-1 sm:mx-2 md:mx-3 lg:mx-4`), `rounded-2xl`, a champagne fill, a gold hairline border, and a shadow. Every section that uses it floats on the page like an island — that's the gap on the sides you're seeing. 186 usages across 58 files.

2. **Dark `bg-[#1A1A1A]` section wrappers** are bolted onto a champagne site. Guides has 2 of them (the "How This Library Works" section and the "What You'll Learn" section), the services pages have 5–10 each. They break the champagne canvas, force the runtime contrast guard to flip text, and create the "silver/black divider" effect you don't want.

3. **Guides "What You'll Learn"** uses a generic 3-column grid of `Card` + `CardContent` with no rhythm, no IconTile, no premium hierarchy, sitting on top of the dark band — so it reads as crowded and unorganized.

## Global structural fix

### a) Convert `.jj-layer-2` from "boxed island" to "full-bleed band" — `src/index.css`

Replace the current definition with:

```css
.jj-layer-2 {
  /* full-bleed band: edge-to-edge, no rounding, no border, no shadow */
  width: 100%;
  background: #F7F2EA;       /* champagne surface — same token as today */
  padding-block: clamp(2.5rem, 5vw, 4.5rem);
  padding-inline: clamp(1rem, 4vw, 2rem);
}

/* Inner content stays comfortably wide but readable */
.jj-layer-2 > * {
  max-width: 1280px;
  margin-inline: auto;
}
```

No rounded corners, no side gutters, no shadow, no border — sections now run side-to-side on every viewport. Inner content still respects a 1280px reading width via the universal child selector so we don't have to rewrite 186 call sites.

The `.jj-section-gutter` class (only used by `.jj-layer-2` today, per grep) is also flattened to a no-op so any stragglers don't reintroduce side margins.

### b) Add a `.jj-band` system for alternating champagne tones — `src/index.css`

Three siblings, all full-bleed, share inner-max-width behaviour:

```css
.jj-band { width:100%; padding-block: clamp(2.5rem,5vw,4.5rem); padding-inline: clamp(1rem,4vw,2rem); }
.jj-band > * { max-width:1280px; margin-inline:auto; }
.jj-band--page    { background:#FDFBF7; }   /* default page tone */
.jj-band--surface { background:#F7F2EA; }   /* one notch warmer */
.jj-band--raised  { background:#EFE6D6; }   /* two notches warmer */
```

The tone difference between adjacent bands IS the divider — no line, no ornament, no gray, no black. Just champagne stepping by 4–6 luminance points. That's the "premium classy way" you described.

### c) Optional 1-px gold hairline divider — opt-in only

For pages that want an explicit seam between two same-tone bands, add `data-band-divider` to the lower band. CSS:

```css
[data-band-divider]::before {
  content:""; display:block; height:1px; width:100%;
  background:rgba(184,149,85,0.18);    /* faded champagne-gold, never gray */
  margin-bottom: clamp(2rem,4vw,3.5rem);
}
```

Matches the existing `[data-gold-hairline]` opt-in rule from the No-Gray standard.

### d) Kill the dark `bg-[#1A1A1A]` band wrappers on public marketing pages

Add a scoped CSS override that maps any `<section class="bg-[#1A1A1A] py-*">` inside marketing routes back to champagne `#F7F2EA`. Implemented as a `[data-marketing-page]` attribute on the page root + a CSS rule:

```css
[data-marketing-page] section[class*="bg-[#1A1A1A]"] {
  background: #F7F2EA !important;
}
[data-marketing-page] section[class*="bg-[#1A1A1A]"] [class*="text-[#1A1A1A]/"] { color: #1A1A1A !important; }
```

Apply `data-marketing-page` on the root `<div>` of:

- `src/pages/Guides.tsx`
- `src/pages/Services.tsx` + every `src/pages/services/*.tsx`
- `src/pages/About.tsx`, `MeetTheTeam.tsx`, `Philanthropy.tsx`, `CompanyProfile.tsx`
- `src/pages/Developers.tsx`, `MarketIntelligence.tsx`, `MarketReport.tsx`
- `src/pages/BrokerEducation.tsx`, `BrokerResources.tsx`

Owner / admin / portal pages are NOT touched — they keep their dark surfaces. Homepage already champagne, untouched.

## Guides "What You'll Learn" — premium rebuild

`src/pages/Guides.tsx` lines ~267–298:

- Remove the `bg-[#1A1A1A]` section wrapper; use `<section className="jj-band jj-band--page">`.
- Replace the generic `Card` / `CardContent` grid with a premium 3-column (md) / 2-column (sm) / 1-column (mobile) layout built on the project's own `<IconTile />` primitive (`tone="gold"`).
- Each card: ink title (`text-[#1A1A1A] font-semibold`), ink/70 description, gold IconTile top-left, 1px `rgba(184,149,85,0.30)` hairline border, `bg-[#FDFBF7]`, generous padding (`p-7`), subtle hover lift (-translate-y-0.5, border opacity to 0.55). No shadows.
- Section header: gold eyebrow chip ("Curriculum"), serif-free ink h2 (Inter 600, tracking -0.02em, 36/44 desktop), short ink/70 lede, all centered, breathing room (`mb-12`).
- Same tone for "How This Library Works" section above — also converted from dark to `jj-band jj-band--surface` for the tone alternation.

This gives the section room to breathe, organises the 6 topics into a clear premium grid, and matches the rest of the champagne canvas.

## Out of scope (per your "no removal" rule)

- The 6 learning topics themselves stay verbatim.
- No content, route, or guide removed anywhere.
- Homepage and owner dashboards are untouched.
- Hero sections are untouched (they were the previous turn's work).

## Technical notes

- `.jj-layer-2` change is global (186 call sites). The flattening is intentional — that's the user's request — and the inner `> *` max-width keeps content readable everywhere without per-page edits.
- The dark-section override is **opt-in via `data-marketing-page`** so it cannot leak into owner/admin/portal surfaces.
- New CSS lives next to the existing `.jj-layer-2` block in `src/index.css`.
- `<SectionDivider />` stays a no-op — the band-tone rhythm replaces it.
- All colours use the existing champagne tokens (#FDFBF7 / #F7F2EA / #EFE6D6 / #B89555). No new design tokens, no gray, no black-section bands.
