

## Dropdown Z-Index Global Fix - Implementation Plan

### Problem Summary
Dropdowns and select menus inside Dialogs, Sheets, and other modal components are appearing **behind** the modal instead of on top. This happens because:

- **Dialog** has `z-[10050]`
- **Sheet** has `z-[9500]`  
- **Select/Popover/DropdownMenu** have `z-50` or `z-[60]`

When a Select is inside a Dialog, its portal renders at `z-[60]` which is much lower than the Dialog's `z-[10050]`, causing it to appear behind.

---

### Solution Strategy

Raise the z-index of all Radix UI portal components to `z-[10100]` - which is **above** the highest modal layer (Dialog at `z-[10050]`). This ensures dropdowns always appear on top regardless of their parent container.

---

### Files to Modify

| File | Component | Current | New |
|------|-----------|---------|-----|
| `src/components/ui/select.tsx` | SelectContent | `z-[60]` | `z-[10100]` |
| `src/components/ui/popover.tsx` | PopoverContent | `z-50` | `z-[10100]` |
| `src/components/ui/tooltip.tsx` | TooltipContent | `z-50` | `z-[10100]` |
| `src/components/ui/context-menu.tsx` | ContextMenuContent, ContextMenuSubContent | `z-50` | `z-[10100]` |
| `src/components/ui/hover-card.tsx` | HoverCardContent | `z-50` | `z-[10100]` |
| `src/components/ui/menubar.tsx` | MenubarContent, MenubarSubContent | `z-50` | `z-[10100]` |
| `src/components/ui/alert-dialog.tsx` | AlertDialogOverlay, AlertDialogContent | `z-50` | `z-[10100]` |
| `src/components/ui/drawer.tsx` | DrawerOverlay, DrawerContent | `z-50` | `z-[10100]` |

---

### Technical Details

**File: `src/components/ui/select.tsx`**
Line 69: Change `z-[60]` to `z-[10100]`

**File: `src/components/ui/popover.tsx`**  
Line 20: Change `z-50` to `z-[10100]`

**File: `src/components/ui/tooltip.tsx`**
Line 20: Change `z-50` to `z-[10100]`

**File: `src/components/ui/context-menu.tsx`**
Lines 47 and 63: Change `z-50` to `z-[10100]`

**File: `src/components/ui/hover-card.tsx`**
Line 19: Change `z-50` to `z-[10100]`

**File: `src/components/ui/menubar.tsx`**
Lines 72 and 91: Change `z-50` to `z-[10100]`

**File: `src/components/ui/alert-dialog.tsx`**
Lines 19 and 37: Change `z-50` to `z-[10100]`

**File: `src/components/ui/drawer.tsx`**
Lines 21 and 34: Change `z-50` to `z-[10100]`

---

### Z-Index Hierarchy After Fix

```
z-[11000] - Sonner (toasts) - highest priority
z-[10100] - Dropdown/Select/Popover portals - above modals
z-[10050] - Dialog/Modal content and overlay
z-[10000] - DropdownMenu (already set correctly)
z-[9500]  - Sheet overlay
z-[9501]  - Sheet content
z-[9999]  - Mega menu
```

This ensures:
1. Dropdowns inside modals appear correctly
2. Toasts still appear above everything
3. All interactive popovers work regardless of their container

---

### Affected Screens After Fix

This will fix dropdown issues in:
- Support Ticket form (Dialog with Select)
- All AI Tools with dropdown filters
- Any form inside a Sheet or Dialog
- Property filters in modals
- CRM forms with select fields
- Profile settings with dropdowns
- All other modal-based forms across the application

---

### Testing Checklist

1. Open Support Ticket dialog and click "Select Service" - dropdown should appear on top
2. Click Priority dropdown - should appear on top
3. Test AI Tools dropdowns (Translation Hub, Video Tour Script, etc.)
4. Test any Sheet with Select components
5. Verify tooltips appear correctly inside modals
6. Verify toasts still appear above everything

