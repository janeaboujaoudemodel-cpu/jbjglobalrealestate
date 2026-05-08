
# Stamp tool fixes for `/e-signature/create`

Three problems to solve, all scoped to the stamp field type. Signature/initials/text/date placement is not changed.

---

## 1. Stamp drops in the wrong spot when clicking on the page

When the user selects **Stamp** and clicks the document, the stamp should land centered exactly on the click point. Today it can land far from the cursor because:

- The default stamp box is **100 × 100 px**, but the click handler centers a field by subtracting half its width/height in *pixels* from a *percentage*-based coordinate against the rendered page width — when the page is narrow (sidebars open at 1112 px viewport), 100 px is a large slice of the page so the clamp `Math.max(0, Math.min(...))` snaps it to the edge.
- The pageRef element is sometimes still `auto`-sized for one paint after switching pages, so the first click after a page switch lands at the top-left.

Fix:

- In `DocumentFieldPlacer.tsx → handleOverlayClick`, compute the centering offset from the actual rendered page rect every time, and only clamp if the field would fall outside the page (don't auto-snap on the first paint).
- Wait for `pageSize` to be set before accepting clicks; if `pageSize` is null, ignore the click and toast "Loading page…".
- For the **Stamp** type specifically, default size becomes **120 × 120** but the placement math uses the live click rect, so it always lands centered on the cursor.

## 2. No way to upload, manage, edit, or delete stamps from the e-signature screen

Today the Stamp button only places a stamp if a saved one already exists in `brand_assets` or `stamp_designs`. There's no upload UI, no list, no delete, no rename. Brand Assets picker is generic and read-only for stamps.

Add a dedicated **Stamp Manager** dialog opened in two ways:

1. **Automatically** the first time the user clicks the **Stamp** field-type button when no saved stamp exists for them. After saving, the stamp loads and they can click to place.
2. **Manually** via a small "Manage Stamps" link next to the Stamp button in the toolbar (always available).

Stamp Manager features:

- Grid of saved stamps from `brand_assets WHERE asset_type='stamp'` (uses existing RLS).
- For each stamp: thumbnail, name, **Set as default**, **Rename**, **Delete**, and "Use this stamp" (loads it into the placer).
- **Upload new stamp** drop-zone that accepts:
  - PNG / JPG / WEBP (transparent background recommended) — converted to a `data:` URL stored as `thumbnail_url`.
  - SVG — sanitized via DOMPurify (per project SVG-Sanitization standard) and stored in `svg_content`.
- "Default stamp" flag stored in `brand_assets.metadata.is_default`. Default loads automatically into the placer on mount.

## 3. Auto-detect stamp slot

When the user clicks **Stamp** with a saved/default stamp loaded, also offer one-click **Auto-place stamp**:

- Calls existing `esign-auto-detect-fields` edge function with a stamp-only hint (`field_types: ["stamp"]`) to find seal/stamp anchors on the page (e.g. "Company Stamp", "Authorised Signatory", "Seal").
- If none found, places the stamp in the bottom-right of the current page near the signature line as a sensible default.

---

## Files touched

- `src/components/e-signature/DocumentFieldPlacer.tsx` — placement math fix, "Manage Stamps" toolbar button, gate Stamp click on having a saved stamp, hook up Stamp Manager dialog and Auto-place stamp.
- `src/components/e-signature/StampManagerDialog.tsx` — **new**: list, upload, rename, delete, set-default. Reuses `brand_assets` table.
- `src/components/e-signature/documentFieldTypes.ts` — bump stamp default to 120×120.
- `supabase/functions/esign-auto-detect-fields/index.ts` — accept optional `field_types` filter so we can request stamp-only detection. No schema change.

No DB migrations needed (`brand_assets` already has `metadata jsonb` for the `is_default` flag and proper RLS).

---

## Verification

After each fix, reload `/e-signature/create`, upload a PDF and:
1. Click **Stamp** with no saved stamps → Stamp Manager opens with empty state and upload dropzone.
2. Upload a PNG and an SVG → both appear in the grid; mark one as default → reload page → default loads automatically.
3. Click **Stamp** then click anywhere on the document → stamp lands centered exactly on the click point on pages 1, 3, and 6.
4. Click **Auto-place stamp** → stamp lands on a detected anchor or bottom-right fallback.
5. Rename and delete a stamp from the manager → grid updates immediately.
