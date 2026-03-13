
Approved clarifications locked from your answers:
- Image behavior: **3 dedicated slots** (Card image, Hero/Cover image, Gallery start image).
- Broken published data: **Keep published + flag** (no auto-unpublish).
- Email integration phase 1: **Dual inbox now** (Personal + Company).
- Execution order after media controls: **Email client upgrade first**.

What I found in current code/data (already verified):
- Listing Admin projects already has upload, but no full media controls (delete/reorder/set card/hero/gallery roles).
- `DraggableMediaGrid` exists but is not connected in `ListingAdmin.tsx`.
- Project detail hero currently defaults to first gallery image before `cover_image_url`, so hero behavior is not fully deterministic.
- Database currently shows **2778/2778 projects as published** and **0 drafts**, which is why draft counters look wrong.
- `status='active'` count is only 610, causing count mismatch if any UI uses status instead of `is_published`.
- `pending_project_imports` currently has only approved rows (1819), no pending.
- Founder assistant and email client are not fully wired to unified alert/task/search systems.

Implementation plan (execution order)

Batch 1 — Listing Admin media controls (Projects tab)
1) Add a dedicated “Media Manager” panel inside project edit:
   - Reorder images (drag/drop).
   - Delete image.
   - Set “Card Image”.
   - Set “Hero/Cover Image”.
   - Set “Gallery Start Image”.
2) Persist media role selection:
   - Keep `cover_image_url` as hero source.
   - Add explicit project-level fields for card/gallery-start image (migration).
   - Keep `display_order` for gallery sequence.
3) Make project card + modal + public detail consume those roles consistently.
4) Add visual badges in media grid (Card / Hero / Gallery Start) and enforce one-per-role.

Batch 2 — Email Client upgrade first (your chosen priority)
1) Replace demo-only email UI with owner-grade layout sections:
   - Personal inbox tab.
   - Company inbox tab.
   - Unified compose with sender selector.
2) Fix header spacing/padding at top (compose/search touching issue).
3) Add bulk actions (select, archive, mark read, labels).
4) Wire assistant integration:
   - “Draft reply with Amanda”.
   - “Summarize thread”.
   - Suggested responses panel.
5) Add role-access controls for assistant/admin visibility over inbox views.
6) Keep edge-to-edge layout and responsive behavior at current viewport and desktop/mobile.

Batch 3 — Published vs draft truth + global count consistency
1) Create one canonical counting service used by:
   - Listing Admin counters,
   - Website listings counters,
   - Search/footer/hero aggregates.
2) Standardize all logic on `is_published` for live visibility.
3) Add “Data Quality Flags” lane (missing developer/description/images/handover) while keeping listings published.
4) Add one-click filter views for flagged projects and bulk-fix workflow.
5) Reconcile counters after approve/reject/delete so updates propagate globally.

Batch 4 — Provident-only enrichment operating model
1) Keep Provident as default source context.
2) Separate queues clearly:
   - New from Provident.
   - Existing enriched from Provident.
   - Draft updates.
3) Run one controlled test enrichment for a single project with before/after diff panel.
4) Then run full Provident extraction/enrichment with non-duplicate match-and-merge.
5) Show evidence per listing:
   - What changed (fields/images/docs),
   - Source link,
   - Timestamp,
   - reviewer/uploader metadata.

Batch 5 — Founder Assistant (Amanda) UX + wiring fixes
1) Fix top spacing (Amanda header touching Founder & CEO bar).
2) Move New Chat / History / Save near tools row as requested.
3) Convert Active/Done/Pending into rectangular cards between Amanda header and chat.
4) Expand prompt system:
   - Paginated quick prompts,
   - category sections,
   - dynamic prompts from tasks/alerts.
5) Wire task/notification/escalation counters to real site data sources.
6) Tools taxonomy cleanup:
   - AI tools in tools category only,
   - non-tool operational items in separate categories.
7) Make history badge count red for visibility.

Batch 6 — Search shortcut + fuzzy discovery
1) Upgrade command/search to fuzzy matching (typos + close matches).
2) Index tools/pages/guides/services with synonyms (example: visa -> guide/consultation/eligibility).
3) Return grouped results (AI tools, pages, actions, guides) with quick actions.
4) Ensure shortcut search opens correct target route directly.

Batch 7 — Listing Admin layout & controls polish
1) Convert left vertical “developer/project/alerts/area” style controls into horizontal filter row as requested.
2) Keep card grid with pagination (no infinite long scroll).
3) Add stronger bulk options in projects hub (visibility, docs, media operations).

Batch 8 — Developer Hub exposure in Owner command center
1) Add Developer Hub entry in owner vertical nav.
2) Add it to shortcuts (global search + shortcut surfaces).
3) Ensure role guards and route consistency in owner shell.

Technical details (implementation-focused)
- Frontend files primarily touched:
  - `src/pages/ListingAdmin.tsx`
  - `src/components/listing-admin/DraggableMediaGrid.tsx`
  - `src/components/listing-admin/ProjectPreviewModal.tsx`
  - `src/pages/ProjectDetail.tsx`
  - `src/components/project-detail/ProjectDetailLayout.tsx`
  - `src/pages/EmailClient.tsx`
  - `src/pages/FoundersAssistant.tsx`
  - `src/components/founders-assistant/FoundersChatPanel.tsx`
  - `src/components/founders-assistant/FoundersAIToolsPanel.tsx`
  - `src/components/ui/command-palette.tsx`
  - `src/components/owner-dashboard/OwnerSidebarNav.tsx`
- Backend/database changes needed:
  - Add project media role fields (card image + gallery-start image) and audit columns if missing.
  - Add normalized reporting view/function for consistent published/draft/flagged counters.
  - Add/extend enrichment audit snapshot storage for before/after evidence.
- Data remediation step:
  - Backfill media role defaults from existing ordered images for all projects.
  - Flag-quality scan over 2778 published items with actionable queues (not auto-unpublish).

Delivery sequence I will execute next (strict):
1) Batch 1 (media controls)  
2) Batch 2 (email dual inbox + assistant integration)  
3) Batch 3–8 sequentially, with validation gates after each batch.
