# Developer Registration Template Rewrite

Scope is limited to the developer-registration email content and its confirmation variant. No dashboard/reply-workflow changes in this turn (those come next — flagged at the end).

## What changes

**File:** `supabase/functions/crm-send-developer-registration/index.ts` (plus the "confirm registered" variant in the same or sibling template file)

### 1. Replace the "Operational contact & escrow" block

Old block will be deleted entirely and replaced with a single, non-repeating block:

```
Registration desk
Please send your registration form, agency code and onboarding documents to
helpdesk@jbj.ae (CC infoo.jane@gmail.com).

Admin contact — Walid Halabi
+971 54 366 2223  ·  +971 50 999 3839
For urgent registration or compliance questions only.

Project folders & escrow
In your marketing-material link, include one folder per project containing:
  • project details
  • the project escrow account
  • the corporate bank account (payment beneficiary)

If a project is not yet registered, mark it as
"Registration pending — documents pending from JBJ" and include the reason.

WhatsApp group
Please create a WhatsApp group named  {Developer} / JBJ Global Real Estate,
add Jane Bou Jaoude and Walid Halabi as admins, use your developer logo,
and paste your marketing-material link in the group description.
```

### 2. Fixes applied inside the template

- Correct spelling: **Walid Halabi** (not Waleed / Wade).
- Remove **all repeated lines** about "coordinate with Waleed", "helpdesk@jbj.ae", "escrow", etc. — each address, phone, and instruction appears exactly once.
- Remove the old escrow paragraph ("Kindly share your developer escrow/trust account beneficiary form…") — this is deleted, not rewritten.
- Remove the sentence "so the CRM can attach your response to the correct developer card." No replacement phrase — the line is dropped entirely (matching your answer).
- Jane is listed only as WhatsApp-group admin. No email/phone for Jane. No "contact Jane" instruction anywhere.
- Helpdesk = single canonical mailbox for replies. Walid = admin/urgent-only contact.
- Sender identity untouched: From `JBJ Global Real Estate <helpdesk@jbj.ae>`, Reply-To `helpdesk@jbj.ae`, CC `infoo.jane@gmail.com` (already correct in the sender chain).

### 3. Confirmation-registered variant

Apply the same contact/escrow/dedup fixes to the `developer_confirm_registered` template so both variants stay consistent.

## Verification

1. Render the template server-side with a fixture developer and save the HTML.
2. Trigger one live test send to `infoo.jane@gmail.com` (per your standing rule).
3. Playwright: open the received email in the preview and screenshot it — confirm:
   - Walid Halabi spelling + both numbers present exactly once
   - Escrow paragraph reads exactly as above
   - No "CRM card" phrasing anywhere
   - No duplicated helpdesk/escrow lines

## Explicitly NOT in this turn

The following broken items you listed are acknowledged and will be the next plan (I'll open it right after you approve this one):

- Insights panel: Reply / Send / Rewrite-with-AI wiring, real thread + reply body rendering
- Tile counters vs "Prepare AI Drafts (0)" mismatch, non-clickable Select checkboxes
- Activity folder honesty ("4 sent · 4 replies" when replies ≠ 4)
- Continuous helpdesk@jbj.ae + infoo.jane@gmail.com sync, retry bucket for Gmail-limit/bounce
- Mirror the same working flow to Client & Brokerage portals

Keeping this plan focused on the template so it ships clean and you can verify the copy before we touch the workflow layer.
