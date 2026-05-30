# Plan — Stop, Consolidate, Enforce ONE Contrast Rule

I will stop adding new CSS and instead **delete conflicting layers**, lock a single rule, and visually verify each highlighted spot.

## The ONE Rule (locked, no exceptions except where you named them)

| Surface (own background) | Text + Icons |
|---|---|
| Navy `#102540` / `#1a3d63` | **WHITE** (idle + hover) |
| Black / Ink `#1A1A1A` | **WHITE** (idle + hover) |
| Champagne `#F7F2EA` / Cream `#EFE6D6` / Gold `#B89555` / White | **INK `#1A1A1A`** (idle + hover) |

**Named exceptions only:** expanded broker sidebar category labels (gold idle → ink hover). Nothing else.

## Step 1 — Clean conflicting CSS (delete, don't add)

In `src/index.css` I will **remove** the recently stacked overlapping rules that fight each other:
- Duplicated "navy box lock" blocks
- `.jj-hero-consultation-cta` one-off lock
- Any late `hover:bg-*` foreground inference rules
- Stray `[data-cta]` overrides added in the last 3 turns

Replace with **one** consolidated block keyed off `data-surface` + own-bg hex detection. No component-specific CSS.

## Step 2 — Fix each highlighted regression

1. **Hero "Free Consultation"** (`HomeHeroSearch.tsx`) — fiberglass dark translucent box, white label + white icon, locked idle/hover. Remove the one-off class.
2. **"Get Verified" banner** (`VerificationBanner.tsx`) — champagne pill = INK text + INK arrow. Shield icon tile = navy box = **WHITE** shield (currently rendering black — fix).
3. **ProjectCard email button** — replace circle with **inbox/envelope shape** (`Mail` icon in rounded-square champagne tile, ink stroke). Same for Call/Chat: rounded-square, champagne bg, ink icon.
4. **Overseas Investors strip** ("Invest in Dubai…") — navy bg, **WHITE** title + WHITE stats + WHITE "Learn more" + WHITE arrow + WHITE globe. Strip any contrast-guard flip.
5. **Explore Our Services** (`ExploreServicesExpander.tsx`):
   - Section title/subtitle on dark image panel → **WHITE**
   - Active tab ("Buy Property") = champagne bg + INK text/icon
   - Inactive tabs = navy/dark + WHITE text/icon
   - "Explore Now" CTA = navy/fiberglass + WHITE label + WHITE arrow
6. **JBJ Royal Tools Hub** (`ToolkitShowcaseCard.tsx`) — same rules: "Explore JBJ Tools" header CTA on navy = WHITE; active tab champagne+ink; "Calculate Now" navy+WHITE.
7. **AI Property Comparison** (`AIComparisonWidget.tsx`) — "Start exploring" button: bg `#1A1A1A` → WHITE label + WHITE icons (currently ink — fix).
8. **"Connect With Mortgage Partners"** (`Index.tsx` ~L439) — navy bg → WHITE label + WHITE icons.
9. **"Explore All Areas"** (`AreasWeCover.tsx` via `pearl-button`) — if rendered on dark, WHITE; if champagne, INK. Read computed bg and lock.
10. **Continue Searching marquee** (`ContinueSearching.tsx`) — replace current snap rail with the **same continuous CSS-keyframe marquee** used by "Explore Our Guides & Reports" at the same speed. Developer name row: align baseline across all cards, WHITE on the dark card overlay.
11. **Books / Guides titles** — restore the original PremiumBookCover label rendering; revert any color change made in the last 2 turns.

## Step 3 — Sitewide audit pass

Run `scripts/contrast/check-contrast-architecture.mjs` + a fresh `check-white-on-light.mjs` and `check-black-on-dark.mjs`. Fix every hit, not just the highlighted ones.

## Step 4 — Visual proof (mandatory before I claim done)

For each of the 11 spots above I will capture browser screenshots at desktop (1366) **and** mobile (390), in **idle** AND **hover** states, and paste them in the reply. No "looks good" claim without the screenshot.

## Step 5 — Memory update

Update `mem://constraints/navy-pill-white-text-lock` and `mem://ui-ux/visual-standards/cta-primitive-system` with the consolidated rule and the exception list (broker sidebar only). Remove now-obsolete one-off entries.

## What I will NOT do

- No new component-specific CSS classes
- No new `data-*` attributes beyond the existing `data-surface` / `data-cta` / `data-no-contrast-guard`
- No edits to business logic, data, or unrelated components
- No "I think it's fixed" — only screenshot-verified completion

Approve and I'll execute in order: clean → fix → audit → screenshot proof.
