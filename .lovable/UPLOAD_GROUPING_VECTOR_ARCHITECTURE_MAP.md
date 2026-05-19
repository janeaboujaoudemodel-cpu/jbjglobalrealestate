# Upload / Grouping / Vector Architecture Map
**Status:** PAPER-ONLY — no implementation until approved.
**Scope:** Workstream B prerequisites. Locks identity, lifecycle, failure handling, and QA contract BEFORE any code.

---

## 0. Operating Contract (locked)
1. **Architecture first → lifecycle second → failure handling third → QA matrix fourth → implementation fifth.**
2. No duplicate upload systems. No duplicate grouping systems. No competing image identity sources.
3. Additive-only migrations. No destructive change to existing upload tables, storage buckets, or RLS.
4. Every state transition must be auditable (who/what/when/why).
5. No silent failures. Every failure produces a user-visible state + a recoverable action.

---

## 1. Upload Architecture Audit

### 1.1 Canonical tables (intended single source of truth)

| Table | Role | Owner |
|---|---|---|
| `upload_batches` | One row per user-initiated upload session. Lifecycle anchor. | `created_by` (user) + admin |
| `upload_batch_images` | One row per physical file inside a batch. Identity row. | inherits via `batch_id` |
| `image_groups` | Logical grouping (manual OR AI). Never replaces image identity. | `batch_id` scoped |
| `image_group_members` | M:N between `upload_batch_images` and `image_groups`. **Unique (image_id) per active group** — see §3. |
| `image_embeddings` | Vector rows keyed to `upload_batch_images.id`. 1:1, nullable. | system |
| `image_phash` | Perceptual hash keyed to `upload_batch_images.id`. 1:1. | system |
| `studio_jobs` | Studio pipeline runs. References `master_image_id`. | system |
| `upload_retry_queue` | Resumable / failed upload chunks. | system + user |

**Rule:** No other table may claim "this is the image". All downstream features (studio, AI grouping, master selection) reference `upload_batch_images.id` only.

### 1.2 Flow diagram (textual)

```
[Client picks files]
        │
        ▼
[upload_batches INSERT  status=draft]
        │
        ▼
[upload_batch_images INSERT per file  status=pending]
        │
        ├─► [chunked upload → storage bucket]  ──► status=uploaded
        │                                       │
        │                                       ▼
        │                              [phash worker]  ──► image_phash row
        │                                       │
        │                                       ▼
        │                              [embedding worker]  ──► image_embeddings row
        │                                       │
        │                                       ▼
        │                              [grouping worker]  ──► image_group_members
        │                                       │
        │                                       ▼
        │                              [master selection]  ──► image_groups.master_image_id
        │                                       │
        │                                       ▼
        │                              [studio_jobs queued]
        ▼
[upload_batches status transitions: draft → uploading → processing → ready → archived]
```

### 1.3 No-duplication guarantees
- **One upload path:** all clients (drag-drop, picker, RAW, ZIP-extracted) funnel through `upload_batch_images`. ZIP extraction inserts children with `source_archive_id` pointing at the parent row — NOT a parallel table.
- **One grouping path:** manual grouping and AI grouping both write to `image_group_members`. They differ only by `created_by_kind ∈ ('user','ai')` + `confidence` (null for manual, 0–1 for AI).
- **One identity:** `upload_batch_images.id` is the only image PK referenced anywhere downstream.

---

## 2. Vector Architecture Validation

### 2.1 Dimensional consistency
- **Model:** `google/gemini-embedding-001` via Lovable AI Gateway.
- **Dimensions:** 1536 (Matryoshka-truncated from 3072 via `dimensions: 1536` request param). Locked. `image_embeddings.embedding vector(1536)`.
- **Rationale:** halves storage + index size vs 3072; still strong retrieval quality for visual-product similarity.
- **`model_version` column required** on `image_embeddings` so a future model switch does not silently corrupt search.

### 2.2 Indexing strategy
- `CREATE INDEX … USING hnsw (embedding vector_cosine_ops)`.
- `m=16, ef_construction=64` defaults; revisit only after >100k rows.
- Index built **after** initial backfill, not before.

