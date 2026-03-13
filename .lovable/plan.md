
Goal: deliver a full rollout now across Listing Admin + extraction automation + Developer Portal + shortcuts, with provider names visible only in admin, no emojis, and correct queue/math behavior.

1) Listing Admin UI cleanup + count integrity
- Replace all emoji-based source labels with premium UI components/icons and champagne-gold styling.
  - Main fixes in `ProjectApprovalQueue.tsx` source dropdown/badges/cards.
  - Replace native `<select>` with styled `Select` and Lucide icons.
- Fix incorrect queue math (e.g., “repairing 36 on 10”):
  - Make one canonical “needs work” definition used by ALL cards, filters, and progress bars.
  - Remove mixed fallback counts (`totalNeedsWorkCount ?? needsWorkCount`) that combine incompatible logic.
  - Eliminate overlapping category totals in `SyncDashboard.tsx` (current additive model can exceed pending total).
- Fix “Needs Work (7)” confusion in cards:
  - Split into “Core missing” vs “Optional missing” counters.
  - Show a deterministic checklist in card/preview (description, price, handover, images, docs, etc.) with readable labels.
- Normalize document layout in queue cards and preview:
  - Consistent document grouping, type badges, and ordering.
  - Surface missing/available docs in a structured block instead of mixed inline chips.

2) Extraction pipeline: remove manual “Fix All” dependency, run daily automation
- Remove/de-emphasize “Fix All Listings” CTA from queue workflow and replace with automated status messaging.
- Implement/enable scheduled daily extraction orchestration for external-source pending imports:
  - Use pg_cron job to trigger backend extraction runner at fixed daily schedule.
  - Keep manual “Run now” for admins as an emergency fallback only.
- Make pipeline idempotent and complete:
  - Always enrich missing description, price, handover, images, docs, amenities.
  - Persist extraction checkpoints + run logs for admin visibility.
- Harden extraction parsing:
  - Dynamic column/header mapping for imported tabular files.
  - Locale-aware numeric parsing and cents-safe arithmetic for money fields.
- Maintain source privacy rule:
  - Provider/source identifiers stay admin-only.
  - Public-facing pages never show provider names/links/attribution.

3) Admin data model + workflow alignment (backend)
- Add/extend backend schema for robust enrichment + review:
  - `pending_project_imports`: clearer extraction state fields, last_extracted_at, extraction_error, extraction_version.
  - Introduce `project_change_requests` + `project_change_request_items` (or equivalent) for developer-submitted edits to published projects.
  - Introduce `project_audit_logs` for immutable “what changed / by whom / when”.
- Keep strict RLS:
  - Admin/listing-admin can manage queue and change requests.
  - Developer representatives can submit edits only for their scoped projects.
  - Public read remains for published project display only.
- Ensure no roles are stored on profiles/users table; role checks stay server-side.

4) Developer Portal: full project review/edit loop for registered developers
- Add a dedicated “My Live Projects” management experience:
  - Show all projects tied to developer (logo, area, description, floor plans, location, media).
  - Field-by-field review/edit UI with premium listing-style layout.
- Add link-first extraction path for developer mode:
  - Developer submits project link(s); system extracts and stores source link + extracted content + uploaded files.
  - Include explicit “manual override” editing before submit.
- Submit-for-approval flow:
  - Developer edits create a change request (not direct live overwrite).
  - Owner/admin sees diff view (before/after), uploaded docs, and approval actions.
- Keep full traceability:
  - Persist all submitted links, extracted artifacts, and file references in Developer Hub records.
  - Show change history to admin and owner.

5) Premium listing-style parity in developer submission UX
- Refactor developer listing creation UI to reuse premium listing creator patterns (phased stepper, extraction + review + submit experience).
- Keep developer constraints:
  - Link input is project-linked workflow first.
  - Preserve manual edit option at every stage.
- Add quality feedback:
  - Extraction confidence + missing-field meter before submit.

6) Shortcuts and navigation wiring
- Add Developer Hub shortcuts consistently in:
  - Owner shortcuts cards (`DepartmentShortcuts`/owner dashboard modules),
  - Vertical navigation shortcuts (`GlobalVerticalNav`),
  - Horizontal header search shortcuts (`MegaMenuAccount` and global search index).
- Ensure route discoverability on all device breakpoints and in search dropdown.

7) Source naming, compliance, and visibility rules
- Admin: allow explicit provider names in source filter/cards per your preference.
- Public UI: strictly suppress provider identity and external-source links.
- Apply/extend sanitizer and presentation guards so provider references cannot leak into public cards/details/SEO.

8) Execution order (full rollout, safe sequence)
- Phase A: Queue math + UI cleanup + remove emoji usage + docs alignment.
- Phase B: Daily extraction scheduler + runner hardening + admin run logs.
- Phase C: Developer project review/edit + approval/diff/audit model.
- Phase D: Shortcut wiring + final polish/regression pass.

9) Validation checklist before completion
- Queue counts never exceed pending totals; “needs work” numbers are stable across cards/filters.
- No emoji/cheap iconography in admin source controls.
- Daily extraction job runs automatically and updates queue without pressing “Fix All”.
- Public pages show no provider attribution; admin still can filter by provider.
- Developer can edit existing published project data through approval workflow, and owner can see exact change diffs + uploaded docs.
- Developer Hub shortcuts appear in owner shortcuts, vertical nav, and header search.
