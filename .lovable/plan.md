
Goal: deliver one recovery release that restores the premium L-frame (left sidebar + gold/champagne utility bar), fixes stamp persistence/preview integrity, and upgrades editing UX without breaking existing projects.

1) Immediate rollback-safe restoration (navigation + spacing)
- Force stamp routes (`/toolkit/stamp-generator`, `/new`, `/projects`, `/:projectId/*`) into a strict “studio shell mode”:
  - Keep left sidebar + horizontal utility bar.
  - Hide any legacy full-width horizontal nav row for stamp studio pages.
- Keep desktop behavior at `>=1024px`, touch fallback for true touch-only devices.
- Normalize top offsets: utility bar (48px) + stamp header spacing so nothing is cramped.
- Increase stamp tool header height/padding and center alignment in `StampProjectHeader` + studio body.

Files:
- `src/components/MainLayout.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/components/stamp-generator/StampProjectHeader.tsx`
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/stamp-generator/StampProjectWizard.tsx`

2) Draft + save integrity (root cause fix)
Current root causes found:
- Wizard uses one global key `stamp-wizard-form` (not project-scoped, not standard draft architecture).
- `saving`/`lastSaved` state in `StampGeneratorPage` is never used for real persistence.
- “Standard model” persistence breaks when concept IDs are local UUIDs (not DB IDs).

Build:
- Replace wizard draft storage with standardized keys: `jbj_draft_stamp-generator_{timestamp}` + project-scoped working key.
- Add “Drafts” restore list in stamp wizard/header flow.
- Implement explicit `saveProjectState()` in `StampGeneratorPage` to persist:
  - selected standard design
  - current style snapshot/overrides
  - timestamp for “Saved just now”.
- Ensure “Use” always persists standard in backend:
  - if design is local UUID, insert it first to `stamp_designs`, then persist resulting DB id in `stamp_projects.selected_design_id`.

Files:
- `src/components/stamp-generator/StampProjectWizard.tsx`
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/stamp-generator/StampProjectHeader.tsx`
- `src/components/toolkit/SaveProjectBar.tsx` (reuse patterns)
- `src/hooks/useStampHistory.ts` (only if save checkpoints needed)

3) History/variations/favorites correctness
Current root causes found:
- Variation apply path creates client UUID then calls standard selection (not persisted reliably).
- Variations edge function emits keys not handled by renderer switch, causing fallback/broken look.
- History currently surfaces every auto-generated row, not user-meaningful “saved/used” progression.

Build:
- Variation apply:
  - open variations tab immediately on click.
  - on apply, persist variation as DB design first, then mark standard.
- Deduplicate generation requests with lock + idempotency token (client + function).
- History tabs:
  - “Standard History” (designs explicitly used/saved/exported first)
  - “Generated Pool” (all generated concepts).
- Favorites reliability:
  - persist favorite toggle in DB and rehydrate deterministically on load.

Files:
- `src/components/stamp-generator/StampGeneratorPage.tsx`
- `src/components/stamp-generator/StampRightPanel.tsx`
- `src/components/stamp-generator/StampVariationsPanel.tsx`
- `src/components/stamp-generator/StampVersionSelector.tsx`
- `supabase/functions/ai-stamp-generator/index.ts`

4) Rendering fidelity + centering (all shapes, all languages)
Current root causes found:
- AI generator (`buildSVG`) uses a different geometry system than official template.
- Separator distance math in official template can over-shift.
- Non-round layout still overflows in edge cases.
- Content can visually sink toward bottom when ring settings change.

Build:
- Make AI generator return official-template-driven SVG (single geometry authority).
- Fix separator radius mapping to bounded 0–100 behavior.
- Enforce hard safe zones for round/oval/rect/square text arcs and center content.
- Recenter top/bottom/location and center content with ring-gap adaptation.
- Keep registration/license circular in round/oval where applicable.
- Preserve bilingual order toggle and ensure both language arcs remain edge-to-edge readable.

Files:
- `src/lib/stampOfficialTemplate.ts`
- `src/components/stamp-generator/LiveStampPreview.tsx`
- `src/components/stamp-generator/StampSVGRenderer.tsx`
- `supabase/functions/ai-stamp-generator/index.ts`

