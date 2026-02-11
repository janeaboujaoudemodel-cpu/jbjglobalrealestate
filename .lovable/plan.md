

# Fix Plan: Global Search Hover Panel -- UI, Colors, and Close Speed

## Issues Identified

1. **Wrong colors**: The search hover dropdown uses `bg-black/95` dark theme, but the approved design uses the premium champagne-gold gradient (`from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`) matching the full-screen search modal.

2. **Slow close**: The `handleMegaMenuLeave` timeout is set to 450ms. The user wants near-instant close when the cursor leaves the panel.

3. **Embedded mode uses dark theme**: The `GlobalSearchModal` embedded mode renders dark-themed content (white text on dark bg), but the wrapper and approved style are champagne/gold. The embedded mode needs to match the modal's light champagne styling.

## Changes

### File 1: `src/components/GlobalHeader.tsx`

**Close speed** (line 110):
- Change the mega menu leave timeout from `450ms` to `120ms` for snappier close behavior

**Search panel wrapper** (lines 1505-1513):
- Replace `bg-black/95 backdrop-blur-xl border border-gold/30` with the approved champagne gradient: `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40`
- This matches the full-screen modal's visual identity

### File 2: `src/components/GlobalSearchModal.tsx`

**Embedded mode colors** (lines 152-259):
- Update the embedded mode to use the same champagne/gold light theme as the full-screen modal:
  - Search input: `text-black` instead of `text-white`, placeholder `text-gold/60`
  - Border: `border-gold/30`
  - Quick Access icons: Keep colorful backgrounds, change labels to `text-black`
  - Popular Pages: `bg-white/50 border border-gold/10` with `text-black` labels
  - Recent Searches: `text-black` labels with gold clock icons
  - Search results: `text-black` for titles, `text-gold` for categories, `bg-white` icon containers
  - "No results" text: `text-zinc-500` (works on light bg)
  - Hint text: `text-gold/80`

This aligns the embedded (hover) panel with the approved champagne-gold premium aesthetic that the full-screen modal already uses.

## Technical Summary

| Change | File | Lines | Detail |
|--------|------|-------|--------|
| Close speed | `GlobalHeader.tsx` | 110 | 450ms to 120ms |
| Panel wrapper color | `GlobalHeader.tsx` | 1506 | Dark to champagne gradient |
| Embedded search input | `GlobalSearchModal.tsx` | 154-166 | White text to black text on light bg |
| Embedded Quick Access | `GlobalSearchModal.tsx` | 196-256 | Dark theme to champagne light theme |
| Embedded search results | `GlobalSearchModal.tsx` | 169-194 | Dark theme to champagne light theme |
