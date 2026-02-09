

# Fix Developer Merging Issue and Logo Styling

## Issue 1: "Ellington and RAK Properties" — Fake Merged Developer

A bad record exists in the `developers` table:
- **"Ellington and RAK Properties"** (id: `644b9c51-3f68-4669-aa65-2b8422395b44`, slug: `ellington-and-rak-properties`)

This is incorrect — Ellington Properties and RAK Properties are two separate developers. There is already a proper "Ellington Properties" record and a proper "RAK Properties" record in the database.

One project ("Porto Playa", id: `67c730a9`) references this merged developer. It needs to be reassigned to the correct developer before deleting the bad record.

### Database Fix (Migration)

1. Determine the correct developer for "Porto Playa" (likely RAK Properties, id: `692ec896`)
2. Update the project to point to the correct developer
3. Delete the fake "Ellington and RAK Properties" developer record

```sql
-- Reassign Porto Playa to RAK Properties
UPDATE projects 
SET developer_name = 'RAK Properties'
WHERE id = '67c730a9-f4e2-4d9c-944a-28a1a395ffa8';

-- Delete the fake merged developer
DELETE FROM developers 
WHERE id = '644b9c51-3f68-4669-aa65-2b8422395b44';
```

## Issue 2: Logo Styling — Remove White Frame, Edge-to-Edge Fill

The current logo container has:
- White background (`#FFFFFF`)
- Gold border (`2px solid hsl(42 45% 59%)`)
- Padding (`p-1.5`) creating visible white edges
- `object-contain` which leaves gaps for non-square logos

### Fix: Remove white frame, make logos fill edge-to-edge

In `DeveloperCard.tsx`, change the logo overlay to:
- Remove the white background
- Remove the gold border
- Remove padding from the image
- Use `object-cover` to fill the container completely (like Imtiaz does)
- Keep `rounded-lg` and `overflow-hidden` for clean edges

```
Before: white box with border + padding + object-contain
After: borderless container + no padding + object-cover (edge-to-edge fill)
```

This matches the "Imtiaz" style the user referenced — logo fills the entire card with no visible white borders or gaps.

## Files to Modify

| File | Change |
|---|---|
| Database migration | Delete fake developer, reassign project |
| `src/components/DeveloperCard.tsx` | Remove white bg, border, padding from logo container; use `object-cover` |

