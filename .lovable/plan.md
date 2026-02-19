
# Full Plan: Stamp Generator + Market Intelligence Book Fixes

This covers two separate areas of the app — the **AI Company Stamp Generator** and the **Market Intelligence Book** — with many specific issues to fix in each.

---

## Part 1 — Stamp Generator Fixes (StampProjectWizard + StampGeneratorPage)

### 1A. Upload Logo Photo in Step 2 (Wizard)

**File:** `src/components/stamp-generator/StampProjectWizard.tsx`

The database already has `uploaded_logo_url` on the `stamp_projects` table. The form `FormState` interface and the `handleCreate()` insert need this field added.

Changes:
- Add `uploaded_logo_url: string` to `FormState` interface
- Add a file upload input in Step 2 ("Logo / Monogram") for uploading a logo image
- On file select, convert to base64 data URL (no storage bucket needed — stored as data URL) OR upload to a Supabase storage bucket and store the URL
- Add a **3rd icon option**: `UPLOADED_LOGO` (already in the `IconStyle` type)
- When `UPLOADED_LOGO` is selected, show the upload area and a preview of the image
- When a logo is uploaded, auto-select `UPLOADED_LOGO` as the icon style
- Add logo preview in a rounded square frame
- Save `uploaded_logo_url` in the DB insert

**New bilingual stamp template (separate from upload):**

The user also wants a specific bilingual round stamp design with:
- **Top half arc**: English company name
- **Bottom half arc**: Arabic company name  
- **Center**: Uploaded logo image (or monogram), city ("Dubai"), country ("United Arab Emirates")
- **Horizontal**: English top / Arabic bottom

This becomes a new SVG template option. Since the AI generates SVGs, this layout needs to be added to the `src/lib/stampTemplates.ts` file as a new template called `bilingual-logo-center` that will be pre-rendered when the user has `language_mode === 'BILINGUAL'` and `icon_style === 'UPLOADED_LOGO'`.

**File:** `src/lib/stampTemplates.ts` — add new template `bilingual-logo-center`

### 1B. Stamp Generator Page Header — Content Lifting

**File:** `src/components/stamp-generator/StampGeneratorPage.tsx`

**Problem:** The second sticky header (the wizard sub-header) sits too low. The tabs (Colors, Fonts, Text), date stamp, concept controls are all falling below it and not filling the secondary header.

**Fix:** The sticky `div` at line 372 uses `sticky top-24 sm:top-28 lg:top-32`. The content inside only has `py-3` padding. All the left-panel controls (Colors / Fonts / Text tab switcher) are in the main body, not the header. The fix is to move the color stop selector row (`stopDefs` map) into the header bar itself, so it visually fills the space.

Specifically:
- Add a condensed horizontal color + font + date stamp controls row **inside** the header `div` — after the breadcrumb area
- This fills the header strip so it doesn't look empty

### 1C. AI Designer Panel — Multiple Fixes

**File:** `src/components/stamp-generator/StampGeneratorPage.tsx`

**Issues to fix:**

1. **X close button** — Already exists (line 685-691). But user says it's not visible. Move it to be more prominent: make it bigger (`w-8 h-8`), keep it top-right but increase visual weight.

2. **Minimize button** — Add a minimize `_` button next to the X. When clicked, collapses the panel to show only the header bar (height becomes just the header, content hidden). The panel stays draggable even minimized. A state `aiPanelMinimized` controls this.

3. **Suggestions stay persistent** — Currently at line 694: `{chatMessages.length === 0 && ...}` — this hides suggestions once any message is sent. 

   Fix: Change the condition so suggestions are always visible (in a collapsed/scrollable section), not only when `chatMessages.length === 0`. Keep all 4 suggestions permanently visible below the messages in a compact form. Or move them to a persistent row above the input that never disappears.

4. **Replace Selected button not clickable** — At line 743-750, the `Replace Selected` button is `disabled={!selectedId}`. The user must first select a stamp by clicking it in the main grid (which opens the preview modal), then close the modal without going to export. The disable logic is correct — the user just hasn't selected a stamp yet. 

   Fix: Add a more visible tooltip/hint that says "Click a stamp design first" and also add a visual indication on the button when it's disabled (greyed text + explanation). The `{!selectedId && <p>}` hint at line 760 already exists but needs to be more visible — style it as a yellow/amber info box.

