

## Plan: Availability Auto-Hide, Stamp UI Premium Upgrade, Sitemap Update, Cross-Tool Integration, Brand Palette Enhancements

This plan covers 5 areas across 3 phases. Phase 1 ships first.

---

### Phase 1: Availability Auto-Hide + Brand Palette Fixes

#### 1A. Availability Auto-Hide (Database + UI)

**Current state:** No `availability_visible` column exists on `projects`. Unit counts are shown on property detail pages.

**Changes:**
- **Migration:** Add `availability_visible boolean DEFAULT false` to `projects` table
- **Property detail pages:** Hide availability/unit-count sections when `availability_visible = false`
- **Listing Admin:** Add a toggle switch per project to set `availability_visible`
- **Developer Portal uploads:** Auto-set `availability_visible = false` on insert

**Files:** DB migration, `ProjectDetailLayout.tsx`, listing admin components

#### 1B. Brand Palette — Already Public, Fix UI Details

**Current state:** Route is already public at `/brand-palette` (no OwnerGuard). Hex codes already hidden from non-owners (line 235 checks `isOwner`). Color swatch already uses `rounded-2xl` and has a `CircleDot` wheel icon.

**Remaining fixes:**
- The `input type="color"` native picker is limited — no actual color wheel UI. Add a visual color wheel icon/button that is more obvious (larger, with tooltip "Click to change color")
- Ensure the default palette displayed matches the real JBJ website colors (already correct: `#C8A766, #000000, #D4AF37, #FDFBF7, #1A1A1A`)
- In AI tools (stamp, e-sign, business card), owner sees brand palette colors in color pickers; non-owners see generic palette only — add `isOwner` check in tool color picker sections

**Files:** `BrandPaletteHub.tsx` (wheel UX), stamp/e-sign/business card color picker components

---

### Phase 2: Stamp Generator + All Tools Premium UI Upgrade

#### 2A. Stamp Generator Landing Page

**Current state:** `StampGeneratorPage.tsx` (landing) uses `bg-white` — not matching the champagne gradient theme.

**Changes:**
- Replace `bg-white` with champagne gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`)
- Add gold-bordered cards (`border-2 border-gold/40`)
- Default to "Ink Blue" standard (already first in `PALETTE_PRESETS` — verify it auto-selects)
- Premium typography with Poppins font references

#### 2B. Stamp Generator Main + Wizard

**Current state:** `StampGeneratorPage.tsx` (main, 1312 lines) and `StampProjectWizard.tsx` (839 lines) — need champagne gradient backgrounds, gold card borders, centered preview.

**Changes:**
- Background: champagne gradient on outer container
- Cards: `border-2 border-gold/40 rounded-xl` with `bg-gradient-to-br from-[#FDFBF7]/95 to-[#EDE4D3]/80`
- Preview section: centered with `mx-auto` and prominent border
- SVG sanitization already in place via DOMPurify in `StampSVGRenderer.tsx` — verify encryption of stamp data in sessionStorage (add `btoa()` wrapper)

#### 2C. Other Tools Premium UI Pass

Apply the same champagne gradient + gold border treatment to:
- Business Card Designer (`/toolkit/corporate-suite/business-card`)
- Logo Creator (`/toolkit/corporate-suite/logo-creator`)
- Cover Letter Generator (`/toolkit/corporate-suite/cover-letter`)
- E-Signature pages (`/e-signature/*`)
- Contract Reviewer (`/ai-contract-reviewer`)
- QR Code Generator (if exists as standalone)

**Approach:** Each tool's outer container gets the champagne gradient background and gold-bordered card wrappers. Preview sections stay centered. No layout changes.

#### 2D. Cross-Tool Integration in Scan & Sign

**Current state:** `ScanSignPage.tsx` saves to localStorage. No import buttons for stamps/cards/QR.

**Changes:**
- Add "Import Stamp" button — reads from `sessionStorage` key used by stamp generator
- Add "Import Business Card" button — reads from business card session data
- Add "Import QR Code" button — reads from QR generator session data
- Each inserts the asset as a new page/overlay in the Scan & Sign workflow
- Buttons styled as gold-bordered compact actions in the toolbar

**Files:** `src/pages/toolkit/ScanSignPage.tsx`

---

### Phase 3: Sitemap Update

Add missing tools/features to the `hubSections` in `Sitemap.tsx`:

**Tools section — add:**
- `{ href: "/brand-palette", label: "Brand Color Palette" }`
- `{ href: "/toolkit/scan-sign", label: "Scan & Sign" }`
- `{ href: "/toolkit/stamp-generator", label: "AI Stamp Generator" }`
- `{ href: "/toolkit/corporate-suite/business-card", label: "Business Card Designer" }`
- `{ href: "/toolkit/corporate-suite/logo-creator", label: "Logo Creator" }`
- `{ href: "/toolkit/corporate-suite/cover-letter", label: "Cover Letter Generator" }`
- `{ href: "/toolkit/corporate-suite/cv-resume", label: "CV & Resume Builder" }`
- `{ href: "/toolkit/corporate-suite/company-profile", label: "Company Profile Builder" }`
- `{ href: "/e-signature", label: "E-Signature" }`
- `{ href: "/ai-contract-reviewer", label: "AI Contract Reviewer" }`
- `{ href: "/toolkit/pdf-suite", label: "PDF Suite" }`
- `{ href: "/toolkit/video-suite", label: "Video Suite" }`
- `{ href: "/toolkit/voice-suite", label: "Voice Suite" }`
- `{ href: "/toolkit/photo-suite", label: "Photo Suite" }`
- `{ href: "/toolkit/background-ai", label: "AI Background Remover" }`
- `{ href: "/toolkit/beauty-filters", label: "Beauty Filters" }`
- `{ href: "/resale-properties", label: "Resale Properties" }`
- `{ href: "/presentations", label: "Presentations" }`

**Files:** `src/pages/Sitemap.tsx`

---

### Summary

| # | Area | Key Files |
|---|------|-----------|
| 1A | Availability auto-hide | DB migration, `ProjectDetailLayout.tsx`, listing admin |
| 1B | Brand palette UX polish | `BrandPaletteHub.tsx`, tool color pickers |
| 2A-C | Premium UI for all tools | Stamp landing/main/wizard, business card, logo, cover letter, e-sign, contract reviewer |
| 2D | Cross-tool integration | `ScanSignPage.tsx` |
| 3 | Sitemap update | `Sitemap.tsx` |

