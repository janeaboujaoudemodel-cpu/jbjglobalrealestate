
# Corporate Suite — Full Expansion + Stamp Typography Controls

## What Exists Today & Where to Find It

The Corporate Document Suite is already accessible at `/toolkit/corporate-suite`. Here is where every tool currently lives:

```text
/toolkit/corporate-suite              → Hub with 6 tool cards
/toolkit/corporate-suite/business-card → Business Card Designer (6 templates, PDF export)
/toolkit/corporate-suite/cv-resume    → CV / Resume Builder (4 templates, AI summary, PDF)
/toolkit/corporate-suite/cover-letter → Cover Letter Generator (AI-powered, 3 tones)
/toolkit/corporate-suite/landing-page → Landing Page Builder (HTML export + DNS guide)
/presentations                        → Presentations (Owner-only)
/e-signature                          → JBJ E-Sign (DocuSign replacement)
/document-scanner                     → Scan & Sign
/spreadsheet                          → Spreadsheet tool
/documents                            → Documents tool
```

The Corporate Suite hub currently shows only 6 tools. It is missing: E-Sign, Scan & Sign, Spreadsheet, Documents, Logo Creator, Company Profile Builder, and AI voice input across all tools.

---

## Everything This Plan Implements

### Part 1 — Stamp Generator: Bold/Italic/Font Size Controls

**File:** `src/components/stamp-generator/StampGeneratorPage.tsx`

The stamp generator uses `STAMP_FONTS` (14 entries) and a live `fontFamily` state. The `LiveStampPreview.tsx` passes `fontFamily` to the SVG renderer. There is no bold, italic, or font-size control anywhere.

**What to add:**
- A **Bold toggle button** (B icon) that appends `font-weight: bold` to the SVG `<text>` attributes via a new `fontBold` state variable.
- An **Italic toggle button** (I icon) that applies `font-style: italic` via a new `fontItalic` state.
- A **Font Size slider** with a numeric input (range 6–16, default 10) that overrides the auto-fit `nameFontSize` calculated in `LiveStampPreview.tsx` when the user sets a manual value. A "Auto" checkbox/toggle resets to auto-fit.

These controls go in the Typography section of the generator sidebar, next to the existing font family dropdown.

**File: `src/components/stamp-generator/LiveStampPreview.tsx`**
- Accept `fontBold?: boolean`, `fontItalic?: boolean`, `manualFontSize?: number | null` as new props.
- When `manualFontSize` is set, skip the `fitFontSize()` calculation and use the manual value directly.
- Apply `font-weight="${fontBold ? 'bold' : '600'}"` and `font-style="${fontItalic ? 'italic' : 'normal'}"` to all arc text elements.

---

### Part 2 — Corporate Suite Hub: Expanded to 12 Tools

**File:** `src/pages/toolkit/CorporateSuite.tsx`

Expand the tools array from 6 to 12 cards by adding:

| # | Tool | Route | Status |
|---|------|--------|--------|
| 1 | Company Stamp | `/toolkit/stamp-generator` | Existing |
| 2 | Business Card | `/toolkit/corporate-suite/business-card` | Existing |
| 3 | CV / Resume | `/toolkit/corporate-suite/cv-resume` | Existing |
| 4 | Cover Letter | `/toolkit/corporate-suite/cover-letter` | Existing |
| 5 | Landing Page | `/toolkit/corporate-suite/landing-page` | Existing |
| 6 | Presentation | `/presentations` | Existing |
| 7 | **Logo Creator** | `/toolkit/corporate-suite/logo-creator` | New |
| 8 | **Company Profile** | `/toolkit/corporate-suite/company-profile` | New |
| 9 | **E-Sign / DocuSign** | `/e-signature` | Existing (link) |
| 10 | **Scan & Sign** | `/document-scanner` | Existing (link) |
| 11 | **Spreadsheet** | `/spreadsheet` | Existing (link) |
| 12 | **Documents** | `/documents` | Existing (link) |

Cards for tools 9–12 are simple deep-links. Cards for 7–8 need new components.

---

### Part 3 — AI Logo Creator (New Tool)

**New file:** `src/components/corporate-suite/LogoCreator.tsx`
**New route in App.tsx:** `/toolkit/corporate-suite/logo-creator`

**Features:**
- **Text input**: Company/personal name
- **Industry/Tone selector**: Real Estate, Technology, Fashion, Healthcare, Finance, Personal Brand, Law, Creative, Restaurant — each maps to a visual style DNA
- **Style selector**: Modern, Minimalist, Bold, Geometric, Vintage/Classic, Luxury, Playful
- **Color palette selector**: Same 8-preset system as Business Card Designer
- **AI Generation**: Calls the `gemini-chat` (or a new dedicated) edge function with a rich prompt that describes the logo as SVG instructions — the AI returns structured SVG or a detailed design spec, which the frontend renders as a CSS/SVG-based logo mark
- **Regenerate button**: Re-calls AI with same or varied seed
- **Live preview**: Shows the generated logo at multiple sizes (icon, card, banner)
- **Export**: PNG (canvas capture) and SVG download
- **Save / Delete / Duplicate project**: Uses `SaveProjectBar`
- **Voice input**: `VoiceInputButton` on the name and description fields