5. **Green tick emoji removed** — Line 280: `✅ Preview ready! Choose to Replace or Save as New below.` — replace `✅` with a plain text check mark or use a Lucide `Check` icon rendered as SVG inline. Change to: `"Preview ready — choose to Replace or Save as New below."` (no emoji).

   Also line 731: `✨ Preview of refined design:` — remove `✨`, change to `"Refined preview:"`

6. **Gold standard color** — The `PRESET_PALETTE` at line 28 has `{ label: 'Gold', hex: '#B8860B' }`. The user wants the exact gold from the landing page outside. Looking at the CSS variables, the exterior gold is `hsl(var(--gold))`. The `--gold` CSS variable is set in the global theme. The palette should use `hsl(var(--gold))` — but since these are inline hex values, we need to find the actual hex. From the example mockStamp on the landing page, it uses `hsl(var(--gold)/0.6)` border color. The standard gold used throughout the app's Tailwind CSS is `#B8860B` (already in the palette) — but the "gold" actually shown on the landing page stamps outside uses the `--gold` variable which resolves to the app's gold. We'll check `tailwind.config.ts` to get the exact hex and ensure it's the FIRST preset in the palette with label "JBJ Gold" as the default/standard.

### 1D. Gold Color Standard + Default

**File:** `src/components/stamp-generator/StampGeneratorPage.tsx`

- Set `primaryColor` initial state to `'#B8860B'` (JBJ gold) instead of `'#1a2744'` (navy). This makes gold the default when you open any project.
- Label it "JBJ Standard Gold" in the preset palette
- Mark it as the recommended/default option visually

---

## Part 2 — Market Intelligence Book Fixes (MarketReport.tsx)

### 2A. Table of Contents — Premium + Clickable

**Current:** TOC items are static `div.toc-item` elements. User wants them to be clickable arrows that navigate to the correct page.

**Fix:** Add `id` anchors to each page div (e.g., `id="page-2"`, `id="page-3"` etc.) and make TOC items into `<a href="#page-N">` links. Add a `→` arrow icon to each TOC row on the right side. Style the TOC title as clickable (gold hover underline).

CSS update: `.toc-item a { color: #1A1814; text-decoration: none; }` and `.toc-item a:hover { color: #A8925A; }`

Also make the TOC look more premium: add a subtle gold dot `◆` on the left of each item, increase font weight of section numbers, and add a gold connector line between title and page number (dotted leader line).

### 2B. Founder Toggle — Dynamic Title Change

**Current:** Page 4 always says "Why This Report Exists"

