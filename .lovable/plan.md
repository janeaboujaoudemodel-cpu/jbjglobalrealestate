I’ll fix the backend/owner dashboard contrast as a system, not as one-off text tweaks.

## What I will change

1. Pending Tasks popup readability
- Make the alert card a locked light/champagne surface with `data-surface="page"` and `data-no-contrast-guard` so global contrast rules cannot bleach it.
- Force the title, body, icon tile, close icon, “View Tasks”, and “Later” buttons to high-contrast ink/champagne combinations.
- Remove weak gold text/icon states from this modal and use gold only as border/accent, not primary text.
- Apply the same hardening to the non-owner user pending-tasks popup so both alert systems are consistent.

2. Owner dashboard shell and vertical sidebar
- Add a backend-specific wrapper class to the owner shell, for example `owner-dashboard-shell`, so I can apply targeted contrast rules without damaging the public website.
- Convert active sidebar items from faded gold text to ink text on a raised champagne/gold plate.
- Convert inactive/sidebar section labels from low-contrast gold to high-contrast ink/brown.
- Make sidebar hover states readable in both default and hover states.
- Ensure sidebar icons stay visible and do not inherit a low-contrast gold/faded state.

3. CRM header and dashboard action bars
- Remove hover behavior that turns the CRM header into a dark strip while nested text remains black or mixed.
- Keep the CRM header champagne/raised with ink text at all times.
- Update quick action buttons/search/notification controls so icons and labels are readable on normal load and hover.

4. Team Communication and Channels panel
- Harden `CRMCommunicationPanel` as a premium champagne card with explicit `data-surface` hints.
- Fix the “Team Communication” title, “Channels” title, channel rows, badges, message bubbles, member counts, and tabs.
- Replace weak `text-gold`, `text-gold/70`, and muted low-opacity labels with ink text or darker warm-brown text.
- Keep gold as accent/border/background only unless it is on a dark enough surface.

5. Backend-wide contrast sweep
- Add targeted CSS inside `src/index.css` scoped to owner/backend UI only:
  - light/champagne backend surfaces force white text to ink,
  - faded gold text on champagne becomes ink/warm-brown,
  - dark backend surfaces force black text to champagne/white,
  - icon contrast floors for alert cards, sidebars, tabs, cards, and buttons.
- This catches repeated errors across owner pages without removing features or changing layout.

6. High-risk owner pages/components audit pass
- Sweep these backend areas for the same patterns and patch obvious offenders:
  - `src/pages/OwnerDashboardShell.tsx`
  - `src/components/owner-dashboard/OwnerSidebarNav.tsx`
  - `src/components/owner-dashboard/OwnerTasksPopupAlert.tsx`
  - `src/components/notifications/UserTasksPopupAlert.tsx`
  - `src/pages/CRM.tsx`
  - `src/components/crm/CRMCommunicationPanel.tsx`
  - selected owner pages/components showing repeated low-contrast tokens from the audit, especially `OwnerDashboardOverview`, `OwnerInbox`, `OwnerCommSettings`, and related owner communication widgets.

7. Verification
- Navigate to `/owner/crm` at the user’s viewport size.
- Check the pending-task popup, sidebar, CRM header, Team Communication card, and Channels panel visually.
- Also spot-check owner communication/settings pages for the same backend contrast system.

## Technical notes

- No backend database change is needed; this is a frontend contrast/readability fix for the owner/backend UI.
- I will preserve all existing features and content under the project’s “No Removal” policy.
- I will not edit generated backend integration files.
- I will avoid raw gray styling and keep the champagne/gold/ink brand system.