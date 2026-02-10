
# Fix Document Editor Toolbar Visibility, Title Input Color, and Auto-Test Enrichment

## Overview
Three issues to address: (1) Document editor toolbar buttons and title input are invisible on the dark background, (2) the enrichment test panel requires manual slug entry -- it should auto-select a project and run the test automatically.

---

## Part 1: Fix Document Editor Toolbar Buttons (Not Visible)

**Problem:** All toolbar buttons in `src/pages/Documents.tsx` use `Button variant="ghost"`, which is aliased to `BRAND_SECONDARY` in the global button system. This renders as a transparent button with champagne/gold borders and dark text -- completely invisible on the dark `zinc-950` background of the document editor.

**Fix:** Change all toolbar `Button variant="ghost"` to `Button variant="dark-ghost"` (lines 240-398). The `dark-ghost` variant is specifically designed for dark backgrounds: `bg-transparent text-white border-2 border-zinc-600 hover:bg-white/10 hover:border-white/40`.

This affects approximately 15 buttons:
- Undo, Redo (lines 240-244)
- Bold, Italic, Underline (lines 280-288)
- Headings dropdown trigger (line 295)
- Alignment buttons x4 (lines 319-330)
- Lists x2 (lines 335-339)
- Link dialog trigger (line 347)
- Image button (line 366)
- Print button (line 373)
- Export dropdown trigger (line 379)
- Import button (line 394)

Also update the "Export" and "Import" text labels to include `text-white` explicitly.

**File:** `src/pages/Documents.tsx` -- Change all `variant="ghost"` to `variant="dark-ghost"` in the toolbar section.

---

## Part 2: Fix "Untitled Document" Title Input Text Color

**Problem:** The title input (line 231) has `text-white` which works when not focused. However, on focus the input may show black text due to browser defaults or the component's focus styles overriding. The user reports the text shows white initially then turns black on click.

**Fix:** Add explicit `focus:text-white` and `selection:text-white` classes to the Input on line 231. Also add `caret-white` so the cursor is visible. The full className becomes:
```
text-xl font-medium border-0 bg-transparent focus-visible:ring-0 max-w-md text-white focus:text-white caret-white placeholder:text-zinc-500
```

**File:** `src/pages/Documents.tsx` line 231

---

## Part 3: Auto-Test Enrichment with a Real Project

**Problem:** The enrichment test panel in `src/components/listing-admin/ReellyImportPanel.tsx` (line 2546) requires the admin to manually type a project slug. The user wants an automatic test -- the system should pick a project automatically and run the enrichment.

**Fix:** Pre-populate the slug input with a known project from the database and add a "Random Project" button that fetches a random project slug. Specifically:

1. Set the default `enrichTestSlug` state to `"binghatti-titania-binghatti-3012"` (a real Binghatti project with a cover image, confirmed in the database).
2. Add a small "Pick Random" button next to the input that queries the database for a random project with a Reelly external ID and auto-fills the slug.
3. The admin can still override with their own slug if desired.

**File:** `src/components/listing-admin/ReellyImportPanel.tsx` lines 2544-2577

---

## Technical Summary

| File | Changes |
|---|---|
| `src/pages/Documents.tsx` | Change ~15 toolbar buttons from `variant="ghost"` to `variant="dark-ghost"`; fix title input focus text color |
| `src/components/listing-admin/ReellyImportPanel.tsx` | Pre-populate enrichment test slug with a real project; add "Pick Random" button |

## Execution Order
1. Fix all toolbar button variants in Documents.tsx
2. Fix title input text color in Documents.tsx
3. Update enrichment test panel with auto-populated slug and random picker
