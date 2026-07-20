## Plan

### 1) Fix the Hub shell visually at the root
- Create one enforced Hub button/action contract for the backend: same height, radius, padding, border, emerald `#064E3B`, pure-white icons/text for filled actions, no hover resizing, no vertical text wrapping.
- Apply it to the header `+`, search, notification, app-grid, widget action buttons, page CTAs, select triggers, active pills, and portal card actions.
- Fix the cropped JBJ Global org picker so it has a stable width and shows a readable label instead of ellipsis/three-dot clipping.
- Fix Today’s Focus white empty control by giving it the correct emerald/white or white/graphite contrast state.
- Normalize dashboard cards/widgets so KPI boxes, “My Open Tasks”, “My Meetings”, plus buttons, dropdown pills, and table controls keep consistent dimensions at the current preview width and smaller widths.

### 2) Fix Relationship Hub layout and counts
- Repair the Relationship Hub top stats, status counters, action rows, delete/bin icon, email icon alignment, sender/reply controls, and active database badges so they are readable and centered.
- Use real backend counts only. I confirmed the database currently has `775` developer-registry rows, with `770` marked `not_started`; the UI should explain and display those numbers consistently with the visible cards/filters rather than showing confusing junk counters.
- Ensure the visible cards, filter tabs, and summary counts all come from the same filtered dataset.

### 3) Unify branded emails across Relationship Hub, Developer Portal, and Broker Portal
- Keep Relationship Hub as the working source of truth.
- Replace the separate portal email panel behavior with the same tested Relationship Hub email system, adapted per portal:
  - Developer Portal: developer registration / registration follow-up / contract request only.
  - Broker Portal: brokerage/broker portal templates only.
- Remove cross-contamination where broker pages can show/send developer registration, or developer pages can show brokerage templates.
- Make the template preview, test send, live send, subject, sender, and audience routing use the same variant keys as the Relationship Hub.

### 4) Fix broken email send/test behavior
- Route Developer Portal sends through the developer-registration function and Broker Portal sends through the brokerage-outreach function, not the generic owner email path.
- Fix malformed subject text such as encoded characters appearing in broker registration subjects.
- Keep test sending to `infoo.jane@gmail.com` by default.
- Surface real send errors in the UI instead of silently hanging.

### 5) Visual and technical validation before reporting complete
- Run a technical check for changed frontend code and affected email functions.
- Use Playwright screenshots at `1180x893` and a narrower width for:
  - Hub Home dashboard
  - Relationship Hub
  - Developer Portal branded email flow
  - Broker Portal branded email flow
  - Search overlay/header buttons
- Do not mark complete unless screenshots visibly prove: no vertical button text, no cropped JBJ picker, pure-white icons on emerald actions, readable active pills, aligned Relationship Hub controls, and correct portal-specific templates.