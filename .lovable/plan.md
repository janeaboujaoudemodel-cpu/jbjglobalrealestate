# Fix Welcome Tour Popup, Backend Task Popup, and Header Color Unification

Three connected issues, all on the home and backend (Nexus CRM) screens.

## 1. Welcome / "Take a Tour" popup — `src/components/GuidedTour.tsx`

**Problems:**
- The modal centers vertically over the whole viewport (`fixed inset-0 ... items-center`) at `z-50`, while the horizontal header is `z-[9998]` and 88 px tall. On home, the modal currently butts up against / is clipped by the header.
- The button **"View Quick Shortcuts"** (sitting under "Take a Quick Tour") reads as transparent / low-contrast on the champagne modal surface.

**Fix:**
- Change the overlay container so the modal cannot touch the header:
  - Add `top-[88px]` (and `pt-4`) to the inner flex wrapper, so the modal is offset below the fixed 88 px utility bar on tablet/desktop.
  - On mobile (`md:hidden` header is 96 px), use a responsive offset: `top-24 md:top-[88px]`.
- Lift the overlay z-index above the header: `z-[10050]` (sits at the existing dialog tier from `Z_INDEX`).
- Replace the secondary button with a high-contrast variant:
  - Use the shared `<Button variant="secondary">` (champagne fill `#F7F2EA` + gold border + ink text) instead of the current bespoke `bg-transparent` outline. Same for "Skip for now" — promote it to a quiet `<Button variant="tertiary">` so the label is always legible.
- Keep the primary "Take a Quick Tour" button (ink + gold text) as-is.

## 2. Backend "Pending Tasks" popup — `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx` and `src/components/notifications/UserTasksPopupAlert.tsx`

**Problems:**
- Same overlap: both use `fixed inset-0 ... items-center` so the modal can ride up under the 88 px backend header.
- User reports the action buttons inside ("View Tasks", "Later", "My Tickets") render unreadable in the Nexus CRM context.

**Fix:**
- Add `pt-[104px] md:pt-[104px]` (88 px header + 16 px breathing room) to the outer overlay so the dialog can never visually touch the top bar.
- Force the buttons to the brand-defined readable variants:
  - Primary action ("View Tasks" / "My Tickets") → `<Button variant="primary">` (already in use — re-confirm it isn't being overridden by class merging. Drop any `text-gold` / faded class still applied).
  - Dismiss action ("Later") → `<Button variant="secondary">` (champagne fill, gold border, ink text).
- Give the dialog body `data-no-contrast-guard` removal review: it's already there but ensure nested buttons still receive their intended `text-white` / `text-[#1A1A1A]` and aren't being washed out by a parent rule.

## 3. Horizontal header unified to sidebar champagne — both public and backend

The vertical sidebar uses these solid champagne stops:
- Top brand cell: `linear-gradient(180deg, #F7F1E6 → #ECE2D2)`
- Lower nav body: `linear-gradient(180deg, #ECE2D2 → #D8C7A6)`

Goal: the **whole** horizontal top bar (logo edge → mode/settings edge) shares the same champagne look as the sidebar so the L-frame reads as one continuous surface.

**Files & changes:**

- `src/components/navigation/HorizontalUtilityBar.tsx` (line 192)
  - Already `bg-gradient-to-b from-[#F7F1E6] to-[#ECE2D2]`. Extend the bar so its right-edge tone matches the sidebar's lower body: switch to `bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]`. Keep the gold hairline bottom border.

- `src/components/GlobalHeader.tsx` (mobile / non-backoffice public header, lines 634–640)
  - Replace the current `linear-gradient(180deg, #F7F1E6 0%, #ECE2D2 60%, #D8C7A6 100%)` (vertical) with the same `linear-gradient(90deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)` so the colour flows horizontally from the logo side to the mode/settings side, mirroring the sidebar palette.
  - Keep the gold hairline bottom and inner shadow as-is.

- `src/components/MainLayout.tsx` (lines 270–286, fallback skeletons)
  - Update the sidebar fallback (`bg-[#F7F2EA]`) to the same `bg-gradient-to-b from-[#F7F1E6] to-[#ECE2D2]`.
  - Update the utility-bar fallback (`bg-[#F7F2EA]`) to the new horizontal gradient so there's no flash of a different tone before hydration.

No changes are required to:
- The vertical sidebar itself (already correct).
- The backend Nexus CRM header — it uses `HorizontalUtilityBar`, so it inherits the new gradient automatically.

## Out of scope
- No changes to popup behaviour, dismissal logic, routing, or copy.
- No changes to mega menus, the L-frame structure, or the gold border tokens.
- No removal of any existing feature (per the No-Removal policy).

## Acceptance
- On `/` after first visit: tour modal is fully visible below the 88 px header, both action buttons are clearly readable on champagne.
- In Nexus CRM (`/owner`, etc.): pending-tasks alert sits below the header with a clear gap; "View Tasks" and "Later" both legible.
- Top horizontal bar (public and backend) reads as a continuous champagne strip flowing into the vertical sidebar with no colour seam at the corner.
