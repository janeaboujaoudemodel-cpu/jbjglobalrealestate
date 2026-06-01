# Complete /list-property + List with AI restyle (blue + white only)

Previous turn only converted the top shell of the AI wizard. The "Purpose" card still overlaps the hero, and every inner card on the AI wizard (What type of listing, Upload Documents, Paste Any Link, Paste Text, Extract buttons, plus the extracting / pricing / review / contact / submit phases) is still champagne+gold. This plan finishes the work and verifies it visually.

## Tasks extracted from the original message

1. Remove the gray look on the Smart Listing Creator card.
2. Make the wizard full width.
3. Push the Purpose section down so it stops overlaying the hero.
4. Apply the same navy + white treatment to the whole AI wizard page.
5. AI-Powered badge and Back to Portal → navy/white.
6. New Listing draft bar + all surrounding text → navy on white (or white on navy).
7. Restyle the wizard background as navy and inner cards as white (or the inverse) — only blue + white, like the header.
8. Verify contrast across every phase and take a screenshot.

## What I will change

### 1) `src/pages/ListProperty.tsx` — push Purpose card down
- Change the `<section className="… -mt-6 md:-mt-8 …">` (line 222) to `mt-8 md:mt-10` so the Purpose + Mode card sits **below** the navy hero, not overlapping it.
- Add `pb-8 md:pb-10` to the same section so it has clear breathing room before the active wizard.
- No other changes to ListProperty (hero + segmented pills already navy/champagne and look correct).

### 2) `src/pages/ListingPortalSubmit.tsx` — full navy shell, white inner cards
Wrap the entire returned `<section>` with `data-ai-listing-shell` and bump the inner container to `max-w-7xl` for true full width (previous turn left it `max-w-none` which is fine — keep it).

Then replace the recurring champagne card pattern with white cards via two layers:

a. **Scoped CSS override** in `src/index.css` (new block, ~25 lines), gated by `[data-ai-listing-shell]`:
   - Any descendant with `bg-[#FDFBF7]`, `bg-[#FDFBF7]/70`, `bg-[#FDFBF7]/80`, `bg-[#F7F2EA]`, `bg-[#EFE6D6]`, `bg-[#EFE6D6]/10`, `bg-[#EFE6D6]/15` → `background-color:#FFFFFF`.
   - Any descendant border using `border-[#B89555]/15|20|30|40` → `border-color:#102540` at 18 % opacity (navy hairline).
   - Any `text-[#1A1A1A]` stays as-is (ink on white = max contrast).
   - Inputs/Textareas inside the shell get `background:#FFFFFF; color:#1A1A1A; border-color:rgba(16,37,64,0.25)`.
   - Dashed upload zone border re-mapped to navy: `border-color:rgba(16,37,64,0.35)`.
   - Tag pills (`Google Drive / Property Finder / Bayut …`) → white bg, navy 10 % border, ink text.
   - Selected listing-type card (currently champagne + gold) → navy outline `2px #102540`, white bg, ink text, navy check-circle.

b. **Spot edits** for items the CSS can't cleanly cover:
   - "Run Price Prediction" / "Continue to Review" / "View My Listings" buttons (currently `bg-[#EFE6D6] text-[#1A1A1A]`) → swap to `jj-cta-dark` (navy bg, white text) with `data-cta="dark"` so they read as the page's primary action on white.
   - "Back" button on the Pricing phase (gold-champagne pill) → `jj-cta-outline` (navy outlined, ink text on white).
   - "Skip — Fill Manually" button (currently gold-bordered/gold-text — faded gold prohibition risk) → `jj-cta-outline` (navy border, ink text).
   - Re-extract Ghost button (line 1026) → navy text instead of ink-faded.
   - Confidence banner emerald/amber/red kept (semantic).
   - The submitted-success page (`return (<section …`) at the top of the file: convert the outer section to the same navy gradient and the approval-stages card to white.

### 3) Contrast guard
- Wherever the user-visible label sits on the navy shell (helper paragraphs above each white card, eyebrow tags), keep `text-white/85` / `text-white` with `data-no-contrast-guard` to prevent the global guard from flipping them to ink.
- Wherever the label sits inside a white card, use ink `#1A1A1A`. No `text-white` may remain inside a white card.

### 4) Visual verification (mandatory before closing)
Sequence with the browser tools:

1. `navigate_to_sandbox` → `/list-property?purpose=sale&mode=ai`, full screenshot.
2. Cycle through phases by injecting state — at minimum re-screenshot:
   - Upload phase (what is shown by default)
   - Click "Skip — Fill Manually" → check the Pricing AI / Review surface.
3. `navigate_to_sandbox` → `/list-property?purpose=sale&mode=manual`, screenshot (sanity that the Purpose card is no longer overlapping the hero on manual mode either).
4. `set_viewport_size 390x844` → re-screenshot the AI wizard on mobile to confirm white cards stack cleanly on navy.
5. If any text on the navy shell renders as ink-on-navy, or any text inside a white card renders as white-on-white, fix and re-screenshot.

## Files touched

```
src/pages/ListProperty.tsx              (1 section: push Purpose card down)
src/pages/ListingPortalSubmit.tsx       (wrapper data attr + ~6 spot button swaps)
src/index.css                           (scoped [data-ai-listing-shell] block ~30 lines)
```

No new components, no route changes, no business-logic changes — purely visual.

## Out of scope (will not touch)

- Reset button (already de-red'd in the prior turn and locked per user instruction in the prior message).
- Hero "List Manually / List with AI / View my submissions" buttons (already navy/champagne and not part of the highlight).
- /list-property?mode=manual SellerListing card styling (separate previous turn already champagne-on-navy-shell, and the user's screenshot was only about the AI wizard).
