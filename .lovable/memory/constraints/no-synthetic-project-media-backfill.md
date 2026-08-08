---
name: No Synthetic or Bucket-Scanned Project Photo Backfill (LOCKED)
description: Never insert project photos by scanning storage buckets or generating images; only owner-uploaded rows are valid.
type: constraint
---

# No Synthetic / Bucket-Scanned Photo Backfill

- Never insert `project_images` rows by enumerating storage buckets, copying files between buckets, or generating placeholder/AI images.
- A project's photo set is exactly what the owner uploaded through the app. If photos appear missing, investigate rendering/query limits first — never "restore" by adding rows.
- Duplicate rows (same project + same URL) are always a bug; keep the earliest row only.
- AMRA (`amra-the-first-integrative-wellness-resort-mr9hh3ia`) owner set = 85 photos; cover = the owner rel-media `PHOTO-2026-03-05-15-35-46.jpg`.
