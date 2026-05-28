## Goal

Make the Broker Portal sidebar + top bar structurally identical to the Owner Dashboard Shell so:
- No empty gap below the sidebar nav
- Sidebar divider lines up with the top-bar bottom border
- Bottom-pinned footer block (Return to Site / Sign Out) seals the sidebar
- Same shell header height (uses global `--shell-header-h`, not a local 56px override)
- Same content padding/max-width rhythm

## Diff vs Owner shell (root causes)

1. **Header height mismatch.** Broker hard-codes `--shell-header-h: 56px` on the layout root. Owner reads the project-global value (≈64px). Result: the divider line under the sidebar logo doesn't sit on the same Y as the top-bar bottom border.
2. **No pinned footer in sidebar.** Owner sidebar ends with a `flex-shrink-0` bottom block (Return to Site + Sign Out). Broker sidebar puts Return to Site at the *top*, so the nav scroll area runs to the very bottom and leaves visible dead space below the last item when the list is short.
3. **`overflow-y-auto` on nav with no footer = visible gap.** With the pinned footer added, `flex-1` nav fills exactly the remaining height, eliminating the gap the user is complaining about.
4. **Content frame drift.** Broker main uses `max-w-[1600px] py-6/10`; owner uses `max-w-[1800px] p-4/6/8`. Minor, but visible side-by-side.
5. **Owner-preview banner placement.** Slim banner is fine but currently pushes the page down inside the column; keep it but make it `sticky` directly under the header so it doesn't break alignment when scrolling.

## Changes

**`src/components/broker-portal/BrokerPortalLayout.tsx`**
- Remove the `style={{ "--shell-header-h": "56px" }}` override so the broker shell inherits the same global value the owner shell uses.
- Tighten content wrapper to mirror owner: `p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto`.
- Make the owner-preview banner `sticky top-[var(--shell-header-h)] z-20` so it never desyncs from the header.
- Keep `h-screen` fixed aside (already correct).

**`src/components/broker-portal/BrokerPortalSidebar.tsx`**
- Restructure into 3 vertical regions like Owner:
  1. Top: logo row (locked to `--shell-header-h`).
  2. Middle: `<nav className="flex-1 overflow-y-auto …">` with the route items.
  3. Bottom: pinned `flex-shrink-0` footer with **Return to Site** and (for owners) **Owner Backend** + a **Sign Out** button — same styling tokens as `OwnerDashboardShell`'s bottom block.
- Drop the current top "Return to site / Owner backend" block (moved into the footer).
- Add a top-of-footer `border-t border-[#B89555]/40` so the footer reads as a sealed section.

**No behaviour/route changes.** This is purely shell structure + tokens.

## Verification (screenshot QA)

After the edit, with the user signed in to the preview:
1. Navigate `/broker/portal`, `/broker/crm`, `/broker/learning?tab=training` at 1280×900 and 1440×900.
2. Capture full-page screenshots and crop the sidebar bottom edge + header/sidebar corner to confirm:
   - No whitespace below the last sidebar item.
   - Logo divider Y == top-bar bottom-border Y (pixel match).
   - Pinned footer (Return to Site / Owner Backend / Sign Out) is visible without scrolling.
3. Repeat in collapsed (72px) state.
4. Compare side-by-side with an owner screenshot of `/owner/crm` to confirm visual parity.
5. Report any remaining drift before claiming done.

## Out of scope (will tackle next, per your priority list)

- CRM Pipeline premium polish
- Request-a-Form curated list + owner notification
- Dashboard owner-redirect hardening (only if QA shows a regression)
