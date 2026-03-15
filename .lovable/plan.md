

# Continuation Plan: Stamp Generator Stabilization (Phase 2-7)

Phase 1 (navigation L-frame restoration, project card click, header padding, basic persistence) was completed in the previous message. The remaining phases cover rendering fidelity, interaction upgrades, variation/version/favorite reliability, owner brand hardening, and platform-wide fixes.

---

## Phase 2: Rendering Fidelity & Shape Overflow (3 files)

### `src/lib/stampOfficialTemplate.ts`
**A. Wire `arc_text_spacing` and `separator_distance`** — Currently these values exist in the wizard form but are never passed through to the template. Add them to `OfficialStampConfig`:
- `arcTextSpacing?: number` — override letter-spacing for company name arcs
- `separatorDistancePct?: number` — shift separator position inward/outward from text arc radius

In `generateRoundStamp`, use `arcTextSpacing` to override the computed `letterSpacing` from `safeArcFontSize` for English text. Use `separatorDistancePct` to offset separator radius from `clampedTextArcR`.

**B. Oval shape safe zones** — In `generateOvalStamp` (line 440+), the text arc radius is `Math.min(innerRx, innerRy) - 6`. This is too tight. Change to `Math.min(innerRx, innerRy) - 12` and reduce font sizes by 1px for oval to prevent border touching.

**C. Rectangle/Square safe zones** — In `generateRectStamp` (line 517+), `safeW = w - 40` is insufficient for long names. Change to `safeW = w - 56` and add font-size capping at `Math.min(calculatedSize, safeW / (text.length * 0.55))`.

**D. Language order (`arabicOnTop`) — already implemented** in the previous fix. Verified in code at lines 309-329 and 477-483.

### `src/components/stamp-generator/LiveStampPreview.tsx`
- Pass `arcTextSpacing` and `separatorDistancePct` from wizard form through to `generateOfficialStampSVG` config.
- Add these to the `useMemo` dependency array.

### `src/components/stamp-generator/StampProjectWizard.tsx`
- Map `form.arc_text_spacing` and `form.separator_distance` into `previewProps` as new props.

---

## Phase 3: Interaction Upgrades (2 files)

### `src/components/stamp-generator/LiveStampPreview.tsx`
- Add `onDoubleClick` callback prop. In the `useEffect` click handler, add a separate `dblclick` event listener that calls `onDoubleClick(elementId)`.
- The double-click should trigger an inline editing mode for the clicked text element.

### `src/components/stamp-generator/StampProjectWizard.tsx`
**A. Persistent selection** — Already partially fixed (outside-click check exists at line 1101-1104). Verify the `closest('[data-stamp-element]')` guard works correctly and that no other code clears `selectedElement` unexpectedly.

**B. Double-click editing** — Add `handleElementDoubleClick` callback that:
1. Sets the element as selected
2. Opens a small floating toolbar near the preview showing: font size slider, letter-spacing slider, bold/italic toggles, color picker
3. Changes apply immediately to the form state and re-render the preview

**C. Tab-jump fix** — The `handleElementClick` currently forces tab switches (lines 452-463). Only switch tabs if the user is not already on the correct tab. Add guard: `if (activeTab !== targetTab) setActiveTab(targetTab)`.

---

## Phase 4: Variations, Versions, Favorites (3 files)

### `src/components/stamp-generator/StampGeneratorPage.tsx`
**A. "Use" button persistence** — In `handleSelectConcept` (line 392), after setting standard, immediately persist to database:
```
await supabase.from('stamp_projects').update({ selected_design_id: concept.id }).eq('id', projectId);
```

**B. AI Variations panel** — The `generateVariations` function (line 510) calls the edge function but the panel opening is not tied to it. Ensure clicking "AI Variation" button both opens the panel AND triggers generation if empty.

**C. Favorites persistence** — `toggleFavorite` (line 363) works but the UI may not reflect saved state on reload. Ensure `loadProject` hydrates `favoriteConcepts` correctly (line 287-289 — already does this).

**D. Generation deduplication** — Add a `generationLock` ref to prevent double-clicks from creating duplicate sets:
```
const generationLockRef = useRef(false);
// In generateConcepts: if (generationLockRef.current) return; generationLockRef.current = true; ... finally { generationLockRef.current = false; }
```

### `src/components/stamp-generator/StampVariationsPanel.tsx`
- Ensure "Apply" button calls parent `onSelectVariation` which should trigger the persistence flow above.

### `src/components/stamp-generator/StampVersionSelector.tsx`
- Ensure "Use" button calls the same `handleSelectConcept` with DB persistence.

---

## Phase 5: Owner JBJ Policy Hardening (1 edge function + 1 component)

### `supabase/functions/logo-guard/index.ts`
The current implementation needs hardening:
- Replace any hardcoded email check with a query to `app_settings` table for `owner_email` and/or `user_roles` table for owner role.
- On `blocked_non_owner`, insert a row into a `security_incidents` or `support_tickets` table with uploader metadata.
- Return structured JSON: `{ policy: 'allow' | 'owner_auto_style' | 'blocked_non_owner', message?: string }`.

### `src/components/stamp-generator/StampProjectWizard.tsx`
- The `checkLogoGuard` callback (line 218-258) already handles the three policies correctly.
- Ensure the "Request unlock from support" toast action navigates to `/ticket-hub`.

---

## Phase 6: Platform-Wide Fixes (4 areas)

### A. Continue Searching strip deduplication
- File: `src/components/ContinueSearching.tsx` (or equivalent marquee component)
- Deduplicate property cards by ID before rendering
- Start animation from full right edge (set initial `translateX` to container width)
- Ensure unique cards only

### B. Chat/Nav arrow overlap
- File: `src/components/PageNavigation.tsx`
- Add right offset when chat is open to prevent clipping
- Test on medium viewport

### C. Global search wiring
- File: `src/components/GlobalSearchModal.tsx` + search hooks
- Connect search input to a unified query that searches across properties, guides, toolkit items, and pages
- This is a larger feature — scope for this phase: ensure the search modal opens and at minimum searches page routes

### D. Creative Suites neon divider
- Add a premium neon gradient divider below the AI tools section in the creative suite pages
- Upgrade suite color theming to match the champagne/gold design system

---

## Implementation Order
1. Phase 2 (rendering fixes) — highest visual impact
2. Phase 4 (persistence + deduplication) — most reported broken behavior
3. Phase 3 (interaction) — UX upgrade
4. Phase 5 (security hardening) — important but less visible
5. Phase 6 (platform fixes) — lower priority in this release

All phases target the same files repeatedly, so they'll be batched where possible to minimize edit conflicts.

