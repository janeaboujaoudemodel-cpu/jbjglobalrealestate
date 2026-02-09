

# Interior Design Forms & AdminLeads UI Fixes

## Summary

Based on file analysis, I've identified the specific fixes needed for the remaining interior design files and the AdminLeads page. The interior design files (ConceptRenderForm, PhotoRedesignForm, VirtualStagingForm) use button-based selection cards (no dropdowns), so they're already properly styled. The `AdminLeads.tsx` file has the actual dropdown issue that needs fixing.

---

## Files Analysis

### Interior Design Files (3 files)

| File | Status | Details |
|------|--------|---------|
| `ConceptRenderForm.tsx` | Clean | Uses button-based selection cards, no Select components |
| `PhotoRedesignForm.tsx` | Clean | Uses button-based selection cards, no Select components |
| `VirtualStagingForm.tsx` | Clean | Uses button-based selection cards, no Select components |

These files are already properly styled with:
- Proper dark backgrounds (`bg-zinc-900/60`, `bg-zinc-800/50`)
- Proper text colors (`text-white`, `text-zinc-300`, `text-zinc-400`)
- Mode-specific accent colors (fuchsia, blue, emerald)
- No dropdown issues to fix

### AdminLeads.tsx - Needs Fixes

This file has **3 Select dropdowns** that need migration to dark variants:

1. **Status Filter** (lines 473-507)
2. **Source Type Filter** (lines 512-530) 
3. **Specific Source Filter** (lines 533-562)

Current pattern:
```tsx
<SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
<SelectContent className="bg-zinc-900 border-zinc-700">
  <SelectItem value="all">All Statuses</SelectItem>
```

Required pattern:
```tsx
<SelectTriggerDark>
<SelectContentDark>
  <SelectItemDark value="all">All Statuses</SelectItemDark>
```

---

## Implementation

### File: `src/pages/AdminLeads.tsx`

**Change 1: Update Imports (line 8)**

Replace:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

With:
```tsx
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
```

**Change 2: Status Filter (lines 473-507)**

Replace `SelectTrigger`, `SelectContent`, `SelectItem` with dark variants:
- `SelectTriggerDark` - removes inline className overrides
- `SelectContentDark` - ensures white text on dark background
- `SelectItemDark` - ensures proper hover/selected states

**Change 3: Source Type Filter (lines 512-530)**

Same dark variant migration.

**Change 4: Specific Source Filter (lines 533-562)**

Same dark variant migration.

---

## Changes Summary

| File | Lines Changed | Type |
|------|--------------|------|
| `src/pages/AdminLeads.tsx` | ~100 lines | Update Select components to dark variants |

---

## No Changes Needed

The interior design files don't need any changes because they use button-based UI for selections rather than dropdown Select components. They're already correctly styled.

---

## Acceptance Criteria

1. AdminLeads page dropdowns show white text on dark background
2. Dropdown items are clearly visible with proper contrast
3. Hover and selected states work correctly
4. No inline className overrides on Select components
5. Interior design forms remain unchanged (already correct)