**Fix:** Change the page heading dynamically:
- `isFounderVisible === true` → "Why I Created This Book" (personal, founder's voice)  
- `isFounderVisible === false` → "Why We Created This Book" (company voice)

Also update the first paragraph to match: when founder visible, keep "I recognized..." When not visible, change to "We recognized..." and "my experience" → "our experience".

### 2C. Villa Photo Frame — Square, Rounded, Full-fit, AI-generated Look

**Current:** `villa-gallery img` uses `object-fit: contain` with `background: #F5EBD7` which shows borders/letterboxing. Images appear non-premium.

**Fix:**
- Change `object-fit: contain` → `object-fit: cover` for all villa images to fill the frame completely
- Change gallery images to **square frames** (`height: 175px; width: 175px` → but since they're in a 2-col grid, set `aspect-ratio: 1/1; width: 100%; height: auto;` or `height: 175px; object-fit: cover`)
- Add `border-radius: 16px` (more rounded, not just 12px)
- Switch `villaImages` array to use better luxury Dubai-specific photos with `&fit=crop&crop=center` Unsplash params
- Remove the black border: `border: 1px solid rgba(168,146,90,0.3)` → keep only the gold border, ensure no dark background shows

### 2D. Rental Yield Comparison Chart — Fix Readability

**Current (Page 10):** The "New York", "London", "Hong Kong" bars use `background: rgba(255,255,255,0.3)` with `color: #fff` for the bar values — on a white/champagne page this makes them invisible.

**Fix:** All bars use the gold gradient. The non-Dubai bars get a lighter gold (`rgba(168,146,90,0.4)`) with dark text (`color: #2C2A26`). Each bar fills to its full percentage with visible colored fill. Values are always readable.

### 2E. Due Diligence Checklist — Fill the Page Better

**Current (Page 15):** Uses `two-col` layout but content is sparse on the right. The left column has most content.

**Fix:** 
- Add a 3rd mini-section: "Professional Team You Need" with a checklist (RERA Broker, Property Lawyer, Mortgage Advisor, Snagging Inspector)
- Add a 4th section: "Red Flags to Avoid" with warning items
- This fills the full page width with content

### 2F. Developer & Area Statistics — Add Transaction Data

**Current (Page 13 - Developer Framework):** Lists developer tiers but no transaction volumes.

**Fix:** Add a table "Top 5 Developers by Transaction Volume (2026 YTD)" with hardcoded data:

| Developer | Transactions | Volume (AED) |
|---|---|---|
| Emaar Properties | 12,450+ | AED 28.4B |
| DAMAC Properties | 8,320+ | AED 15.7B |
| Nakheel | 5,890+ | AED 14.2B |
| Sobha Realty | 4,120+ | AED 11.9B |
| Ellington Properties | 2,870+ | AED 9.4B |

**For Page 8 (Top Areas):** Already has a top-10 table — add a "Volume (AED)" column using data from `liveTopAreas` (which has a `volume` field if available, or use estimated values).

### 2G. Market Outlook Year Recap

**Current (Page 16):** 2026 outlook exists. User wants a "2025 Recap" table alongside "2026 YTD" data.

**Fix:** Add a two-column stat comparison:

| Metric | 2025 Full Year | 2026 YTD |
|---|---|---|
| Value | AED 761B | liveYtd.value |
| Transactions | 226,000 | liveYtd.transactions |
| Growth | +36% | liveYtd.growth |
| Off-Plan Share | 59% | calculated |

### 2H. AI Property Matchmaker Page — Add CTA Button

**Current (Page 18):** Has QR code + URL link. User wants a direct CTA button.

**Fix:** Add a styled clickable button:
```html
<a href="https://JBJ.AE/quiz" style="display: inline-block; background: linear-gradient(135deg, #A8925A, #8a7648); color: #fff; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 16px auto; display: block; text-align: center; max-width: 280px;">
  Start AI Property Finder →
</a>
```

Also add a "Follow us / Stay in the Loop" social block on this page with Instagram, TikTok, YouTube links.

### 2I. Featured Projects — Square Cards

**Current (Page 22):** Uses `height: 110px` rectangular images.

**Fix:** Change all project card images to square aspect ratio:
```css
width: 100%; aspect-ratio: 1/1; object-fit: cover;
```
Remove the `height: 110px` fixed height.

### 2J. Premium Book Footer (End of Page 23)

**Current:** Page 23 ends with a simple copyright line.

**Fix:** Add a full-width premium book footer section at the bottom of page 23:
- Gold top border line
- JBJ monogram centered in large gold text
- "JBJ Global Real Estate" in spaced uppercase
- Three columns: Contact | Explore | Social
- Copyright line
- "Crafted in Dubai, UAE" tagline
- Full-width gold bottom gradient line

---

## Files Changed

| File | Changes |
|---|---|
| `src/components/stamp-generator/StampProjectWizard.tsx` | Add logo upload in Step 2, add `uploaded_logo_url` to form state + DB insert, add `UPLOADED_LOGO` option |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Fix AI panel (minimize, persistent suggestions, X prominence, emoji removal, Replace hint), gold default color, header content lift |
| `src/lib/stampTemplates.ts` | Add `bilingual-logo-center` template with English top arc / Arabic bottom arc / logo center design |
| `src/pages/MarketReport.tsx` | Fix TOC (clickable anchors + arrows), dynamic "Why I/We Created" title, villa photos (square + cover), rental yield chart (readability), checklist page (fill content), add developer transaction table, add 2025 vs 2026 recap table, AI matchmaker CTA button + social follow, project cards (square), premium book footer |

---

## What Does NOT Change

- The book exterior (dark cover page 1) — unchanged
- `MarketReportHeroBook.tsx` — unchanged
- All other pages/components — untouched
- The stamp export page
- The stamp preview modal
- Database schema (already has `uploaded_logo_url` column)