**AI approach**: Use `gemini-chat` edge function with a specialized prompt that returns a JSON description of SVG shapes + text layout, which the frontend renders as a clean SVG logo. This avoids binary image generation and produces scalable vector output.

---

### Part 4 — Company Profile Builder (New Tool)

**New file:** `src/components/corporate-suite/CompanyProfileBuilder.tsx`
**New route in App.tsx:** `/toolkit/corporate-suite/company-profile`

**Features:**
- **Sections**: Company name, tagline, About Us, Services (add/remove), Team (add/remove), Contact, Social links, Logo upload
- **3 PDF templates**: Premium (gold accent, full-bleed cover), Executive (dark blue, structured), Clean (white, minimal)
- **AI content generator**: User writes a short description → Gemini Flash expands it into full "About Us" and "Services" paragraphs
- **Live A4 preview** (scrollable multi-page)
- **Export as PDF** via `pdf-lib` (multi-page)
- **Save/Delete/Duplicate project** via `SaveProjectBar`
- **Voice input** on description fields

---

### Part 5 — AI Smart Extractor (Universal Upload-to-Extract)

**This applies to: Business Card, CV/Resume, Cover Letter**

For each tool, add an **"Extract from File"** mode alongside the existing form editor. A tab/toggle switches between:
1. **Design Mode** — the existing editor (build from scratch)
2. **Extract Mode** — upload an existing document, AI reads it, populates all fields

**Implementation:**
- Add a file `<input accept=".pdf,.jpg,.jpeg,.png">` in each tool
- On upload, call a new edge function `document-extractor` (or reuse `gemini-chat` with the file base64-encoded) — Gemini Vision reads the image/PDF and returns structured JSON matching the tool's data schema
- Populate all form fields from the extracted JSON
- User can then edit the pre-filled form and switch to any template

**New edge function:** `supabase/functions/document-extractor/index.ts`
- Accepts: `{ file_base64: string, file_type: string, extraction_type: "cv" | "business_card" | "cover_letter" }`
- Uses Gemini Vision (`gemini-2.5-flash`) to extract structured data
- Returns typed JSON matching each tool's data interface

---

### Part 6 — Voice Input Across All Corporate Suite Tools

The `VoiceInputButton` component already exists at `src/components/ui/VoiceInputButton.tsx`. It calls the `voice-to-text` edge function.

**Add to:**
- `BusinessCardDesigner.tsx` — name, company, title fields
- `CVResumeBuilder.tsx` — summary, experience description, skills fields
- `CoverLetterGenerator.tsx` — skills, experience fields
- `LogoCreator.tsx` — name, tone description fields
- `CompanyProfileBuilder.tsx` — About Us, Services description fields

---

### Part 7 — Bold/Size/Style Controls Applied to ALL Corporate Suite Tools

**Universal typography control bar** — wherever there is formatted text output (CV preview, Cover Letter, Business Card) add:
- **Bold toggle** (B icon)
- **Font size +/−** with numeric display
- **Font family selector** (3–4 options per tool)

For the **CV Builder** specifically:
- Add font family selector (4 options: serif, sans-serif, mono, humanist)
- Add global font size scaling slider (80%–120%)

For the **Business Card Designer**:
- The template already scales via `scale` prop — add a name font-size override control

---

## Technical Architecture

### New Files to Create:
```
src/components/corporate-suite/LogoCreator.tsx
src/components/corporate-suite/CompanyProfileBuilder.tsx
supabase/functions/document-extractor/index.ts
```

### Files to Edit:
```
src/pages/toolkit/CorporateSuite.tsx          — Expand to 12 tools
src/App.tsx                                   — Add 2 new routes
src/components/stamp-generator/StampGeneratorPage.tsx  — Bold/Italic/Size controls
src/components/stamp-generator/LiveStampPreview.tsx    — Accept new font props
src/components/corporate-suite/BusinessCardDesigner.tsx — Extract mode + voice
src/components/corporate-suite/CVResumeBuilder.tsx     — Extract mode + voice + font controls
src/components/corporate-suite/CoverLetterGenerator.tsx — Extract mode + voice
```

### No new database tables needed
All tools are client-side with PDF export. The `document-extractor` edge function uses Lovable AI (Gemini Vision) via the existing `LOVABLE_API_KEY` — no extra secrets needed.

---

## Execution Order

1. **Stamp font controls** — Bold/Italic/Size in `StampGeneratorPage` + `LiveStampPreview` (isolated change, immediate value)
2. **Hub expansion** — Update `CorporateSuite.tsx` to show 12 cards (fast, no new components)
3. **Logo Creator** — New component + route (highest-requested new tool)
4. **Document Extractor edge function** — Powers extract-from-file for all tools
5. **Extract mode in Business Card, CV, Cover Letter** — Upload → AI fill → edit
6. **Company Profile Builder** — New component + route
7. **Voice input** — Add `VoiceInputButton` to all tools
