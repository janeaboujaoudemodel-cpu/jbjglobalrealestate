## Goal

Make the JBJ Property Advertising Agreement match the Property Finder PDF **field-for-field, section-for-section, signature-for-signature** — but wrapped in a JBJ-branded premium header/footer (champagne + gold + black, JBJ monogram), with AI smart-fill, and a built-in send flow (email + WhatsApp + copy link) that uses an editable branded message template.

No fields are added or removed from the body of the agreement. The body is locked to the Property Finder layout. Only the header, footer, signature styling, and surrounding actions are JBJ-premium.

---

## 1. Lock the body to the Property Finder layout (exact)

Rewrite `src/templates/jbjPropertyAdvertisingAgreement.ts` so the rendered document mirrors the PDF you uploaded, in this exact order:

**Intro paragraph** (verbatim wording from the PDF, just with `propertyfinder.ae` replaced by JBJ language about "the UAE's leading property network").

**1. LANDLORD / OWNER DETAILS** — two columns, exactly:
- Landlord's Name · Passport Number
- Listing Consultant · Property Reference No
- Expiry date (DD / MM / YYYY split boxes)

**2. PROPERTY DETAILS** — one row of inline radio chips:
`☐ Villa  ☐ Apartment  ☐ Office  ☐ Warehouse   ☐ Furnished  ☐ Unfurnished`
then `☐ Vacant  ☐ Tenanted   Vacating Date: DD / MM / YYYY`
then 2-col fields: Building Name · Unit · Street Name · Community · BUA (SqFt) · Plot (SqFt) · Bedrooms · Bathrooms · Rental / Sales Amount · Parking.

**3. TERMS AND CONDITIONS** — clauses 1-4 verbatim:
- Clause 1 with broker-name underline + `☐ EXCLUSIVE  ☐ NON EXCLUSIVE` + `☐ 1 MONTH  ☐ 2 MONTHS  ☐ 3 MONTHS OR UNTIL: __/__/__  ☐ 6 MONTHS (RESIDENTIAL SALE OR COMMERCIAL ONLY)`
- Clauses 2, 3, 4 verbatim from the PDF.

**LANDLORD(S)** — single row: Name · Signature · Date (DD / MM / YYYY), styled the same as the PDF.

Existing `template_field_values` keys are preserved so Omar's draft re-hydrates cleanly. `PAA_LAYOUT_VERSION` bumps to `4`; older drafts auto re-render on open.

## 2. JBJ premium chrome (header + footer)

This is the only place the design diverges from Property Finder.

**Header** (every page):
- Champagne band `#F7F2EA`, 1px gold hairline `#B89555` bottom border (no gold fills).
- Left: JBJ monogram (existing transparent PNG from brand assets) + wordmark "JBJ GLOBAL REAL ESTATE" in black `#1A1A1A`, Inter.
- Right: doc number badge (e.g., `JBJ-PAA-LEASING-0001`) + ISO date, small caps gold tracking.
- Title row: `PROPERTY ADVERTISING AGREEMENT — REAL ESTATE OWNERS`, black, with a thin gold underline.

**Footer** (every page):
- Champagne band, 1px gold hairline top.
- Three columns: address block · `CONTACT@JBJ.AE · WWW.JBJ.AE · +971 54 716 7107` · TRN / RERA / ORN compliance line.
- Page `n / N`, gold hairline divider.
- Replaces the Property Finder footer entirely.

Header/footer are reused by the Listing Authorisation template later (same chrome engine, different body).

## 3. Premium signature block (same shape as PDF, upgraded styling)

Same row layout as the PDF (Name · Signature · Date) but:
- **JBJ side** (auto-applied): pre-loads `owner_signature_assets` → renders the saved owner signature image + company stamp, with a faint "JBJ • Authorised Representative" caption in gold.
- **Landlord side**: dotted gold underline on the signature line. Before signing it shows italic "Awaiting signature — {{landlord_name}}". After signing it shows the captured signature image + printed name + ISO date + `Signed on … · IP …` caption.
- Identical in iframe preview, exported PDF, and emailed PDF.

## 4. AI Smart-Fill (Dubai-aware)

The existing `SmartFillDropzone` + `document-extractor` edge function are upgraded so the user can drop **any** Dubai document and it pre-fills the right fields:

