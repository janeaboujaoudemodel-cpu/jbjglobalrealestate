# Workstream B — Decision Questions + Lifecycle Lock
**Status:** PAPER-ONLY. Implementation gated on owner sign-off of every Q below + every lifecycle rule.
**Companion to:** `.lovable/UPLOAD_GROUPING_VECTOR_ARCHITECTURE_MAP.md`

---

## PART 1 — Decision-Grade Questions

Format for every Q: **Recommended · Alternatives · Scalability · Storage/Cost · Security · UX · Migration risk later · Reversibility**

---

### Q1. Storage bucket strategy
**Question:** Where do upload chunks and final assets live?

- **Recommended:** Two new dedicated buckets — `upload-chunks` (private, 24h auto-expiry on orphans) + `upload-assets` (private, permanent, signed-URL reads). Do NOT reuse `assistant-files` or `rel-media`.
- **Alternatives:** (a) Reuse `rel-media` for finals; (b) S3 connector for finals, Supabase for chunks; (c) single bucket for both.
- **Scalability:** Dedicated buckets allow independent lifecycle rules + per-bucket quota. Reusing existing buckets mixes RLS policies and complicates retention.
- **Storage/cost:** Chunks bucket churns — cheap if TTL'd at 24h. Assets bucket grows linearly. S3 cheaper above ~1 TB; Supabase simpler below.
- **Security:** Separate buckets = separate RLS scopes. Reuse risks accidental cross-feature read.
- **UX:** Invisible.
- **Migration risk later:** Switching buckets later requires re-signing all asset URLs and a copy job. Medium pain.
- **Reversibility:** **Hard to reverse** once URLs are persisted in `upload_batch_images.storage_path`. Decide now.

---

### Q2. Per-user storage quota
**Question:** Default quota and per-role overrides?

- **Recommended:** 50 GB owner, 20 GB developer, 10 GB broker, 2 GB investor. Soft warn at 80%, hard block at 100%.
- **Alternatives:** Single 50 GB flat; unlimited for owner; pay-as-you-grow.
- **Scalability:** Tiered quotas keep cost predictable; flat-50GB explodes if brokers go heavy.
- **Storage/cost:** ~$0.021/GB/mo Supabase. 100 active users at avg 10 GB = 1 TB ≈ $21/mo. Manageable.
- **Security:** Quota is anti-abuse (prevents single account exhausting bucket).
- **UX:** Must show usage bar + clear "upgrade or delete" message at hard cap. Quota errors must NOT lose work — block at batch creation, not mid-upload.
- **Migration risk later:** Raising quotas is trivial; lowering them retroactively requires user warning + grace period.
- **Reversibility:** **Easy** — quota is a single config row per role.

---

### Q3. Cross-batch AI similarity (default state)
**Question:** Does AI grouping look across batches by default?

- **Recommended:** **OFF by default for all roles. Owner-only opt-in toggle.**
- **Alternatives:** Always on; on for owner, off for others; user-toggleable per batch.
- **Scalability:** Cross-batch search means HNSW queries scan global index — fine at 100k, slower at 10M.
- **Storage/cost:** No new storage; query cost grows ~log(N) with HNSW.
- **Security:** **Cross-batch reveals existence of other users' images.** Even "suggestion only" leaks information. Must be hard-scoped by `created_by` even when toggle is ON.
- **UX:** OFF default keeps grouping deterministic and easy to QA. ON later is additive.
- **Migration risk later:** Turning ON later is a config flag, no schema change.
- **Reversibility:** **Easy** — feature flag.

---

### Q4. Variant depth
**Question:** Max depth of `parent_image_id` chain?

- **Recommended:** **Depth = 1 (variant cannot have children).** Enforced by trigger.
- **Alternatives:** Depth 2 ("color of size of base"); unlimited.
- **Scalability:** Depth 1 keeps queries O(1). Unlimited needs recursive CTEs.
- **Storage/cost:** Negligible difference.
- **Security:** Deeper chains = more places for permission bugs.
- **UX:** Real fashion catalogues sometimes need (base → color → size). Depth 1 forces flat siblings — UI groups them via `variant_axis` (color/size) column instead.
- **Migration risk later:** Going from depth 1 → depth 2 later requires backfill + trigger change. **Medium** pain.
- **Reversibility:** **Hard** — once depth-2 rows exist, can't collapse without data loss.

---

