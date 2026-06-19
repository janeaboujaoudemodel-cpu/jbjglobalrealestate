---
name: Broker Brand Profile & Co-Branded PDFs
description: /broker/brand lets brokers upload logo/headshot + tagline/brand color/contact, stored on crm_brokers and consumed by every PDF generator for co-branded brochures alongside JBJ.
type: feature
---
- Route: `/broker/brand` (page `src/pages/broker/BrokerBrandProfile.tsx`), under broker portal shell, sidebar entry "Brand Profile".
- Storage bucket `broker-brand` (private, workspace blocks public buckets). Files at `{auth.uid}/logo-*` / `{auth.uid}/headshot-*`. After upload we generate a 1-year signed URL and persist it to `crm_brokers.logo_url` / `headshot_url`.
- `crm_brokers` columns added: `logo_url`, `headshot_url`, `tagline`, `brand_primary_hex`, `agent_display_name`.
- QuizResults brochure (`src/pages/QuizResults.tsx`) pulls these in broker mode and renders broker logo (36×36) + agent/title/company + tagline + contact in footer. Non-broker users still get the clean JBJ-only footer.
- Storage RLS: public SELECT on bucket (signed URLs do not require it but kept open for direct PDF embed); INSERT/UPDATE/DELETE scoped to first folder segment = auth.uid.
