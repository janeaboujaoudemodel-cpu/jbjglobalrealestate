# Fix Brokerage Outreach Email Templates

The brokerage templates in `crm_email_templates` (`brokerage_partnership_intro` and `brokerage_breakfast_invite`) still produce awkward greetings like "Dear from your brokerage" and don't reuse the agency name through the body. We'll rewrite both rows and tighten the variable resolution so every send (test or real) personalizes correctly.

## 1. Greeting block — both templates

Replace the current "Dear {{contact_first_name}} from {{brokerage_name}}," with a two-line institutional opener:

```text
Greetings from CITI Developer,

Dear {{salutation}},
```

`{{salutation}}` resolves in the edge function `crm-send-brokerage-outreach` with this priority:

1. If a real contact first name is on file (or supplied via `personalization.contactFirstName`) → use it: `Sayyed`, `Jane`.
2. Else if test send with explicit recipient → derive first name from the email local-part (already done by `prettifyFromEmail`).
3. Else → `{{brokerage_name}} team` → renders as `Dear Driven Properties team,` / `Dear Provident team,` / `Dear Fam Properties team,`.

No more "Dear from your brokerage" — if the brokerage is unknown the fallback is `Dear team,`.

## 2. Body copy — speak to the agency by name

Rewrite the intro paragraph and CTA copy so `{{brokerage_name}}` is used naturally:

- `brokerage_partnership_intro`:
  - Lead: "We'd like to invite **{{brokerage_name}}** to a private briefing with CITI Developer."
  - Confirmation line: "We'd also love to confirm whether **{{brokerage_name}}** is registered with us — if not, we'll fast-track activation."
  - CTA section: "Reserve a seat for **{{brokerage_name}}**".
- `brokerage_breakfast_invite`:
  - Lead: "On behalf of CITI Developer, we'd like to organize a private breakfast and training for **{{brokerage_name}}**."
  - Logistics: "Share the best WhatsApp number for **{{brokerage_name}}** so we can coordinate breakfast logistics."
  - CTA: "Confirm attendance for **{{brokerage_name}}**".

## 3. Visual styling — parity with the developer template

Apply the same premium edits already shipped on the developer template:

- Champagne page (`#F7F2EA`) + cream card (`#FDFBF7`) + 1px gold hairline (`#B89555`).
- Centered Featured Project block with project name, tagline, and offer HTML.
- Gold-gradient CTA button (linear-gradient `#C9A75E → #B89555 → #9A7B36`, ink text `#1A1A1A`, 12px radius).
- Inter font stack only, line-height 1.6, no faded-gold text colors.
- Remove any leftover "Please disregard this message if your brokerage is already registered" paragraph (currently absent from DB but we'll also strip the stale "if your brokerage is already registered with us" hedging — replaced by the cleaner copy above).

## 4. Edge function changes — `crm-send-brokerage-outreach`

- Add `salutation` to `varsMap` with the priority logic from §1.
- Keep all existing variables (`brokerage_name`, `contact_first_name`, `project_name`, `booking_url`, etc.) so any custom owner edits to the locked HTML still work.
- Test-send flow already infers `firstName` and `brokerage` from the email — feed those into `salutation` so a test to `sayyed@provident.ae` renders `Dear Sayyed,` and the body still references `Provident`.
- If `body.testBrokerageName` is provided, it wins over the inferred domain segment for `{{brokerage_name}}`.

## 5. Delivery

1. `supabase--insert` migration that updates the two rows in `crm_email_templates` with the rewritten HTML.
2. Edit `supabase/functions/crm-send-brokerage-outreach/index.ts` to add the `salutation` variable.
3. Deploy the edge function.
4. Verify by triggering a test send from the Brokerage tab → "Send test" with both an email containing a name (e.g. `sayyed@provident.ae`) and a generic one (e.g. `info@driven.ae`).

## Files touched

- `supabase/migrations/<ts>_brokerage_template_rewrite.sql` (new) — UPDATEs both rows.
- `supabase/functions/crm-send-brokerage-outreach/index.ts` (edit) — add salutation resolver.

No UI/component changes; all personalization stays server-side.