### 2.3 Fallback behavior
- If gateway returns 429/402/500 → mark `image_embeddings.status='failed'`, increment `retry_count`, requeue with exponential backoff (1m, 5m, 30m, 2h, then dead-letter).
- Grouping must degrade gracefully: missing embedding → fall back to phash-only grouping with `confidence` capped at 0.6.
- UI must surface "Similarity unavailable for N images" instead of pretending success.

### 2.4 Cleanup logic
- Embedding rows are **child of** `upload_batch_images`. `ON DELETE CASCADE`.
- When an image is soft-deleted (`upload_batch_images.deleted_at`), embedding row stays for 30 days then a nightly job hard-deletes. Prevents orphan embeddings.

### 2.5 Storage growth expectations
- 1536 floats × 4 bytes = ~6 KB per row + index overhead ≈ ~10 KB.
- 100k images ≈ 1 GB. 1M images ≈ 10 GB. Within Postgres comfort zone with HNSW.

### 2.6 Orphan prevention checklist
- FK CASCADE on delete.
- Nightly reconciliation: `image_embeddings LEFT JOIN upload_batch_images WHERE images.id IS NULL` → alert + cleanup.

---

## 3. Image Identity Hierarchy (LOCKED)

Strict, non-overlapping roles per `upload_batch_images` row, expressed via columns — **not** separate tables:

| Role | Column / derivation | Constraint |
|---|---|---|
| **Original upload** | `kind='original'`, `parent_image_id IS NULL` | Default state. Never mutated after upload. |
| **Variant** | `kind='variant'`, `parent_image_id = <original>.id` | Variants reference an original. A variant **cannot** become a parent. Enforced by CHECK: `kind='variant' → parent_image_id IS NOT NULL` AND trigger blocking children of variants. |
| **Grouped image** | Membership in `image_group_members`. Not a column. | An image may appear in **at most one ACTIVE group** (`UNIQUE (image_id) WHERE status='active'`). Historical group memberships kept with `status='superseded'`. |
| **Master image** | `image_groups.master_image_id` → one image per group | Master must be a member of its own group (trigger-enforced). Master must have `kind='original'` (never a variant). Replacing master archives old master assignment, does not delete. |
| **Studio hero** | `studio_jobs.hero_image_id` references master at job time | Snapshotted. Changing group master later does NOT retroactively change shipped studio jobs. |
| **Duplicate-detection image** | Derived from `image_phash` matches + embedding cosine ≥ threshold. Not a separate row. | Surfaces as a *suggestion* in UI, never auto-merges. |

### Anti-loop guarantees
- `parent_image_id` cannot equal `id` (CHECK).
- `parent_image_id` chain depth limited to 1 (variant of variant disallowed by trigger).
- Group master cannot be a variant.
- Deleting an image: if it is a master, group enters `status='needs_master'` and blocks studio jobs until reassigned. Never silently picks a new master.

---

## 4. Upload Resiliency Plan

| Concern | Rule |
|---|---|
| **Partial upload recovery** | Tus-style resumable chunks. Each chunk row in `upload_retry_queue` with `(image_id, chunk_index, byte_range, sha256)`. Server idempotent on `(image_id, chunk_index, sha256)`. |
| **Retry behavior** | Per-chunk: 3 immediate retries, then exponential backoff (5s, 30s, 5m). Per-image: max 10 chunk failures → mark image `status='failed'`, surface in UI. |
| **Corruption handling** | Client computes sha256 per chunk + per file. Server re-verifies. Mismatch → discard chunk, force re-upload of that chunk only. |
| **Duplicate chunk prevention** | Unique `(image_id, chunk_index)` in retry queue; idempotent PUT with sha256 dedupe. |
| **Refresh / browser close** | IndexedDB persists `{image_id, chunk_cursor, file_handle_ref}`. On reopen, resume from server's `next_expected_chunk`. |
| **Offline handling** | Worker pauses, queue stays in IndexedDB, resumes on `navigator.onLine`. UI shows "Paused — offline". |
| **Cancellation** | User cancel → mark batch `status='cancelled'`, server stops accepting new chunks for that batch, storage cleanup job sweeps orphan chunks after 24h. |
| **Queue priority** | FIFO per batch; smaller files prioritized within batch to give early visual feedback. |
| **Max concurrency** | 3 parallel files × 4 parallel chunks per file = 12 in-flight requests max. Hard cap. |
| **RAW memory** | RAW files NEVER fully loaded in memory. Streamed from `File` handle via `slice()`. Preview generation deferred to server-side worker. |

