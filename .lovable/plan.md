## Goal

Eliminate every visible white/champagne gap around the colored bands on the three listing pages, fix all contrast/readability inside the Seller Details card and the "No submissions yet" card, and re-skin the AI listing page so it uses the same stepper-and-small-card layout as the manual page (in purple).

Pages in scope:
1. `/list-property` — main entry (mode-aware: navy/emerald/purple)
2. `/list-property?mode=manual` — `src/pages/SellerListing.tsx` (emerald)
3. `/list-property?mode=ai` — `src/pages/ListingPortalSubmit.tsx` (purple)

No backend changes, no removed features.

---

## 1. Seal the white edge gaps (all 3 pages)

### Root cause
On `/list-property`, the page is wrapped by an outer chrome:
```
<div className="px-2 sm:px-4 md:px-6 py-4 md:py-6">
  <AnimatedBorderShell tone="navy" bare>
    <div style={{ backgroundColor: CHAMPAGNE }}>  ← champagne page fill
```
The `AnimatedBorderShell` adds a rounded animated border, and the surrounding `px-*/py-*` padding leaves a champagne band on every side. Even though the inner sections are full-bleed `<section>`s, they stop at the shell's rounded edge — so a thin champagne sliver shows on the right/top/bottom (the line the user circled).

### Fix (`src/pages/ListProperty.tsx`)
- Remove the outer padding wrapper and the `AnimatedBorderShell` for this page only — replace with a flat full-bleed container `<div className="min-h-screen w-full">` so every `<section>` reaches viewport edges.
- Keep the page `data-listing-mode={theme.name}` attribute and SEO head.
- Every internal `<section>` already has its own background (hero gradient, `ombreSoft(theme)`, `theme.sectionGradient`). Make sure each section uses `w-full` with no horizontal padding on the section itself — only on the inner `max-w-*` content wrapper. Audit and fix any section that still relies on the parent's `px-*` for its color band.
- Result: hero → Purpose ombre → Picker ombre → My Submissions deep band, all flush to the viewport edges, no gaps.

### Fix (`src/pages/SellerListing.tsx`)
- The outer `<main data-manual-listing-shell className="min-h-screen pt-6 pb-12 md:pb-16" style={ombre}>` is fine, but the inner emerald sections (steps + form band) need `w-full` and the `container mx-auto px-4` only on the inner content (already correct). Verify the `pt-6` doesn't expose a sliver above the hero ombre — if it does, drop `pt-6` and let the hero start at y=0.
- Inner "form card" (line ~659) is rounded with a soft gradient on top of the deep emerald band — that's expected and is the design. The visible gap is ONLY the page frame; with the shell removed at the parent (`ListProperty.tsx` lazy-loads this), the manual page will render edge-to-edge.

