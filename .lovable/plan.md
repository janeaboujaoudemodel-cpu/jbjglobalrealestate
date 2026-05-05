# Fix CRM/Owner Header Readability Bugs

Targeted fixes for the four complaints, in three files. No global sweeps, no other changes.

## 1. Remove the unreadable ⌘K shortcut next to "Search leads…"
**File:** `src/pages/CRM.tsx` (line 678)

Delete the `<kbd>⌘K</kbd>` element entirely. The "Search leads…" button stays — only the keyboard hint chip is removed.

## 2. Make the "Owner" badge in the top header readable
**File:** `src/pages/OwnerDashboardShell.tsx` (lines 135–139)

Currently the badge uses `bg-[#B89555]/12` (≈12% gold tint) with a thin border, which makes "Owner" almost invisible on the already-champagne header.

Change to a solid champagne raised tone with a darker shield + bolder text:
- Container: `bg-[#EFE6D6] border-[#B89555]` (full opacity, raised cream surface)
- Shield icon: keep `#1A1A1A` but `strokeWidth={2.5}`
- "Owner" label: `text-[#1A1A1A] font-bold tracking-wide`, also visible on `sm` breakpoint not just `hidden sm:inline` (keep responsive but darker)

## 3. Darken sidebar section labels (CORE / PROPERTIES / COMMUNICATION / etc.)
**File:** `src/components/owner-dashboard/OwnerSidebarNav.tsx` (line 167)

Change `text-[#1A1A1A]/75` → `text-[#1A1A1A]` (full ink, no opacity). 10px uppercase labels need full contrast on champagne. Font weight stays `font-bold`.

## 4. Verification
After changes, navigate to `/owner/crm`, dismiss the Pending Tasks modal, screenshot, and confirm:
- No ⌘K chip next to Search leads
- "Owner" pill in top-right reads clearly in solid dark ink on cream
- "CORE", "PROPERTIES", "COMMUNICATION", "AI & TOOLS", "CREATIVE", "ADMIN", "SYSTEM" all clearly legible

## Out of scope
No changes to Pending Tasks popup, no DB/edge function work, no other pages, no other colors. Per your standing "no removal" rule, no features are deleted — only the cosmetic ⌘K hint chip you explicitly asked to remove.
