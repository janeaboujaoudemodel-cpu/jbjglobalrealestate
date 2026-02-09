
# Fix Developer Logos, Clean Duplicates, and Fix All Maps

## Issues Confirmed

### 1. Logo White Borders
All three logo containers use `object-contain` which preserves aspect ratio but leaves white gaps on the sides for rectangular logos. The user wants logos to FILL the container completely with NO white borders visible.

**Solution**: Change `object-contain` to `object-cover` on all logo images. This stretches/crops to fill the container completely, eliminating white gaps. Since logos are already roughly the right proportion, minimal cropping will occur, but the white borders will be gone.

### 2. Duplicate/Merged Developers Still in Database
The audit found these problematic entries that need deletion (0 projects, safe to remove):

| Developer to DELETE | Reason | Projects |
|---|---|---|
| Ellington and RAK Properties | Fake merged entry -- both exist separately | 0 |
| Imtiaz Development | Duplicate of "Imtiaz Developments" (36 projects) | 0 |
| Al Hamra Construction and Development | Duplicate of "Al Hamra" (8 projects) | 0 |
| East and West International Group | Subset of "Adventz and East and West" (3 projects) | 0 |
| Meraki Developers | Duplicate of "Meraki" (4 projects) | 0 |
| Nshama Group | Duplicate of "Nshama" (33 projects) | 0 |
| Kappa Acca Real Estate Development | Subset of merged Khamas+Kappa entry (2 projects) | 0 |

### 3. Map Scroll Zoom -- Still Broken in 2 of 3 Maps
`ProjectLocationMap.tsx` was fixed (`scrollWheelZoom={false}`), but TWO other maps still have scroll zoom enabled:
- `DeveloperProjectsMap.tsx` line 127: `scrollWheelZoom: true`
- `PropertyMap.tsx` line 449-454: No `scrollWheelZoom` prop (defaults to `true`)

All maps need `scrollWheelZoom: false` and visible zoom/navigation controls.

## Plan

### Step 1: Fix Logo Styling -- `object-cover` to Fill Container (3 files)

| File | Line | Change |
|---|---|---|
| `src/components/DeveloperCard.tsx` | 97 | `object-contain` to `object-cover` |
| `src/pages/DeveloperDetail.tsx` | 160 | `object-contain` to `object-cover` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | 68 | `object-contain` to `object-cover` |

### Step 2: Delete 7 Duplicate/Fake Developer Entries (Database)

```sql
DELETE FROM developers WHERE id IN (
  '6bf5f4aa-46e6-41bd-8870-163e5b428e43',  -- Ellington and RAK Properties
  'a9e195b7-7e10-48ff-af92-427b05879647',  -- Imtiaz Development
  '297d620d-7944-4890-a26f-8644f9f579c6',  -- Al Hamra Construction and Development
  '447f3a4e-858b-468b-8a52-2f3d165b1630',  -- East and West International Group
  'fbdcdb92-3671-4a8b-a048-f25d4019a314',  -- Meraki Developers
  '874bac24-85a9-490b-b525-3e29edc3e31c',  -- Nshama Group
  '8635effb-1671-4e0e-afd7-000039569601'   -- Kappa Acca Real Estate Development
);
```

All 7 have 0 projects so no data will be lost.

### Step 3: Fix Map Scroll in DeveloperProjectsMap.tsx

Change line 127 from `scrollWheelZoom: true` to `scrollWheelZoom: false`. The map already has zoom controls via buttons.

### Step 4: Fix Map Scroll in PropertyMap.tsx

Add `scrollWheelZoom={false}` and `zoomControl={true}` to the MapContainer props (lines 449-454). The PropertyMap is the full-page map view and currently has no explicit scroll zoom setting (defaults to true).

## Files to Modify

| File | Change |
|---|---|
| `src/components/DeveloperCard.tsx` | Logo: `object-cover` |
| `src/pages/DeveloperDetail.tsx` | Logo: `object-cover` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo: `object-cover` |
| `src/components/developer/DeveloperProjectsMap.tsx` | `scrollWheelZoom: false` |
| `src/pages/PropertyMap.tsx` | `scrollWheelZoom={false}` |
| Database | Delete 7 duplicate developer entries |
