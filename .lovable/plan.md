## Goal

Fix four concrete problems you flagged, no scope creep, no feature removal.

---

## 1. Interior Design AI — restyle body to match the header

Keep the purple→indigo→teal header gradient (the part you said "looks perfect") and reuse it as the page's visual identity:

- **Subtitle "Upload a photo or describe your space…"** → solid white (`#FFFFFF`) at 90% opacity for contrast against the gradient.
- **All inner cards** (Project Name input, Concept/Redesign/Staging tabs, Upload Photo card, Design Style, Color Palette, Design Assistant) → switch from current near-black panels to the same purple-violet gradient family as the header, with a 1px violet hairline border and matching glow shadow.
- **Section headers** ("Design Style", "Color Palette", "Design Assistant") → white text, violet icon tile (same as the AI-Powered Design chip in the hero).
- **Style chips** (Modern, Classic, Luxury…) → unify as violet outline pills; active = filled violet gradient + white text.
- **"Generate Concept" CTA** → keep purple→pink gradient but make sure idle + hover both render white label + white sparkle.
- **Layout fix** — content currently slides under the fixed app header. Add `pt-[88px]` to the tool shell body when not in fullscreen so the hero starts below the 88px chrome.

## 2. Fullscreen toggle — invert the logic globally

Right now the maximize button shows on tool pages that are already in normal mode, which is confusing.

- Rename the control from ambiguous icon → `Maximize` / `Exit fullscreen` with a clear label tooltip.
- **Default state = normal (sidebar + header visible).** Tool opens inside the L-shaped frame just like every other page.
- Clicking **Maximize** → hides global header + vertical sidebar + utility bar (this is the real fullscreen), button swaps to **Exit fullscreen**.
- Clicking **Exit fullscreen** → restores chrome, button swaps back to Maximize.
- Apply to every tool that uses `PremiumToolShell` or `ToolAnimatedFrame` (no per-tool wiring needed — it's a single component).
- The recent `data-tool-fullscreen` CSS in `index.css` already does the hide work; only the toggle component needs the label + state-sync fix.

## 3. List Property — fix Purpose card contrast (`/list-property` top section)

Inactive segmented pills (`For Sale` ↔ `For Rent`, `Manual` ↔ `AI-Assisted` ↔ `Browse`) currently render as **empty white pills** because the inner icon/label color is being overwritten.

- Lock inactive pill: white background, **mode-color** text + icon (emerald for Manual, violet for AI, navy for Browse), 1.5px mode-color border. No global guard can override (apply `!important` via inline `color` + `WebkitTextFillColor` + `data-no-contrast-guard`).
- Lock active pill: mode-gradient background, white label + icon at idle and hover.
- "View my submissions →" button kept as-is but verified contrast.

## 4. List Property AI-Assisted page (`Seller Assistant`)

- **"Extract with AI"** purple CTA — verify white label + white sparkle at idle/hover.
- **"Skip — Fill Manually"** outline button — make the label visible (currently lavender-on-lavender). Lock to violet text on white pill, violet border.
- **"Open Dashboard →"** button on the "My Listing Submissions" band — currently invisible (white text on light gradient). Lock to navy fill + white label + white arrow.
- **"No submissions yet"** subtitle — switch to ink `#1A1A1A` at 75% on the cream card (currently lavender-on-lavender).

## 5. List Property main mode picker (`Seller Listing Tool` / `Seller Assistant (AI)` cards)

- **"Start →"** CTA on both cards is currently invisible because the white label sits on a light pill inside a dark card. Lock to: white fill, dark navy ink label, navy arrow — same pattern used on the navy CTA system across the site.
- Card body text colors verified: eyebrow, title, description all render white on the dark card; meta chip (`≈ 4–6 minutes` / `≈ 60 seconds`) renders white-on-white-translucent and stays readable.

## 6. List Property manual page (`Seller Listing Studio`)

- Same Purpose pill fix as section 3 (component is shared, so this is one fix).
- Verify "Back to Portal" stays ink-on-cream.

---

## Validation

Before delivering: take screenshots of `/interior-design-ai`, `/list-property` (top), `/list-property?mode=ai`, `/list-property?mode=manual` and confirm:
1. Every button label and icon is visible at idle.
2. Hover does not flip white-on-white.
3. No content sits under the 88px header.
4. Maximize button shows correct label for its current state.

## Out of scope (will not touch)

- Backend / edge functions.
- Lead-capture form fields, validation, or submission logic.
- Other tool pages (Mortgage, Rental Index, Business Card Scanner) — earlier turns covered the global scroll fix; further reskin of those is a separate request.
- Removing any existing feature, card, or section.

## Files touched

```text
src/components/tools/FullscreenToolToggle.tsx     (label + state sync)
src/pages/InteriorDesignAI.tsx                    (body reskin + subtitle contrast + 88px offset)
src/pages/ListProperty.tsx                        (SegmentedPill lock + Start CTA fix)
src/pages/SellerListing.tsx                       (Extract / Skip / Open Dashboard / No submissions contrast)
```

Approve and I'll execute the four fixes in one pass, with screenshot verification at the end.
