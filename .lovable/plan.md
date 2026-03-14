
Goal: stabilize the stamp wizard to premium behavior, apply owner-only JBJ logo intelligence, and make editing controls truly interactive and persistent.

1) Locked product decisions (based on your message)
- Navigation standard: use professional desktop behavior at 1024px+ with desktop pointer detection; keep touch devices in mobile layout. For stamp generator pages, enforce desktop frame from 1024px to prevent mixed header states.
- Monogram color policy:
  - Normal users: default all monogram letters = ink color (no forced gold), with optional per-letter customization.
  - Owner + detected JBJ logo/monogram: auto-apply JBJ rule (J letters = ink blue, B + dividers preserved in gold).
  - Non-owner uploading detected JBJ logo: block upload, show “Request unlock from support” action linking to `/ticket-hub`, and auto-log an owner-visible support/security ticket with uploader details.

2) Root causes found
- `arabicOnTop/language_reversed` is passed but not applied in template logic (language order toggle appears broken).
- Click highlight clears immediately because parent container click clears selection after element click bubble.
- No double-click editing path in wizard preview.
- Arc/spacing controls exist in UI but are not wired into rendering (`arc_text_spacing`, `separator_distance`).
- Current monogram fallback in template still forces middle letter gold globally.
- Registration is rendered as straight center text, not circular text.
- Non-round shape renderers use weak constraints (especially oval arc geometry), causing border collisions.
- Generated concept engine uses separate SVG builder rules, so output quality diverges from live template.

3) Implementation plan (files)
A) `src/lib/stampOfficialTemplate.ts`
- Apply `arabicOnTop` in bilingual mode (swap top/bottom arc assignment).
- Add explicit controls for:
  - English letter spacing cap (reduce over-spacing for readability),
  - English word-gap multiplier (increase gaps between legal suffix words like ESTATE / LLC / SOC),
  - Monogram letter spacing (tighten J-B-J spacing).
- Make center content policy-aware:
  - Default monogram = all ink color unless owner-JBJ override applies.
  - Respect user per-letter overrides.
- Convert trade license rendering to circular arc text (round/oval) instead of straight baseline when enabled.
- Dynamic ring system:
  - If location disabled/deleted, remove location ring layer and recenter monogram in remaining rings.
- Rebuild oval/rectangle/square text-safe zones so text never touches/outflows borders.

B) `src/components/stamp-generator/LiveStampPreview.tsx`
- Stop event propagation for in-stamp clicks so selection does not get cleared by outer container.
- Add double-click handler callback support (element-level).
- Pass through new spacing/layout controls and owner/JBJ policy flags to template generator.

C) `src/components/stamp-generator/StampProjectWizard.tsx`
- Keep selection persistent until explicit outside click or selecting another element.
- Add true on-canvas editing controls (nudge, arc width, vertical offset, spacing) by integrating the existing interactive overlay behavior used in studio.
- Wire sliders to real renderer inputs (`arc_text_spacing`, `separator_distance`, monogram letter spacing).
- Fix tab-jump behavior: clicking style controls should not be force-switched back to company unexpectedly.
- Monogram defaults:
  - Initialize normal users to all-ink.
  - Keep per-letter editor available.
- Owner/JBJ upload flow:
  - On logo upload, run backend logo-guard analysis.
  - Apply owner-only auto-rule when match is JBJ.
  - Block non-owner JBJ attempts with support CTA.

D) `src/components/stamp-generator/MonogramColorEditor.tsx`
- Reset should return to “all letters ink” baseline for normal users.
- Keep owner auto-rule as a conditional preset, not global default.

E) Navigation shell (`src/components/MainLayout.tsx`, optionally `use-touch-layout`)
- Enforce desktop L-frame at 1024px+ for stamp routes with touch-aware fallback to avoid mixed header states.

F) Backend function(s)
- Add a logo-guard backend endpoint:
  - Analyze uploaded logo/monogram for JBJ match (vision/text detection),
  - Return policy decision (`allow`, `owner_auto_style`, `blocked_non_owner`),
  - On blocked case, create a support/security ticket record for owner review (uploader id/email/time/file fingerprint).
- Keep ownership validation server-side using existing owner verification logic.

G) Generation/export parity
- Update concept generation path to use the same official template constraints as live editor (or same geometry helpers) so generated models never overflow borders.
- Ensure export outputs preserve the same center color policy and spacing rules as preview.

4) Validation checklist (with deep screenshots per task before marking done)
- Screenshot set at 1178px and 1024px: desktop frame consistency.
- Bilingual round stamp: Arabic/English arcs match edge-to-edge and remain readable.
- Language order toggle: visibly swaps top/bottom arcs.
- Click + double-click: highlight persists, toolbar appears, drag/nudge controls work.
- Show License Number: circular arc rendering confirmed.
- Location off: location ring disappears, center recenters correctly.
- Monogram behavior:
  - Normal user default all ink + editable colors.
  - Owner JBJ upload auto-styles correctly.
  - Non-owner JBJ upload blocked with `/ticket-hub` unlock path and owner-visible incident log.
- Oval/rectangle/square: no border touching/overflow.
- Generated concepts and exports match live layout constraints.
