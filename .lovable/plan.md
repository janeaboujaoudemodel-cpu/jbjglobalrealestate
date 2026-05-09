## Status: already implemented — no code changes needed

Re-verified every piece of "CampaignComposer + crm-resolve-segment with Resend, quota, suppression, single-agency rules".

### What's in place

**Edge functions** (`supabase/functions/`)
- `crm-resolve-segment/index.ts` — owner-auth, builds query against `crm_leads`, supports `segment_id` + ad-hoc `filter`, modes `count|sample|all`, dedupes by email, excludes `email_suppressions`, returns `deliverable_count`, `skipped_suppressed_count`, `companies[]`, `distinct_companies`, `recipients[]`.
- `crm-send-campaign/index.ts` — owner-auth, loads `crm_email_campaigns`, calls resolve function, enforces single-agency rule (HTTP 400 `SINGLE_AGENCY_VIOLATION` with the offending companies unless `allow_multi_company`), renders `{{lead.*}}` tokens, sends via shared `sendViaResend` (which honours daily/monthly quota and 429 short-circuits), logs every attempt to `crm_campaign_recipients`, updates campaign `status/sent_count/failed_count`.

**Frontend**
- `src/components/crm/CampaignComposer.tsx` — full segment builder UI (chips for contact_type / pipeline_stage / tags / source / language, company datalist, search, VIP / suppressed / multi-company switches), live debounced preview (deliverable count, suppressed count, company breakdown), sender-domain guard (`@jbj.ae`), quota meter via `useEmailQuota`, "Save as segment" → `crm_segments`, "Send test" and "Send campaign" both wired to `crm-send-campaign`.
- `src/pages/owner/crm/CampaignsPage.tsx` mounts the composer.
- Route registered at `/owner/crm/campaigns` in `src/routes/OwnerRoutes.tsx`.
- Sidebar entry "Campaigns" in `src/components/owner-dashboard/OwnerSidebarNav.tsx` → `/owner/crm/campaigns`.

**Backing tables** (verified present): `crm_segments`, `crm_email_campaigns`, `crm_campaign_recipients`, `email_suppressions`, `crm_leads`.

### Recommendation

Open `/owner/crm/campaigns`, build a segment (or pick a saved one), use **Send test** to confirm Resend delivery with the current `RESEND_API_KEY`, then **Send campaign**. If anything misbehaves at runtime (e.g. a 401 from Resend or a single-agency rejection), share the toast text and I'll fix that specific failure — but there is no missing implementation to add for this task.
