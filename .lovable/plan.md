
The user wants me to use the browser tool to test the contact form and audit forms across the entire site (front + back end) to find where they're breaking.

This is a testing/QA task. I need browser tools (not available in plan mode) plus likely fixes after.

Plan:

## Goal
Use the browser to actively test forms across the entire site, identify what's broken (visual contrast, validation, submission, errors), and fix every issue found.

## Testing scope

**Front end (public)**
1. `/contact` — consultation form submission + readability
2. `/project/tilal-al-furjan` — Register Interest + Download Brochure modals
3. Smart Lead Capture popup (triggered by behavior)
4. `/card` — digital business card form
5. Action gate / sign-in modal
6. Meeting booking modal (Amanda)
7. Newsletter / footer subscribe (if present)
8. Search & filter bars on `/projects`, `/resale-properties`, `/property-map`

**Back end (authenticated / owner)**
1. `/owner` command center forms
2. `/owner/email-client` compose
3. `/team-chat` message composer
4. `/admin/marketing` campaign editor
5. CRM lead create/edit (`/owner/leads` or equivalent)
6. `/owner/documents` editor
7. Listing admin / Provident portal create/edit project
8. Developer portal registration + project submission
9. Ticket hub create ticket
10. Settings / profile edit

## Method (per form)
1. Navigate, screenshot before
2. Check label/placeholder/input contrast (must be black on light, white on dark)
3. Try empty submit → check validation messages render readably
4. Try valid submit → check success toast + network 2xx
5. Check dropdowns/selects/date pickers contrast when open
6. Check modal close button visibility
7. Capture screenshot as proof

## Fix-as-I-go
For every issue found I'll:
- Patch the component (inline color locks or `data-surface` tag)
- If it's systemic, patch the primitive (`Input`, `Label`, `Select`, `Textarea`, `Button`)
- Re-test and screenshot the fixed state

## Deliverable
- Single audit report listing every page → form → issue found → fix applied → before/after screenshot
- Saved to `/mnt/documents/form-audit/` and surfaced as artifacts
- Final summary table: page, form, status (PASS / FIXED / BLOCKED)

## Constraints
- I'll skip destructive back-end actions (don't delete real CRM leads, don't send real campaigns) — I'll fill forms and verify the submit step works without final-confirming destructive ops, and note that explicitly in the report
- If a back-end form requires data I don't have (e.g. specific IDs), I'll note it as "manual verification required"
- If the browser fails to start, I'll do the audit by code reading and still patch issues, then report which forms need your manual click-through

Once approved, I'll start with `/contact`, work through public pages, then authenticated pages, fixing readability/submission breaks as I find them and delivering screenshot proof at the end.
