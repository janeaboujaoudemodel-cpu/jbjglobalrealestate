## Goal
Elevate the Ink Emerald (`var(--gradient-ink)` / emerald #0B3B2E family) from "dark-CTA repaint" into a **deliberate brand accent system** used consistently across titles, icons, key CTAs, and signature surfaces — so the site feels cohesive, premium, and unmistakably JBJ. No black/champagne removed; emerald becomes the *hero accent* alongside gold.

---

## 1. Bug fix — Continue Searching cards show no project image
**File:** `src/components/home/ContinueSearchingRail.tsx` (and/or the card primitive it renders)

Symptom (screenshot 1): every card is a solid emerald gradient with only the developer logo tile + title — the actual project cover photo never paints. Root cause is the same PASS 9 emerald repaint bleeding into the card's image surface (the card root or its image wrapper carries `data-surface="dark"` / `bg-[#0A0A0A]` for the fallback color, so the gradient overrides the `<img>`'s background).

**Fix:** add `data-ink-emerald-opt-out` to the card image wrapper (the `<div>` that holds the `<img>` / background-image), and ensure the image element itself uses `object-cover` over a neutral champagne fallback. Verify by reading the component first.

---

## 2. JBJ Royal Tools Hub — make the active tool panel show its full image
**File:** `src/pages/JBJDesignStudio.tsx` or `src/components/tools/RoyalToolsHub.tsx` (whichever renders the Property Evaluator / Comparison / AI Home Finder / Mortgage / Rental Index / List-for-Sale tabbed panel from screenshot 2)

Currently the left half is a solid emerald wall and the photo only shows on the right. Same root cause. **Fix:** add `data-ink-emerald-opt-out` to the panel's image container so the full magnifier-on-blueprints photo shows edge-to-edge. The `Get Evaluation` button stays emerald (already correct — that's the target CTA style).

---

## 3. Explore Our Services — match `Explore Now` button to Get Evaluation
**File:** `src/components/home/ExploreServicesExpander.tsx`

The card image opt-out is already in place. Now upgrade the **`Explore Now`** button to the same emerald-gradient pill used by `Get Evaluation` (apply `.jj-cta-dark` or `data-cta="dark"` class so PASS 9 paints it with `var(--gradient-ink)` + gold hairline + white text). Same hover behavior.

---

## 4. Handpicked For You — emerald-tint the Email / Call / Chat trio
**File:** `src/components/properties/PropertyCard.tsx` (or the action-row sub-component)

Currently the three pill buttons are champagne with ink text (screenshot 3). Promote them to **emerald-outline pills**: 1px emerald hairline border + emerald icon + emerald label on champagne fill; on hover, fill emerald with white text/icon. This applies **everywhere these three actions appear** (project detail page, search results, favorites, broker views) — single-source change in the card component.

---

## 5. Section title + icon emerald promotion
Promote signature section titles & their icon tiles to emerald (instead of black ink) so the brand color leads the eye:

- **Top Areas in Dubai** (screenshot 5) — title in emerald, `<IconTile tone="emerald">` for the `📍 TOP AREAS` chip, **Area names** ("Dubai Islands", "Business Bay", "Dubai South") in emerald.
- **Explore Our Guides & Reports** — title + icon in emerald.
- **Ready to Get Started** (screenshot 4) — `GET IN TOUCH` chip already emerald (good); upgrade the three contact cards (WhatsApp / Call Us / Email): icon tile in emerald, label "WHATSAPP/CALL US/EMAIL" in emerald, value in ink.
- **Featured Properties → Handpicked For You** (screenshot 3) — `🏠 FEATURED PROPERTIES` chip stays emerald (already good).
- **Recently Viewed → Continue Searching** — clock-history icon chip in emerald.

**Implementation:** introduce a new design token + utility class:

```css
/* index.css */
:root { --emerald-ink: #0B3B2E; --emerald-ink-soft: #134E3A; }
.jj-title-emerald { color: var(--emerald-ink); }
[data-icon-tile-tone="emerald-strong"] { background: var(--gradient-ink); color: #fff; }
```

Then update `<IconTile />` to accept `tone="emerald"` (already exists per memory) and ensure it maps to the new strong emerald, and add `<SectionHeader emerald />` prop (or just apply `.jj-title-emerald` to specific section h2s).

---

## 6. Scroll-to-top / scroll arrows → emerald & restyled
**File:** `src/components/ui/ScrollToTop.tsx` (and any inline up/down chevrons in `src/pages/Index.tsx`)

Replace the plain ↑/↓ arrow buttons with a **circular emerald pill** (44px, `var(--gradient-ink)` fill, white chevron, gold hairline ring, soft emerald shadow). Use a different icon variant — `ArrowUpToLine` / `ArrowDownToLine` from lucide — for a more distinctive shape than the current basic arrow.

---

## 7. Memory updates
Update `mem://style/color-palette/ink-emerald-gradient-standard` to record the **promotion**:

- Emerald is now a **brand accent**, not just a CTA repaint
- Approved emerald uses: signature CTAs, section titles (curated list), icon tiles on key chips, area/zone names, scroll-to-top control, contact card icons + labels
- Forbidden: emerald on body text, on photo overlays (must opt-out), on every button (keep ink CTAs for tertiary actions), on input fields

Also add a new short rule to `mem://index.md` Core section:
> Emerald promotion: titles in Top Areas / Guides / Reports / Ready-to-Get-Started, contact-card icons+labels, area names, scroll-to-top, and primary CTAs (`Explore Now`, `Get Evaluation`, `View All Projects`, Email/Call/Chat trio) use `var(--gradient-ink)` family. Body text + photo overlays always opt-out.

---

## Verification
1. Browser screenshot homepage at desktop width — verify: Continue Searching cards show real photos; Royal Tools Hub photo edge-to-edge; Explore Now matches Get Evaluation; Email/Call/Chat are emerald-outlined; Top Areas title + area names are emerald; Ready-to-Get-Started cards have emerald icons + labels; scroll-to-top is an emerald pill.
2. Spot-check the project detail page to confirm Email/Call/Chat upgrade carries through.
3. Confirm no regression: hero search bar, Explore Our Services photo, Buy Property card image still show photos (opt-outs intact).

## Out of scope
- No backend / data / RLS changes.
- No new pages or routes.
- Existing black CTAs not listed above stay as-is.
