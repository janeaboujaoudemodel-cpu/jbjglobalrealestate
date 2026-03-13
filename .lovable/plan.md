
Implementation plan approved scope: deliver in strict batches, no partial rollout.  
Current findings from code/data audit (already executed in this planning pass):
- Source card labels are still wrong in UI (“Source Sync/External Source” instead of Reelly API / Provident).
- Queue stats logic is inconsistent with real data (real queue currently 0 pending, 1819 approved), while UI can still show misleading “needs work”.
- Approval modal still routes review as modal/gallery-only; internal preview exists but legacy redirect is wrong.
- Developer click in pending card goes to generic `/developers` instead of exact developer detail.
- Fixed search bars on Developers/Areas use `top-0` and can overlap utility bar/sidebar; Developers grid uses `px-0` causing edge-touch cards.
- Listing Admin card/header spacing under Owner shell is still too tight.
- Reelly is disabled in settings, but panel UX still behaves like active connection flow.

Execution model (what I will do in implementation messages):
- Batch 1 first (critical user-visible breakages), then Batch 2, etc.
- After each batch: validate counts/navigation/layout before moving to next batch.

Total task inventory: 56 tasks across 8 batches.

Batch 1 — Listing Admin critical fixes (10 tasks)
1) Rename source card A label to “Reelly API”.  
2) Rename source card B label to “Provident Portal”.  
3) Set default selected source to Provident (left), Reelly on right.  
4) Make source-to-tab click open correct tab/source/status consistently.  
5) Fix tabs container edge stretching (remove left/right visual gap).  
6) Fix right-border “open edge” in visibility tab rail.  
7) Increase top spacing of Listing Admin content under “Founder & CEO” bar.  
8) Ensure top divider is visible above Listing Admin card block.  
9) Keep Reelly card minimized/disabled mode when key is missing.  
10) Show clear disabled badge (not repetitive error state).

Batch 2 — Approval queue, preview, navigation correctness (9 tasks)
11) Fix legacy preview redirect to preserve `/owner/listing-admin/preview/:id`.  
12) Add explicit “Open Internal Draft Page” from queue modal/card actions.  
13) Reset gallery index when selected item changes.  
14) Reuse robust image filtering in modal to prevent broken first image.  
15) Developer link from pending card to exact developer detail route (slug/id match).  
16) “Back” from preview returns to approvals with preserved filters/query params.  
17) Replace modal-only dead-end flow with route-aware review flow.  
18) Align queue cards + preview + project page links (internal draft + live when published).  
19) Keep approvals state after navigation (no forced jump to source landing).

Batch 3 — Queue counters and “needs work” truthfulness (7 tasks)
20) Recompute queue summary from backend counts only (not loaded-page heuristics).  
21) Remove document requirement from “complete” logic for Reelly-origin records.  
22) Rebuild needs-work criteria to only true missing core fields.  
23) Add source-aware counters (Reelly/Provident/manual) with consistent formulas.  
24) Sync stat cards with same query logic used in table filter.  
25) Fix “in queue / pending / needs work” mismatches.  
26) Add handover-missing explicit metric (separate from needs-work badge).

Batch 4 — Provident Portal enrichment + non-duplicate merge (8 tasks)
27) Move Provident extraction controls into Provident Portal section (not Reelly block).  
28) Add one-click full Provident scrape run (published + drafts + all projects).  
29) Match by slug variants + normalized name similarity before creating new pending.  
30) Existing project => merge/enrich only (no duplicate project creation).  
31) Not found => create as new pending import.  
32) Capture before/after snapshot fields for each enriched listing.  
33) Show “what changed” per listing (images/docs/amenities/payment/etc.).  
34) Show last run timestamp + run status in Provident Portal header.

Batch 5 — Project Hub + governance metadata (7 tasks)
35) Introduce/rename Projects area as Project Hub with owner controls.  
36) Add per-row source tag (Reelly API / Provident / Manual).  
37) Show created-by / updated-by / last-updated timestamp on projects.  
38) Show same governance metadata on developers list/detail rows.  
39) Add red/green status and suggestion indicators for data quality.  
40) Add bulk controls (hide brochure, visibility toggles, delete flow).  
41) Keep draft-first policy on approvals (no silent auto-publish).

Batch 6 — Search/filter/header layout fixes across pages (7 tasks)
42) Developers fixed filter: offset from sidebar and utility header (`left` + `top` corrected).  
43) Keep horizontal utility header visible while fixed filters are active.  
44) Move arrow controls into row 2, remove extra dedicated arrow strip.  
45) Put “All tiers + developers found” on same line as requested.  
46) Developers filter fields: keep developer-specific fields only (remove project-only filters).  
47) Areas page filter: area-specific fields only, same sticky behavior rules.  
48) Restore card side paddings on Developers (remove edge-touch `px-0` pattern).

Batch 7 — AI tools consolidation + access segmentation (5 tasks)
49) Keep AI Hub as single canonical AI tools landing page.  
50) Redirect/deprecate duplicate AI hub-style pages to canonical AI Hub (no duplicate content).  
51) Ensure all existing AI tools are represented in AI Hub without duplicate cards.  
52) Restrict lead-qualification/objection/property-coach visibility to broker/developer contexts only.  
53) Update sitemap/SEO entries and canonical links to remove duplicate AI route indexing.

Batch 8 — Developer upload review workflow + enterprise docs + auth/performance (3 grouped streams, 3 tasks)
54) Developer upload duplicate detection + edit request + owner approval queue + activity timeline + end-session summary + notification email.  
55) Split document generation into: (a) public general document studio, (b) owner-only JBJ exclusive enterprise docs/e-sign hub with restricted access.  
56) Landing/auth/performance hardening: reduce repetitive welcome gate, persistent session behavior, passkey/biometric-compatible auth path, loader/blink and route-chunk performance cleanup.

Technical implementation map (concise)
- Frontend:  
  `src/pages/ListingAdmin.tsx`, `SourceCountsPanel.tsx`, `ProjectApprovalQueue.tsx`, `PendingImportCard.tsx`, `PendingImportPreview.tsx`, `ReellyImportPanel.tsx`, `ExtractionJobsPanel.tsx`, `Developers.tsx`, `AreaGuides.tsx`, `FilterShortcutBar.tsx`, `OwnerDashboardShell.tsx`, `AdminRoutes.tsx`, `OwnerRoutes.tsx`, `AIHub.tsx`, sitemap/SEO-linked files.
- Backend functions / pipelines:  
  `scheduled-extraction`, `provident-*` sync/enrichment functions, `bulk-approve-imports`, plus audit/session summary and notification flow functions.
- Data model extensions (via migrations):  
  project/developer audit log fields, enrichment before/after snapshot storage, developer session activity log + approval status trail.

What will be executed first in the next implementation message
- Batch 1 + Batch 2 (highest urgency, directly tied to your immediate blockers in Listing Admin, preview, broken navigation, naming, spacing, and image/review flow).  
Then I’ll continue sequentially until all 8 batches are completed.
