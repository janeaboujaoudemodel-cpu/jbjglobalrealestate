

## Stamp Generator — Critical Fixes & Upgrades (Phase 1)

This is a large request with 15+ distinct issues. I'll organize them into priority tiers and address the most impactful ones first.

---

### Priority 1: Critical Layout & Rendering Fixes

**A. Official Template — Fix text overlay & circle structure**
The `stampOfficialTemplate.ts` has layout issues where Arabic and English company names overlay each other on the top arc. The template needs:
- Arabic company name on TOP arc (between outer ring and inner ring)
- English company name on BOTTOM arc (between outer ring and inner ring)  
- Dot/star separators at 3 & 9 o'clock between the two arcs
- Location text between inner ring and center circle (Arabic top, English bottom)
- Only 3 circles total: outer ring, inner ring, center circle (remove any extra)
- Text must be centered between ring borders, never touching them
- Reduce gap between inner ring and center circle; increase gap between outer and inner rings

**B. Color not applying — "Corporate Official Blue" shows as black**
The `generateOfficialStampSVG` uses color tokens (`C_PRI = '#1a2744'`, `C_SEC = '#2a3a5c'`) which are dark navy, not the actual `#1B3A8C` blue. When `StampSVGRenderer` tints, it replaces `#1a2744` with `primaryColor`, but the default `primaryColor` in state is `'#1B3A8C'`. The issue is the token replacement regex is case-insensitive but the tokens and actual ink color don't match visually. Need to verify the tinting pipeline works end-to-end and ensure the preview uses the actual ink color.

**C. Border style not affecting preview**
When user selects SINGLE/DOUBLE/RING/DOTTED/ROPE in the wizard, the `LiveStampPreview` correctly handles these for EN-only round stamps (lines 183-222), but for bilingual stamps it delegates entirely to `generateOfficialStampSVG` which has fixed double-ring layout. Need to pass `borderStyle` to the official template and make it responsive.

**D. Remove duplicate "Your Company Name" — compressed one**
The EN-only round stamp path (lines 226-280) shows company name on top arc. The bilingual path via `generateOfficialStampSVG` shows it on both top and bottom. The user sees both because both code paths may run or the template renders overlapping text. Need to ensure only one clear company name arc per position.

**E. StampPreviewModal — left panel hidden behind sidebar**
The modal uses `fixed inset-0 z-[9000]` but the global sidebar has z-index `9997` (from `z-index.ts`). Need to increase the modal z-index to `10050` (dialog level).

**F. Fullscreen expand not working**
The `Maximize2` button triggers `setStampFullscreen(true)` but the fullscreen overlay is at `z-[9999]` — should work. Need to verify the click handler reaches through. The up/down arrows (if referring to the preview panel) may not have expand handlers wired.

---

### Priority 2: UX & Feature Improvements

**G. Smart Auto-Fill — highlight & guide popup**
Keep current collapsed structure but add:
- A one-time tooltip/popover on first visit: "Upload your trade license to auto-fill company details"
- Visual highlight with gold border and sparkle icon
- Store dismissal in localStorage

**H. Logo upload persistence**
`localLogoUrl` is stored in component state (lost on navigation). Need to:
- Save uploaded logo as base64 in localStorage keyed by project ID
- On mount, restore from localStorage and show thumbnail with "Continue with this logo?" prompt

**I. Custom color palette — save up to 5 user colors**
Add a "My Colors" section in the Colors tab:
- Up to 5 custom swatches saved in localStorage
- Add via color wheel + "Save" button
- Delete individual swatches
- Label each swatch

**J. Generation speed**
The edge function call to `ai-stamp-generator` is slow. Add optimistic client-side concepts first (instant), then replace with AI results when ready. Already has `generateStampConcepts` client-side fallback — make it the immediate response.

---

### Priority 3: Preview Modal & Mockup Fixes

**K. Mockup tab labels overlapping content**
The mockup view tabs (business-card, letterhead, etc.) overlap the mockup content area. Fix with proper scroll containment and z-index on the tab bar.

**L. Business card stamp placement**
Add position controls: Left, Center, Right buttons for stamp placement on business card mockup. Currently fixed at right side.

**M. Remove gray backgrounds in mockup editor**
Replace gray containers with champagne/white backgrounds per design system.

**N. Gold scrollbars everywhere**
Ensure all scrollable areas use `.jj-scrollbar-gold-x` / gold-y classes.

---

### Files to Modify

1. **`src/lib/stampOfficialTemplate.ts`** — Fix circle structure (3 rings only), text placement between rings, pass borderStyle, fix gaps
2. **`src/components/stamp-generator/LiveStampPreview.tsx`** — Pass borderStyle to official template, fix EN-only text overlay
3. **`src/components/stamp-generator/StampGeneratorPage.tsx`** — Logo persistence, custom palette, auto-fill guide tooltip, fix modal z-index references
4. **`src/components/stamp-generator/StampPreviewModal.tsx`** — Fix z-index to 10050, fix mockup layouts, add stamp position controls, remove gray bg, gold scrollbars
5. **`src/components/stamp-generator/StampProjectWizard.tsx`** — Wire borderStyle to preview

### Scope Note
The "Corporate Suite" integration request (combining stamp, letterhead, business card, e-signature into one unified tool) is a major architectural change that should be planned separately after these critical fixes are stable. Similarly, making mockups fully interactive with drag-to-position and live editing is a Phase 2 feature.