5) Interactive editing upgrade (word-first, then letters)
Current root causes found:
- Double-click support exists in preview but is not wired in wizard.
- Left editor is flat text-node listing (not word-first hierarchy).
- No guided first-run sequence and no “skip/continue memory”.

Build:
- Wire `onDoubleClick` from `LiveStampPreview` into wizard state.
- Replace flat editor UX with:
  - Level 1: full segment (top arc / bottom arc / location / registration / center)
  - Level 2: expandable words
  - Level 3: optional letters
- Keep sections minimized by default.
- Add first-run guided flow:
  - step lock per segment
  - “Skip & Continue”
  - remembered completion so returning users are not forced through onboarding again.
- Add inline controls for selected level: size, spacing, color, weight, style, curve offset, nudge.
- Add AI action trigger on selected segment for color/style rewrite prompts.

Files:
- `src/components/stamp-generator/StampProjectWizard.tsx`
- `src/components/stamp-generator/LiveStampPreview.tsx`
- `src/components/stamp-generator/StampTextEditor.tsx`
- `src/components/stamp-generator/StampInteractivePreview.tsx`
- `src/components/stamp-generator/StampLeftPanel.tsx`

6) Owner/admin protection + tool-level edit access
User decision locked: Edit access = Owner + Admin roles.

Build:
- Replace hardcoded `logo-guard` owner email with trusted owner/admin verification path:
  - role check from `user_roles` + fallback owner email from `app_settings`.
- Keep policy outcomes:
  - owner/admin + JBJ => auto-style preset
  - non-owner/non-admin + JBJ => block + support path + incident log.
- Add “Edit” buttons on tool cards guarded by owner/admin role checks only.
- Keep controls hidden for non-authorized users.

Files:
- `supabase/functions/logo-guard/index.ts`
- `supabase/functions/_shared/owner-auth-middleware.ts` (reuse/align)
- Creative suite/tool card components where edit CTA is shown

7) Platform fixes requested in same release
- Chat/nav overlap: refine floating offsets on medium/mobile so arrows never clip.
- Continue-search strip:
  - start animation from full right edge reliably
  - avoid visible duplicate artifacts
  - ensure unique card source list before loop cloning.
- Global search:
  - create unified backend search endpoint for core entities/routes/tools
  - wire all search boxes to shared search service.
- Creative suites premium polish:
  - neon divider under AI tools block
  - stronger champagne/gold visual hierarchy.

Files:
- `src/components/PageNavigation.tsx`
- `src/components/AIChatWidget.tsx` (if offset coupling needed)
- `src/components/ContinueSearching.tsx`
- `src/components/GlobalSearchModal.tsx`
- shared search hook/service + backend function
- `src/pages/business-suite/CreativeSuite.tsx` and related suite pages

Technical execution notes
- Keep existing RLS model (`auth.uid() = user_id`) for stamp tables.
- Do not change protected generated files.
- For schema changes (only if needed), use migrations; for data updates use row operations.
- Edge functions remain authenticated; no anonymous privileged flows.

Validation/proof checklist (single release gates)
- Gate A: navigation restored at 1166, 1024, and mobile (screenshots).
- Gate B: draft save/reload + standard persistence across refresh/crash (video + screenshots).
- Gate C: use/variation/version/favorite/history consistency with real DB rows (evidence queries + screenshots).
- Gate D: shape safety (round/oval/rect/square) no border collisions.
- Gate E: click/double-click editing hierarchy working (segment→word→letter).
- Gate F: JBJ owner/admin policy and block flow to support route.
- Gate G: continue-search motion + chat/nav overlap + global search sanity across pages.

Delivery approach (one release, risk-controlled)
- Batch 1: shell + save/persistence + history/variation integrity.
- Batch 2: rendering unification + centering constraints.
- Batch 3: advanced editing hierarchy + onboarding memory.
- Batch 4: security hardening + platform-wide polish.
- After each batch: run the validation gate and capture screenshots before proceeding.
