# Sidebar active/hover gold polish + unified champagne shell

You're right — black-on-black active state and black hover were unreadable. Locking this in once.

## Bugs

1. **Leads & CRM (active item)** — currently `bg-[#1A1A1A] text-[#FDFBF7]` (black box, white text). User wants **gold active**, not black.
2. **Hover state** — currently `hover:bg-[#EFE6D6] hover:text-[#1A1A1A]`. User reports text turning black on a dark/gold background → unreadable. Real cause: the global "Universal Same-Tone Contrast Guard" sometimes flips hover text to black against the warm hover bg, AND the resting `text-[#1A1A1A]` is correct but there's no actual gold highlight on hover at all.
3. **Premium item (Royal Tools Hub)** active/hover both use full-black background → same readability problem on hover.
4. **Backend shell colors** — sidebar uses `#F7F2EA` (champagne surface), while front-end header uses `#FDFBF7` (page). Top header in backend already uses `#FDFBF7`, so the sidebar looks one shade darker than the rest. User wants both to match the front-end's `#FDFBF7`.

## Fix (locked rule)

**Sidebar nav active/hover system — `src/components/owner-dashboard/OwnerSidebarNav.tsx`:**

- **Active (regular item):** gold gradient `from-[#B89555] to-[#A68444]` + ink text `#1A1A1A` + bold + soft gold shadow. Readable, premium, gold-forward.
- **Hover (regular item):** soft gold tint `from-[#B89555]/20 to-[#B89555]/10` + ink text forced (`hover:!text-[#1A1A1A]`) + thin gold border. Highlight is visible but text stays black on a light gold wash.
- **Active (premium):** same gold gradient with stronger shadow.
- **Hover (premium):** light gold gradient wash, never black background.
- **Badge:** flips colors based on active state so it stays readable.

**Sidebar shell color match — `src/pages/OwnerDashboardShell.tsx`:**

- Sidebar `aside` and `SheetContent` and logo divider: `bg-[#F7F2EA]` → `bg-[#FDFBF7]` (matches front-end + backend top header).
- Bottom-actions container already `#FDFBF7` — keep.
- Result: sidebar + top header are now the same single-tone champagne shell, identical to the public site's header.

**CSS lock — `src/index.css` (Backend Contrast Hardening block):**

Add a final rule that prevents any future regression where a hovered nav item in the owner sidebar gets text bleached to white or forced to a black background:

```css
[data-surface="champagne"] nav button:hover,
[data-surface="champagne"] nav a:hover {
  color: #1A1A1A !important;
}
[data-surface="champagne"] nav button[class*="bg-gradient"]:not(:hover) {
  /* allow active gold gradient to win */
}
```

## Out of scope
- Other dashboard pages (already covered by previous passes).
- Front-end nav (untouched per "no removal" rule).

After approval I'll apply all three edits in one shot.
