

# Fix Vertical Text in Nearby Projects Map

## Root Cause

The global CSS rule in `src/index.css` line 1886:
```css
.leaflet-popup-content {
  width: auto !important;
}
```

This overrides Leaflet's default inline `width: 200px` on popup content. This was added to support edge-to-edge images in the main property map popups (which have explicit `min-w-[220px]` containers). But the Nearby Projects map popup contains only a bare `<Link>` with no width container — so the content collapses to single-character width, stacking text vertically.

The AreaMapSection popups are unaffected because they wrap content in `<div className="min-w-[220px] max-w-[260px]">`.

## Fix

### 1. `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` — Add width container to popups

Wrap both popup contents (red current-project marker and gold nearby markers) in a container with explicit min-width:

**Current project popup (line 132-135):**
```tsx
<Popup>
  <div className="min-w-[180px] max-w-[260px] p-3">
    <div className="text-sm font-bold">{currentProjectName}</div>
    <div className="text-xs text-muted-foreground">{t('map.thisProject')}</div>
  </div>
</Popup>
```

**Nearby project popup (line 141-144):**
```tsx
<Popup>
  <div className="min-w-[200px] max-w-[280px] p-3">
    {p.cover_image_url && (
      <img src={p.cover_image_url} alt={p.name} className="w-full h-24 object-cover -mx-3 -mt-3 mb-2" style={{width: 'calc(100% + 24px)'}} />
    )}
    <Link to={`/project/${p.slug}`} className="text-sm font-semibold text-blue-600 hover:underline block">
      {p.name}
    </Link>
    {p.price_from && (
      <p className="text-xs font-semibold text-amber-700 mt-1">
        From AED {Math.round(Number(p.price_from)).toLocaleString()}
      </p>
    )}
  </div>
</Popup>
```

This matches the pattern used in `AreaMapSection.tsx` where popups work correctly.

### 2. Global audit — no other vertical text issues

The `width: auto !important` only affects `.leaflet-popup-content`. All other map popup usages (AreaMapSection, PropertiesMapView) already have explicit width containers or don't use Leaflet popups at all (PropertyMap uses custom cards). No other components are affected.

## Files to modify
- `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` — add width containers to popup content

