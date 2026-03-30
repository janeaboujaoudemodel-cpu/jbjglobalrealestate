

# Fix Nearby Map Popup Image + Close Button + Audit

## 1. Image Not Full Width — Root Cause & Fix

**File: `src/components/project-detail/ProjectNearbyPropertiesMap.tsx`**

The popup content div has `p-3` padding, and the image uses `-mx-3 -mt-3` with `width: calc(100% + 24px)` to compensate. This negative-margin hack is fragile and doesn't achieve true edge-to-edge because the global CSS already strips Leaflet popup padding (`margin: 0 !important; padding: 0 !important` in index.css lines 1883-1887).

**Fix**: Remove `p-3` from the outer wrapper and restructure so the image sits at the top with no padding, and only the text content below gets padding:

```tsx
<Popup>
  <div className="min-w-[200px] max-w-[280px]">
    {p.cover_image_url && (
      <img src={p.cover_image_url} alt={p.name} 
           className="w-full h-24 object-cover" loading="lazy" />
    )}
    <div className="p-3">
      <Link to={`/project/${p.slug}`} 
            className="text-sm font-semibold text-blue-600 hover:underline block">
        {p.name}
      </Link>
      {p.price_from && (
        <p className="text-xs font-semibold text-amber-700 mt-1">
          From AED {Math.round(Number(p.price_from)).toLocaleString()}
        </p>
      )}
    </div>
  </div>
</Popup>
```

Same pattern for the current project marker (remove `p-3` from wrapper, add it to a text-only inner div).

## 2. Close (X) Button — Leaflet Default

Leaflet popups have a built-in close button. The global CSS in index.css does NOT hide it, so it should render. However, the `border-radius: 12px !important` + `overflow: hidden` on `.leaflet-popup-content-wrapper` may clip it since the close button sits outside the content wrapper in Leaflet's DOM.

**Fix**: Add CSS to ensure the Leaflet close button is visible and properly styled:

```css
/* index.css — after existing leaflet popup rules */
.leaflet-popup-close-button {
  z-index: 10 !important;
  color: #333 !important;
  font-size: 20px !important;
  padding: 4px 8px !important;
}
```

## 3. Main Map Card X Button (PropertyMap.tsx)

Already implemented at line 413-417 with `absolute top-2 right-2 z-10`. This is correct. No change needed.

## 4. Global Audit Results

### Maps
- **PropertyMap.tsx**: Uses custom hover/click cards (no Leaflet popups). X button present on click card. Image is full-width via `w-full h-full object-cover rounded-t-lg`. ✅
- **ProjectNearbyPropertiesMap.tsx**: Uses Leaflet popups. Image not full-width (the bug). Fix above. Close via Leaflet's built-in X.
- **AreaMapSection.tsx**: Uses Leaflet popups with `min-w-[220px]` wrapper. Same padding structure — needs same image fix pattern if images are used.

### Cards (UI components)
- `Card` component: consistent `rounded-lg border` pattern. ✅
- All cards use `CardContent p-0` for image cards and add padding to text sections. ✅
- List/Grid panel cards in PropertyMap (lines 488-524): consistent image + text layout. ✅

### No other issues found
- No vertical text issues elsewhere (the prior fix resolved that)
- Z-index system is standardized via `src/config/z-index.ts`
- No overflow clipping issues in other components
- Sidebar, header, modals all use consistent layering

## Files to modify

| File | Change |
|------|--------|
| `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` | Restructure popup content: image outside padding wrapper, text inside padded div |
| `src/index.css` | Add `.leaflet-popup-close-button` styling for visibility |

