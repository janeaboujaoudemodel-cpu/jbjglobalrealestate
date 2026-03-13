
Scope confirmed from your answers:
- Batch priority: Standard template first
- Owner official default: Arabic top / English bottom
- Default location text: Dubai, UAE
- “AI” wording should be removed from stamp generator UI (replace with Smart/Auto)

Implementation plan (batched)

Batch 1 — Official standard stamp foundation (first delivery)
1) Build a locked “Owner Official Standard” template matching your reference:
- Double-ring circular layout
- Arabic top arc, English bottom arc
- Side separators (default dots) with switchable separator type (dot/star/dash/none)
- Center area for monogram/logo, fully scalable and movable
- Optional second inner text ring for location (“Dubai, UAE”), with show/hide toggle
2) Owner-only default behavior:
- If owner is verified, this template opens as default preset every time
- Non-owner users still get multi-model generated variations
3) Live preview wiring fix:
- Replace overlay-only edits with true SVG-bound transforms so move/scale/delete updates the actual exported SVG
- Ensure border style and typography selections update instantly in preview

Batch 2 — Core UX and layout stabilization
1) Fix preview centering and crop/overlap issues:
- Enforce center-canvas layout with side controls around it
- Remove gray strip/background bleed and hidden/cropped sections under headers/sidebar
2) Fix wizard reliability:
- Resolve “Failed to create project” with stronger validation + better error handling/retry
- Ensure license + selected fields immediately reflect in preview without stale state
3) Improve monogram/logo quality:
- Vector-first rendering path
- Better raster handling (high-res scaling + quality guardrails)
- Lock/unlock + resize + drag from both panel and direct canvas

Batch 3 — Smart generation and automation upgrade
1) Stamp generation upgrades:
- Add/refine/re-generate flows with instruction prompts
- Better arc text fitting to prevent overflow outside circle
- Faster response path with deterministic local preview before server generation
2) Trade license automation:
- Keep auto business-type extraction
- Map business type to style presets (real-estate, legal, etc.)
3) Terminology cleanup:
- Replace visible “AI Stamp” labels in stamp tool screens with “Smart” wording

Batch 4 — Export, deployment, and proof
1) Export hardening:
- Verify SVG/PNG/JPG/PDF/ZIP outputs are actual downloaded files (not opening as browser tab)
- Keep standard ink-blue reset as one-click baseline
2) Deploy backend functions:
- Deploy updated stamp generation/extraction functions
- Validate auth behavior and logs post-deploy
3) Proof package:
- Run end-to-end test flow and capture screenshots for each batch:
  - Wizard creation
  - Live edit interactions (drag/resize/delete/lock)
  - Official template correctness
  - Export outputs
- Provide a phase-by-phase audit checklist with pass/fail per requirement

Technical implementation details
- Frontend files (primary):  
  - src/components/stamp-generator/StampProjectWizard.tsx  
  - src/components/stamp-generator/StampGeneratorPage.tsx  
  - src/components/stamp-generator/InteractiveStampCanvas.tsx  
  - src/components/stamp-generator/StampPreviewModal.tsx  
  - src/components/stamp-generator/LiveStampPreview.tsx  
  - src/components/stamp-generator/StampExportPage.tsx  
  - src/lib/stampTemplates.ts  
- Backend files (primary):  
  - supabase/functions/ai-stamp-generator/index.ts  
  - supabase/functions/ai-stamp-extract/index.ts  
- Data model use:
  - Keep existing stamp_projects fields (language_reversed, show_location, business_type, layout_json)
  - Store owner-standard and interactive layer state in layout_json for resume/save draft continuity
- Role-aware behavior:
  - Reuse existing verified owner check path for owner-only default template selection

Acceptance criteria for Batch 1 sign-off
- Owner opens stamp flow and immediately gets official standard template
- Arabic top/English bottom is readable, curved correctly, and inside ring bounds
- Dubai, UAE is default and can be toggled off
- Dot separators are editable (dot/star/dash/none)
- Center monogram/logo is crisp and editable directly in live preview