### Fix (`src/pages/ListingPortalSubmit.tsx`)
- Outer section already has `data-ai-listing-shell` with a soft purple ombre and an inner `max-w-6xl` deep-purple card. Add `w-full` and verify no `px-*` chrome on the outermost `<section>` — the soft ombre must reach viewport edges. The inner deep-purple card stays inset (this is the design — same as Manual's form card on the emerald band).

---

## 2. Seller Details readability + premium ombre (`SellerListing.tsx`)

Inside the form card (currently `linear-gradient(135deg, #E8F3EC 0%, #FFFFFF 55%, #D4E9DB 100%)` with border `#0F5132`):

- **Section title** "Seller Details" + subtitle: switch to deep emerald ombre text using `WebkitBackgroundClip:'text'` with `linear-gradient(135deg, #064E3B 0%, #0F5132 50%, #022C22 100%)`. Make the title 22px bold, subtitle `#1A1A1A`/85% opacity at 14px.
- **All field labels** (`<Label>` blocks across all 7 steps): force color `#064E3B` (deep emerald), font-weight 600, letter-spacing 0.01em. Required asterisks `*` use `#B91C1C`.
- **Inputs / Selects / Textareas / Radios**: background `#FFFFFF`, border `1.5px solid #10B981/45`, focus ring `2px #0F5132`, placeholder `#1A1A1A`/55%, value text `#1A1A1A`. Active radio fill `#0F5132` with white dot.
- **Card surface**: deepen the ombre to `linear-gradient(135deg, #DCEFE3 0%, #FFFFFF 50%, #C8E2D0 100%)` with a 1.5px `#0F5132` hairline and `0 24px 60px -28px rgba(15,81,50,0.35)` shadow — feels luxurious without losing legibility.
- **Step indicator labels** (white on dark emerald) already read white per the prior fix — keep.
- **Previous / Next Step buttons**: Previous = champagne ghost with emerald border + emerald text; Next Step = solid emerald gradient `#0F5132 → #064E3B` with white text + white arrow.

Apply the same label/input rules to every step component used inside `SellerListing` (Property Basics, Pricing, Condition & Upgrades, Media Uploads, Documents Vault, Review & Submit) so the look stays consistent across the wizard.

---

## 3. "No submissions yet" + "Sign in to track" cards (`ListProperty.tsx` MySubmissionsSection)

Both inner cards sit on the deep mode band. Fix readability:

- **Title** ("No submissions yet" / "Sign in to track your submissions"): change from `accent` (deep emerald, invisible on the soft white-mint card) → ombre white-on-mode text using `linear-gradient(135deg, #FFFFFF 0%, ${theme.primary} 60%, #FFFFFF 100%)` clipped to text, OR solid white if the card has enough underlay. Per user: "make it in white" — render `#FFFFFF` with `textShadow:'0 1px 6px rgba(0,0,0,0.18)'` so it pops over the white-tinted card.
- **Inner card backgrounds**: deepen from `#FFFFFF→primary14→#FFFFFF` to `${theme.primary}1F → #FFFFFF55 → ${theme.primary}1F` so the title legibly reads white over a mid-tone tinted card (still soft ombre, but enough contrast).
- **Icon tile**: keep solid theme gradient + white icon.
- **Body text under the title**: white at 90%.
- **Buttons** ("Sign in to continue"): keep solid theme primary with white text.

---

## 4. AI page layout parity (`ListingPortalSubmit.tsx`)

The AI page currently runs phases (`upload → extracting → review → pricing_ai → success`) as one long flow inside a deep-purple card. Refactor to mirror the Manual wizard:

### Layout structure (purple version of Manual)
1. **Hero band** (soft purple ombre `#F2EBFF → #FFFFFF → #E5D6FF`)
   - Eyebrow pill "AI Smart Listing"
   - H1 "List Your Property with AI" (purple ombre clip)
   - Subtitle
   - FormDraftBar (purple theme)
   - Primary CTA "Get Help with JBJ AI Assistant" (solid `#5B21B6 → #2E1065` purple gradient, white text)
2. **Deep purple band** (`#2E1065 → #4C1D95 → #0B0B0B`) wrapping:
   - Horizontal step indicator (same component as Manual STEPS): mapping the AI phases to discrete labeled steps:
     - Step 1: **Upload Sources** (replaces current upload phase: category + docs + URL + paste)
     - Step 2: **AI Extraction Review** (extracted data preview/edit)
     - Step 3: **Pricing Intelligence** (price prediction)
     - Step 4: **Seller Details** (reuse Manual's contact fields)
     - Step 5: **Media Confirmation** (gallery)
     - Step 6: **Review & Submit**
   - Active step icon = white-on-purple gradient circle, completed = filled purple, future = translucent white.
   - Below the steps, the **per-step content card** uses the soft purple ombre `linear-gradient(135deg, #F2EBFF 0%, #FFFFFF 55%, #E5D6FF 100%)` with `1.5px #A855F7` border — exact mirror of Manual's emerald form card.
   - Inside the card: deep purple field labels (`#5B21B6`), white inputs with purple borders, placeholders ink/55%.
   - **Previous / Next Step** buttons at the bottom of every step (Next = solid purple gradient, Previous = champagne ghost with purple border).
3. **My Listing Submissions** band (purple `sectionGradient`) reused via shared section — already exists in `ListProperty.tsx` so AI mode inherits.

### Implementation approach
- Introduce an `AI_STEPS` constant (icons: Upload, Sparkles, DollarSign, User, Camera, CheckCircle2) and a `currentStep` state.
- Wrap the existing phase content in a new step renderer that uses `currentStep` to decide which section to show; preserve every existing handler (`runAIExtraction`, `pricePrediction`, image upload, submit). No feature removed.
- The "extracting" loading state becomes a transient overlay on Step 2 instead of a separate phase screen.
- Map current `phase` state ↔ `currentStep` for backwards compatibility with the success screen.
- Keep all AI extraction/edge function calls intact.

---

## 5. E2E visual validation (in build mode)

After implementation, navigate the preview to:
- `/list-property?purpose=sale` (navy)
- `/list-property?purpose=sale&mode=manual` (emerald) → step through Seller Details → Next Step → Property Basics
- `/list-property?purpose=sale&mode=ai` (purple) → verify stepper + step-1 card + Next Step

Take screenshots at 1366×900 of each page and crop edges to confirm no champagne sliver, then crop the inner Seller Details / No Submissions / AI step card to confirm readable titles and labels.

---

## Files to edit

- `src/pages/ListProperty.tsx` — drop outer padding/`AnimatedBorderShell` chrome; deepen MySubmissions inner cards; white ombre titles for empty states.
- `src/pages/SellerListing.tsx` — deepen form-card ombre; emerald labels; emerald inputs; ombre title; Next/Previous button polish.
- `src/pages/ListingPortalSubmit.tsx` — full restructure into stepper layout mirroring Manual, keeping purple theme and all existing AI logic.
- (No new files; no backend; no `index.css` changes required — all themed inline via existing tokens.)

No data model, RLS, edge functions, or routes change.