### Q5. Retention of soft-deleted batches
**Question:** How long do soft-deleted batches stay recoverable?

- **Recommended:** **30 days** soft, then hard delete + storage purge nightly.
- **Alternatives:** 7 days (cheap), 90 days (safe), forever (legal risk).
- **Scalability:** 30 days × 100 deletes/day × 10 GB = 30 TB pending. Aggressive but feasible.
- **Storage/cost:** Longer = more $$. 30d is industry norm (Gmail, Dropbox).
- **Security:** Right-to-be-forgotten (GDPR) — 30d satisfies "without undue delay". Anything > 90d needs legal review.
- **UX:** "Restore within 30 days" is a clear, familiar promise.
- **Migration risk later:** Changing the window is a cron config.
- **Reversibility:** **Easy.**

---

### Q6. Antivirus / malware scanning
**Question:** Where and when does AV happen?

- **Recommended:** **Async queue + external scan via edge function calling a hosted scanner (e.g., VirusTotal API or Cloudmersive).** Files land in `quarantine` status; promoted to `clean` only after scan. Brochure/PDF + ZIP entries scanned; raw images allowed pre-scan but flagged.
- **Alternatives:** (a) Synchronous clamd in edge runtime — NOT available in Supabase edge; (b) skip AV entirely; (c) client-side hash check against known-bad list.
- **Scalability:** Async queue handles bursts; sync would time out edge functions.
- **Storage/cost:** VirusTotal free = 4 req/min — too low. Paid tier or Cloudmersive ~$0.001/scan. 1000 uploads/day ≈ $1/day.
- **Security:** **Required** for ZIP and any file shown to other users. Without AV, one infected brochure becomes a vector.
- **UX:** "Scanning…" badge for a few seconds. Quarantined files cannot be shared or studio-processed.
- **Migration risk later:** Adding AV later means backfilling all existing files — painful. **Decide now.**
- **Reversibility:** **Hard.** Decide AV vendor before going live with public sharing.

---

### Q7. RAW file handling
**Question:** Server-side RAW conversion or client-side?

- **Recommended:** **Server-side via worker (sharp + libraw)**. Client uploads RAW bytes as-is; worker generates JPEG preview + thumbnail. Original RAW kept in `upload-assets`, derivatives in same row.
- **Alternatives:** Client-side dcraw.js (heavy, 5MB WASM, slow); skip RAW (rejected — needed for fashion shoots).
- **Scalability:** Worker pool scales horizontally; client conversion blocks the user's CPU.
- **Storage/cost:** RAW + JPEG ≈ 1.2× storage. Acceptable.
- **Security:** libraw has had CVEs — pin version, sandbox worker, never execute embedded scripts.
- **UX:** Upload feels fast (raw bytes only); preview appears 5–30s later. UI must show "Generating preview…" instead of broken thumbnail.
- **Migration risk later:** Switching converter (libraw → libvips) is internal.
- **Reversibility:** **Easy** if derivative paths are regenerable.

---

### Q8. ZIP extraction model
**Question:** Extract on upload or on demand?

- **Recommended:** **Extract immediately on upload, server-side, streamed.** Hard limits: 500 entries, 2 GB uncompressed, 50 MB per entry, 100:1 ratio cap.
- **Alternatives:** Lazy extract on user click; extract client-side (memory bombs); skip ZIP.
- **Scalability:** Immediate extract uses worker pool, predictable load. Lazy extract creates "first-click is slow" surprise.
- **Storage/cost:** Extracted files counted in user quota (not raw ZIP). Original ZIP discarded after successful extract unless user opts to keep.
- **Security:** ZIP bombs blocked pre-extraction by ratio check. Path traversal blocked by `sanitizeFileName` on every entry.
- **UX:** Progress per entry; partial success allowed (`source_archive_status='partial'`).
- **Migration risk later:** None — extraction is deterministic from the ZIP.
- **Reversibility:** **Easy.**

---

### Q9. Embedding retry lifecycle
**Question:** How aggressive is the retry?

- **Recommended:** **5 attempts: 1m, 5m, 30m, 2h, 12h. Then dead-letter + admin alert.** Per-image, not per-batch.
- **Alternatives:** Fewer retries (cheaper but stalls UX); infinite (cost risk on persistent 402).
- **Scalability:** Per-image queue prevents one bad file from blocking a batch.
- **Storage/cost:** Each retry = 1 gateway call. 5 retries × failed rate (1%?) = ~0.05 extra calls per image. Negligible.
- **Security:** Backoff prevents amplification attack on gateway.
- **UX:** Per-image status visible; batch shows "8/10 embedded, 2 retrying".
- **Migration risk later:** Easy — config only.
- **Reversibility:** **Easy.**

