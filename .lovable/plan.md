## Goals

1. **Register Interest everywhere = the detailed form**, not the 3-field quick modal.
2. **Download Brochure stops being blocked by Chrome** ("popup blocked" page).
3. **Brokers can reach Presentation generator + brand upload directly from the project page** (Vindera etc.), not only via a hidden URL.

---

## 1. Unify "Register Your Interest" modal

Today every Register Interest / Brochure CTA on `/project/:slug` opens `LeadCaptureModal` (Name, Email, Phone only). We already have the richer `ProjectInquiryForm` (developer combobox, location, bedrooms, size, message). The user wants ONE detailed form everywhere — including **Timeline ("when do you want to buy")** and **Preferred contact time** which neither currently has.

Changes:
- Extend `ProjectInquiryForm` with two new required fields:
  - **Purchase timeline** — Select: Within 1 month / 1–3 months / 3–6 months / 6–12 months / Just exploring.
  - **Preferred contact time** — Select: Morning (9–12) / Afternoon (12–5) / Evening (5–9) / Anytime. Plus optional WhatsApp preferred checkbox.
- Keep existing bedroom / size / developer / location / message fields.
- Refactor `LeadCaptureModal.tsx` so the dialog body renders `<ProjectInquiryForm />` instead of the 3-field form. Header keeps "Register Your Interest" or "Download {documentType}" + project name. On success it still triggers the same `documentUrl` download flow and the same `captureLead` hook (the form's submit handler will write the extended fields into `lead_metadata` / `crm_leads.notes` so nothing is lost).
- Single source of truth: delete the inline form JSX inside `LeadCaptureModal`. All other call-sites of the modal (ProjectDetailLayout hero CTA, brochure tab, floor plan, payment plan, gallery, PremiumBrochureCard, ProjectDetailTabs) automatically inherit the detailed form.

## 2. Fix "Download Brochure" being blocked by Chrome

Root cause: `LeadCaptureModal` and `PremiumBrochureCard` both call `window.open(url, "_blank")` from inside an async `setTimeout`/`.then()`. Chrome treats that as a popup (not a user-gesture) and blocks it on the new tab → the "blocked by Chrome" page the user is seeing.

Fix:
- In `LeadCaptureModal` success path, replace `window.open(...)` with a programmatic anchor click (`<a href download target="_self">`) using `maybeProxyStorageUrl`. Same-tab download avoids the popup blocker entirely.
- In `PremiumBrochureCard` `handleDownload`, drop the `window.open` fallback; if `fetch` → blob fails, fall back to anchor-click on the proxied URL (still a same-tab navigation, no popup).
- Use `src/lib/buildSafeDownloadUrl.ts` to always pass through the download proxy and force `Content-Disposition: attachment` so the browser downloads instead of navigating.
- Confirm fix in the browser: open `/project/vindera-emaar-properties-the-valley`, click Download Brochure, complete the form, and verify the PDF downloads in-place without the Chrome block screen. Capture a screenshot for proof.

## 3. Broker Presentation + Brand entry on the project page

Today brokers can only reach `/broker/brand` (logo upload) via the broker portal sidebar. From a project page there is no visible affordance to (a) generate a co-branded presentation/brochure for *this* project, or (b) upload their photo/logo.

Changes scoped to **broker mode only** (`useUserMode().isBrokerMode`):
- New small card under the hero CTAs on `ProjectDetailLayout`, titled **"Your branded materials"**, visible only when `isBrokerMode`:
  - Button **"Generate co-branded presentation"** → opens a new lightweight modal that calls the existing AI presentation engine pre-filled with the current project (`projectId`, cover image, dev logo, broker brand from `crm_brokers`). Output PDF uses the same co-branded footer added in the last batch.
  - Button **"Download co-branded brochure"** → same `handleDocumentDownload("brochure", ...)` but skips the lead modal for the broker themselves (they're logged in) and stamps their logo/headshot in the footer.
  - Link **"Edit my brand (logo, photo, contact)"** → `/broker/brand`.
- If the broker hasn't completed `/broker/brand` yet, show an inline notice: *"Upload your logo and photo to enable co-branded exports"* with a CTA to `/broker/brand`.

## 4. Verification (mandatory before reporting done)

Will use `browser--view_preview` + `browser--act` to:
1. Navigate to `/project/vindera-emaar-properties-the-valley`.
2. Click **Register Your Interest** → confirm the detailed form (bedrooms, size, developer, location, timeline, preferred time, message) renders, fill it, submit, confirm success toast + lead row in `crm_leads`.
3. Click **Download Brochure** → confirm the same detailed form opens, submit → PDF downloads in-place (no Chrome block screen). Screenshot the downloaded state.
4. Switch to broker mode → confirm the new "Your branded materials" card appears under the hero CTAs and the three actions work.
5. Send screenshots + console/network log summary as proof.

## Out of scope
- No changes to the AI presentation engine itself (only a new entry point).
- No DB schema changes beyond storing the two new optional inquiry fields inside the existing `lead_metadata` JSON column.
- No restyle of the project page beyond inserting the broker card.

## Files expected to change
- `src/components/project-detail/ProjectInquiryForm.tsx` — add timeline + preferred-time fields.
- `src/components/project-detail/LeadCaptureModal.tsx` — render `ProjectInquiryForm`, replace `window.open` with anchor-click download.
- `src/components/project-detail/PremiumBrochureCard.tsx` — drop `window.open` fallback, use safe download URL.
- `src/components/project-detail/ProjectDetailLayout.tsx` — insert `<BrokerBrandedMaterialsCard />` under hero CTAs (broker-only).
- New: `src/components/project-detail/BrokerBrandedMaterialsCard.tsx`.
- `src/hooks/useLeadCapture.ts` — accept optional extended metadata (timeline, preferred_contact_time) into `lead_metadata`.
