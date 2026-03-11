

## Plan: Brand Palette for All Users, Availability Auto-Hide, Stamp/Tools UI Premium Upgrade, Sitemap Update, and Cross-Tool Integration

This is a large request spanning 6 distinct areas. To avoid quality issues, I recommend implementing in **3 phases**. This plan covers all phases but Phase 1 will be implemented first.

---

### Phase 1: Brand Palette → Public + Per-User Personalization + UI Fixes

**Problem:** Brand Palette is owner-only (`OwnerGuard`), live preview doesn't work properly, color swatches are square inside rounded cards, hex codes are visible to all, no color wheel, no saved palette history, no per-user personalization.

**Changes:**

#### 1A. Database: `user_color_palettes` table
```sql
CREATE TABLE public.user_color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Custom Palette',
  palette jsonb NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
-- RLS: users CRUD their own palettes only
```

#### 1B. Remove `OwnerGuard` from brand palette route
Move `/owner/brand-palette` → `/brand-palette` as a public authenticated route. Owner sees full hex codes + corporate palette management. Regular users see:
- Color wheel pickers (no hex codes visible)
- Visual labels ("Primary — buttons, links", etc.) with live example previews
- Apply to "Website" or "Tools only" toggle
- Save/Revert/History of their personal palettes
- Palettes saved per-user in `user_color_palettes`

#### 1C. Fix UI issues
- Match color swatch shape to card container (use `rounded-2xl` on swatches to match card radius)
- Add a clickable color wheel icon next to each swatch for users who don't know to click the square
- Fix live preview: make `isPreviewing` default to `true` so changes reflect immediately
- Show accurate JBJ website palette as defaults: `primary: #C8A766, secondary: #000000, accent: #D4AF37, background: #FDFBF7, text: #1A1A1A`

#### 1D. BrandPaletteContext updates
- Load user's active personal palette from `user_color_palettes` for non-owners
- Owner's palette comes from `app_settings` (unchanged)
- `applyPaletteToDOM()` already works — just needs to trigger on page load for per-user palettes

**Files:**
| File | Action |
|------|--------|
| Database migration | Create `user_color_palettes` |
| `src/routes/AdminRoutes.tsx` | Move palette route from OwnerGuard to authenticated |
| `src/pages/owner/BrandPaletteHub.tsx` | Major refactor: dual-mode (owner vs user), color wheels, no hex for users, palette history, shape fixes |
| `src/contexts/BrandPaletteContext.tsx` | Load per-user palette, add `saveUserPalette`, `getUserPaletteHistory`, `revertToDefault` |
| `src/components/navigation/GlobalVerticalNav.tsx` | Update nav link path |

---

### Phase 2: Availability Auto-Hide + Stamp Generator Premium UI

**Problem:** Property availability/unit counts are visible to investors (discourages urgency). Stamp generator UI needs premium upgrade.

#### 2A. Availability auto-hide
- Add `availability_visible` boolean column to `projects` table (default `false`)
- All public-facing property pages: hide availability/unit count data when `availability_visible = false`
- Owner can toggle visibility per-project from Listing Admin
- Developer Portal uploads auto-set `availability_visible = false`

#### 2B. Stamp Generator premium UI overhaul
- Apply champagne gradient theme consistently (matching Royal Tools Hub)
- Default to "Ink Blue" standard with the two canonical company stamp designs
- Gold-bordered cards, premium typography, centered preview
- Upgrade security: sanitize all SVG inputs, encrypt stamp data in session storage

**Files:** `projects` migration, Listing Admin toggle, property detail pages, `StampGeneratorPage.tsx`, `StampProjectWizard.tsx`, related stamp components

---

### Phase 3: Sitemap Update, Cross-Tool Integration, Security Hardening

#### 3A. Sitemap
Add missing tool links: Brand Palette, Scan & Sign, all new features added recently.

#### 3B. Cross-tool integration
- Scan & Sign: add "Import Stamp", "Import Business Card", "Import QR Code" buttons that pull from session storage
- E-Signature: already has stamp integration — verify QR code and business card import paths
- All tools: ensure owner sees their brand palette colors in color pickers; non-owners see generic palette

#### 3C. Global security
- RLS audit across new tables
- Edge function JWT hardening review
- DOM obfuscation layer verification

**Files:** `Sitemap.tsx`, `ScanSignPage.tsx`, `CreateEnvelope.tsx`, tool color pickers, edge functions

---

### Implementation Priority
**Phase 1 first** (Brand Palette) — directly addresses the page user is currently viewing and the most detailed feedback. Phases 2 and 3 follow in subsequent messages.

