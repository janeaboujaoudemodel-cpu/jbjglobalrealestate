I’ll do a focused contrast hardening pass instead of another cosmetic tweak.

What I will fix:

1. Remove the gray/silver cast from the main app shell
- Change the main public layout desktop background from the current grayish champagne (`#ECE2D2`) to the approved page/surface tokens: `#FDFBF7`, `#F7F2EA`, `#EFE6D6`.
- Replace sidebar gradients using `#ECE2D2`, `#D8C7A6`, and `#E0D3BF` with stronger champagne/gold surfaces that do not look silver/gray.

2. Fix the owner/CRM vertical sidebar readability
- Increase all owner sidebar labels/icons from faded alpha text to solid ink/gold.
- Replace `text-[#1A1A1A]/50`, `/60`, `/65`, `/70`, `/80`, `/85` in the navigation with explicit high-contrast colors.
- Strengthen active/hover rows so sections and icons are readable at normal zoom.
- Keep the 88px L-shaped layout intact.

3. Fix the CRM relationships page background and controls
- Replace the `#FAF7F2` page background with approved champagne `#FDFBF7` / `#F7F2EA`.
- Harden tabs, buttons, filters, badges, and search controls so text/icons never inherit low opacity.
- Keep all relationship features intact; no removal.

4. Fix the pending-tasks popup that is currently washing out
- The screenshot shows the modal is being dimmed into nearly white/gray text. I will mark the modal content as an explicit light surface and remove/adjust the blur/dim interaction so the page is dimmed but the popup itself stays crisp.
- Ensure the title, description, icon, message box, “View Tasks”, “Later”, and close button are all readable.

5. Fix homepage unreadable sections/icons
- Update homepage category cards and trust/service sections that still use `neutral-*`, gray borders, or faded brown text.
- Replace gray/neutral classes with champagne/gold/ink tokens.
- Ensure icons use strong ink/gold/white-on-ink contrast, not low-opacity gray.
- Remove the silver gradient from homepage navigation/header surfaces.

6. Add a final global contrast safety net
- Add a last-source-order CSS lock for champagne/light surfaces:
  - light/champagne backgrounds → text must be ink `#1A1A1A` or strong brown `#3A2D1D`
  - dark/ink backgrounds → text/icons must be white/champagne
  - gold backgrounds → text/icons must be white or ink depending on the exact fill
- Replace remaining gray/neutral utility colors in affected surfaces with warm champagne/ink equivalents.
- Avoid broad rules that accidentally turn text white inside light cards.

7. Verify visually
- Re-open `/owner/crm/relationships` at the current viewport and confirm:
  - no gray/silver background cast
  - vertical sidebar labels and icons are readable
  - pending task popup is readable
  - CRM relationship controls are readable
- Re-open homepage and confirm:
  - icons and section text are visible
  - no gray/neutral card styling remains in the visible homepage sections

Technical files I expect to update:
- `src/index.css`
- `src/components/MainLayout.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/pages/OwnerDashboardShell.tsx`
- `src/components/owner-dashboard/OwnerSidebarNav.tsx`
- `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`
- `src/pages/CRMRelationships.tsx`
- `src/pages/Index.tsx`
- selected homepage components such as `CategorySelectorSection`, `TrustBar`, `WhyChooseUs`, `ServicesGrid`, `ExploreServicesCard`, and `ToolkitShowcaseCard` if they still contain gray/neutral/low-opacity styling.

I will not remove any features or content. This is a contrast and palette correction only.