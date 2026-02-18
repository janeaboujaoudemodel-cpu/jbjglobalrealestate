
# Stamp Generator: Major Upgrade + Navigation Clarification Plan

## Context & Issues Identified

### Issue Audit

**1. Bilingual/Arabic stamps not working**
In `src/lib/stampTemplates.ts` (line 207), the bilingual template uses `arabicName = name` — it just copies the English company name into the Arabic slot. There is no actual Arabic text input in the wizard. The edge function has the same problem. Arabic text needs to be collected from the user and properly rendered.

**2. City + Country not showing together**
In `stampTemplates.ts` line 103: `const city = (project.city_optional || project.country_optional || 'UAE').toUpperCase()` — this uses `||` (OR), so if `city_optional` is "Dubai" it never shows country. Fix: combine them as `DUBAI, UAE`.

**3. Text overlapping the circle border**
The `circleTextPath` function at line 72-79 uses `startOffset="12%"` and renders company name on the ring path. The inner name text at the same radius causes overlap. The SVG coordinate system needs proper layering with safe inner radii and font size capping.

**4. No "Favorite" feature for designs**
The `stamp_designs` table has no `is_favorite` column. We need to add one via migration and update the UI to show a heart/star button on each card.

**5. Color picker is limited & no custom hex input**
Current: only 5 preset swatch buttons. User wants: custom hex input, multi-color support (2-3 colors like BrandCrowd), and more options including black.

**6. No AI designer chat for iterative improvements**
No conversational AI interface exists. Need to add a chat panel where users describe improvements and the AI refines the stamp design.

**7. "New AI Tools" row in header**
The row EXISTS in `MegaMenuToolkit.tsx` (lines 101-116) with the `MegaMenuSectionTitle` and two tools. The user cannot see it because the mega menu may be rendering below the fold or the nav item for "Toolkit" needs to be clicked. This is a **visibility/UX awareness** issue, not a missing feature. We need to highlight it better.

**8. DocuSign / JBJ E-Signature system**
The `ScanSignDocuments.tsx` (`/document-scanner`) is a physical document scanner + handwritten signature tool — NOT a DocuSign-like e-signature system for contracts. A true DocuSign replacement for JBJ would require: contract upload, multi-signer workflows, signature fields, audit trails, and signed document delivery. This needs to be built as a separate system: **JBJ E-Sign** at `/toolkit/e-sign`.

---

## Technical Plan

### Part 1: Database Migration

Add `is_favorite` column to `stamp_designs` and `arabic_company_name` to `stamp_projects`:

```sql
ALTER TABLE stamp_designs ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE stamp_projects ADD COLUMN IF NOT EXISTS arabic_company_name TEXT;
ALTER TABLE stamp_projects ADD COLUMN IF NOT EXISTS arabic_city TEXT;
```

---

### Part 2: Stamp Generator — Quality Overhaul

#### A. Fix City + Country Display
In `stampTemplates.ts` and `ai-stamp-generator/index.ts`, change:
```ts
// Before:
const city = (project.city_optional || project.country_optional || 'UAE').toUpperCase();
// After:
const parts = [project.city_optional, project.country_optional].filter(Boolean);
const city = (parts.join(', ') || 'UAE').toUpperCase();
```

#### B. Fix Bilingual/Arabic Stamps
- Add Arabic name field to the **Wizard Step 1** (shown only when language mode is `AR` or `BILINGUAL`)
- Update `stamp_projects` table to store `arabic_company_name` and `arabic_city`
- Update the bilingual SVG templates to use the actual stored Arabic text
- Use proper RTL SVG `direction="rtl"` and `unicode-bidi="bidi-override"` attributes
- Add horizontal divider between English (top) and Arabic (bottom) sections
- Generate proper bilingual circular ring text with both languages separated by `★` or `⬥`

#### C. Fix Overlapping Text / Premium Layout
Redesign the SVG templates with proper safe zones:
- Outer border ring: radius `r`
- Ring text path: radius `r - 6` (tight to border)
- Inner safe zone: radius `r - 20` for all content
- Monogram: centered at `cy` with font size `44–50`
- Company name: at `cy - 8` from center, font-size auto-scaled by character count
- City/location: at `cy + 18`, smaller font
- Reg number: at `cy + 34`
- Add auto font-size reduction: if `name.length > 20`, reduce font size, if `> 28` wrap to 2 lines
- Minimum 6px clearance between any text element and the inner border circle

#### D. Premium SVG Template Redesign (8 Templates)
Replace all 8 templates with proper premium designs:
1. **Classic Double Ring** — proper text ring path, monogram centered
2. **Modern Minimal** — horizontal dividers, sans-serif, no ring text
3. **Luxury Ornate** — triple ring, star dividers, serif
4. **Bold Corporate** — rectangle with strong borders
5. **Vintage Seal** — dashed inner ring, traditional layout
6. **Bilingual Official** — Arabic top, English bottom, horizontal divider (only generated for AR/BILINGUAL)
7. **Geometric Modern** — geometric inner element, clean lines
8. **Arabic Calligraphy** — Arabic-first layout with decorative borders

#### E. Color Picker Upgrade
Replace the simple 5-swatch picker with:
- **Preset swatches**: Navy, Black, Dark Red, Forest Green, Royal Purple, Midnight Blue, Gold, Dark Brown (8 swatches)
- **Custom hex input**: text input with `#` prefix, live preview on change
- **Multi-color mode toggle**: "Dual Color" switch — select a primary color (ink) and a secondary color (for inner elements / monogram)
- Apply colors to SVG: primary color replaces `#1a2744` for borders and ring text; secondary color for center monogram and dividers

