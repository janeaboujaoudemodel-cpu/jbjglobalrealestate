
## Goal
Fix the brokerage outreach email template so it looks premium, never says "Dear Sample / Sample Brokerage Group", greets each recipient by their actual brokerage / contact name, centers the featured project block, makes the CTA a champagne-gold premium button, restructures the registration paragraph, and removes the "please disregard" line.

## Files to change

### 1. `supabase/functions/crm-send-brokerage-outreach/index.ts` (lines ~428–469, fallback HTML)

Rewrite the email body with this structure:

```text
GREETINGS FROM CITI DEVELOPER!     ← brand banner (center, gold underline)
Sales & Training · Channel Partner Activation

Dear {Brokerage Name} team,         ← (or "Dear {Contact First Name}" if a real contact exists)

This is Jane Aboujaoude from CITI Developer, Sales & Training.

{group_status_line}

Please let us know if {Brokerage Name} is already registered with CITI
Developer. If you are not yet registered, kindly share the email address
where your team would like to receive the registration documents and we
will send everything required to complete onboarding.

────────── FEATURED PROJECT (centered card) ──────────
                  AMRA
   Wellness-led beachfront resort residences…
   [ Open AMRA e-catalogue → ]   ← champagne/gold premium CTA
─────────────────────────────────────────────────────

PRIVATE INVITATION — Partnership Briefing & Breakfast
…existing breakfast block (unchanged content, slight polish)…
[ Book your slot on the calendar → ]

Warm regards,
Jane Aboujaoude
CITI Developer · Sales & Training
```

Specific edits:
- **Greeting block (new):** replace the small uppercase header with a centered gold-accent line `GREETINGS FROM ${representedDeveloperName}!` (note the `!`, not a colon) plus a thin `#B89555` hairline underline.
- **Salutation (line 433):** change to dynamic logic — if `pcRaw.name` exists use `Dear <strong>${resolvedContactFirstName}</strong>,`; otherwise `Dear <strong>${varsMap.brokerage_name}</strong> team,`. Never the words "Sample" or "from".
- **Registration paragraph:** move it out of the bottom and place it directly after `${resolvedGroupLine}` (before the Featured Project card). New copy:
  > *"Please let us know whether <strong>{brokerage_name}</strong> is already registered with {representedDeveloperName}. If not, kindly reply with the email address where your team would like to receive the registration documents, and we will send everything required to complete onboarding."*
  No question mark; declarative tone.
- **Delete** the entire "Could you also confirm…" paragraph (line 458) and the italic "Please disregard this message…" paragraph (line 459).
- **Featured Project card (lines 436–441):** add `text-align:center` to the wrapper; center the project name, tagline, and CTA. Replace the black CTA with a premium champagne-gold button:
  ```
  background: linear-gradient(180deg,#D4B05A 0%,#B89555 100%);
  color:#1A1A1A; border:1px solid #8A6F3E;
  border-radius:10px; padding:14px 30px;
  font-weight:600; letter-spacing:0.4px;
  box-shadow:0 2px 8px rgba(184,149,85,0.35);
  ```
  Label stays `Open ${project.name} e-catalogue →`.
- Apply the same gold-CTA style to the "Book your slot" button below for visual consistency (currently solid black).
- Polish: increase outer container padding, refine spacing, keep champagne palette per memory.

### 2. `src/components/crm/TemplateEditorDialog.tsx` (preview, lines 65–67, 99, 137, 141)
- Remove the literal default `"Sample Brokerage Group"` and `"Sample Developer Co."` — use `""` and show placeholder text "Recipient brokerage name (for preview only)" in the input. The preview substitution must fall back to `"Your Brokerage"` rather than the word "Sample".
- Replace `{{contact_first_name}}` preview value `"Sample"` with empty (so the new salutation logic shows `Dear Your Brokerage team,`).
- Update the `group_status_line` preview text to the new wording (no "confirm if you're already registered" trailer — the registration ask is now its own paragraph).

### 3. `src/components/crm/BulkSendDialog.tsx` (line 291 and the GROUP_LINES_LOCAL block 289–302)
- Update `prospective` line to: `"We'd love to introduce CITI Developer to your team."` (drop the "and confirm if you're already registered with us." tail — that ask now lives in a dedicated paragraph rendered by the edge function).
- Keep all other group lines unchanged.

### 4. Per-recipient name synchronization (already wired, verify)
The edge function already resolves `varsMap.brokerage_name` from `brk.company_name` and `varsMap.contact_first_name` from the brokerage's `primary_contact.name` for **every recipient** in bulk sends (each `send-brokerage-outreach` invocation is per-brokerage). No code change needed — the new salutation logic above will automatically render `Dear Provident team,` for Provident and `Dear Farm team,` for Farm, etc. We will add a one-line code comment documenting that the salutation is per-recipient and never falls back to the word "Sample".

## Out of scope / not changed
- Template variants other than `brokerage_partnership_intro` fallback (the edge function only renders this fallback when stored template lacks `{{project_name}}`; stored DB templates are untouched and remain owner-editable in the Template Editor).
- Booking flow, CC auto-save, briefing fields, "All shows 0" fix — already shipped previously.

## Deploy
After edits, redeploy the edge function `crm-send-brokerage-outreach`.
