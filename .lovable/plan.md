
I hear you. I’ll prioritize this as a recovery + stabilization release with strict order so the visible regressions are fixed first.

## 1) Immediate restoration (navigation + layout frame)
1. Restore the latest L-frame everywhere in Stamp routes:
   - Fix `MainLayout.tsx` route detection so `/toolkit/stamp-generator` (without trailing slash) is treated as generator route.
   - Keep desktop frame (left sidebar + champagne utility bar) from 1024px+ for stamp pages.
2. Remove mixed-header fallback behavior on stamp routes:
   - Ensure global mobile header is hidden once desktop frame is active.
3. Correct top spacing/padding hierarchy in stamp screens:
   - Increase spacing between global utility bar and tool header.
   - Increase stamp tool header height and center alignment for professional look.

Files:  
- `src/components/MainLayout.tsx`  
- `src/hooks/use-touch-layout.ts` (only if needed for pointer/device edge-cases)  
- `src/components/stamp-generator/StampProjectHeader.tsx`  
- `src/components/stamp-generator/StampGeneratorPage.tsx`  
- `src/components/stamp-generator/StampProjectWizard.tsx`

## 2) Persistence + “Standard model” integrity (core broken behavior)
1. Fix “Save Draft / Save” reliability:
   - Wizard currently saves only a global local key (`stamp-wizard-form`), not project-scoped draft.
   - Implement project-scoped draft keys and explicit restore logic.
2. Fix Standard model persistence:
   - On every “Use” action (concept/version/variation), persist `selected_design_id` immediately in project (not only on export).
   - On load, always hydrate preview from `selected_design_id` first.
3. Fix false history growth (24 unsaved designs):
   - Add generation request lock/debounce + idempotency token so repeated clicks cannot double-insert.
   - Keep one active non-favorite generation set per project unless user explicitly “Save as version”.
4. Make project cards open on full-card click (not only Open button).

Files:  
- `src/components/stamp-generator/StampGeneratorPage.tsx`  
- `src/components/stamp-generator/StampProjectsDashboard.tsx`  
- `src/components/stamp-generator/StampProjectWizard.tsx`  
- `supabase/functions/ai-stamp-generator/index.ts`

## 3) Stamp rendering fidelity (shape overflow, arc alignment, broken variants)
1. Unify generation fidelity with the official template rules:
   - Current AI generator uses older geometry and unknown variation keys; this causes broken borders/content overflow.
   - Align generation output with `stampOfficialTemplate` constraints (safe zones, ring spacing, circular registration rules).
2. Wire currently ignored controls:
   - `arc_text_spacing`, `separator_distance` (currently visible but not affecting renderer).
3. Fix language order and arc readability:
   - Ensure bilingual top/bottom swap is respected consistently.
   - Reduce English over-spacing, tighten monogram spacing, keep Arabic/English arc widths matched.
4. Fix round/oval/rectangle/square overflow:
   - Enforce strict text-safe boundaries for each shape.
5. Fix ink impression not breaking layout:
   - Harden SVG filter injection to avoid malformed wrapping in complex SVGs.

Files:  
- `src/lib/stampOfficialTemplate.ts`  
- `src/components/stamp-generator/LiveStampPreview.tsx`  
- `supabase/functions/ai-stamp-generator/index.ts`  
- `src/components/stamp-generator/StampSVGRenderer.tsx`

## 4) Interaction upgrades (selection, double-click edit, tool behavior)
1. Persistent selection:
   - Keep highlight active until explicit outside click.
2. Double-click edit behavior:
   - Add true dblclick handling for selected text zones.
3. Better text editor UX:
   - Replace raw “letter list” feel with hierarchical controls:
     - word/sentence level first, then per-letter expansion.
   - Keep advanced controls collapsed by default; expand on user action.
4. Avoid unexpected tab jumps/redirections while editing style/logo controls.

Files:  
- `src/components/stamp-generator/StampProjectWizard.tsx`  
- `src/components/stamp-generator/LiveStampPreview.tsx`  
- `src/components/stamp-generator/StampInteractivePreview.tsx`  
- `src/components/stamp-generator/StampTextEditor.tsx`  
- `src/components/stamp-generator/StampLeftPanel.tsx`

## 5) Variations, versions, favorites, uploads (non-working flows)
1. AI variations:
   - Ensure button opens/activates variations panel immediately.
   - Ensure applied variation updates center preview and persists as version entry.
2. Version view:
   - Ensure “Use” updates standard preview instantly and persists.
3. Favorites:
   - Normalize favorite logic so favorited stamps persist and appear reliably in history/favorites.
4. Upload logo:
   - Guarantee upload control is always visible in relevant mode and immediately reflected in preview.

Files:  
- `src/components/stamp-generator/StampRightPanel.tsx`  
- `src/components/stamp-generator/StampVariationsPanel.tsx`  
- `src/components/stamp-generator/StampVersionSelector.tsx`  
- `src/components/stamp-generator/StampGeneratorPage.tsx`  
- `src/components/stamp-generator/StampProjectWizard.tsx`

## 6) Owner-only JBJ policy hardening (fix current risky implementation)
1. Replace hardcoded owner email matching with trusted owner verification source.
2. Keep normal users default monogram all-ink + editable options.
3. Apply JBJ auto-style only for owner-approved JBJ detections.
4. For non-owner JBJ attempts:
   - Block usage,
   - route to support unlock (`/ticket-hub`),
   - create owner-visible support/security incident with uploader metadata.

Files:  
- `supabase/functions/logo-guard/index.ts`  
- `src/components/stamp-generator/StampProjectWizard.tsx`  
- (optionally shared verification utility/edge function integration)

## 7) Additional reported platform issues (next pass in same release branch)
1. “Continue searching” strip:
   - remove visible duplication artifacts, start animation from full-right, enforce unique cards.
2. Chat/nav overlap:
   - ensure page arrows are fully visible on medium/mobile and never clipped by chat.
3. Global search:
   - unify search behavior across modules with shared global search entry + backend query orchestration.
4. Creative Suites premium visual upgrade:
   - add neon divider under AI tools block and harmonize suite color system.

Files:  
- `src/components/ContinueSearching.tsx`  
- `src/components/PageNavigation.tsx`  
- `src/components/AIChatWidget.tsx` (if offset coupling needed)  
- `src/components/GlobalSearchModal.tsx` + search hooks/services  
- creative suite pages/components

## 8) Validation and proof protocol
I will validate in this exact order and capture deep screenshots after each completed block:
1. Navigation frame at 1178 and 1024 (desktop), plus mobile.
2. Stamp standard persistence after Use/Version/Variation.
3. Save Draft + reopen correctness.
4. Shape integrity (round/oval/rect/square) with no border touching.
5. Interaction (click persistence + double-click + edit controls).
6. Logo upload + ink impression + favorites + history parity.
7. Continue-search strip + chat/arrow overlap + global search sanity checks.