---

### Part 3: Favorites Feature

**Database**: Add `is_favorite BOOLEAN DEFAULT FALSE` to `stamp_designs`.

**UI Changes in `StampGeneratorPage.tsx`**:
- Add a heart/star `♥` button to each concept card (top-left or floating)
- Clicking it calls `supabase.from('stamp_designs').update({ is_favorite: true }).eq('id', concept.id)`
- Add a "Saved Designs" tab/section at the top of the generator page that filters `is_favorite = true`
- Favorites persist even after regeneration (since they're DB records from previous generations)
- When regenerating, existing favorites are preserved — only non-favorited designs are replaced

**Flow**:
1. On load, load existing DB designs, mark favorites with a heart icon
2. On "Regenerate" — only delete non-favorited designs and generate new ones
3. Favorites section shows above the new concepts grid

---

### Part 4: AI Designer Chat Panel

Add a collapsible AI chat panel to the right side of the generator page:

**UI**: Slide-in panel from the right, triggered by "Chat with AI Designer" button.

**Interaction Flow**:
1. User types: "Make the borders thicker and add a star divider"
2. System sends: `{ project_data, selected_concept_svg, user_instruction }` to the `ai-stamp-generator` edge function with `action: "refine"`
3. Edge function calls Gemini with the instruction and generates a refined SVG
4. The new SVG is shown as a new concept at the top of the grid
5. Chat history persists in component state during the session

**Edge function update**: Add `action: "refine"` handler that takes an existing SVG + instruction and returns a modified SVG.

---

### Part 5: "New AI Tools" Row Visibility Fix

The row EXISTS in the header (MegaMenuToolkit.tsx lines 101-116) but users may not find it easily. Fix:
- Make the "New AI Tools" section title more visually distinct — add a ✨ badge/highlight
- Add the AI Stamp Generator and Scan & Sign to more visible locations (e.g., the main Toolkit landing page hero section)
- Ensure the AI Stamp Generator appears in the AI Hub page (`/ai-hub`)

---

### Part 6: JBJ E-Sign System (DocuSign Replacement)

Build a proper e-signature system at `/toolkit/e-sign` — separate from the camera-based Scan & Sign tool.

**Database Tables**:
```sql
CREATE TABLE esign_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, completed, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE esign_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES esign_documents(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, signed, declined
  signed_at TIMESTAMPTZ,
  signature_data TEXT, -- base64 signature image
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE esign_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES esign_documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES esign_signers(id),
  field_type TEXT NOT NULL, -- signature, initials, date, text, checkbox
  page_number INT DEFAULT 1,
  x_percent FLOAT NOT NULL,
  y_percent FLOAT NOT NULL,
  width_percent FLOAT NOT NULL,
  height_percent FLOAT NOT NULL,
  value TEXT,
  required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS**: All tables locked to `user_id = auth.uid()`. Signers access via token-based public route.

**UI Pages**:
1. **`/toolkit/e-sign`** — Landing/Dashboard: list of sent documents with status badges
2. **`/toolkit/e-sign/new`** — Upload document, add signers, place signature fields on document preview
3. **`/toolkit/e-sign/sign/:token`** — Public signing page (no auth required) where signers can view and sign
4. **`/toolkit/e-sign/document/:id`** — Owner view: track signer statuses, download completed doc

**Integration**:
- Add to Navigation header under "New AI Tools" section
- Add to Footer under PDF & Documents
- Add to AI Hub and Broker Toolkit tools list

---

### Part 7: Update Navigation & Tool Listings

Update the following to include the new E-Sign system:
- `MegaMenuToolkit.tsx` — add E-Sign to the "New AI Tools" section (3rd tool)
- `Footer.tsx` — add E-Sign link
- `BrokerToolkitTools.tsx` — add E-Sign under Documents
- `AIHub.tsx` — add E-Sign card
- `App.tsx` — add all new routes

---

## Files to Create/Edit

**New Files**:
- `supabase/migrations/[timestamp]_stamp_favorites_esign.sql`
- `src/pages/toolkit/ESignPage.tsx` (landing + dashboard)
- `src/components/e-sign/ESignDocumentEditor.tsx`
- `src/components/e-sign/ESignSigningPage.tsx`
- `src/components/stamp-generator/StampAIDesignerChat.tsx`

**Modified Files**:
- `supabase/functions/ai-stamp-generator/index.ts` — add `refine` action, fix city/Arabic
- `src/lib/stampTemplates.ts` — fix city display, Arabic, overlapping text, premium layouts
- `src/components/stamp-generator/StampGeneratorPage.tsx` — favorites UI, color picker upgrade, AI chat panel
- `src/components/stamp-generator/StampProjectWizard.tsx` — add Arabic name field
- `src/components/stamp-generator/StampSVGRenderer.tsx` — multi-color support
- `src/components/header/MegaMenuToolkit.tsx` — add E-Sign, highlight section
- `src/components/Footer.tsx` — add E-Sign
- `src/components/broker-toolkit/BrokerToolkitTools.tsx` — add E-Sign
- `src/pages/AIHub.tsx` — add Stamp Generator + E-Sign cards
- `src/App.tsx` — add E-Sign routes
