## Goal

Remove the gold underline strip on the tab rows of "Explore Our Services" and "JBJ Royal Tools Hub". Replace the underline-style active/hover treatment with a soft champagne highlight pill that matches the site standard (cream fill + 1px gold hairline + ink text).

## Files

1. `src/components/home/ExploreServicesExpander.tsx`
2. `src/components/home/ToolkitShowcaseCard.tsx`

## Changes (identical pattern in both files)

### Tabs container
- Remove `border-b border-[#B89555]/25` from the scroller row.
- Add a small vertical padding (`py-2`) so the new pills sit cleanly.

### Tab button
- Remove `border-b-2 -mb-px` and the `border-[#1A1A1A]` / `border-[#B89555]` border states.
- Replace the active/hover treatment with:
  - **Idle**: `rounded-lg text-[#1A1A1A]/80 hover:bg-[#F7F2EA] hover:text-[#1A1A1A]`
  - **Active**: `bg-[#EFE6D6] text-[#1A1A1A] ring-1 ring-[#B89555]/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`
- Keep `transition-colors`, padding, icon, label and the disabled `opacity-80` for unavailable services.

### Result
- No more horizontal gold rule under the tabs.
- Active tab reads as a soft cream pill with a 1px gold hairline.
- Hover reads as a slightly lighter cream surface — no underline.
- Both Explore Our Services and Royal Tools Hub stay visually consistent.
