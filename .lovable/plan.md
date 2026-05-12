## Problem

The PAA document URL stored on the envelope is:

```
https://…supabase.co/storage/v1/object/public/esign-documents/<uuid>/<file>.pdf
```

— a `/object/public/…` path. But the `esign-documents` bucket is **private** (`public = false`). When the browser hits a `/object/public/…` URL on a private bucket Supabase responds with `404 Bucket not found` — exactly what the screenshot shows.

The code base everywhere builds these URLs with `supabase.storage.from("esign-documents").getPublicUrl(...)` (4 call sites: `useEsignTemplates.ts` ×2, `CreateEnvelope.tsx`, `BlankLetterStudio.tsx`). The intent has always been public; the bucket was just never flipped.

## Fix

Single one-line migration: flip `esign-documents` to public. RLS on `storage.objects` already restricts **uploads/updates/deletes** to authenticated owners (untouched by `public=true`). `public=true` only changes whether the unauthenticated `/object/public/…` URL resolves a 200 — which is exactly what every PAA download/preview URL needs.

Filenames are `<envelope-uuid>/<random-uuid>.pdf` (unguessable), matching the access pattern of the other public PDF buckets in this project (`developer-logos`, `project-files`, `email-assets`, etc.).

## Migration

```sql
update storage.buckets
set public = true
where id = 'esign-documents';
```

No code changes. After the migration runs, the existing 404 URL — and every previously generated PAA URL — starts resolving. Open / Download / Print / Sign-page links all work.

## Verification

1. Run migration → `select public from storage.buckets where id='esign-documents'` returns `t`.
2. Reload `/e-signature/810df24a-…` → preview iframe + Download + Open PDF + the public Sign page all return the PDF instead of 404.
