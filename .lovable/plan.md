# Emerald Pill Unification + Newsletter Polish

Align three pill clusters to the same emerald "AED" header pill (deep emerald gradient + subtle metallic sheen, white text + white icons, per Emerald Surface → White FG global rule), and upgrade the newsletter input.

## 1. ProjectCard — Email / Call / Chat (`src/components/ProjectCard.tsx` ~L427–455)
- Swap the three anchor pills to use `.jj-pill-emerald` (same primitive as header AED chip).
- Add `data-no-contrast-guard` so icons + label stay white at all states.
- Keep 3-up row, equal width, icon-left, h-9.

## 2. Mortgage "Compare to bank rates" toggle (`src/components/mortgage/MortgageParityPanel.tsx`)
- Rebuild segmented control so its **width matches the sibling sliders** (Loan Term / Down Payment / Interest Rate / Property Price) — full container width, same height.
- Active segment = `.jj-pill-emerald` with the existing `jj-sqtoggle-sheen` metallic sheen animation; the inner thumb/circle indicator also becomes emerald (not gold).
- Inactive segment = transparent, ink label.

## 3. "Ready to Get Started" contact pills (`src/components/CombinedContactNewsletter.tsx` ~L43–119)
- Convert WhatsApp / Call Us / Email from rounded pills → **premium rectangular tiles** (`rounded-xl`).
- Apply emerald metallic surface + 1px gold hairline frame + white icon/label/value, `data-no-contrast-guard`.
- 3-col grid desktop, stack on mobile.

## 4. Newsletter input + headline (`src/components/CombinedContactNewsletter.tsx`, `src/components/marketing/NewsletterBrevo.tsx`)
- Upgrade "Stay in the Loop" headline to a premium attention-grabbing title (e.g. "Get the Edge — New Listings, Market Moves & Insider Insights") with a short ink sub-line.
- Restore prior dark input styling: dark emerald/ink field, white typed text, white-ish placeholder: *"Enter your email — new listings, market updates & insider insights"*.
- Submit button stays emerald metallic to match the new pill family.

## Notes
- Uses existing `.jj-pill-emerald` + `jj-sqtoggle-sheen` primitives in `src/index.css` — no new tokens.
- `data-no-contrast-guard` on all emerald surfaces keeps white fg (PASS 10).
- No href/onClick or business-logic changes.
- Verify visually at 1144px and 390px.
