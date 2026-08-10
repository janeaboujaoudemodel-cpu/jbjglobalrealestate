---
name: Woven Enrichment Pipeline (LOCKED)
description: Woven.ae is a staged, owner-reviewed enrichment source for projects/developers — never a live write, never unit/resale inventory, never Woven contact details.
type: feature
---

# Woven Enrichment Pipeline

Source: `https://api.woven.ae/marketplace/projects` (requires `Origin: https://www.woven.ae`).
Scope: project-level and developer-level data only.

Rules (LOCKED):
- Nothing crawled is written live. Everything lands in `woven_staged_projects` /
  `woven_staged_developers`, is scored into `woven_review_matches`, and only
  moves after the owner picks MERGE / KEEP SEPARATE / IGNORE at
  `/owner/crm/jbj/owner-woven-import` (`src/pages/owner/WovenImportHub.tsx`).
- Manually edited JBJ fields always win. Per-field origin is recorded in
  `record_field_provenance`; owner values are never overwritten by an import.
- Never import unit-level or resale inventory, availability counts, prices per
  unit, phone numbers, emails, WhatsApp numbers, or Woven agents. Availability
  stays "On Request" and all contact routes stay JBJ's.
- Ready / sold-out projects are staged with `is_offplan = false` and excluded.
- Deduplication key: normalized project name + normalized developer name, with
  bonuses for same area, matching coordinates and identical Woven source URL.

Run 1 (Aug 2026): 336 developers, 1,749 project pages → 1,550 off-plan
(769 new, 781 merge candidates), 199 ready/sold-out excluded, 48 new developers,
288 developer matches, 0 extraction failures. Coverage: UAE + Türkiye.
