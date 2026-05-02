## Goal

Polish every project listing card sitewide so:
1. The word **"Handover"** is solid black; only the **date** stays orange.
2. The **developer name** ("by Emaar / Aldar / Meraas / …") is **gold, clickable, with a permanent underline** so users can see it's a link.
3. Every card shows the **payment plan** directly under the handover line, with a **premium square badge** (small radius, not pill-shaped).
4. Every project card renders the **real developer logo, fully fit, no white frame, no fake building icon, no project photo as logo**. The home-page **partners marquee stays locked and untouched**.

## What changes

### 1. Handover line — black label, orange date
Currently the whole line ("Handover 2026") is orange. Split it:

```text
Handover           2026
^ black, semibold  ^ orange, tabular-nums
```

Files:
- `src/index.css` (`.handover-orange .handover-label` rule) → label becomes ink `#1A1A1A`, date keeps `--price-orange`.
- `src/components/ProjectCard.tsx`, `src/components/ReellyProjectCard.tsx`, `src/components/home/FeaturedListings.tsx` already use `<span className="handover-label">Handover</span>` + value span — only the CSS needs to flip the label colour.

### 2. Developer name — gold, clickable, underlined
Files:
- `src/components/ui/developer-link.tsx` — change the link class to `text-gold font-semibold underline underline-offset-4 decoration-gold/60 hover:decoration-gold` (always-on underline, not hover-only).
- `src/components/home/FeaturedListings.tsx` lines 217–230 — replace the local ink-coloured `<Link>` with `<DeveloperLink>` so the home cards match the standard.
- `src/components/ReellyProjectCard.tsx` — same fix where developer name is rendered.

### 3. Payment-plan badge — premium square
Replace the rounded-full pill with a premium square chip on every card:

```text
Before:  ( CreditCard 20/80 )   ← rounded-full, gold pill
After:   [ CreditCard  20/80 ]  ← rounded-md, ink fill, gold hairline, eyebrow text
```

Spec (matches the price-pill premium identity):
- shape: `rounded-md` (~6 px), padding `px-2.5 py-1`
- bg: `#1A1A1A`, text `#FDFBF7`, border `1px solid #B89555`
- inner eyebrow `PAYMENT` in `10px` uppercase tracking, value bold tabular-nums
- subtle gold inner shadow for the premium feel

Add a single CSS utility `.payment-plan-square` in `src/index.css` so all three cards stay in sync. Apply in:
- `src/components/ProjectCard.tsx` (footer meta row, lines 384–389)
- `src/components/ReellyProjectCard.tsx` (payment row)
- `src/components/home/FeaturedListings.tsx` lines 254–268

Also: the badge must render on **every** card (so currently-hidden conditions stay, but the visual is upgraded). When no payment-plan data exists, the slot stays empty — never fake.

### 4. Developer logo — full-fit on every project listing
The fake `Building2` fallback was already removed in the previous turn. Two remaining issues:

a. Logos still show a visible **champagne/white inner frame** because `DeveloperLogo` wraps the image in a `bg-[#FDFBF7] p-1.5 border border-[#B89555]/30` tile. Inside a project-card photo this reads as a "white border".

b. The image uses `max-h-full max-w-full object-contain`, so wide logos shrink and look cropped or undersized inside the 56×56 tile.

Fix in `src/components/ui/DeveloperLogo.tsx`:
- Add a `variant` prop: `"tile" | "bare"`. Default `"tile"` keeps current behaviour (used on the developer directory and dev-detail card where a tile makes sense).
- When `variant="bare"` (used by every **project card**): no border, no inner padding, transparent rounded-md background, image rendered with `object-contain w-full h-full` inside a `w-14 h-14` (or caller-controlled) box. No white frame; the logo sits cleanly on the photo with a soft drop shadow for legibility.
- Increase the box default to `w-16 h-12` (4:3) so wide wordmark logos (Emaar, Aldar, Meraas) are fully readable instead of squished into a square.

Apply `variant="bare"` in:
- `src/components/ProjectCard.tsx` (line 211)
- `src/components/ReellyProjectCard.tsx` (line 166)
- `src/components/home/FeaturedListings.tsx` (line 181)

Keep `variant="tile"` (default) on:
- `src/components/DeveloperCard.tsx` (developer directory grid)
- `src/components/area-detail/AreaDevelopersBar.tsx` (dev chips)
- `src/components/developer/RecommendedDevelopers.tsx`
- `src/components/project-detail/DeveloperInfoCard.tsx`

Marquee stays untouched: `src/components/DeveloperPartnersMarquee.tsx` is **not** modified.

### 5. Audit

After the changes, run a quick visual audit on:
- `/` (home → Featured Listings, plus untouched marquee)
- `/properties` (project grid)
- `/properties-reelly`
- `/developer/<slug>` (recommended-projects strip)
- `/project/<slug>` (recommended projects)

For each, verify: handover label is black + date orange, developer name is gold underlined and links to `/developer/:slug`, payment-plan badge is square premium, and every card with a known developer shows the real logo full-fit with no white frame and no Building2 fallback. Report findings inline; no hardcoded screenshots needed beyond the live preview the user can already see.

## Out of scope / locked

- `src/components/DeveloperPartnersMarquee.tsx` and its placement on the home page → **DO NOT touch**.
- CRM-internal logo usages (`SentHistoryView`, `CRMRelationships`) → keep current `tile` look.
- Fake brochures, price logic, filters → unchanged.