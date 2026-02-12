

## Fix Plan: Advanced Filter as Centered Dialog + Developer List with Logos + Location Cleanup

### 1. Convert Advanced Filter from Side Sheet to Centered Dialog

**Problem:** Currently uses `<Sheet>` (slides from right, attached to header edge). User wants a centered pop-up modal like Reelly, not cropped at edges.

**File: `src/components/filters/AdvancedFilterPanel.tsx`**
- Replace `<Sheet>` / `<SheetContent>` with `<Dialog>` / `<DialogContent>`
- Use a custom-sized dialog: `max-w-2xl w-[calc(100vw-3rem)] max-h-[calc(100dvh-4rem)]` to ensure no cropping on any edge
- Keep the champagne gradient background and all internal sections
- The dialog will be centered on screen with proper padding from all edges

### 2. Replace "By Company" with "By Developer" -- Full List with Logos + Checkboxes

**Problem:** Current developer section shows tiny pill buttons with just text. User wants it to look like the header's developer dropdown: a scrollable list with checkboxes and developer logos.

**File: `src/components/filters/AdvancedFilterPanel.tsx`**
- Rename section title from "By Company" to "By Developer"
- Fetch developers from the `developers` table (which has `name`, `logo_url`) instead of distinct `developer_name` from `projects`
- Replace the pill-button layout with a vertical scrollable list
- Each row: `[ Checkbox ] [ Logo (24x24, rounded, object-contain, bg-white) ] [ Developer Name ]`
- Keep the search input at top to filter the list
- Multi-select via checkboxes (clicking toggles the developer in/out of `localFilters.developers`)
- Style matching the header dropdown: champagne background, gold border checkboxes, developer logo in a small white box

### 3. Location Filter -- Remove International, Keep UAE Only

**Problem:** The Location section in the advanced filter shows Indonesia, Oman, Thailand, Cyprus. User wants only UAE Emirates.

**File: `src/components/filters/AdvancedFilterPanel.tsx`**
- Filter `EMIRATES_OPTIONS` to only show entries where `country === 'UAE'`
- This removes Cyprus, Indonesia, Oman, Thailand
- Show "All Emirates" label above the UAE emirates list
- Keep the search input for filtering within UAE emirates

### 4. Fix Cropping / Overflow

**Problem:** The top of the panel (search bar, title) gets cropped when opened.

**Fix:** By switching from Sheet to Dialog, the centered modal naturally has equal spacing from all edges. The `max-h-[calc(100dvh-4rem)]` ensures 2rem padding from top and bottom. Internal `ScrollArea` handles overflow for the filter sections.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/filters/AdvancedFilterPanel.tsx` | Replace Sheet with Dialog; rename "By Company" to "By Developer"; fetch from `developers` table with logos; show checkbox + logo + name list; filter EMIRATES_OPTIONS to UAE only; ensure no cropping |

### Technical Details

**Dialog structure:**
```
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl w-[calc(100vw-3rem)] max-h-[calc(100dvh-4rem)] p-0 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 flex flex-col overflow-hidden">
    {/* Header - fixed */}
    {/* ScrollArea - flex-1 */}
    {/* Footer - fixed */}
  </DialogContent>
</Dialog>
```

**Developer list item:**
```
<button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gold/10">
  <div className="w-4 h-4 rounded border border-gold/40 flex items-center justify-center">
    {isSelected && <Check className="w-3 h-3 text-black" />}
  </div>
  <div className="w-7 h-7 rounded bg-white border border-gold/20 p-0.5 flex items-center justify-center">
    <img src={dev.logo_url} className="w-full h-full object-contain" />
  </div>
  <span className="text-sm text-black">{dev.name}</span>
</button>
```

**Location filter (UAE only):**
```tsx
const uaeEmirates = EMIRATES_OPTIONS.filter(e => e.country === 'UAE');
```
