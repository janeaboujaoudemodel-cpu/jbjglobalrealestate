---
name: Developer Media Repair Batching (LOCKED)
description: How developer logo/cover repair batches are tracked so no developer is ever re-processed twice.
type: feature
---

# Developer Media Repair Batching

- Every developer touched by a media-repair batch is logged in `public.developer_media_repair_attempts`
  (`developer_id`, `batch`, `outcome` = `fixed` | `no_authentic_source`, `note`).
- A new batch worklist MUST be built with `NOT EXISTS (select 1 from developer_media_repair_attempts ...)`
  so previously attempted developers are never re-run.
- Batch size = 40 developers, ordered: has website first, then A–Z.
- Each batch must report before/after counts of missing logos and missing covers, plus a
  screenshot proof sheet of every accepted and rejected candidate.
- Only assets from the developer's own official website/brochure are accepted. Reject stock photos,
  lifestyle/people shots, promo banners with text overlays, AI-generated art, facility-management or
  same-name unrelated companies. Never invent or generate developer media.
