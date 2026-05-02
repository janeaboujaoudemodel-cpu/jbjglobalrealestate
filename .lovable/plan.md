# Reelly-style developer logo cards

The directory cards on `/developers` (and the listing page header `DeveloperGrid` on /properties) currently render the `feature_image_url` photo full-bleed, with the actual brand logo squeezed into a tiny 12×16 overlay in the top-left corner. Logos look inconsistent — different sizes, sometimes cropped, sometimes invisible because `feature_image_url` overshadows them.

The user wants the Reelly.ai treatment: every developer card identical in size and shape; the **logo itself** is the hero of each card, full-fit (no cropping), on a uniform rounded surface, with the developer name + stats below.

## What changes

### 1. `src/components/DeveloperCard.tsx` — Reelly-style logo card

Remove the photo-first design. Replace the top half with a **uniform rounded logo plate**:

```text
┌──────────────────────────────────┐
│                                  │
│                                  │
│         [    LOGO     ]          │  ← rounded-xl plate, white/champagne bg,
│                                  │     logo object-contain, 70% padding
│                                  │
│                                  │
├──────────────────────────────────┤
│ EMAAR PROPERTIES        [ELITE]  │
│ Premier UAE developer            │
│ ───────────────────────────────  │
│  🏢 128 Projects   📈 80k+ Done  │
└──────────────────────────────────┘
```

Implementation:
- Drop `feature_image_url`, `imageError`, `WHITE_BG_DEVELOPERS`, `isDamac`, the dark gradient fallback, the small overlay logo block — none of it survives.
- Card chrome: `rounded-2xl border border-[#B89555]/35 bg-[#FDFBF7] shadow-[0_8px_24px_rgba(200,167,102,0.18)]`. Hover: lift + stronger shadow (no color change). Same fixed aspect for all cards (`aspect-[5/4]` for the logo plate, then content row underneath).
- Logo plate: `aspect-[5/3]` rounded-t-2xl block, `bg-[#FFFFFF]` (clean white — wordmark + colored marks need it), centered with generous padding so logos breathe and never crop. Inner `<img>` uses `object-contain max-h-full max-w-full`.
- When `logo_url` is missing or invalid (per `isValidDeveloperLogoUrl`) → render the approved `Building2` fallback centered + the developer name in a refined wordmark-style display. NEVER fall back to a project photo (locked rule, see `developerLogo.ts`).
- Tier badge stays top-right, on the logo plate, smaller pill (`px-2 py-0.5 text-[9px]`).
- Bottom content row: developer name in 16px ink, optional 1-line description, stats row (Projects / Delivered) — same as today but tightened.

### 2. `src/components/DeveloperGrid.tsx` — uniform header logo tile

The per-developer header tile on `/properties` currently has variable size (`min-w-[280px] md:min-w-[350px]`, `max-h-16`/`max-h-20`). Standardize to a **fixed rounded plate** matching Reelly:
- Wrapper: `w-[260px] h-[120px] rounded-2xl bg-[#FDFBF7] border border-[#B89555]/35 shadow-md flex items-center justify-center p-5`.
- Logo: `max-h-full max-w-full object-contain`. No cropping, no stretching.
- No-logo fallback: developer name centered in ink semibold.

### 3. `src/components/ui/DeveloperLogo.tsx` — add a sized "card" variant

Today the component has `tile` (small 56×56) and `bare` (overlay). Add a third variant **`card`** that renders the rounded logo plate used on the directory: white background, ample padding, `object-contain`, no cropping. The new `DeveloperCard` will render `<DeveloperLogo variant="card" size="lg" ... />`. This keeps the locked rule (only `logo_url`, with `Building2` fallback only — never a substitute photo) centralized.

### 4. Memory update

Refresh `mem://features/ui/developer-logo-standard-v7-locked` (currently "Champagne padded container standard for brand logos") to v8:
- Public directory cards (`/developers`): **logo-first Reelly-style cards**, white plate, full-fit `object-contain`, uniform size, rounded-2xl, gold hairline, no feature photos.
- Header tiles (`/properties`, `DeveloperDetail`): fixed-dimension white plate, rounded, gold hairline, `object-contain`.
- Locked rules from `developerLogo.ts` remain: only `logo_url`, Building2 fallback only, never a project/feature photo.

## Files changed

- `src/components/DeveloperCard.tsx` — rewritten as logo-first Reelly card
- `src/components/DeveloperGrid.tsx` — uniform fixed-dimension logo tile
- `src/components/ui/DeveloperLogo.tsx` — add `variant="card"` rendering
- `mem://features/ui/developer-logo-standard-v7-locked` → v8 with new rules

## Out of scope

- `developerLogo.ts` resolver and locked allow-list — unchanged (already correct).
- DeveloperDetail page header tile — already correct (rounded, white, object-contain).
- Project cards' overlay logo — `bare` variant unchanged.
- The "No Removal" policy is respected: tier badges, project counts, descriptions, "Delivered" stat all preserved on the new card layout.
