## Plan: full audit + fix batch

### 1) Broker portal data isolation and fake-data cleanup
- Tighten broker lead queries so broker portal surfaces only leads assigned to the logged-in broker.
- Apply the same broker scoping to the AI assistant lead list; it currently queries `crm_leads` broadly and can show owner/global leads.
- Remove any fallback/sample/fake leads from broker-facing views; empty states must say no leads are available instead of fabricating data.
- Verify technically with the lead query code and visually on `/broker/leads`, `/broker/crm`, and `/broker/ai`.

### 2) Broker deals and commissions pages
- Replace the current “Open CRM Pipeline” placeholder behavior.
- Build broker-native read-only summary sections:
  - `/broker/deals`: deal-stage pipeline insights from the broker’s assigned leads/deal records.
  - `/broker/commissions`: commission/payout summary cards and empty states, not CRM redirects.
- Keep them inside the broker portal shell and never redirect to frontend tools.

### 3) Request form dialog contrast
- Fix the “Request a form” dialog buttons and select menus so text/icons remain readable on normal, disabled, hover, and active states.
- Use navy only for primary action buttons with explicit white opt-out, and ink/gold/champagne for secondary buttons.
- Verify visually in `/broker/forms`.

### 4) JBJ Academy books and certificate
- Audit `BrokerLearning`, `BookReader`, book cards, `useBrokerEducation`, and certification hooks.
- Fix broken book opening/reading flow.
- Add a visible certificate/progress area in JBJ Academy showing certificate status, points/training progress, and clear empty states when not eligible.
- Keep Academy portal-native; no marketing-page chrome.

### 5) Broker settings blinking and loader monogram contrast
- Re-check `/broker/settings` for nested layout or redirect loops and remove any remaining causes of blinking.
- Fix `BrandedLoader` so champagne/light backgrounds use the dark JBJ monogram/letters, not white letters.
- Ensure any broker loading state uses the correct light variant or a non-blocking progress bar.

### 6) Broker AI assistant naming, scoring, and selected lead behavior
- Rename “Your Head of Sales” to the approved assistant naming (`JBJ Sales Assistant` / portal assistant wording), removing prohibited “Head of Sales”.
- Ensure clicking a lead in the AI assistant actually loads that lead in the assistant and keeps the selected lead visible.
- Fix score rendering so values like `30` display as `30%`, not just `30` or unclear scoring.
- Ensure the send button contrast remains readable in normal, hover, disabled, and loading states.

### 7) Owner backend classic navigation styling
- Remove the normal-state champagne “label/highlight” effect from owner backend navigation, header controls, and account dropdown triggers.
- Keep the current hover state and active-section styling.
- Preserve active section borders while making inactive buttons classic/clean with transparent backgrounds.

### 8) Global pill edge standard
- Replace over-rounded pill styling (`rounded-full`) in portal/navigation/filter/action pills with the same edge radius as the “Search databases” input/select style (`rounded-md`).
- Scope carefully so true avatars, circular icons, progress rings, and loaders stay circular.
- Prioritize owner CRM, broker portal, AI assistant filters, mode/account dropdown pills, and toolbar chips.

### 9) Verification pass
- Technical checks:
  - Search for remaining banned labels: `Your Head of Sales`, fake/sample lead fallbacks, `Open CRM Pipeline` in broker deals/commission routes.
  - Inspect dev-server logs after changes.
  - Check permission/RLS-related insert paths only where needed.
- Visual checks:
  - `/broker/portal`
  - `/broker/crm`
  - `/broker/leads`
  - `/broker/deals`
  - `/broker/commissions`
  - `/broker/forms`
  - `/broker/learning`
  - `/broker/settings`
  - `/broker/ai`
  - `/owner/crm?entity=databases&view=all`
- Confirm no white-on-champagne/gold button regressions, no blinking settings page, no fake broker leads, no broken AI assistant lead panel, and cleaner owner backend chrome.