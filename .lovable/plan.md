

## PDF & Documents Suite — Major Overhaul Plan

This is a large-scope request touching 4+ tools simultaneously. I'll structure it into prioritized phases that can be implemented incrementally.

---

### Phase 1: UI & Color System Overhaul (Immediate)

**Problem**: All tools use the same dark champagne-gold theme (`#0E1018` bg, `#C8A766` accents). User wants distinct, clean, professional colors — no more gray/gold everywhere.

**Changes**:

- **PDFSuite.tsx**: Replace dark bg with clean white/light theme. Remove champagne-gold palette constant `C`. Use a professional white card-based layout with subtle borders.
- **ScanSignPage.tsx**: Switch to a **green color scheme** (e.g., `#059669` emerald). Replace the entire `G` palette object. Fix the "Untitled Document" header — make it a proper `SaveProjectBar` integration instead of custom inline editing.
- **PDFEditor.tsx**: Clean white/slate professional theme. Remove dark surface backgrounds.
- **PdfFromPhotos.tsx**: Same clean white theme. Remove dark `G.surface` background.
- **BrochureGeneratorPage.tsx**: Clean white theme with professional blue accents.

**Files**: `PDFSuite.tsx`, `ScanSignPage.tsx`, `PDFEditor.tsx`, `PdfFromPhotos.tsx`, `BrochureGeneratorPage.tsx`

---

### Phase 2: Stamp Generator Inline Integration (Scan & Sign)

**Problem**: Clicking "Stamp" in Scan & Sign shows "No stamp found. Generate one first." — no inline generation.

**Changes**:

- Add a **dialog/modal** in `ScanSignPage.tsx` that embeds a lightweight stamp creation flow (reusing `StampGeneratorPage` components or a simplified version).
- When user clicks "Stamp" import button:
  1. Check `sessionStorage` for existing stamp
  2. If found → show stamp preview with "Use This" button
  3. If not found → open inline stamp generator modal with "Generate → Save → Use" flow
  4. On completion, auto-return to Scan & Sign with stamp inserted
- Same pattern for Signature (already partially there) and Business Card imports.

**Files**: `ScanSignPage.tsx`, new `src/components/toolkit/InlineStampGenerator.tsx`

---

### Phase 3: Brochure Generator → Unified Document Creator

**Problem**: Brochure auto-downloads on "Generate", no live preview, no editing. User wants to merge brochure/book/company profile/presentation into one tool.

**Changes**:

1. **Rename**: "Brochure Generator" → **"Document Creator"** — route stays `/toolkit/pdf-suite` (brochure tab renamed)
2. **Document Type Selector** at top: Brochure | Company Profile | Book | Presentation | Report
3. **Generate = Preview, not Download**:
   - "Generate" button creates an in-page preview (rendered pages as images or embedded PDF viewer)
   - User can then: Edit, Rearrange slides, Add/delete pages, Add logos/QR/stamps
   - Download is a separate explicit action
4. **Live Preview Panel**: Center-fixed preview showing the document as it's being built
5. **Editing Capabilities**:
   - Drag to reorder pages/slides
   - Click to edit text inline
   - Add blank page, duplicate page, delete page
   - Logo placement (drag, resize, duplicate across pages)
   - Header/footer configuration
   - QR code insertion
6. **Image Selection Feedback**: When clicking project images to add, show a checkmark overlay on selected images
7. **Footer Fix**: Use actual company data from user profile/auth context instead of hardcoded placeholder

**Files**: `BrochureGeneratorPage.tsx` (major rewrite), new `src/components/toolkit/DocumentPreviewEditor.tsx`, update `brochure-ai` edge function

---

### Phase 4: Cross-Tool Save/Draft System

**Problem**: Not all tools have Save Draft / Create New / Load functionality.

**Changes**:

- Enhance `SaveProjectBar.tsx` to include: **Save Draft**, **Create New**, **Load Previous**, **Delete**
- Integrate the enhanced bar into all 4 PDF Suite tools consistently
- Store drafts in `localStorage` with a standardized key pattern: `jbj_draft_{toolName}_{timestamp}`
- Add a "Drafts" dropdown in the save bar showing recent drafts

**Files**: `SaveProjectBar.tsx`, all tool pages

---

### Phase 5: Layout Stability — Center Preview Pattern

**Problem**: Preview should always be centered and visible. Controls around it. User shouldn't need to scroll to see results.

**Changes**:

- All tools adopt the 3-zone pattern: Left (inputs/controls) | Center (live preview, fixed/sticky) | Right (properties/actions)
- On mobile: preview on top (sticky), controls below in scrollable tabs
- Specifically for Brochure/Document Creator: the generated document preview stays centered with editing toolbar floating above it

**Files**: All tool pages within PDF Suite

---

### Phase 6: Edge Function Upgrades

- **brochure-ai**: Expand to handle all document types (company profile, book, presentation). Add structured content generation for multi-page documents with proper sections.
- Ensure all existing edge functions for these tools are deployed and working (document-ocr for Scan & Sign, brochure-ai for Document Creator)

**Files**: `supabase/functions/brochure-ai/index.ts`

---

### Routing & Naming

| Current | New |
|---------|-----|
| Brochure Generator tab | Document Creator |
| Tab in PDF Suite | Stays as tab, label updated |

The PDF Suite tabs become:
1. **PDF Editor** — merge, split, rotate, OCR
2. **Photo → PDF** — image to PDF conversion
3. **Scan & Sign** — camera scan, sign, stamp (green theme)
4. **Document Creator** — brochure, company profile, book, presentation (replaces Brochure Generator)

---

### Implementation Priority

Given the scope, I recommend implementing in this order:
1. **Phase 1** (UI colors) + **Phase 2** (stamp integration) — immediate visual impact
2. **Phase 3** (Document Creator with preview) — core workflow fix
3. **Phase 4** (save/draft system) — quality of life
4. **Phase 5** (layout stability) — polish
5. **Phase 6** (edge functions) — backend

Shall I proceed with Phase 1 + Phase 2 first, or would you like all phases implemented together?

