-- Media Ingestion Audit (Aug 17 2026) — finding 3.3
--
-- `rel-media` and `rel-logos` were created with no `file_size_limit` and no
-- `allowed_mime_types`, so Storage accepted any file of any size from anyone
-- who passed the write policy. The listing-media path uploads straight from
-- the browser, so there is no edge function in between to inspect the bytes —
-- which made the bucket definition the only place server-side enforcement
-- could live, and it was empty.
--
-- The client-side checks added alongside this (src/lib/media/validateUpload.ts)
-- give better messages and catch a renamed executable by its magic bytes, but
-- a client can always be bypassed. These constraints cannot be.
--
-- 500 MB is the ceiling because video tours legitimately reach that size; the
-- tighter per-kind caps (20 MB images, 50 MB documents) are enforced client-side
-- where the file's kind is known.
--
-- SVG is deliberately absent from both lists: it is an XML document that can
-- carry script, and these buckets are public.

UPDATE storage.buckets
SET
  file_size_limit = 524288000, -- 500 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/msword'
  ]
WHERE id = 'rel-media';

-- Logos are images only, and small.
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'rel-logos';
