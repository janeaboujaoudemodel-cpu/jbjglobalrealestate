

# Fix: Gray Scrollbars, AI Analyzer Cons/Metrics, Logo Background, and E-Signature Flows

## 6 Issues to Fix

### 1. Gray Native Scrollbar Still Visible on Filter Bars (Project Detail Page)
**Root cause**: The containers at lines 654 and 662 in `ProjectDetailLayout.tsx` use `overflow-x-auto scrollbar-hide`. The `scrollbar-hide` class is defined in `App.css` but the `index.css` (the main stylesheet imported in `main.tsx`) does NOT include these styles. Since `App.css` is not imported anywhere, the class only works if `App.css` happens to be bundled. Additionally, some browsers still show native scrollbars despite `scrollbar-hide` if the container isn't also styled with `scrollbar-width: none` inline.

**Fix**:
- In `ProjectDetailLayout.tsx` lines 654 and 662: add inline `style={{ scrollbarWidth: 'none' }}` as a belt-and-suspenders fix alongside the class.
- Row 1 (line 654) already has a `PremiumHorizontalScrollHint` via `FilterShortcutBar` — ensure only gold scroll is visible.
- Row 2 (line 662) already has `PremiumHorizontalScrollHint` at line 690 — remove the native scrollbar.
- Also apply the same fix to `FilterShortcutBar.tsx` lines 303 and 369 (Row 1 and Row 2 containers).

### 2. JBJ AI Project Intelligence — Logo Monogram Background Mismatch
**Root cause**: In `ProjectAIAnalyzer.tsx` line 262, the monogram image (`jbjMonogramNobuffer`) is placed inside a loading animation div within a section that has `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` (line 219). However, the monogram PNG has a transparent background, and the breathing animation with scale causes it to appear against the champagne gradient inconsistently. If the monogram PNG itself has a slightly different background color baked in, it creates a visible mismatch.

**Fix**: In `ProjectAIAnalyzer.tsx`, ensure the monogram container has no background wrapper that differs from the section background. Remove any potential container background, or add `mix-blend-mode: multiply` to the image so it blends seamlessly with the champagne gradient. Alternatively, wrap the monogram in a div that matches the exact section gradient.

### 3. Investment Metrics — Capital Growth and Rental Yield Too Low
**Root cause**: The AI analyzer edge function (`ai-property-analyzer/index.ts`) uses `google/gemini-2.5-flash-lite` (line 121) which is the cheapest/weakest model — it produces conservative, generic numbers. Additionally, the prompt doesn't mention specific UAE rental yield benchmarks or Umm Al Quwain's strong holiday home market. The user wants AI-only but improved output.

**Fix in `supabase/functions/ai-property-analyzer/index.ts`**:
- Upgrade model from `google/gemini-2.5-flash-lite` to `google/gemini-2.5-flash` for better accuracy.
- Add to the system prompt: "UAE Northern Emirates (RAK, UAQ, Ajman) have seen significant rental yield increases in 2025-2026, especially for holiday homes and Airbnb. RAK and UAQ holiday home yields can reach 10-15% gross. Dubai prime areas typically see 6-8% net yields. Factor current market conditions accurately."
- Add: "Capital appreciation in UAE off-plan has averaged 15-30% in prime areas during 2024-2026. Reflect current bullish market conditions."

### 4. Cons Still Showing — Apply Strict Filter
**Root cause**: The Cons section (lines 504-522 in `ProjectAIAnalyzer.tsx`) always renders if `consList.length > 0`. There's no quality filter.

**Fix in `ProjectAIAnalyzer.tsx`**:
- Add a filter function that checks each con bullet for vague/speculative language (keywords like "may", "might", "could", "potential", "possible", "uncertain"). Only show cons that contain specific, verifiable facts.
- If after filtering, no cons remain, show "No significant risks identified" instead of the red Cons card.
- Also update the AI prompt in `ai-property-analyzer/index.ts` to add: "For Cons, ONLY list risks that are VERIFIABLE market facts with specific data points. Do NOT list generic risks like 'market may decline' or 'prices could fluctuate'. If you cannot name a specific, factual risk, return an empty Cons section."

