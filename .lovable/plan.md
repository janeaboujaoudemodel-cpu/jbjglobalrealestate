## PAA → Listing Pipeline + Status Audit + Footer Fix

### Part A — Status audit of previously requested PAA tasks

| Task | Status | Notes |
|---|---|---|
| Updated EnvelopeDetail UX (no autofill of signer/date) | DONE | `EnvelopeDetail.tsx` clears `landlord_signature_*` / `jbj_signature_*` on save; JBJ stamp/sig only render when `status === "completed"`. |
| Leasing/Selling category fields | DONE | Template v13 reads `PAACategory`; rental amount only when leasing, sales amount only when selling. |
| Premium header & footer v13 | PARTIAL | New 220px monogram + gold gradient hairline shipped; **footer spacing bug** remains (Part C below). |
| Deep field audit (Form A) | DONE | 15+ Form A fields added (title deed, oqood, DEWA, makani, TRN, RERA permit, docs attached, etc.) with category gating. |
| Approve & Lock action | NOT DONE | Button + `approved_at`/`locked` columns + final-render lock not yet built. |
| PAA AI Co-Pilot drawer + edge fn | NOT DONE | `PAACopilotDrawer`, launcher, `paa-copilot` edge fn, `paa_copilot_messages` table not built. |
| Auto-generate listing draft from PAA + media uploader + approve→publish to Leasing/Resale | NOT DONE | New requirement — built in Part B. |
| Footer blank-space fix (push divider down, A4 locked) | NOT DONE | Fixed in Part C. |

### Part B — New: PAA → Listing Draft pipeline

**Trigger:** every time a PAA envelope is saved (selling or leasing), upsert a matching `projects` row in draft state, linked by a new `source_envelope_id` column.

1. **Schema**
   - Add `projects.source_envelope_id uuid` (nullable, unique) + `projects.listing_kind text` ('leasing' | 'resale').
   - Add `projects.owner_pii_hidden bool default true` (always true on publish).
   - Reuse existing `projects.is_published` for approve/publish.

2. **Edge function `paa-sync-listing`** (invoked from `EnvelopeDetail` save + on category change)
   - Input: `envelope_id`.
   - Reads envelope `template_field_values` + `category`.
   - Maps fields → projects columns: `name = property_name`, `community`, `city`, `emirate`, `bedrooms`, `size_sqft`, `price_from = rental_amount` (leasing) or `sales_amount` (selling), `payment_plan`, `service_charge`, `handover_date`, `description`, `listing_kind = category`.
   - **Strips PII**: never copies `owner_*`, `landlord_*`, `mobile`, `email`, `id_number`, `unit_number`, `trn`, POA holder, signature blocks.
   - Upserts on `source_envelope_id`. Sets `is_published=false`.

3. **EnvelopeDetail UI additions**
   - New "Listing Draft" card under the editor showing:
     - Linked project name + slug + status pill (Draft / Published).
     - Quick uploader (photos, brochures, files) → reuses existing `project-files` storage + `project_documents` and `project_images`.
     - "Add link (Drive / portal / URL)" → stored as `project_documents` row with `document_type='external_link'`.
     - "Open in Listing Approval" deep link → `/admin/listings-approval` filtered to the project.
   - "Approve & Publish Listing" button (owner-only) → sets `is_published=true` after gallery has ≥1 image (existing rule in `ListingsApproval.tsx`).

4. **Where it appears once published**
   - **Leasing** category → portal Leasing section (`/properties?listingKind=leasing` filter, also surfaced in the existing leasing hub route).
   - **Selling** category → Secondary Market / Resale (`/secondary-market-hub`, also `/properties?listingKind=resale`).
   - Both lists already query `projects` where `is_published=true`; we add a `listing_kind` filter param.

5. **PII hiding on public render**
   - Add `sanitizeListingForPublic(project)` helper invoked in all public project pages (project detail, cards, map cards, search results) that nulls: `owner_name`, `owner_email`, `owner_mobile`, `owner_id_number`, `owner_trn`, `unit_number`, `landlord_*`, `poa_*`. Also strips these keys from any rendered `description` HTML via the existing `contentSanitizer`.
   - Owner/admin views bypass via existing `useAuth().isOwner`.

### Part C — Footer spacing fix on PAA PDF

Problem: A4 page renders signature block, then a large blank gap, then the footer near the bottom — leaving an awkward void *under* the footer divider.

Fix in `jbjPropertyAdvertisingAgreement.ts`:
- Wrap each rendered page's body in a flex column: `display:flex; flex-direction:column; min-height: 297mm; padding: [existing margins]`.
- Body content (`flex: 1 1 auto`) absorbs the slack, pushing the footer to the true page bottom.
- Signature row gets `margin-top: auto` so the gap sits **between signature block and footer**, not after the footer.
- Footer: `flex: 0 0 auto`, fixed height ~28mm, hairline divider sits at top of footer.
- Verify in print preview: page stays one A4, no overflow to page 2. Bump `PAA_LAYOUT_VERSION` to `14` so existing drafts re-render.

### Implementation order
1. Footer fix (Part C) — small, isolated, immediate visual win.
2. Listing pipeline schema + edge fn (Part B steps 1-2).
3. EnvelopeDetail Listing Draft card + uploader (Part B step 3).
4. Public PII sanitizer + leasing/resale routing (Part B steps 4-5).
5. Approve & Lock action on the envelope itself.
6. AI Co-Pilot drawer + `paa-copilot` edge function.

### Verification
- Create a leasing PAA → confirm draft appears in `/admin/listings-approval` Pending tab with no PII fields populated.
- Upload one image → Approve → confirm it appears under Leasing portal section, owner contact hidden.
- Repeat with selling category → confirm it lands in Resale/Secondary Market.
- Print PAA PDF → confirm single A4, footer flush to bottom, gap moved above footer divider.
