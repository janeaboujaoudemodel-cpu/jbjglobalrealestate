

## Fix Developer Logo Boxes: Remove All Backgrounds Except Binghatti and Azizi

### Problem
Currently, 441 out of 538 developers have a `logo_bg_color` value set in the database, and the code defaults to white (`#FFFFFF`) for the remaining ones. This means EVERY developer logo shows a colored/white background box. The user only wants Binghatti and Azizi to have background boxes. All other logos should display directly with no visible box or border.

Additionally, the `p-0.5` padding on logo images creates a visible gap between the logo and its container edge, making the white/colored background peek through.

### Solution

#### 1. Database: Clear `logo_bg_color` for all developers except Binghatti and Azizi

```sql
-- Clear all developers' logo_bg_color
UPDATE developers SET logo_bg_color = NULL WHERE slug NOT IN ('binghatti', 'azizi');

-- Ensure Binghatti keeps its black background
-- (already set to rgb(0,0,0) - no change needed)

-- Set Azizi's background (currently NULL - needs to be set)
UPDATE developers SET logo_bg_color = 'rgb(0,0,0)' WHERE slug = 'azizi';
```

This leaves only 2 developers with a background color.

#### 2. Code: Change logo container to be transparent by default, remove padding

Update three files to:
- Change fallback from `'#FFFFFF'` to `'transparent'`
- Remove `p-0.5` padding so logos fill edge-to-edge
- Only show the rounded-lg shadow box styling when `logo_bg_color` is present

**Files to edit:**

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` (line 99) | Default `transparent`, remove `p-0.5`, only add shadow/rounded when bg color exists |
| `src/components/ProjectCard.tsx` (line 207) | Same treatment |
| `src/components/ReellyProjectCard.tsx` (line 161) | Same treatment |

For each file, the logo container changes from:
```tsx
<div
  className="w-14 h-14 rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
  style={{ backgroundColor: developer.logo_bg_color || '#FFFFFF' }}
>
  <img className="w-full h-full object-contain p-0.5" />
</div>
```

To:
```tsx
<div
  className={`w-14 h-14 overflow-hidden flex items-center justify-center ${
    developer.logo_bg_color ? 'rounded-lg shadow-lg' : ''
  }`}
  style={{ backgroundColor: developer.logo_bg_color || 'transparent' }}
>
  <img className="w-full h-full object-contain" />
</div>
```

This way:
- Binghatti and Azizi: black background box with rounded corners and shadow
- All other developers: logo displayed directly, no box, no white borders, no padding