---

## 5. RAW / ZIP Support

| Concern | Rule |
|---|---|
| **Supported formats** | RAW: `.cr2 .cr3 .nef .arw .dng .raf .orf .rw2`. ZIP: standard PKZIP (no encrypted, no rar/7z in v1). |
| **Extraction limits** | ZIP max 500 entries, max 2 GB uncompressed total, max 50 MB per entry. Reject before extraction if header reports beyond limits. |
| **Malware protection** | Server-side extraction only (never client). Antivirus scan hook (clamd or equivalent) before files become visible. Quarantine status until clean. |
| **ZIP bomb protection** | Compression ratio > 100:1 → reject. Per-entry uncompressed size enforced during streaming extract (abort mid-stream if exceeded). |
| **Duplicate extraction** | If batch already contains image with same sha256, skip extraction, log as `duplicate_skipped`. |
| **Filename normalization** | NFKD unicode normalize → strip control chars → collapse whitespace → truncate 200 chars → preserve extension. Reuse existing `developerFileValidation.sanitizeFileName`. |
| **Storage quota** | Per-user soft cap (e.g., 50 GB) enforced before extraction starts; abort entire ZIP if would exceed. |
| **Timeout** | ZIP extraction job: 10 min hard timeout. On timeout → mark `status='extraction_timeout'`, partial children stay with `source_archive_status='partial'`. |

---

## 6. AI Grouping Safety

| Concern | Rule |
|---|---|
| **Confidence thresholds** | `≥0.92` auto-group (still reversible). `0.75–0.92` suggested, requires user confirm. `<0.75` ignored. |
| **Manual override priority** | Manual group membership wins always. AI never moves an image out of a manually-created group. AI suggestions on manually-grouped images are surfaced as "merge?" prompts, never auto-applied. |
| **Rollback** | Every AI grouping action writes an `image_group_audit` row. One-click undo restores prior `image_group_members` snapshot within 30 days. |
| **Regroup** | Re-running AI on a batch does NOT delete existing groups. It proposes additions/merges as suggestions. |
| **Audit trail** | `image_group_audit (id, group_id, image_id, action, actor_kind, actor_id, confidence, model_version, created_at)`. Append-only. |
| **Cross-batch contamination** | AI grouping is **batch-scoped by default**. Cross-batch suggestions only when user explicitly enables "find similar across batches" and only as suggestions. |
| **Same item / different color** | Color histogram delta > threshold → keep as sibling variants under same `parent_image_id`, NOT same group master. |
| **Same item / different size** | Aspect ratio + EXIF dimension diff → siblings, same rule as color. |
| **Studio consistency scoring** | Per-group score = mean pairwise cosine of members. Score < 0.85 → flag group as "low consistency" in UI before studio job. |

---

## 7. Admin Batches Tab

| Concern | Rule |
|---|---|
| **Lifecycle states** | `draft → uploading → processing → ready → archived`. Plus terminal: `failed`, `cancelled`. |
| **Progress states** | Per-batch counters: `files_total, files_uploaded, files_phashed, files_embedded, files_grouped`. Computed view, not denormalized columns. |
| **Stuck-job recovery** | Heartbeat per worker job. No heartbeat 5 min → job auto-requeued. After 3 requeues → dead-letter + admin alert. |
| **Retry controls** | Admin-only "Retry failed images" and "Retry failed embeddings" actions. Per-batch + per-image granularity. |
| **Batch ownership** | `created_by` user owns; admins have read+intervene rights via `requireOwnerAuth`. RLS unchanged. |
| **Rollback** | Admin can soft-delete a batch (cascades to images, groups, embeddings via `deleted_at`). 30-day undo window. Hard delete after 30 days by nightly job. |
| **Error surfacing** | Every failure row carries `error_code` (enum) + `error_detail` (text). UI shows code + human message; never leaks stack traces. |
| **Queue visibility** | Admin sees `upload_retry_queue` filtered by batch. |
| **Processing visibility** | Real-time channel on `upload_batches` + `upload_batch_images` status changes. |
| **AI vs manual distinction** | Every group, every membership, every master selection carries `actor_kind ∈ ('user','ai','admin')`. Filterable in admin UI. |

