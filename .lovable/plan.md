# Bank-Grade Identity Verification — Rebuild Plan

## 1. Fix the broken CTA on the homepage banner

**Problem:** `Get Verified` button on `/` banner is dark + white text, but the global contrast guard in `index.css` (`.bg-[#F7F2EA] ... .text-white → !important ink`) re-flips it to ink, so the label and arrow vanish into black-on-black.

**Fix in `VerificationBanner.tsx`:**
- Replace the raw `bg-[#1A1A1A] text-white` button with a champagne mother-of-pearl primary `Button` carrying `variant="default"` + `data-allow-dark-cta` and explicit `[#1A1A1A]` ink text (matches the Mother-of-Pearl CTA rule already in memory), OR
- Keep dark obsidian variant and add `data-allow-dark-cta` + `data-on-dark` to the button AND every child (`<ArrowRight>` + the label span) so the guard skips them. Strip the drop-shadow hack, add `text-[#FDFBF7]` explicit, ensure arrow has `stroke-[#FDFBF7]`.
- Visual: rounded-xl pill, gold 1px hairline ring, gold glow on hover, animated arrow translate, never gray.

## 2. Bank-level KYC verification flow (rebuild)

A 7-step wizard that mirrors retail-bank onboarding. Each step is its own panel inside `VerificationModal` with a top progress rail (1/7 … 7/7), Back/Next, and inline validation.

```text
Step 1  Welcome & consent      → AML/KYC notice, 3 checkboxes (T&C, data-processing, truthful info)
Step 2  Country + ID type      → Country select, document type (Passport / Emirates ID / National ID / Driver License)
Step 3  Personal details       → Full legal name (as on ID), DOB, nationality, residential address, phone
Step 4  ID document front      → Upload OR camera capture, client-side blur/MIME/size check
Step 5  ID document back       → Auto-skipped for Passport; required otherwise
Step 6  Selfie with ID         → Live capture only (no upload), face-in-oval guide
Step 7  Liveness challenge     → 3 randomized prompts (blink, turn left, turn right, smile, nod) — server picks order
Review  Summary + final submit → All inputs read-only, "Edit" link per row, big "Submit for review"
```

After submit: success screen with reference number (`VRF-XXXXXX`), ETA (24–48h), CTA "Track status" → `/verification`.

## 3. Backend — new edge function + schema hardening

**New edge function `submit-verification`** (verify_jwt = true):
- Validates: required fields, file MIME (image/jpeg/png/webp only), per-file ≤ 8 MB, total payload ≤ 40 MB.
- Re-uploads files to `verification-documents` bucket under `{user_id}/{submission_id}/...` using service role (client never holds service key).
- Inserts `user_verifications` row with all new fields below + sets `status='pending'`, `reference_code`, `client_ip`, `user_agent`.
- Writes immutable `verification_audit_log` event (`submitted`).
- Sends confirmation email via existing Resend wrapper to the user (templated, champagne brand).
- Returns `{ reference_code, status }`.

**Schema additions (migration):**
- `user_verifications`: add `reference_code TEXT UNIQUE`, `document_type TEXT`, `document_country TEXT`, `date_of_birth DATE`, `nationality TEXT`, `address JSONB`, `phone TEXT`, `id_back_url TEXT`, `liveness_frames JSONB`, `liveness_challenges JSONB`, `client_ip INET`, `user_agent TEXT`, `consent_snapshot JSONB`, `risk_score NUMERIC`.
- New table `verification_audit_log` (id, verification_id, actor_user_id, event, payload jsonb, created_at). RLS: owner/admin SELECT all; insert only via edge function (service role).
- `profiles.verification_status` enum already exists — keep; trigger updates it on `user_verifications` status change (`pending → approved/rejected`).

**Existing RLS already correct** (users insert/select own, owner/admin manage). Bucket stays private.

## 4. Owner review surface

`/owner/verifications` (already exists) gets:
- Reference code column + filter (Pending / Approved / Rejected).
- Detail drawer with signed URLs for ID front/back, selfie, liveness contact sheet (all 3 challenge frames side-by-side), submitted personal data, reference, audit trail.
- Approve / Reject buttons call **new edge function `review-verification`** (verify_jwt + admin/owner role check) which updates row, writes audit row, fires approval/rejection email.

## 5. User-facing status page

New route `/verification` (public when logged in, redirects to `/auth` otherwise):
- Card with current status (None → Start CTA, Pending → review timeline, Approved → green check + badge preview, Rejected → reason + Resubmit CTA).
- Lists past submissions (reference code, date, status).

## 6. SEO + sitemap

- Add `/verification` and `/legal/aml-kyc-policy` (already exists) entries to `public/sitemap.xml`.
- Add `<title>` "Identity Verification — JBJ Global Real Estate" and meta description for `/verification` via the existing per-page head pattern (`index.html` defaults stay sitewide; page sets its own via the project's title helper).
- After deploy, trigger an SEO scan and mark addressed findings fixed.

## 7. QA / edge-to-edge testing

1. Sign in as test user → open homepage → click `Get Verified` → confirm CTA + arrow are visible (fix #1 verified in the browser).
2. Walk the 7 wizard steps end to end, including camera permission denial fallback.
3. Submit → assert (a) Supabase row created with `pending` + reference code, (b) all files appear in bucket under `{uid}/{submission}/...`, (c) audit row written, (d) confirmation email landed (sent to `infoo.jane@gmail.com` per session preference).
4. Log in as owner → `/owner/verifications` → review the submission → approve → assert status flips on profile, approval email sent, audit row appended.
5. Re-load `/verification` as the user → status reads "Approved" with verified badge.
6. Re-submit as the user after rejection path → ensure new reference code and old submission preserved.

## Technical details

- **Files to edit**: `src/components/verification/VerificationBanner.tsx`, `src/components/verification/VerificationModal.tsx` (substantial refactor into step components under `src/components/verification/steps/`), `src/pages/owner/VerificationRequests.tsx`, `src/pages/Verification.tsx` (new), `src/App.tsx` (route), `public/sitemap.xml`, `index.html` (only if global meta needed).
- **New edge functions**: `supabase/functions/submit-verification/index.ts`, `supabase/functions/review-verification/index.ts`. Both verify JWT, the review function additionally checks `has_role(uid, 'owner'|'admin')`. Service role only used inside the function.
- **Migrations**: add columns + audit table + trigger that mirrors `user_verifications.status` into `profiles.verification_status` + sequence/function for reference code (`'VRF-' || lpad(nextval('verification_ref_seq')::text, 6, '0')`).
- **Email**: reuse existing transactional email infra (Resend wrapper already shipped). Two templates: `verification-submitted`, `verification-decision` (branching on approved/rejected reason).
- **Validation**: zod schemas in `src/lib/verification/schema.ts` shared by wizard + edge function (duplicate file in `supabase/functions/_shared/verification-schema.ts` since Deno cannot import from `src/`).
- **Security**: file MIME sniff via magic bytes server-side, strip EXIF on re-upload, rate limit submissions to 3/24h per user via `rate_limits` table (existing pattern), log IP/UA, never expose raw storage paths to other users.
- **No removal**: existing modal/banner/admin page stay live during the rewrite (refactor in place, do not delete the components or the route).

## Out of scope (not in this plan)

- Third-party KYC provider integration (Sumsub/Onfido) — current flow remains manual owner review.
- OCR auto-extraction from the ID image.
- Sanctions/PEP screening — call out as a future hardening pass.