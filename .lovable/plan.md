

## Fix "Sold Out" Color + Ensure Daily Status Updates

### 1. Change "Sold Out" Dot Color from Gray to Red

**Problem:** In the status filter dropdowns, the "Sold Out" option shows a gray dot (`bg-zinc-400`) instead of red. This is inconsistent with how "Sold Out" is displayed everywhere else (red badges, red text).

**Fix:** Change the `dotClass` for "Sold Out" from `bg-zinc-400` to `bg-red-500` in two files:

| File | Line | Change |
|------|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | 116 | `dotClass: 'bg-zinc-400'` to `dotClass: 'bg-red-500'` |
| `src/components/filters/AdvancedFilterPanel.tsx` | 32 | `dotClass: 'bg-zinc-400'` to `dotClass: 'bg-red-500'` |

Also update `src/components/home/HeroSearchBar.tsx` line 98 where "Sold Out" already uses `bg-red-500` (this one is correct, no change needed).

---

### 2. Daily Automatic Status Updates (Already Happening)

**Good news:** The daily Reelly auto-sync already handles this. Here is what runs every day at 04:00 UAE time:

1. **`reelly-api-sync`** fetches all projects from Reelly API and updates `sale_status` (Announced, On Sale, Sold Out, etc.) for every project
2. **`bulk-approve-imports`** propagates these status changes to the live `projects` table, including setting `is_sold_out = true` when the status contains "sold"

So if a project changes from "On Sale" to "Sold Out" on Reelly, it will be automatically reflected in your portal within the next daily sync cycle. No additional work is needed for Reelly-sourced status tracking.

---

### 3. No Additional Google Research Needed

The Reelly API is the authoritative source for project sale statuses in the UAE market. It already tracks status transitions (Announced, Presale EOI, Start of Sales, On Sale, Sold Out) and the daily sync captures these changes. Adding a separate Google search layer would be unreliable and could conflict with the API data.

---

### Summary

| File | Change |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | "Sold Out" dot: gray to red |
| `src/components/filters/AdvancedFilterPanel.tsx` | "Sold Out" dot: gray to red |

Two small color changes. The daily status sync infrastructure is already in place and working.
