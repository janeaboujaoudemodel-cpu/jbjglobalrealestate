

# Session 9 — Stamp Integration into Other Brand Tools

## Current State Analysis

### Business Card Designer
- `BusinessCardRightPanel.tsx` line 298: `BrandAssetLibrary` only accepts `assetTypes={["monogram", "logo", "signature"]}` — **stamps are excluded**.
- No dedicated stamp overlay layer exists. The only overlay is `logoUrl` which renders as a single `<img>` at `logoPos` with `logoSize`.
- Card background color is driven by `frontPrimary`/`backPrimary` from `COLOR_PRESETS`. If a stamp SVG with embedded background fill (e.g., the outer circle of a blue stamp) is inserted as the "logo", the stamp's own blue fill visually dominates the card — this is the "card turns blue" bug. The fix: render stamps with transparent backgrounds and on a guaranteed white/neutral card surface.

### Cover Letter / Letterhead
- `DocumentStampIntegration.tsx` loads stamps from `sessionStorage("jbj_stamp_preview")` — volatile and fragile. Should load from `brand_assets` DB.
- `CoverLetterPreview.tsx` renders stamp at fixed `height: 60px` with `opacity: 0.85`. This works but the stamp section in `DocumentStampIntegration` doesn't offer loading from `brand_assets` table.
- `LogoMockups.tsx` (Letterhead Preview in Logo Creator) has NO stamp placement at all.

### Brand Asset Library
- `BrandAssetLibrary.tsx` already queries both `design_assets` and `brand_assets` tables and merges results. It supports `stamp` as an `AssetType`. The integration plumbing exists but is not wired into the business card or letterhead tools.

## Implementation Plan

### 1. Add Stamp Support to Business Card Designer

**`BusinessCardRightPanel.tsx`**:
- Add a new "Stamp" collapsible section below Brand Assets, with its own `BrandAssetLibrary` filtered to `assetTypes={["stamp"]}`.
- New props: `stampUrl`, `setStampUrl`, `stampSize`, `setStampSize`, `stampOpen`, `setStampOpen`.
- Stamp renders as a separate overlay (not reusing logoUrl) so it's independently positionable.

**`BusinessCardPreview.tsx` / `CardCanvas`**:
- Add `stampUrl`, `stampSize`, `stampPos` props.
- Render stamp overlay similar to logo overlay but:
  - Apply `mix-blend-mode: multiply` to simulate ink impression on card surface.
  - Ensure stamp renders on white/transparent background regardless of card color.
  - Position stamp typically at bottom-right corner (default `{ x: 70, y: 65 }`) for professional placement.

**`useBusinessCardState.ts`**:
- Add `stampUrl`, `stampSize`, `stampPos`, `stampOpen` state variables.
- Add localStorage persistence for stamp settings.

**Background Rule (TASK 2)**:
- When a stamp is present (`stampUrl` is set), the CardFace component will NOT change the card background. The stamp overlay uses `mix-blend-mode: multiply` which naturally works on light backgrounds. Add a note in the UI: "Stamp works best on white or light backgrounds."

### 2. Connect DocumentStampIntegration to Brand Assets DB

**`DocumentStampIntegration.tsx`**:
- Replace `sessionStorage.getItem("jbj_stamp_preview")` with a "Load from Brand Library" button that opens `BrandAssetPicker` filtered to `filterType="stamp"`.
- Keep the manual upload option.
- When a brand asset stamp is selected, convert its `svg_content` to a data URI and set it as `stampUrl`.

### 3. Add Stamp to Letterhead Preview (LogoMockups)

**`LogoMockups.tsx`**:
- Add optional `stampSvg?: string` prop to `LetterheadPreview`.
- Render stamp in the footer area of the letterhead at a professional scale (24px height), positioned after the footer text, with `opacity: 0.8`.
- The parent `LogoMockups` component receives an optional `stamp` prop from the Logo Creator page (which can load it from brand assets).

### 4. Preview Consistency (TASK 4)

- All tools render stamps using the same approach: the stamp SVG as a data URI `<img>` with `object-fit: contain`, `mix-blend-mode: multiply`, and consistent sizing relative to the container.
- Create a shared `StampOverlay` utility component that standardizes rendering:
  ```tsx
  function StampOverlay({ src, size, className }: { src: string; size: number; className?: string }) {
    return <img src={src} style={{ width: size, height: size, objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.85 }} />;
  }
  ```

## Files Modified

| File | Changes |
|------|---------|
| `BusinessCardRightPanel.tsx` | Add Stamp collapsible section with `BrandAssetLibrary` filtered to stamps |
| `BusinessCardPreview.tsx` | Add stamp overlay layer with `mix-blend-mode: multiply` and independent positioning |
| `BusinessCardDesigner.tsx` | Pass new stamp props through component tree |
| `useBusinessCardState.ts` | Add stampUrl, stampSize, stampPos, stampOpen state |
| `businessCardTypes.ts` | Add stamp position defaults |
| `DocumentStampIntegration.tsx` | Replace sessionStorage with BrandAssetPicker DB loading |
| `LogoMockups.tsx` | Add optional stamp placement to LetterheadPreview |

## What Will NOT Change
- StampGeneratorPage, StampLeftPanel, StampRightPanel
- stampOfficialTemplate.ts
- StampExportPage
- Database schema (existing `brand_assets` table already supports stamps)
- Edge functions