---

### Q10. Orphan cleanup cadence
**Question:** How often do we sweep orphans (embeddings, phashes, chunks, soft-deleted)?

- **Recommended:** **Nightly cron at 03:00 UTC.** Separate jobs for: chunk-bucket TTL (24h), embedding orphans, phash orphans, soft-deleted hard-delete (30d), studio job orphans.
- **Alternatives:** Real-time triggers (expensive, race conditions); weekly (too slow for chunks).
- **Scalability:** Nightly batch is cheap, deterministic.
- **Storage/cost:** Saves storage proportional to churn.
- **Security:** Stale chunks = leaked partial content. 24h cap is necessary.
- **UX:** Invisible.
- **Migration risk later:** Easy — cron schedule edit.
- **Reversibility:** **Easy.**

---

### Q11. AI vs manual grouping precedence
**Question:** Who wins when AI and manual disagree?

- **Recommended:** **Manual always wins. AI may only SUGGEST on manually-grouped images, never auto-move.** All AI actions are reversible via 30-day audit snapshot.
- **Alternatives:** AI wins above 0.95 confidence (dangerous); user picks per-batch.
- **Scalability:** No impact.
- **Storage/cost:** Audit table grows linearly with actions — partition quarterly.
- **Security:** Manual-wins is the only model that doesn't surprise users.
- **UX:** AI surfaces as banners ("3 merge suggestions") — never silent mutation.
- **Migration risk later:** Easy to relax later; impossible to tighten retroactively without trust damage.
- **Reversibility:** **Hard** — once users see AI auto-moving things, trust is lost.

---

## PART 2 — Lifecycle Diagrams (LOCKED on approval)

ASCII state machines. Every transition has: trigger · actor · audit row · reversibility.

### 2.1 Upload lifecycle (batch)
```text
   ┌────────┐  user creates    ┌──────────┐  first chunk    ┌────────────┐
   │ draft  │ ───────────────▶ │ uploading│ ──────────────▶ │ processing │
   └────────┘                  └──────────┘                 └─────┬──────┘
       │                            │                             │
       │ cancel                     │ cancel                      │ all images ready
       ▼                            ▼                             ▼
   ┌────────────┐              ┌────────────┐              ┌────────┐
   │ cancelled  │              │ cancelled  │              │ ready  │
   └────────────┘              └────────────┘              └───┬────┘
                                                              │ user archives
                                                              ▼
                                                         ┌──────────┐
                                                         │ archived │
                                                         └──────────┘
   Any state ──fatal─▶ ┌────────┐
                       │ failed │  (recoverable via admin retry)
                       └────────┘
```
Reversible: `cancelled → draft` (admin only, 24h window). `archived → ready` (user, anytime).
Terminal: `failed` after 3 admin retries.

### 2.2 Image lifecycle
```text
 pending ─upload start─▶ uploading ─sha ok─▶ uploaded
                                              │
                                              ├─phash worker─▶ phashed
                                              ├─embed worker─▶ embedded
                                              └─group worker─▶ grouped
                                                                │
                                                                ▼
                                                              ready
                                                                │
                                                  user soft-delete │ master deleted
                                                                ▼   ▼
                                                          deleted   needs_master (group only)
                                                                │
                                                       30d nightly job
                                                                ▼
                                                          hard_deleted
```
Failure terminal per stage: `upload_failed`, `phash_failed`, `embed_failed`. Each independently retryable.

### 2.3 Grouping lifecycle
```text
   none ──manual create──▶ active(manual) ◀── AI suggests merge ── pending_merge
                              │                                         │
                              │  user dismisses                         │ user accepts
                              │◀────────────────────────────────────────┤
                              │
   none ──AI auto (≥0.92)──▶ active(ai) ──user splits──▶ split
                              │
                              │ master deleted
                              ▼
                          needs_master ──user picks new master──▶ active
                              │
                              │ admin archive
                              ▼
                          archived (members preserved, queryable, not editable)
```
Manual wins: any `active(manual)` group is immutable to AI without user accept.

