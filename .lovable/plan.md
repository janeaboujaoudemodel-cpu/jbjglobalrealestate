
# Fix Breakfast Booking + CRM Brokerage/Developer overhaul

There are 7 distinct problems. I'll fix them all in one pass.

---

## 1. "Book your slot on the calendar" → white page / wrong number / Team Login

**Root cause:** the link points to the production domain `https://www.jbj.ae/breakfast-booking?token=…`. That domain serves the **published** build, not the latest preview. The `<noscript>` block hard-coded in `index.html` is what shows:
- "JBJ Global Real Estate"
- "This website requires JavaScript to run."
- the **old** number `+971 56 591 1000`
- a `Team Login` button

So the page is fine when JS is on — but the noscript block is wrong, *and* on the live deployment some browsers/previews show it. Also the email is using the wrong base URL until the project is republished.

**Fix:**
- Update `index.html` `<noscript>` block: remove the "Team Login" button (per your instruction) and replace the phone number with the correct one (`+971 54 716 7107`, `contact@jbj.ae`).
- In `crm-create-breakfast-invite-token`, default `SITE_URL` to the **preview** URL when `PUBLIC_SITE_URL` is not set, so test sends never go to the stale production build. Also append the token correctly so the React route loads.
- Verify `/breakfast-booking` route is in `PublicRoutes` (it is) and confirm published build will pick up the noscript fix once the user republishes (I'll tell them).

## 2. "Umrah" / e-catalogue card not centered

The featured-project card in the email uses `text-align:left` for the title in the saved DB template. The fallback HTML in `crm-send-brokerage-outreach` is centered, but the user-edited DB template is what's actually being sent.

**Fix:** Update both DB templates (`brokerage_breakfast_invite` + `brokerage_partnership_intro`) so:
- The featured-project block is `text-align:center`, project name + tagline centered, "Open … e-catalogue →" button centered.
- The "Book your slot on the calendar" button is upgraded to the **premium gold gradient CTA** (matches the fallback in the edge function: `linear-gradient(180deg,#D4B05A,#B89555)`, gold border, soft shadow).

## 3. "Please disregard this message if your brokerage is already registered" still showing

That sentence is hard-coded in both DB templates. Migration `20260505195250` only neutralized one phrase ("n this message"), the user's edits added the full sentence back.

**Fix:** Strip the entire `<p>…disregard this message…</p>` paragraph from both templates via a data update (UPDATE statement, not migration).

## 4. Brokerage tab — "Email Selected Agencies" / "Edit Templates" / "Send Test" should be merged

Currently they are three separate buttons in the toolbar. The Developer tab has the same separation.

**Fix:** Replace with a single **"Outreach"** dropdown card on both tabs containing:
- Send to Selected
- Edit Template
- Send Test
- Activity Log

Same component shared between Brokerage and Developer tabs.

## 5. Outreach Queue / Sent History minimized by default; Outreach Queue must show only actionable statuses

Both sections currently expand on mount.

**Fix:**
- Wrap both panels in collapsibles, **collapsed by default** (chevron + counts visible).
- Outreach Queue list: filter to only `not_started | pending_application | documents_required` (drop `expired | rejected | do_not_start`).
- Add a **new top-level filter chip "Contracts"** (next to Expired / Rejected / Do Not Start). Clicking it shows all developers with an uploaded agreement file. From there, allow uploading / replacing the contract PDF inline.

## 6. Bulk upload (Excel/CSV) of brokerages and developers with strict de-dup + classification

Add an **"Upload list"** button on each tab (Brokerage and Developer) opening a dialog:

1. User drops an `.xlsx` / `.csv` / DLD-style HTML.
2. Server parses → for each row:
   - Normalize name (strip "LLC", "(BRANCH)", punctuation).
   - **Classify** via Lovable AI (`google/gemini-3-flash-preview`) + Firecrawl: is it a *real-estate brokerage*, a *mortgage broker / consultancy*, or a *developer*?
     - Mortgage / consulting / non-real-estate → **rejected** (returned in report, never inserted).
     - Developer rows uploaded into Brokerage tab → automatically rerouted to the Developer table (and vice versa).
   - **De-dupe** against existing rows by: DLD office number → normalized name → email domain → website domain.
3. Returns `{ inserted, rerouted, rejected_non_real_estate, duplicates_skipped, sample }` and surfaces it in the dialog.

Two new edge functions:
- `crm-bulk-upload-brokerages` (Brokerage tab handler)
- `crm-bulk-upload-developers` (Developer tab handler)

Both share a classifier helper that calls Lovable AI with the company name + scraped homepage summary and returns `{ kind: "brokerage" | "developer" | "mortgage" | "other" }`.

## 7. Filter bar takes too much vertical space + brokerage/developer directories are mixed

**Fix:**
- Replace the multi-row filter strip on each tab with a single-line **"Filters" popover button** (count badge shows active filters). Inline only Search + the count chip + the "Filters" button + the Outreach dropdown + Upload + Add.
- Move the **UAE Brokerage Directory** widget (auto-run / Refresh now) into the **Brokerage tab only**.
- Move the **UAE Developer Directory** widget into the **Developer tab only**.
- Both directory cards collapsed by default, tucked under the filter row.

---

## Technical breakdown

**Files to edit:**
- `index.html` — fix noscript block (phone + remove Team Login).
- `supabase/functions/crm-create-breakfast-invite-token/index.ts` — robust SITE_URL fallback.
- DB data update (via insert tool, not migration): rewrite both `crm_email_templates` rows — center featured project block, premium gold CTA on booking link, strip "disregard" paragraph.
- `src/pages/CRMRelationships.tsx` — collapse Outreach Queue/Sent History, add Contracts chip + filter, restrict queue statuses, single-line filter row with popover, dedicated directory widgets per tab, Upload List button, unified Outreach dropdown.
- `src/components/crm/OutreachActionsMenu.tsx` (new) — merged dropdown for both tabs.
- `src/components/crm/BulkUploadDialog.tsx` (new) — file drop + result report.
- `src/components/crm/ContractsPanel.tsx` (new) — list + upload of developer agreements.

**New edge functions:**
- `crm-bulk-upload-brokerages`
- `crm-bulk-upload-developers`
- shared classifier inlined in each (Lovable AI + optional Firecrawl scrape).

No schema migration is required — existing `crm_brokerages` (with `dld_office_number` unique key) and `crm_developers` already support all needed fields. Contracts re-use existing `crm_developers.agreement_file_url` (will verify).

I'll execute everything in one go after approval, then ask you to test the Bulk Send breakfast email once more.
