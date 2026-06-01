I found two concrete issues in the screenshot:

1. The Sign Out button in `src/components/broker-portal/BrokerPortalSidebar.tsx` is missing the required `data-signout-action`, `data-signout-label`, and icon class hooks, so the existing final CSS rule in `src/index.css` cannot apply. That is why it stays faded/white instead of visible red.

2. The broker portal wordmark uses `truncate` inside a fixed `260px` sidebar header. That intentionally creates the forbidden `...` after `JBJ GLOBAL REAL ESTATE`. This is not acceptable for the brand wordmark.

Plan:

- Update only `src/components/broker-portal/BrokerPortalSidebar.tsx`.
- Remove `truncate` from the company wordmark and allow the full `JBJ GLOBAL REAL ESTATE` text to render at a smaller fixed uppercase size if needed.
- Keep `Broker Portal` on its own line and readable.
- Add the missing sign-out hooks:
  - `data-signout-action` on the button
  - `data-signout-icon` plus `jj-signout-icon` on the `LogOut` icon
  - `data-signout-label` on the label
- Give Sign Out an explicit light/destructive surface so it is visible at rest, not only on hover.
- Do not touch homepage sections, homepage hero, property cards, global layout, database, or routes.
- After implementation, visually validate `/broker/portal` with a screenshot and confirm:
  - Sign Out is clearly visible
  - no ellipsis appears in `JBJ GLOBAL REAL ESTATE`
  - sidebar/footer buttons remain readable