

## Plan: Cover Letter → Full Document Designer & Signing Platform

This is a very large scope. I will break it into **3 implementation phases** within this plan, focusing on Phase 1 for immediate execution.

---

### Phase 1: Core Designer Upgrade (This Message)

#### 1. Deploy `cover-letter-generator` edge function
- Already exists at `supabase/functions/cover-letter-generator/index.ts` — will trigger deployment
- Verify it's listed in `supabase/config.toml` with `verify_jwt = false`

#### 2. Upgrade `CoverLetterGenerator.tsx` → Full Document Designer
**Rename scope**: Keep route at `/toolkit/corporate-suite/cover-letter` but rebrand to **"AI Document Designer"** — generates cover letters, offer letters, company letters, contracts, NDAs, HR docs, etc.

**UI Fixes & Additions:**
- Fix padding between header and Brand Assets collapsible (currently too tight)
- Add **Color Wheel** section using HSL picker for accent color, header bg, text color, divider color
  - **Owner**: Loads locked company palette from brand settings, shows preview, allows override
  - **Regular users**: Shows general color wheel with presets
- Add **Typography Controls**: Font family dropdown (10+ fonts: Georgia, Inter, Poppins, Playfair, Merriweather, Lora, etc.), font size slider, bold/italic/underline toggles
- Add **Text Alignment**: Left, center, justify buttons for letter body
- Add **Divider Controls**: Style (solid, dashed, double, gold), thickness, color
- Keep **preview centered** on the right panel with all changes reflecting live

#### 3. Signature & Stamp Integration
- Add "Signature" section: Type your name → AI generates styled signature (founder, corporate, HR, etc.) via `ai-signature-generator` edge function
- Add "Upload Signature" option alongside generated ones
- Add "Stamp" section: Upload stamp image, or load from saved stamps (session storage from Stamp Generator)
- Add "Trade License Upload" → Extract company details to auto-fill letter header
- One-click: Click signature field → auto-signs, click stamp field → auto-stamps, click date → auto-dates

#### 4. Header/Footer Builder
- Editable header: Logo, company name, contact, QR code placement
- Editable footer: Copyright text, links, page numbers
- Business card mini-embed option in footer
- Email signature card integration (load from saved e-signature designs)

#### 5. Template System Upgrade
- Expand from 4 templates to 8+ (add: Legal, Corporate Gold, Minimalist Dark, Creative, Royal)
- Each template shows color-customizable preview thumbnails
- Ombre/gradient option for header band via dual color picker

#### 6. Content Editability
- Click any field in preview to edit inline
- Right-click context: Delete, Duplicate, Move Up/Down
- Drag-to-reorder content blocks
- "Add Field" button: Date, Signature, Stamp, Divider, Text Block, QR Code

---

### Phase 2: E-Signature Integration (Next Message)

- Any user can upload a document and sign it or add stamp (free feature)
- Integration with existing `/e-signature` system
- "Sign This Document" button in the designer that opens the signing pad
- Save signed documents to user's account

### Phase 3: Owner-Only DocuSign Features (Following Message)

- Owner can send documents for signature via email
- Email notification to signer with secure link
- Follow-up reminders (manual + scheduled)
- Signature status tracking (pending, viewed, signed)
- This uses existing `esign-send-for-signature` and `esign-send-reminder` edge functions

---

### Files Modified in Phase 1

| File | Change |
|------|--------|
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | Major upgrade: color wheel, typography, stamps, signatures, header/footer, more templates, inline editing |
| `supabase/functions/cover-letter-generator/index.ts` | Expand prompt to support multiple document types (not just cover letters) |
| `supabase/config.toml` | Ensure cover-letter-generator is registered |

### New Components (Phase 1)

| File | Purpose |
|------|---------|
| `src/components/corporate-suite/DocumentColorWheel.tsx` | HSL color picker with gradient/ombre support, owner palette lock |
| `src/components/corporate-suite/DocumentTypographyControls.tsx` | Font family, size, weight, alignment, underline controls |
| `src/components/corporate-suite/DocumentStampIntegration.tsx` | Stamp upload/load/place controls |
| `src/components/corporate-suite/DocumentHeaderFooterBuilder.tsx` | Header/footer editor with QR, links, copyright |