---

## 8. Failure Mode Matrix (pre-implementation)

| Failure | Detected by | User-visible state | Recovery |
|---|---|---|---|
| Chunk upload fails | Client + server sha256 | "Retrying chunk N/M" | Auto-retry, then surface |
| Whole file fails | Retry exhaustion | Image row `status='failed'` with reason | Manual retry button |
| Phash worker fails | Worker heartbeat | Image `phash_status='failed'` | Auto-requeue, then admin retry |
| Embedding gateway 402 | HTTP status | Batch banner: "AI similarity paused — add credits" | Admin adds credits, retry button |
| Embedding gateway 429 | HTTP status | Silent backoff | Auto-resume |
| ZIP bomb | Extraction guard | Batch: "Archive rejected: suspicious compression" | None (rejected) |
| ZIP timeout | 10m timer | Batch partial; children flagged | Admin "resume extraction" |
| Group master deleted | Trigger on image delete | Group: `status='needs_master'` | User picks new master |
| Variant promoted to parent (blocked) | CHECK constraint | API error surfaced as toast | None — by design |
| Orphan embedding | Nightly recon | Admin alert | Auto-cleanup |
| Browser closed mid-upload | IndexedDB on reopen | "Resume 3 in-progress uploads?" | Resume button |

---

## 9. QA Matrix Contract (must be filled BEFORE implementation marked done)

For each of these, a real pass/fail line — never "looks fine":

- [ ] Upload 1 file → batch reaches `ready` with all child statuses green.
- [ ] Upload 100 files concurrently → concurrency cap (12 in-flight) respected.
- [ ] Kill browser tab mid-upload → reopen → resume completes.
- [ ] Offline mid-upload → restore network → resume completes.
- [ ] Upload corrupted chunk (manual sha mismatch) → server rejects, client retries.
- [ ] ZIP with 600 entries → rejected with clear error.
- [ ] ZIP bomb (1KB → 10GB) → rejected pre-extraction.
- [ ] RAW file (50 MB .cr3) → preview generated, memory stays bounded.
- [ ] Embedding gateway returns 402 → batch shows banner, no silent failure.
- [ ] Embedding gateway returns 429 → auto-backoff, eventual success.
- [ ] Manual group exists → AI proposes merge → manual wins until user confirms.
- [ ] Delete master image → group enters `needs_master`, studio blocked.
- [ ] Soft-delete batch → 30-day undo restores everything including embeddings.
- [ ] Variant of variant attempted → blocked by trigger.
- [ ] Same image in two active groups attempted → blocked by unique partial index.
- [ ] No blue tokens anywhere in new UI (scripts/contrast/check-no-blue.mjs).
- [ ] No gold fills (memory rule).
- [ ] Champagne theme + IconTile compliance.
- [ ] RLS unchanged on existing tables (linter clean).

---

## 10. Open Questions (need owner answer before implementation)

1. **Storage backend for chunks** — reuse existing `assistant-files` / `rel-media` buckets, or new `upload-chunks` bucket with shorter retention?
2. **Per-user storage quota** — 50 GB default OK, or different per role (broker vs developer vs owner)?
3. **Admin alert channel** for dead-letter / stuck jobs — existing audit log + email, or new dashboard widget?
4. **Cross-batch AI similarity** — opt-in default OFF (recommended) or opt-in default ON for owner only?
5. **Variant depth** — locking at depth 1 (variant cannot have children). Confirm acceptable, or need depth 2 for "color of size of base"?
6. **Retention of soft-deleted batches** — 30 days proposed. Confirm or change.
7. **Antivirus** — do we have clamd available in edge runtime, or do we defer AV to a queue + external scan?

---

## 11. What this document does NOT do
- Does not create tables.
- Does not write migrations.
- Does not introduce IndexedDB, Web Workers, resumable uploads, embeddings, or RAW/ZIP code.
- Does not touch RLS, existing buckets, or existing upload paths.

**Next step:** owner reviews §10 open questions + locks the contract. Only then do we proceed to Workstream B implementation, in this order: schema migration → lifecycle workers → resumable client → RAW/ZIP → embeddings → AI grouping → admin tab. Each step gated by its own QA matrix row above.
