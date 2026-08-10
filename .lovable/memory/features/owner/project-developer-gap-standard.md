---
name: Projects Never Blocked by Missing Developer or Logo (LOCKED)
description: Publishing a project is never blocked by a missing developer profile or missing developer logo; the gap is flagged in the backend queue instead.
type: constraint
---
Owner decision (Aug 2026), supersedes the old "no developer / no logo = cannot publish" rule.

- `enforce_developer_logo_before_publish` no longer raises. It writes
  `projects.developer_gap_reason` (`no_developer_record` | `developer_has_no_logo`)
  and `developer_gap_flagged_at`. Listing-data readiness
  (`jbj_project_publish_blockers_for_row`) is still a hard gate.
- The trigger fires on `UPDATE OF is_published, developer_id`; to recompute flags
  in bulk run `UPDATE projects SET is_published = is_published WHERE ...`.
- View `public.project_developer_gaps` exposes project + developer name + website
  + reason. Backend queue: `/owner/crm/jbj/owner-developer-gaps`
  (`src/pages/owner/DeveloperGapsQueue.tsx`), grouped by developer so the owner
  can contact the brand for its logo.
- Batch 17: 114 developer profiles were auto-created from `projects.developer_name`
  (flagged `created_from_project_gap`, HQ Dubai) and their projects linked.
  16 DLD legal-name shells received plain white Jost wordmarks at
  `developer-logos/wordmark-v1/<slug>-tight.png` (`logo_source='jbj-wordmark-v1'`).
- Remaining: 115 developers still need real sourced marks; 249 live projects have
  no developer name written on them at all.
