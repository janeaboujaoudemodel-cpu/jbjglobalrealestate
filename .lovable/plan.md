## 1. Footer — premium, distributed, with company location

Update both footer renderers so they share the same 3-column layout, with the trade-license office address front and center.

**Files:** `src/templates/jbjLockedChrome.ts` (`jbjFooterHtml`) and `src/components/document-studio/LockedLetterhead.tsx` (`LockedFooter`).

Layout (single full-width band, champagne bg, 1px gold top hairline):

```
┌──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ JBJ GLOBAL REAL ESTATE   │ Office SM1-195, Port     │ +971 54 716 7107         │
│ L.L.C · S.O.C            │ Saeed, Deira, Dubai, UAE │ contact@jbj.ae           │
│ Trade Lic. 1591031       │                          │ www.jbj.ae               │
└──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

- Left cell: legal name + suffix (uppercase, tracked) + trade-license number small line
- Center cell: full office address from `TRADE_LICENSE_OFFICE`
- Right cell: phone / email / website stacked (gold accents, ink for primary)
- Ink color for body text (not all-gold) — gold reserved as hairline + link accent so it reads as a premium footer, not a gold ribbon
- Mobile: collapses to a single centered column

## 2. Global removal of ID / Passport from every signature & body block

Owner has asked that ID/Passport disappear from every template — signature side and recipient block — and live only in the outbound email body. Effect must be universal, not just Holiday Home.

**Files:** `src/templates/composers/index.ts`, `src/config/documentCatalog.ts`, `src/components/document-studio/DocumentStudio.tsx`.

- `signatureBlock`: drop the `ID / Passport` row entirely; keep only Name / Date on the recipient side. Stop accepting `applicantId`.
- `recipientBlock`: drop the `ID / Passport` line in both greeting and address variants.
- Remove every `applicantId: f.idNumber` in the composers (job offer, generic, commission invoice, facility management).
- Remove the standalone `idNumber` text input in `DocumentStudio.tsx` from the client-info side panel.
- Drop the `idNumber` field definition from `documentCatalog.ts` (and any per-template repeat such as Facility Management's "Owner ID / Trade Licence #").
- Recipient/client name continues to auto-sync into the signature block from `f.recipientName` everywhere — already the behaviour, but verified template by template.

## 3. Holiday Home — premium booking-details quote table + stronger T&Cs

**File:** `src/templates/composers/index.ts` → `composeHolidayHome`.

### 3a. Replace the flat 2-column reservation list with a true quotation table

Two stacked tables, gold hairline, alternating champagne rows:

**Booking Summary** (compact 2-col)
- Booking ID (auto-generated `JBJ-HH-YYYYMMDD-XXXX` if blank)
- Booking Source (e.g. Booking.com, Airbnb, Direct, WhatsApp)
- External Reference (booking.com confirmation #, if any)
- Property · Unit Type · Unit Size · Address
- Guest Name · Phone / WhatsApp · Number of Guests

**Stay & Quotation** (5-col itemised table)
| Item | Dates | Nights | Rate (AED) | Amount (AED) |
| Accommodation | check-in → check-out | nights | nightly rate | nightly × nights |
| Cleaning fee (optional) | — | — | — | f.cleaningFee |
| Security deposit (refundable) | — | — | — | f.securityDeposit |
| **Subtotal** | | | | computed |
| **Amount Paid** | payment date · via {paymentMethod} · {paid/pending} | | | f.amountPaid |
| **Balance Due** | due {f.balanceDueDate} | | | subtotal − amountPaid |

All currency rendered with `AED` prefix and thousands separators. Hide any row whose value is empty so the table stays clean.

### 3b. New form fields in `documentCatalog.ts` (Holiday Home only)

Add: `bookingSource` (select: Direct, Booking.com, Airbnb, Agoda, WhatsApp, Other), `externalRef`, `cleaningFee`, `securityDeposit`, `amountPaid`, `paymentStatus` (select: Paid in Full / Partial / Pending), `balanceDueDate`. Keep existing `bookingRef` but auto-fill it if blank using the `JBJ-HH-…` generator at compose time.

### 3c. Tougher Guest Declaration clauses

Inside the existing "Terms & Conditions — Guest Declaration" ordered list, replace the current `Guest Responsibility` clause with an expanded version and add two new clauses. Final clause set:

1. Non-Refundable Booking *(unchanged)*
2. No Refund · No Credit *(unchanged)*
3. Full Release of Liability *(unchanged)*
4. **Damage & Property Condition (expanded).** Guest is fully liable for the cost of repair or replacement of any damage, breakage, loss or theft affecting the unit, furniture, appliances, fixtures, finishes or common areas — whether caused by the Guest, their co-occupants, their visitors, or any person admitted by the Guest. Damages are charged at full market/replacement cost plus a 15% handling fee, deducted from the security deposit and, where insufficient, invoiced separately and payable within seven (7) days.
5. **Overstay & Unauthorised Occupation (new).** If the Guest fails to vacate at the agreed check-out time without prior written extension, the Guest shall pay (i) AED 1,500 per day or 2× the nightly rate (whichever is higher) as liquidated damages, and (ii) all legal, eviction, locksmith and enforcement costs. The Guest expressly consents to JBJ initiating eviction, police and Dubai Courts proceedings, and acknowledges that overstaying constitutes unlawful occupation under UAE law.
6. **Conduct of Guests & Visitors (new).** The Guest is fully responsible for the conduct, safety and compliance of every co-occupant and visitor admitted to the property, and indemnifies JBJ against any claim arising from their actions. Maximum occupancy stated above may not be exceeded; subletting, re-listing or commercial use is strictly prohibited.
7. **House Rules & Policy Adherence.** Guest agrees to read, respect and abide by all house rules, building by-laws, community regulations and UAE laws at all times. Violations result in immediate eviction with no refund and full liability for resulting damages.
8. Check-in / Check-out *(kept)*
9. Security Deposit *(kept)*
10. Governing Law — Dubai Courts *(kept)*
11. Acknowledgement *(kept)*

Multi-page is acceptable; the composer already lets content flow.

## 4. Company stamp — bundled and rendered on every template

The user-uploaded JPG (blue circular trade-license stamp, License No. 1591031, DUBAI - UAE) becomes the default JBJ corporate stamp shown on every generated document, regardless of whether the owner has uploaded a personal stamp.

**Steps:**
- Save the upload as `src/assets/jbj-company-stamp.png` (saved as PNG; background already white — render with `mix-blend-mode: multiply` to drop the white on champagne).
- In `signatureBlock`, render the stamp as an `<img>` overlapped on the **owner (left) side**, anchored to the bottom-right of the owner signature cell, ~110px wide, rotated −6°, opacity 0.92, `mix-blend-mode: multiply`. This sits naturally where the owner's wet signature would land — matching standard UAE corporate practice (stamp + signature together, owner side only; client side stays clean for the counter-signature).
- Use a data-URI (`?inline`) import like the monogram so it survives html2canvas PDF export and srcDoc previews without network fetches.
- If the user has uploaded a personal company stamp via the asset library (`defaultStamp` in `useOwnerAssets`), prefer that one instead — the bundled stamp is the **fallback** so every template is always stamped.

## Technical notes

- All currency formatting uses a single helper `fmtAED(n)` (locale `en-AE`, no decimals unless fractional).
- Booking-ID auto-generator: `JBJ-HH-${yyyymmdd}-${4 random uppercase alphanumerics}` computed at compose time when `f.bookingRef` is blank.
- Stamp rendering is HTML inside `signatureBlock`, so it appears identically in preview, print, and PDF export — no extra wiring needed in `DocumentStudio.tsx`.
- Footer changes apply to every template (every doc uses the locked chrome via `wrapWithJbjChrome` and `LockedFooter`).
- No DB changes required.

## Files touched

- `src/templates/jbjLockedChrome.ts` — premium 3-col footer with office address
- `src/components/document-studio/LockedLetterhead.tsx` — matching preview footer
- `src/templates/composers/index.ts` — signature block (no ID), recipient block (no ID), Holiday Home rewrite, bundled stamp injection
- `src/config/documentCatalog.ts` — remove `idNumber` field everywhere, add Holiday Home booking/quotation fields
- `src/components/document-studio/DocumentStudio.tsx` — remove ID/Passport client-info input
- `src/assets/jbj-company-stamp.png` — new bundled stamp asset
