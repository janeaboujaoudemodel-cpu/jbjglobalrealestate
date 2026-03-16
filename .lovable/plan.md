

## Plan: Sidebar Header Cleanup + Horizontal Bar Restyle

### Changes

**1. Sidebar Header (GlobalVerticalNav.tsx, lines 1070-1096)**
- Remove the `ring-1 ring-gold/30` border from the monogram image — keep it clean with no border/ring
- Restructure company name to fit on **2 lines** instead of 4:
  - Line 1: `JBJ GLOBAL`
  - Line 2: `REAL ESTATE`
  - This is already 2 lines — the issue is likely the logo + text + collapse button creating wrapping. Will tighten spacing and ensure the layout stays on 2 text lines only.
- Also update collapsed state monogram (line 1290) to remove the ring/border

**2. Remove Sidebar Toggle from Horizontal Bar (HorizontalUtilityBar.tsx, lines 119-136)**
- Remove the entire sidebar toggle button (PanelLeftOpen/PanelLeftClose) since the toggle now lives in the vertical sidebar itself

**3. Restyle Horizontal Bar to Match Sidebar Header (HorizontalUtilityBar.tsx, line 117)**
- Change the horizontal bar background from `from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` to match the sidebar header champagne gradient: `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]`
- Update the segmented rail borders and cell styles to harmonize with the richer champagne tone
- Adjust text/icon contrast for the darker background

### Files Modified
- `src/components/navigation/GlobalVerticalNav.tsx` — header cleanup (remove logo border, ensure 2-line name)
- `src/components/navigation/HorizontalUtilityBar.tsx` — remove minimizer, restyle background to match sidebar header

