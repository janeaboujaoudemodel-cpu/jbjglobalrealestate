## Plan

### 1) Fix access and sidebar visibility immediately
- Hide **Property Comparison** everywhere unless the current mode is **Broker** or the real app owner.
- Apply this to:
  - Vertical sidebar `TOOLS & WORKSPACE`
  - Mega-menu tool links
  - AI Hub / Royal Tools entry if present
  - Property Suite tab
- If a developer/investor directly opens `/compare`, show the broker-only gate instead of the comparison UI.

### 2) Stop the Compare Units reload feeling
- Keep `/compare` mounted and make **Compare Projects / Compare Units** a local section switch.
- Still update `?mode=units` for shareability, but use `replace` and preserve the page shell so it does not feel like a new page reload.
- Remove the separate/manual redirect dependency and keep manual entry inside the compare workspace.

### 3) Upgrade Compare Projects selection
- Add a real project picker at the top of Compare Projects:
  - Search website projects by keyword.
  - Multi-select projects from the portal.
  - Keep current shortlist support, but do not depend only on favorites/shortlist.
  - Allow manual entry and AI-filled entry to appear live in the same comparison table.
- Remove the “Sample data — not your shortlist” label from the preview.

### 4) Upgrade Compare Units into a full card/table workflow
- Replace the current “only search a project” empty state with a full premium comparison card.
- Flow:
  1. Select **one project/developer**.
  2. Add/select multiple units: 1BR, 2BR, 3BR, etc.
  3. Show a live table immediately as units are added or edited.
- Unit table will use the same organized comparison-table language as Compare Projects, but columns are **units**, not project/developer columns.
- Include unit metrics: bedroom type, unit label/number, size, price, price/sqft, view, floor, payment plan, down payment, monthly installment, handover payment, post-handover total, and notes.

### 5) Make tables clearer and better organized
- Rebuild the visual table structure into grouped sections with distinct styling:
  - Project identity
  - Developer profile
  - Location/views
  - Price and unit economics
  - Payment plan
  - AI analysis/recommendation
  - Materials link
- Add the extra project metrics requested:
  - Location
  - Views
  - Project name
  - Developer name
  - Developer description
  - Founded date/year
  - Founder/CEO
  - Delivered projects
  - Years in market
  - Project/developer summary
  - AI recommendation and analysis

### 6) Add client/broker/company branded export
- Add an **Export PDF** button visible in both Compare Projects and Compare Units.
- Before download, open an export details panel/dialog:
  - Client name
  - Client email/phone optional
  - Greeting/welcome note
  - Broker/brokerage name
  - Broker phone/email
  - Broker logo upload or saved logo
- Owner export is locked to **JBJ GLOBAL REAL ESTATE** with company logo and official company details.
- Broker export uses saved broker/brokerage details.
- Generate a PDF matching the preview colors and table layout, not the old HTML download.
- Include: company header, broker details, client details, greeting, comparison table, AI verdict, materials links, disclaimer.

### 7) Broker paid export gate
- Owner can export directly.
- Brokers must pass the paid-download gate before PDF export.
- The UI will collect broker details, then trigger the existing payment/membership path before allowing final download.

### 8) Owner-only promoted AI verdict / focus project
- Add owner-only controls:
  - Select “Focus project” or “Top recommendation”.
  - Highlight that project in the table.
  - AI verdict prioritizes that selected project while still presenting comparison data.
- Brokers can generate neutral comparisons only; no manipulation/focus control.

### 9) Manual + AI fill stays live and editable
- Bring manual comparison into the same page/card instead of a separate route.
- Every input update immediately updates the preview table.
- AI-fill from link/PDF populates editable rows/cards.
- Allow editing any field before saving/exporting.

### 10) Owner-only website enrichment from comparison data
- Add an owner-only “Enrich published project” workflow:
  - When a typed/selected project matches an existing website project, show “Project found” preview.
  - Compare filled fields against published fields.
  - Show only fields that can be updated from the provided data.
  - Owner approves field-by-field changes before applying.
  - Update only provided fields; never delete brochures, floor plans, media, unit details, or unrelated data.
  - Link to the published project after update.
- If there is a conflict, ask owner to choose:
  - Use published value in the comparison, or
  - Replace published value with the comparison value.

### 11) Materials link per project/unit
- For each compared project/unit, allow attaching brochures, floor plans, payment plans, and documents.
- Generate a materials link shown in the comparison table.
- The link page allows individual downloads and “download all”.

### 12) Validation
- Visual-check `/compare` in Developer mode: comparison hidden from sidebar and gated on direct URL.
- Visual-check Broker/Owner mode: comparison visible and usable.
- Test Compare Projects:
  - Search/select multiple projects.
  - Manual edit updates table live.
  - AI fill updates table live.
  - Export PDF downloads.
- Test Compare Units:
  - Select one project.
  - Add 1BR/2BR/3BR.
  - Payment plan table updates live.
  - Export PDF downloads.
- Test PDF output visually against the preview colors/layout.

## Technical notes
- Main files to update: `GlobalVerticalNav.tsx`, `Compare.tsx`, `UnitCompareShell.tsx`, `UnitComparisonTable.tsx`, project picker components, manual entry components, and PDF export utilities.
- New shared compare model will normalize selected website projects, manual projects, and AI-filled projects into one editable structure.
- Owner-only enrichment will use protected backend logic and audit logging; brokers will not be able to update published listings.