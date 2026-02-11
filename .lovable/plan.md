

# Outstanding Tasks Found -- Fixes Required

After a thorough audit of the codebase and live browser testing, here are the **real outstanding tasks** that were previously marked as "completed" but are NOT actually done:

---

## Issue 1: ModeSelectionModal is NEVER Rendered (JBJ-019 -- NOT DONE)

**Problem:** The `ModeSelectionModal` component exists at `src/components/ModeSelectionModal.tsx` and is fully implemented, but it is **never imported or rendered anywhere** in the application. It is not in `PopupLayer.tsx`, not in `MainLayout.tsx`, not in `App.tsx` -- nowhere.

**Memory spec says:** "First-time users are prompted to select a mode via the ModeSelectionModal (persisted in jj_mode_selected). Upon selection, a guidance toast with a visual pointer indicates that the mode can be changed anytime via the profile menu."

**Fix:** Add `ModeSelectionModal` to `PopupLayer.tsx` so it renders centrally via the PopupCoordinator system (which already has priority 3 registered for `mode-selection-modal`).

**Files to edit:**
- `src/components/PopupLayer.tsx` -- import and render `<ModeSelectionModal />`

---

## Issue 2: GlobalContactGating is NEVER Used (Missing Feature)

**Problem:** `GlobalContactGating.tsx` wraps the `ContactGatingModal` and is fully implemented with `useContactGating` hook, but it is **never imported or rendered** in `MainLayout.tsx`, `App.tsx`, or any wrapper. The contact gating flow for requiring user info before accessing certain features is dead code.

**Fix:** Add `GlobalContactGating` as a wrapper in `MainLayout.tsx` around the main content area.

**Files to edit:**
- `src/components/MainLayout.tsx` -- import and wrap children with `<GlobalContactGating>`

---

## Issue 3: Financial Disclaimer Links Missing on Some AI Tools

**Problem:** Per the compliance memory: "All financial disclaimers (AI Analyzers, DLD Widgets, ROI Calculators) must append a gold-styled link: 'Contact our team for professional guidance'". While many tools have this, some AI tool pages may be missing it. The search for "Contact our team for professional guidance" found matches in only ~11 files, but there are 30+ AI tool pages.

**Fix:** Audit all AI tool pages and add the disclaimer link where missing (especially tools that produce financial/investment outputs).

**Files to audit:**
- All `src/pages/AI*.tsx` pages that generate financial/investment analysis
- `src/components/ai-tools/premium/*.tsx` components

---

## Issue 4: Golden Visa Language -- "eligible to apply" Not Used Everywhere

**Problem:** The compliance memory states: 'Golden Visa eligibility is described as "eligible to apply"'. The Golden Visa Guide page correctly uses this phrasing, but the search index, property cards, and other references throughout the site may still use phrases like "qualifies for Golden Visa" or "Golden Visa eligible" without the "to apply" qualifier.

**Fix:** Search for all Golden Visa references and ensure compliance wording ("eligible to apply") is used consistently.

---

## Issue 5: Header Search Dropdown -- Missing "Trending Searches" / "Recent Searches"

**Problem:** The header search panel (JBJ-003) was expanded to 620px and Popular Pages were added, but the original requirement mentioned "shortcut suggestions" and improved UX. The current embedded search panel shows Quick Access shortcuts and Popular Pages but has no "Recent Searches" or "Trending Searches" section -- features users expect from a premium search UX.

**Fix:** Add a "Recent Searches" section that persists via localStorage, showing the user's last 5 searches for quick re-access.

**Files to edit:**
- `src/components/GlobalSearchModal.tsx` -- add recent searches tracking and display

---

## Technical Summary

| Issue | Component | Status | Fix Effort |
|-------|-----------|--------|------------|
| ModeSelectionModal not rendered | PopupLayer.tsx | NOT DONE | Small -- 1 import + 1 JSX line |
| GlobalContactGating not used | MainLayout.tsx | NOT DONE | Small -- 1 import + wrap |
| Financial disclaimers incomplete | AI tool pages | PARTIAL | Medium -- audit 30+ pages |
| Golden Visa wording consistency | Multiple files | PARTIAL | Small -- search and replace |
| Recent Searches in header | GlobalSearchModal.tsx | NOT DONE | Medium -- localStorage + UI |

### Execution Order
1. ModeSelectionModal rendering (highest priority -- user-facing onboarding)
2. GlobalContactGating integration (lead capture flow)
3. Recent Searches in header search
4. Financial disclaimer audit
5. Golden Visa wording audit

