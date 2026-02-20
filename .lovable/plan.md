
# Fix Stamp Arc Text + Add Monogram Asset Library Across All Corporate Suite Tools

## Issues Being Fixed

### Issue 1 — Stamp Live Preview: Arabic Text Too Small, Text Not Filling Circle

**Root cause in `LiveStampPreview.tsx`:**

The arc sweep is currently **160°** from -160° to 160°. This leaves visible gaps at the 9 o'clock and 3 o'clock positions (sides of the circle). The text visually looks cramped and small because the arc it travels on is too short.

The fix is to increase the sweep to **175°** (from -177.5° to 177.5°) so both English (top) and Arabic (bottom) arcs run nearly the full diameter of the circle, filling it horizontally. The font size budget is also adjusted upward since more arc length is now available.

**Also:** When `iconStyle === 'UPLOADED_LOGO'`, the image size `innerRx * 0.55` is only ~55% of the inner ring — which is the correct center zone. This part is fine. The visual impression of it being "small" is that the arc text is not framing it properly. Once the arcs fill the circle, the center logo will look correctly proportioned.

### Issue 2 — Business Card & All Tools: Missing Monogram/Logo Asset Panel

No tool currently has a place to upload, save, and reuse a monogram/logo. The `design_assets` table already exists in the database (`id, user_id, project_id, name, asset_type, file_url, thumbnail_url, metadata, created_at`) — it just isn't used anywhere in the Corporate Suite.

### Issue 3 — Arabic Text Direction in Bottom Arc

The bottom arc currently goes from 20° sweeping 160° clockwise. For Arabic RTL text on the bottom arc, the text appears **left-to-right along the arc** which reads incorrectly. Arabic text on the bottom arc needs to be rendered on a **reversed path** (counter-clockwise) so characters flow right-to-left as expected, centered at the bottom.

---

## What Will Be Built

### Part 1 — Fix Stamp Arc Text Coverage (`LiveStampPreview.tsx`)

**Change the arc parameters:**
- Top arc: start `-177.5°`, sweep `175°` (nearly full top semicircle)  
- Bottom arc: start `2.5°`, sweep `175°` (nearly full bottom semicircle)  
- Arc radius: keep `innerRx - 6` (text stays inside inner ring)  
- Font size cap: raise from `Math.min(10, ...)` to `Math.min(11, ...)` now that more arc length is available  
- Arabic bottom arc: use a **counter-clockwise** path so RTL text reads naturally

**Arabic RTL arc fix:** SVG `textPath` doesn't natively support RTL arc direction. The workaround is to define the bottom Arabic arc path in **reverse** (clockwise from 180° going backwards, or using a separate reversed arc) and use `startOffset="50%"` with `text-anchor="middle"`. This makes Arabic flow from right-to-left along the bottom curve as expected.

### Part 2 — Brand Asset Library (`BrandAssetLibrary.tsx` — New Shared Component)

A reusable panel component that all Corporate Suite tools can embed. It:

1. **Shows saved assets** from the `design_assets` table filtered by `asset_type` (`monogram`, `stamp`, `signature`, `logo`)
2. **Lets users upload** a new asset (image file → stored in Lovable Cloud storage → URL saved in `design_assets`)
3. **Insert/apply** an asset into the current tool's design with one click
4. **Resize handle** — a slider (50%–200%) to scale the applied monogram within the current preview
5. **Delete assets** from the library

**Asset types supported:**
- `monogram` — logo/monogram image
- `stamp` — saved stamp PNG
- `signature` — handwritten signature image
- `logo` — full company logo

**Storage:** Will use a `brand-assets` Lovable Cloud Storage bucket (public, read by owner only via RLS on `design_assets` table).

### Part 3 — Embed Brand Asset Library in Business Card Designer

Add a new "Brand Assets" collapsible section in the left panel of `BusinessCardDesigner.tsx` that:
- Opens the `BrandAssetLibrary` panel
- When a monogram is selected, it renders on the card preview in the `creative` template avatar spot and an overlay position on other templates
- Exposes a size slider (50px–150px) to control the logo size on the card
- Saves the selected asset URL to card data state

### Part 4 — Embed Brand Asset Library in CV/Resume, Cover Letter, Company Profile

Each tool gets the same "Brand Assets" panel (collapsible section in the sidebar) with:
- A logo/monogram picker from the library
- A size control
- The selected logo renders in the appropriate template location (top-left of CV header, letterhead of cover letter, cover page of company profile)

### Part 5 — Storage Bucket Creation (SQL Migration)

```sql
-- Create brand-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false);

-- RLS: Users can only see their own assets
CREATE POLICY "Users read own brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own brand assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own brand assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

The `design_assets` table already has RLS — just need to confirm policies exist (will verify and add if missing).

---

## Technical Architecture

### Files to Create:
```
src/components/corporate-suite/BrandAssetLibrary.tsx   ← New shared component
```

### Files to Edit:
```
src/components/stamp-generator/LiveStampPreview.tsx         ← Fix arc sweep + Arabic RTL arc
src/components/corporate-suite/BusinessCardDesigner.tsx     ← Add BrandAssetLibrary panel + logo on card
src/components/corporate-suite/CVResumeBuilder.tsx          ← Add BrandAssetLibrary panel + logo in header
src/components/corporate-suite/CoverLetterGenerator.tsx     ← Add BrandAssetLibrary panel + logo in letterhead
src/components/corporate-suite/CompanyProfileBuilder.tsx    ← Add BrandAssetLibrary panel + logo on cover
```

### Database:
- Create `brand-assets` storage bucket via SQL migration
- Add RLS policies on `design_assets` if missing (the table exists but has no confirmed policies)

---

## Execution Order

1. **SQL Migration** — Create storage bucket + RLS policies
2. **Fix `LiveStampPreview.tsx`** — Extend arcs to 175°, fix Arabic RTL direction
3. **Build `BrandAssetLibrary.tsx`** — Upload, save, list, delete, resize assets
4. **Embed in `BusinessCardDesigner.tsx`** — Logo panel + rendered on card
5. **Embed in `CVResumeBuilder.tsx`**, `CoverLetterGenerator.tsx`, `CompanyProfileBuilder.tsx`

---

## Key Design Decisions

- **No new table needed** — `design_assets` already exists with the perfect schema (`user_id`, `asset_type`, `file_url`, `name`)
- **Storage path convention**: `{user_id}/{asset_type}/{filename}` — enforces RLS automatically
- **Resize is client-side only** — the slider sets a CSS `transform: scale()` or inline `width/height` on the logo element in preview; the actual asset URL is stored
- **Arabic arc fix approach**: Define a second arc path going counter-clockwise (sweeping negative degrees) for Arabic text so it reads right-to-left naturally along the bottom curve