- Passport / Emirates ID → `landlord_name`, `passport_number`, formatted as `784-XXXX-XXXXXXX-X`.
- Title Deed (DLD) → `building_name`, `unit`, `community`, `bua_sqft`, `plot_sqft`, `property_reference_no`, infers Villa/Apartment from "Property Type".
- Ejari → `tenanted` status + `vacating_date` from contract end, `rental_amount`.
- Floor plan / brochure → `bedrooms`, `bathrooms`, `bua_sqft`.
- MOU / Form A / Form F → `sales_amount`, exclusivity flag.

The extractor prompt is rewritten with Dubai-specific schema hints (RERA, DLD, Ejari, Form A/F/I, Trakheesi). Confidence scores stay; low-confidence values are highlighted gold for review.

## 5. Send flow: email + WhatsApp + copy link, with editable branded template

A new **"Send for signature"** dialog replaces the current single button. Inside:

**Recipients**
- To · CC · BCC fields with chips, add/delete/bulk-paste, primary recipient toggle.
- WhatsApp number (auto-formatted `+971 50 363 4224`).

**Message template (fully editable per envelope, persisted to `esign_envelopes.metadata.send_template`)**
- Editable **Subject** (default: `Please sign — Property Advertising Agreement · {{doc_number}}`).
- Editable **Body** (rich text, brand-styled), with merge tags: `{{landlord_name}}`, `{{property_address}}`, `{{doc_number}}`, `{{signing_link}}`, `{{owner_name}}`.
- Default body is a JBJ-branded paragraph asking the client to review and sign; user can save edits and they stick for that envelope.
- "Reset to JBJ default" button.

**Channels** (multi-select)
- ✉️ **Email** — sent through the existing locked-send pipeline, branded JBJ HTML wrapper, signing link → `https://jbj.ae/sign/<token>`, PDF attached.
- 💬 **WhatsApp** — opens `wa.me` with the same message body + signing link, or copies it.
- 🔗 **Copy link** — `https://jbj.ae/sign/<token>` (no `*.lovable.app` ever).
- 📱 **SMS** (optional, behind an "Other channels" disclosure).

All sends are logged on the envelope timeline.

## 6. Status tracking & follow-up

The dashboard card and envelope detail page show a clear status pill per envelope:
`Draft → Sent → Viewed → Signed → Completed` (plus `Declined`, `Expired`).

- Auto-sync from existing webhook events (`viewed`, `signed`) — no polling needed.
- Per-envelope timeline: who, when, channel, IP.
- "Needs follow-up" badge appears if `Sent` > 48h with no view, or `Viewed` > 24h with no signature.
- One-click "Resend" reuses the same editable template.

## 7. Always editable

Every field on the agreement remains editable at any stage before signing — the form on the right of the envelope page already drives this; the new layout keeps every existing input wired to the same `template_field_values` keys. Post-signature, fields lock but the user can clone the envelope into a new draft with one click ("Duplicate as new draft").

---

## Files to change

- **edit** `src/templates/jbjPropertyAdvertisingAgreement.ts` — lock body to Property Finder layout, bump `PAA_LAYOUT_VERSION` to 4, premium signature block, chrome injection.
- **new** `src/components/e-signature/JBJDocumentChrome.tsx` — header/footer renderer, JBJ monogram + wordmark, gold hairline, page numbering.
- **edit** `src/pages/e-signature/EnvelopeDetail.tsx` — mount new SendForSignatureDialog, status pill, timeline, follow-up badge, auto re-render on stale layout version.
- **new** `src/components/e-signature/SendForSignatureDialog.tsx` — recipients (To/CC/BCC/WhatsApp), editable Subject + Body with merge tags, channel multi-select, preview pane.
- **edit** `src/pages/e-signature/ESignatureDashboard.tsx` — status pill, follow-up badge, last-activity timestamp.
- **edit** `supabase/functions/document-extractor/index.ts` — Dubai-aware schema (Passport/EID/Title Deed/Ejari/Form A-F-I/MOU/Trakheesi), confidence per field.
- **edit** `supabase/functions/esign-send-for-signature/index.ts` — accept editable subject + body + channels array, branded HTML wrapper, jbj.ae links, PDF attach.
- **edit** `src/hooks/useEsignTemplates.ts` — pass chrome + signature/stamp + send_template into render, re-render on stale version.
- **migration** — add `send_template jsonb` (subject/body/last_edited) to `esign_envelopes.metadata`; no destructive changes.

## Out of scope (next pass)

- Listing Authorisation template restyle (will reuse the same `JBJDocumentChrome` once approved).
- New auth/role logic.
- Public signing page UX redesign — only the URL host changes to `jbj.ae`.
