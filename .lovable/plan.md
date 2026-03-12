

## Plan: Business Card Designer, Logo Creator & Email Signature Full Upgrade

This is a large multi-phase upgrade touching BusinessCardDesigner.tsx, LogoCreator.tsx, and their edge functions. Given the scope, I will implement this across multiple messages.

---

### Phase 1 — Layout & Padding Fixes + Remove Back Button

**BusinessCardDesigner.tsx**
- Remove the "Back" button from the sticky header (lines 1629-1635) since horizontal nav already provides navigation
- Remove the breadcrumb trail (Toolkit > Corporate Suite > Business Card) — redundant with horizontal nav
- Fix padding between header and content cards: reduce `py-8` to `py-4` on main grid (line 1812) and tighten spacing
- Restructure layout from `grid-cols-[380px_1fr]` to a **3-zone center-canvas layout**: Left tools (320px) | Center preview (flex-1) | Right style controls (320px)
  - Left: Card Shape, Template, Card Info fields, Scan Existing Card
  - Center: Live Preview (always centered, large), Front/Back toggle, Edit Layout, Share buttons
  - Right: Colors, Brand Assets, Typography, QR Code, AI Design, Share Analytics
- Ensure email signature color changes apply to the email signature shape (not the business card) — currently the color state is global; will scope color application per active shape

**LogoCreator.tsx**
- Already uses StudioShell (center canvas), so layout is correct. No structural changes needed.

---

### Phase 2 — Edge Function Deployment & Model Upgrades

Deploy and upgrade these edge functions with updated CORS headers and model versions:
- `ai-card-design-generator` — update CORS headers to full set, upgrade champagne gold style prompt defaults
- `ai-logo-generator` — already has auth; update CORS headers to full set
- `ai-signature-generator` — already uses image model; update CORS headers
- `business-card-ocr` — update CORS headers, add live camera scan support instruction
- `voice-to-text` — already using gemini-2.5-pro, update CORS headers

All edge functions will get the standard expanded CORS headers:
```
authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version
```

---

### Phase 3 — AI Business Card Gallery Generator

New edge function: `ai-card-gallery-generator`
- Accept: description prompt, color palette, industry, tone
- Generate: 20-30 card design variations as structured JSON (SVG element arrays)
- Return paginated results with favoriting capability

**BusinessCardDesigner.tsx additions:**
- New section "Smart Gallery" in left panel
- Prompt input + voice input for describing desired card style
- Option to upload a photo/screenshot — extract color palette via `extract-logo-colors` function
- Display grid of generated card thumbnails (paginated, 12 per page)
- Favorite up to 5 designs, then "Merge" button:
  - Pick front from one design
  - Pick back from another
  - Pick colors from a third
  - Pick layout/architecture from a fourth
- Each selected design's code/data stored for AI to combine via prompt

---

### Phase 4 — Interactive Live Preview Upgrade

**Center canvas direct editing:**
- Click any text field on the card → inline edit directly on preview
- Drag fields to reposition (already partially built with `editLayout` mode — make it always-on with visual handles)
- Resize logo/monogram via drag handles on the preview
- Lock/unlock individual elements
- Add stamp overlay, signature overlay from Brand Assets
- Undo/redo/reset toolbar above the canvas (reuse `useStampHistory` pattern)

**Email signature specific:**
- When shape is `email-signature`, color changes apply to the signature border/accent, not the business card colors
- Add frame options: left photo + right content, right photo + left content, top/bottom layouts
- Add tone selector: Corporate, Professional, Premium, Friendly, Flashy
- Add signature/stamp/photo/logo/monogram asset slots

---

### Phase 5 — Typography & Color Enhancements

**Typography panel expansion:**
- Add text alignment: left, center, right
- Add underline toggle
- Add letter spacing slider
- Add line height slider
- Add padding controls
- More font options (10+ fonts)

**Color panel expansion:**
- Add color wheel (native `<input type="color">` already exists — add a visual wheel component)
- Add ombre/gradient picker: start color + end color + direction
- Add "Extract from photo" button: upload image → call `extract-logo-colors` → apply palette
- Website screenshot → extract colors → generate card matching website

---

### Phase 6 — Trade License Auto-Fill

- Add DocumentExtractorUpload for trade license (reuse existing component)
- Call `ai-stamp-extract` or `document-ocr` to extract company info + business_type
- Auto-fill: name, company, address, phone, email, website
- Auto-set industry based on extracted business_type
- Auto-generate matching card/signature/logo based on extraction

---

### Phase 7 — Bilingual Card Support

- Add language toggle: "Bilingual" option
- Two modes:
  - Both languages on one card (Arabic on back, English on front)
  - Two separate cards (one per language)
- On download, prompt: download both languages together or separately
- High-quality PDF export at 300 DPI

---

### Phase 8 — Logo Creator Upgrades

- Add "Upload existing logo" option → display on canvas for editing
- Add trade license upload → extract company info → auto-generate logo
- Add Instagram/website URL input → scrape brand identity → generate matching logo
- Increase history from 3 to 100 variations (paginated grid)
- Add favorites/checklist system across all tools
- Fix microphone: voice-to-text is using gemini-2.5-pro which is slower — switch to gemini-2.5-flash for faster transcription
- Add "Projects" concept: save/resume logo generation sessions

---

### Phase 9 — Mockup Previews & Sharing

- After card/logo is ready, show mockups on:
  - Business card on desk
  - Logo on document letterhead
  - Card on clothing/badge
  - Stationery kit view
- Use AI image generation (`gemini-2.5-flash-image`) to create context mockups
- Share options: WhatsApp, email, direct link, print

---

### Phase 10 — Second Layer / Finishing Effects

- Add "Finish" options per card:
  - Matte background with glossy content overlay
  - Spot UV simulation (shiny text/logo on matte)
  - Embossed text effect
- Visual simulation in the preview using CSS filters and shadows

---

### Files to Create/Modify

| File | Action |
|---|---|
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | Major refactor: 3-zone layout, remove Back button, fix padding, add interactive editing, gallery, bilingual, trade license, mockups |
| `src/components/corporate-suite/LogoCreator.tsx` | Add upload, trade license, favorites, projects, fix voice speed |
| `supabase/functions/ai-card-design-generator/index.ts` | Update CORS, upgrade prompt for champagne gold style |
| `supabase/functions/ai-card-gallery-generator/index.ts` | New: batch card design generation |
| `supabase/functions/ai-logo-generator/index.ts` | Update CORS headers |
| `supabase/functions/ai-signature-generator/index.ts` | Update CORS headers |
| `supabase/functions/business-card-ocr/index.ts` | Update CORS headers |
| `supabase/functions/voice-to-text/index.ts` | Switch model to gemini-2.5-flash for speed |
| `supabase/config.toml` | Add new function entries |

### Implementation Order
Due to scope, I will implement in this order across messages:
1. Layout fix + Back button removal + padding + edge function CORS updates + deploy
2. 3-zone center-canvas layout + email signature color fix
3. Typography/color enhancements + interactive editing
4. AI gallery + trade license + bilingual
5. Logo creator upgrades + mockups + finishing effects

