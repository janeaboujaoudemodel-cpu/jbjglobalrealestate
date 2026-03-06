

## Plan: Fix CV Preview/Download, Status Buttons, Email Sending, and CV Center Sections

### Problems Identified

1. **CV Preview broken**: The `resolvePreviewUrl` and `handleViewCV` functions try multiple buckets and blob download approaches, but the preview still fails. The iframe approach with blob URLs should work for PDFs but may fail due to incorrect storage paths or bucket mismatches. Need to add better error handling and ensure the download proxy includes auth headers.

2. **Status buttons wrong behavior**: When a CV is accepted, the "Accept" button stays visible (just disabled). When rejected, "Reject" stays. The "Pending" button only shows when status is NOT pending. The user wants: once accepted, hide Accept button and show only Pending/Reject; once rejected, hide Reject and show only Pending/Accept.

3. **Email not sending**: The edge function uses `RESEND_API_KEY` and sends from `jbj@jbj.ae`. The Resend API key exists in secrets. The sender domain `jbj.ae` must be verified in Resend for emails to work. No Lovable email domain is configured. Since this is a transactional email (CV status notification), it uses Resend directly, which is correct. Need to test by invoking the edge function directly.

4. **Missing CV sections**: User wants separate sections/tabs for All Collected, Accepted, Rejected, Pending — with category and status filters, showing scoring, summary, languages, department, and contact details on the card surface (not hidden in expandable).

### Implementation Plan

#### A. Fix CV Preview & Download
- In `handleViewCV`, improve the storage path resolution — the `storagePath` extracted from `cv.cv_url` might have the bucket prefix included. Add defensive stripping of bucket name from path.
- Add auth token to the download proxy fetch call for private files.
- For the download button, ensure it passes the auth Bearer token when fetching through the proxy.
- Add a fallback: if blob download from all buckets fails AND proxy fails, try generating a fresh signed URL and open directly.

#### B. Fix Status Buttons Logic
- In the action buttons section (lines 1074-1100), change the logic:
  - **Accept button**: Hide (not just disable) when `cv.status === 'approved'`
  - **Reject button**: Hide when `cv.status === 'rejected'`
  - **Pending button**: Hide when `cv.status === 'pending'`
  - Show a prominent status badge instead of the hidden button
- After status update succeeds, the local state already updates via `setCvEntries`, so buttons will reactively hide.

#### C. Fix Email Sending & Send Test
- First, invoke `send-cv-status-email` directly via the edge function tool to send a test email to `janeaboujaoudenails@gmail.com` to verify the Resend setup works.
- If the test fails, check the edge function logs for the Resend API error response (likely domain verification issue).
- The email infrastructure is already built correctly — the issue is likely the Resend domain verification for `jbj.ae`.

#### D. Enhance CV Center with Sections
- Replace the current single-list layout with a tabbed section view:
  - **All CVs** (default) — everything
  - **Pending Review** — status = pending
  - **Accepted** — status = approved
  - **Rejected** — status = rejected
- Each section shows CV cards with **visible on the surface** (not collapsed):
  - AI Score badge, department category, position
  - Languages, experience years
  - AI summary (truncated)
  - Contact details (email, phone with action buttons)
  - Skills tags
- Keep the existing category filter and search above all tabs
- Keep the sort dropdown

### Files to Modify
- `src/components/crm/CVCenter.tsx` — all UI changes (status buttons, card layout, section tabs)
- Potentially `supabase/functions/send-cv-status-email/index.ts` — if test reveals issues

### Execution Order
1. Send test email first to diagnose email issues
2. Fix CV preview/download logic
3. Fix status button visibility
4. Restructure CV Center with section tabs and surface-level card info

