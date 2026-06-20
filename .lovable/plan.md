Implement the remaining fixes exactly where they are currently failing:

1. Vertical sidebar: Billing & Subscriptions
- `accountShortcuts.ts` already contains Billing, but `GlobalVerticalNav.tsx` still has a separate hard-coded MY ACCOUNT group that stops before Billing.
- Add `Billing & Subscriptions` directly into the hard-coded MY ACCOUNT nav order so it appears in the expanded vertical sidebar.
- Keep it in the canonical account shortcut list too; do not remove any account items.

2. My Account dashboard: Brand Update subcategory/card
- Add a visible `Brand Update` shortcut/card directly under the top dashboard heading area and before the main dashboard grid.
- Link it to the existing Brand Palette route (`/brand-palette`) unless a more specific existing route is found during implementation.
- Add `#brand-update` to the dashboard hash mapping so sidebar/header account subcategory navigation can land on it.
- Do not remove existing Profile, Badges, Account Settings, Tasks, Notifications, Quick Actions, Activity, Favorites, Shortlist, Explore & Learn, or AI Tools blocks.

3. Emerald + white contrast for services and AI tools
- In `ExploreServicesExpander.tsx` and `ToolkitShowcaseCard.tsx`, change the segmented tab strip from black to the emerald gradient.
- Keep all inactive tab labels/icons white on emerald.
- Active tab can remain champagne/ink only if it is the selected pill; all emerald segments must have white text/icons at rest and hover.
- Change the photo CTA (`Explore Now` and AI tool CTA buttons) from black/frosted black to emerald gradient with white text/icons at rest and hover.
- Add `allow-white` / `data-no-contrast-guard` where needed so global contrast guards cannot flip these labels back to black.

4. Header service tabs in Explore Our Services
- Specifically fix `Sell Your Property`, `Rent a Property`, `List Your Property for Rent`, etc. so their tab backgrounds are emerald, not black.
- Preserve the scrollable tab behavior and active tab behavior.

5. Restore full-width bands after the sidebar line
- Keep the global main gutter for normal cards/KPIs so content does not touch the sidebar.
- Restore homepage/full-band sections to stretch from the vertical sidebar boundary to the right edge, not sit inside a large side gap.
- Apply this by making `PremiumSectionCard width="full"` break out of the gutter to the inner viewport edges while its child card/content keeps its own internal padding.
- Do not allow sections to go underneath the fixed vertical sidebar or horizontal header.

6. Verification pass after implementation
- Check homepage at desktop size: hero-adjacent sections, Explore Our Services, Developer/market/join-style bands, Featured Listings, Royal Tools, Top Areas stretch correctly from sidebar boundary to right edge.
- Check expanded vertical sidebar: MY ACCOUNT contains Billing & Subscriptions.
- Check My Dashboard: Brand Update card appears above the dashboard content.
- Check services/tools cards: service names, AI tool names, and CTA labels remain white on emerald at rest and hover.
- Check at multiple viewports requested previously: desktop wide, laptop, tablet, mobile.

Files expected to change:
- `src/components/navigation/GlobalVerticalNav.tsx`
- `src/pages/MyDashboard.tsx`
- `src/components/home/ExploreServicesExpander.tsx`
- `src/components/home/ToolkitShowcaseCard.tsx`
- `src/components/ui/premium-section-card.tsx`
- possibly `src/index.css` only for a narrow full-width gutter/emerald contrast helper if component classes alone are insufficient.