### 5. E-Signature Create Flow — Document Not Showing, Signature/Stamp/Initials Missing

**Root cause (Document preview)**: In Step 3 (`CreateEnvelope.tsx` line 732), `DocumentFieldPlacer` receives `pdfUrl` which is a blob URL. The `<object>` tag (line 550-563 in `DocumentFieldPlacer.tsx`) tries to render it with `pointerEvents: "none"`. On some browsers, blob URLs in `<object>` tags don't render at all. The user sees nothing.

**Root cause (Signature/Stamp/Initials)**: In the field placer, clicking "Signature", "Initials", or "Stamp" buttons only *selects the field type* — the user must then click on the document to place a field. But if the document isn't showing, there's nothing to click on. Additionally, the "Stamp" field type exists in the UI but the DB enum `esign_field_type` only has: signature, initials, date, text, checkbox — no "stamp". So stamp fields can be placed visually but will fail on save.

**Fixes**:

**A. `DocumentFieldPlacer.tsx` — Fix document preview**:
- Replace the `<object>/<iframe>` approach with a pdf.js canvas renderer (already loaded for thumbnails). Render the current page as a full-size canvas, which works reliably with blob URLs and allows proper click-to-place overlay.
- Fallback: if canvas render fails, use `<iframe>` with the blob URL.

**B. `DocumentFieldPlacer.tsx` — Add inline signature/initials input**:
- When user clicks to place a "signature" field, show a small popover/modal with 3 options: Draw (using `ESignaturePad`), Generate (using the font-based approach from `AISignatureDesigner`), or Upload image.
- When user clicks to place "initials", show the user's name/initials auto-derived from their auth profile, with option to draw custom initials.
- For "stamp", load the saved stamp from `stamp_designs` (already implemented) and show a fallback "Upload stamp image" if none saved.

**C. Database — Add stamp to enum**:
- Run migration: `ALTER TYPE esign_field_type ADD VALUE 'stamp';`

**D. `CreateEnvelope.tsx` — Add stamp to field type union**:
- Line 35: add `"stamp"` to the SignatureField type union.

### 6. E-Signature Signer Flow — No Signature/Initials/Name/Email Visible

**Root cause**: In `SignDocument.tsx`, the signer sees a plain `ESignaturePad` for signature and initials (lines 381-396). There's no user info display beyond basic text at lines 339-344. The user wants to see their name, email, and have proper input options.

**Fix in `SignDocument.tsx`**:
- Add a prominent info card showing the signer's name and email above the signature section.
- For the initials field, auto-generate initials from the signer's name and display them, with option to draw custom.
- Ensure the PDF preview iframe (line 361) renders properly — add fallback rendering if iframe fails.

## Files to Modify

### Frontend
1. **`src/components/project-detail/ProjectDetailLayout.tsx`** — Add inline `scrollbarWidth: 'none'` to filter bar containers (lines 654, 662)
2. **`src/components/filters/FilterShortcutBar.tsx`** — Add inline `scrollbarWidth: 'none'` to Row 1 and Row 2 containers (lines 303, 369)
3. **`src/components/project-detail/ProjectAIAnalyzer.tsx`** — Fix monogram background blend, add cons quality filter, remove empty cons card
4. **`src/components/e-signature/DocumentFieldPlacer.tsx`** — Replace object/iframe with pdf.js canvas rendering for reliable document preview; add inline signature/initials/stamp input modals when placing fields
5. **`src/pages/e-signature/CreateEnvelope.tsx`** — Add "stamp" to SignatureField type union
6. **`src/pages/e-signature/SignDocument.tsx`** — Add prominent signer info card, improve initials auto-generation, fix PDF preview

### Edge Functions
7. **`supabase/functions/ai-property-analyzer/index.ts`** — Upgrade model to `gemini-2.5-flash`, add UAE market benchmarks to prompt, add strict cons filtering rules

### Database
8. **Migration**: `ALTER TYPE esign_field_type ADD VALUE 'stamp';`

