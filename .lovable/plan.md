This is a large, multi-system change. I'll deliver it as one coordinated workstream so branding, the report flow, and the document library stay in sync.

## 1. Report Preview Modal — contrast & branding fixes
File: `src/components/ai-home-finder/ReportPreviewModal.tsx`
- "Include in Report" buttons:
  - Selected → emerald metallic gradient (`.jj-cta-emerald` / `.jj-pill-emerald-metallic`), WHITE label + WHITE icon, no black text under any state.
  - Unselected → white surface, charcoal `#1A1A1A` label, gold hairline border, emerald hover.
  - Scoped CSS guard so global same-tone guard never flips emerald-fill labels to ink.
- Profile/Role pill: keep auto-synced from `useUserMode`, lock white text/icon on emerald.
- Replace inline monogram with the **official JBJ logo asset** (black "JBJ" on champagne with horizontal divider through the B). Used in preview header, preview footer, exported PDF header/footer, letterhead, and every document template.

## 2. Official JBJ Logo as a shared asset
- New component `src/components/brand/OfficialJbjLogo.tsx` that renders the approved monogram (champagne tile, black JBJ, gold rule above & below the B) at any size.
- Promote it as the single source of truth — used by:
  - `ReportPreviewModal` preview header
  - PDF builder header/footer
  - `CompanyLetterhead` template
  - Documents & Forms templates
- Add `data-no-contrast-guard` only where required so the black glyphs are preserved on champagne.

## 3. Multi-page branded PDF builder
File: `src/pages/QuizResults.tsx` (extract builder into `src/lib/reports/aiHomeFinderReport.ts`)
Every page shares:
- Emerald→ink header band: official monogram (champagne tile) + "JBJ GLOBAL REAL ESTATE" wordmark + page subtitle + date.
- Champagne footer: gold hairline, "Powered by JBJ Global Real Estate — Dubai, UAE", `www.jbj.ae`, page N/total.

Page sequence:
1. **Cover** — title, AI summary intro, ranked match cards, "Prepared by" panel (ONLY on cover — never repeated).
2. **Property Comparison** — comparison table (project, developer, price, beds, handover, area), ranking row, Pros/Cons lists, AI Match Summary block with Budget Match / Timeline Match / Area Match / Features Match progress rows. Matches the in-app AI comparison.
3..N. **Per-property pages** — hero image, metadata grid, amenities, AI analysis, recommendation, links.
N+1. **Closing page** — thank-you, contact strip, disclaimer.

PDF rendered via `jspdf` + `jspdf-autotable`. High-DPI image embedding kept.

## 4. Canva-style Page Management
In the preview modal, add a "Pages" rail (left of the live preview, collapsible on mobile):
- Thumbnails for each page (Cover, Comparison, each property, Closing).
- Per-page actions: include/exclude toggle, drag-to-reorder, delete.
- "Export range" presets: All / Cover only / 1–2 / 2–N / Custom.
- Live preview reflects the active order + inclusion set.
- PDF builder accepts `{ order: PageId[], include: Set<PageId> }` and emits only the selected pages with correct page-N-of-total numbering.

## 5. Company Letterhead — official reusable template
New: `src/lib/documents/companyLetterhead.tsx` + `src/components/documents/CompanyLetterheadFrame.tsx`
- Branded header (official monogram + wordmark + RERA/ORN line).
- Branded footer (address, phone, email, website, gold hairline).
- Empty editable body with luxury margins (24mm sides, 32mm top, 28mm bottom).
- Reusable as a shell — every other document inherits this frame.
- Exposed in Documents & Forms as **"Company Letterhead"**.

## 6. Documents & Forms — restoration + Company Templates library
Files: `src/pages/owner/DocumentsHub.tsx` (or current location), `src/lib/documents/templates/`
- Audit current registry, restore previously-shipped templates if any are missing:
  - Offer Letter, Employment Forms, Confirmation Forms, Warning Letters, HR Templates, Company Documents, Business Templates, RERA Form A/B/F/I, NOCs, Tenancy.
- New **Company Templates** category containing:
  - Official Company Letterhead
  - Blank Letter
  - Employment Offer
  - Warning Letter
  - Confirmation Letter
  - Business Proposal
  - Broker Agreement
  - Referral Letter
  - General Company Document
- Every template auto-wraps in `CompanyLetterheadFrame` so header/footer/branding/typography/margins/numbering are automatic — no per-template setup.

## 7. Global branding tokens for documents
- Centralize palette + typography in `src/lib/documents/brandTokens.ts` (emerald gradient, champagne, gold hairline, Inter stack, margins, page-number format).
- Letterhead frame + PDF builder + preview all read from this single source.

## 8. Validation (manual, visual, technical)
- `tsgo` typecheck.
- Drive Playwright against localhost:8080:
  - Open AI Home Finder results → open Preview → screenshot Include-in-Report states (selected/unselected/hover).
  - Toggle pages in the rail, reorder, export "Pages 2–N" → save PDF → rasterize with `pdftoppm` and inspect every page (header, footer, no overlap, no orphan "Prepared by", page numbers correct).
  - Open Documents & Forms → screenshot library list incl. Company Templates → open Company Letterhead → export PDF → rasterize and inspect header/footer.
  - Switch user mode Broker↔Owner↔Developer↔Consultant → confirm role label updates and report regenerates.
  - Mobile viewport (390×844) repeat of preview modal.
- Deliver screenshots: Include-in-Report states, Preview cover, Comparison page, Per-property page, Closing, Page manager, Documents library, Company Letterhead PDF, Final exported PDF (all pages).

## Out of scope
- No backend schema changes.
- No edits to other report flows (Compare Projects / Property Evaluator) — they keep their own builders this turn; the new shared `brandTokens` + `OfficialJbjLogo` are available for them in a later pass.
- No new edge functions.

Confirm and I'll execute end-to-end, including the Playwright validation pass.