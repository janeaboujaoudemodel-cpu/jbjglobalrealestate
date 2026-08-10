---
name: Emerald Wordmark Fallback for Logo-less Developers (LOCKED)
description: Developers with no official logo get a generated pure-white Jost wordmark on the emerald plate so they publish normally, and are flagged in the backend as needing a real logo.
type: feature
---
Owner decision (Aug 2026).

- Any developer with no `logo_url` / `logo_url_processed` receives a generated
  wordmark: brand name uppercase, Jost medium, generously letterspaced, name on
  line 1 and the descriptor tokens (REAL ESTATE / DEVELOPMENT(S) / PROPERTIES /
  GROUP / LLC / …) smaller on line 2, pure white on transparency, tight-cropped
  with 3% padding. Stored at
  `developer-logos/wordmark-v2/<slug>-tight.png`, written to both `logo_url` and
  `logo_url_processed`, `logo_source = 'jbj-wordmark-v2'`,
  `logo_status = 'approved'`.
- Never invent a symbol, monogram or icon — text only.
- Every wordmarked developer is flagged `developers.needs_real_logo = true` with
  `wordmark_applied_at`, exposed by view `public.developer_logo_wordmark_gaps`
  (developer, slug, live project count) and rendered as the
  "Temporary wordmark — needs real logo" section on
  `/owner/crm/jbj/owner-developer-gaps`
  (`src/pages/owner/DeveloperGapsQueue.tsx`).
- When a real logo arrives, replace the artwork and set `needs_real_logo = false`
  so the brand leaves the queue.
- Batch of Aug 10 2026: 227 developers wordmarked; the
  `developer_has_no_logo` project gap dropped from 199 to 0.
