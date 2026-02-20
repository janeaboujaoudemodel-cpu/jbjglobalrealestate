
# Large-Scale Platform Enhancement Plan

This is a major multi-component upgrade spanning 8 distinct areas. Given the scope, I'll implement these in priority order across focused changes.

---

## Summary of All Requested Changes

### 1. AI Hub — Add Corporate Suite Tools
Add all 12 Corporate Suite tools individually to the AI Hub (`/ai-hub`) alongside the existing Stamp Generator entry. Tools to add: Business Card, CV/Resume, Cover Letter, Logo Creator, Company Profile, Presentation, Landing Page, E-Sign, Scan & Sign, Spreadsheet, Documents.

### 2. CV / Resume Builder — Major Upgrades
Multiple improvements to `CVResumeBuilder.tsx`:

**a. Color wheel for accent color**
- Add a color picker (HTML `<input type="color">`) that applies to all template accents uniformly.

**b. Logo delete button**
- When a logo is loaded, show a clickable "X" / delete button on the logo preview to remove it.

**c. AI Header Prompt / CV Description**
- Add a text area at the top labeled "Describe your ideal CV" or "AI Instructions" — free-text prompt that the AI uses when generating the summary and/or regenerating content.

**d. Upload & AI Extract → Show multiple templates**
- After uploading a CV and extracting data, show all 12 template previews simultaneously in a scrollable gallery so the user can pick visually.

**e. Photo placement — outside the sidebar**
- For templates where the photo is currently inside the dark sidebar (like "executive"), move it to be positioned above or beside the name, outside/at the top of the main content area, with proper circular framing.

**f. Show full CV page (not cropped rectangle)**
- The preview panel currently clips the CV. Change the preview to show the entire A4 page at a scaled-down size, with a scroll or zoom view for the full document.

**g. Multi-template gallery view**
- Show all templates as full CV thumbnails (mini previews) side by side. When the user clicks one, it becomes active and they can see it full-size. This is the "Canva-style" template picker.

**h. Skills auto-suggest based on job/experience**
- When the user types a job title or experience description, trigger an AI call to suggest relevant skills automatically.

**i. Job description / experience description generator**
- Add an "AI Generate" button next to each experience entry that generates a professional bullet-point description based on title and company.

**j. Full typography controls**
- Expand font family list to 20+ fonts (Google Fonts / system fonts).
- Add Bold / Italic toggles, font size slider, text alignment (left/center/right).
- These controls appear in the "Typography" collapsible panel.

**k. Save / Share / Print / Export bar**
- Proper action bar: Save (to browser storage), Share (copy link or generate shareable URL), Print (window.print()), Export dropdown (PDF, PNG, JPEG) — without emojis, with champagne/gold premium button styling.

**l. Remove emojis from Export dropdown**
- Replace 📄 🖼️ 📷 emojis with Lucide icons (FileText, Image, Camera).

**m. Fix Export button color**
- Change from old yellow gold to champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` with gold border, black text).

### 3. Background AI — Fix Removal + Add Video Support
- **Fix photo background removal**: The current client-side flood-fill algorithm often fails on complex photos. Replace with a call to the AI Vision model (Gemini) or use a dedicated `remove-background` edge function using AI for more accurate results.
- **Fix background removal in CV Builder**: The CV's profile photo upload has a "remove background" toggle — make it use the same fixed approach.
- **Add video background removal**: Add a new panel in the Background AI page for video files. Use FFmpeg WASM to extract frames, remove background frame-by-frame, and reassemble. Show progress bar.
- **Integrate video background removal into Video Suite**: Add a "Remove Background" track effect option in the Video Studio/Creative Suite video editor.

### 4. Corporate Suite Page — Premium Redesign
- Replace the current white card grid with a dark premium design using deep charcoal/black backgrounds.
- Use champagne-gold gradient top borders, premium icon containers.
- Add subtle glow effects matching the platform's dark aesthetic.
- Remove any old yellow/amber button colors — replace with champagne gradient.

### 5. Presentations — Full Rebuild
- Fix button colors: all buttons currently use black bg which is unreadable on dark slides.
- Fix text contrast: white text on bright backgrounds.
- Add Canva-style template gallery: 10+ templates (Business, Pitch Deck, Portfolio, Minimal, Bold, etc.) shown as visual cards.
- Fix Export: currently downloads HTML immediately even with empty content — add proper PDF export using html2canvas + pdf-lib, with a confirmation dialog.
- Fix Content/Title/Welcome slide buttons visibility.
- Add proper color-contrast enforcement for all UI buttons.
- Add Portfolio and Presentation template categories as requested.

### 6. Landing Page Builder — "Coming Soon" / Under Maintenance Pages
- Add new page types to the Landing Page Builder: "Coming Soon", "Under Maintenance", "404 Not Found" with animated countdown timer and email capture.

### 7. Typography — Universal Font System
- Create a shared `FontControls` component usable across: CV Builder, Documents editor, Company Profile, Spreadsheet, Presentation.
- Include 20+ font families, size slider, bold/italic/underline toggles, text alignment buttons.
- This matches "international standard" editing toolbars like Google Docs / Microsoft Word.

### 8. Color Standard — Remove Old Gold Yellow
- Audit and replace all instances of the old amber/yellow gold color (`from-amber-600`, `to-yellow-600`, `bg-yellow-*`, `hsl(var(--gold))` on buttons) with the champagne gradient standard across all affected components.

---

## Technical Implementation Plan

### Files to Create
- `supabase/functions/remove-background/index.ts` — AI-powered background removal edge function
- `supabase/functions/cv-skills-suggest/index.ts` — Skill suggestion based on job title/experience  
- `supabase/functions/cv-experience-writer/index.ts` — AI job description generator
- `src/components/shared/FontControls.tsx` — Universal typography toolbar component

### Files to Modify (in priority order)

**Phase 1 — CV Builder (highest impact)**
- `src/components/corporate-suite/CVResumeBuilder.tsx` — All CV upgrades above
- `src/components/corporate-suite/BrandAssetLibrary.tsx` — Add delete button for logo

**Phase 2 — AI Hub**
- `src/pages/AIHub.tsx` — Add all 12 corporate tools to `productivityTools` array

**Phase 3 — Background AI Fix**
- `src/pages/toolkit/BackgroundAI.tsx` — Replace flood-fill with AI edge function, add video panel
- `supabase/functions/remove-background/index.ts` — New AI removal function

**Phase 4 — Corporate Suite + Presentations**
- `src/pages/toolkit/CorporateSuite.tsx` — Dark premium redesign
- `src/pages/Presentations.tsx` — Full rebuild with templates, fix buttons/colors/export

**Phase 5 — Typography + Color Cleanup**
- `src/components/shared/FontControls.tsx` — New shared component
- Various files — Replace old gold/amber colors with champagne standard

---

## Prioritization Note

This is an extremely large scope. I will implement all changes systematically, starting with the highest-impact visible items:
1. CV Builder improvements (color wheel, logo delete, photo placement, full-page preview, skill suggest, typography, export fix)
2. AI Hub corporate tools
3. Background AI fix + video support
4. Corporate Suite dark redesign
5. Presentations rebuild
6. Typography system + color cleanup

The implementation will be done in the approved session following this plan.