### 2.4 Retry lifecycle (per failed unit: chunk OR embed OR phash)
```text
   queued ──pick up──▶ in_flight ──fail──▶ backing_off ──timer──▶ queued
              │                                                      │
              │                                          5 attempts │
              ▼                                                      ▼
            succeeded                                            dead_letter
                                                                       │
                                                            admin retry │
                                                                       ▼
                                                                    queued
```
Heartbeat: `in_flight` with no heartbeat 5m → auto-requeued (counts as fail).

### 2.5 AI-analysis lifecycle (embedding + grouping per image)
```text
   not_started ─batch ready─▶ queued ─worker pickup─▶ analyzing
                                                          │
                                            success │ fail │ gateway 402
                                                    ▼      ▼      ▼
                                                 analyzed retry  paused_no_credits
                                                              (auto resume on credit add)
```
Grouping is downstream of `analyzed`. No analysis = no AI group, but phash group still possible.

### 2.6 Deletion lifecycle
```text
   active ──user delete──▶ soft_deleted (deleted_at=NOW)
                                │
                  ┌─────────────┼─────────────┐
                  │             │             │
            cascades:      grace 30d     user restore
              groups ──▶ needs_master      │
              embeddings: kept             ▼
              phash: kept                active
              studio: snapshotted        (deleted_at=NULL)
                  │
                  ▼
            hard_delete (nightly job after 30d)
                  │
                  ├─ storage purge (chunks + assets)
                  ├─ embeddings CASCADE
                  ├─ phash CASCADE
                  ├─ group_members CASCADE
                  └─ audit row PRESERVED forever
```

### 2.7 Rollback lifecycle (AI action undo)
```text
   AI action ──writes audit──▶ image_group_audit row (snapshot of pre-state)
                                          │
                                user clicks undo (≤30d)
                                          ▼
                              restore membership from snapshot
                                          │
                                  writes new audit row
                                          ▼
                                  state returned to pre-AI
```
After 30 days: snapshot purged, undo unavailable, but audit log of "what happened" stays forever.

---

## PART 3 — Hard Rules (LOCKED on approval)

| # | Rule | Enforcement |
|---|------|------------|
| HR-1 | **Duplicate detection priority:** exact sha256 > phash distance ≤ 5 > embedding cosine ≥ 0.95. Higher tier always wins; never auto-merge, always suggest. | Worker logic + UI |
| HR-2 | **Master-image reassignment:** only allowed if new candidate is `kind='original'` AND member of same group. Old master assignment archived, not deleted. | Trigger on `image_groups.master_image_id` UPDATE |
| HR-3 | **Variant inheritance:** variants inherit `parent_image_id`'s `batch_id`, `group_id`, `master_image_id`. Cannot diverge. Variants excluded from being master. | CHECK + trigger |
| HR-4 | **Manual override priority over AI:** any group with `created_by_kind='user'` is immutable to AI workers. AI actions on user-owned groups require user confirm. | Worker check + audit |
| HR-5 | **Cross-batch contamination prevention:** all worker queries scoped by `batch_id` unless cross-batch flag explicitly set AND `created_by` matches. | Query layer + RLS |
| HR-6 | **Deletion propagation:** soft-delete on image → group enters `needs_master` if image was master; group stays. Soft-delete on batch → cascades to all children with same `deleted_at`. Hard-delete only via nightly job after 30d. | Trigger + cron |
| HR-7 | **Orphan prevention:** every child table (`image_embeddings`, `image_phash`, `image_group_members`, `studio_jobs`) has FK to `upload_batch_images` with `ON DELETE CASCADE`. Nightly reconciliation alerts on any orphan. | FK + cron |
| HR-8 | **Single active group per image:** `UNIQUE (image_id) WHERE status='active'` partial index on `image_group_members`. | Postgres index |
| HR-9 | **Variant depth = 1:** trigger blocks INSERT/UPDATE where `parent_image_id` references a row that itself has non-null `parent_image_id`. | Trigger |
| HR-10 | **No AI auto-action on user-created entities** without explicit user confirmation, ever. | Worker contract |

---

## PART 4 — What I need from you

Reply with **one of three** per question Q1–Q11:
- `OK` (accept recommendation)
- `Change to: <alternative>`
- `Need to discuss`

And **one of two** per hard rule HR-1 to HR-10:
- `LOCKED`
- `Change: <text>`

Once every Q has a decision and every HR is `LOCKED`, I'll write the schema migration as the **only** next step, and we QA before any worker code.
