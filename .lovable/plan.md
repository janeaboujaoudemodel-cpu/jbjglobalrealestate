

## Deep Audit Results & Remediation Plan — Unified Email Templates

### Audit Summary

I audited all 10 outbound email edge functions plus the survey/review frontend flows. Here is every outstanding defect, categorized by template.

---

### DEFECTS FOUND (Per Template)

**1. `send-welcome-email`** (partially compliant)
- Header padding `24px 40px 20px` — monogram/wordmark still not perfectly centered. Needs `28px 40px 28px` for true centering.
- Benefit icons: SVG icons are present but `<div>` with `display:flex` does NOT render in email clients (Gmail, Outlook strip `display:flex`). Must use `<table>` centering instead.
- "CONTACT@JBJ.AE" — the company email must be written in CAPITAL LETTERS everywhere (currently mixed case in multiple places).
- Champagne background container has `border-radius:24px` but user wants rounded corners — need to ensure consistency.

**2. `send-password-change-confirmation`** (multiple critical bugs)
- **Broken layout**: Email renders as split cards with "..." (three dots/ellipsis) between sections. Root cause: the HTML structure nests tables incorrectly — the body/footer are separate table rows at different nesting levels, causing email clients to truncate.
- Lock icon in circle: SVG inside `<td>` with gold gradient — SVGs are stripped by many email clients (Gmail). Must use the monogram PNG image as fallback or an HTML/CSS circle with a unicode lock character.
- Recommended For You: uses 4-card (2x2) grid instead of 3-card row (AI Tools, Guides, Properties). Must match welcome email.
- Missing: ticket support embed section.
- Footer: standalone (not using shared function), slightly different styling from welcome email.

**3. `send-email-otp`** (OTP/Verification code)
- Missing: Recommended For You section entirely.
- Missing: Suggested actions (AI Tools, Guides, Properties shortcuts).
- Missing: Ticket support embed.
- Missing: Feedback section (Review/Survey buttons).
- "Need help" contact line is too thin/slim vertically — needs more padding.
- Header padding: `36px` top vs `24px` — inconsistent with other templates.

**4. `send-cv-status-email`** (Career)
- Header: uses separate monogram row + gold hero — different from unified black header with centered monogram+wordmark.
- Recommended For You: uses Unicode emojis (&#9881; &#128218; &#127969;) instead of SVG icons.
- Survey link: points to `/survey` (404) instead of `/ticket-survey`.
- Missing: ticket support embed section.
- contact@jbj.ae not underlined.
- Company email not in CAPITAL LETTERS.

**5. `send-application-status-email`** (Partnership/Career/Listing status)
- Header: missing monogram image, just text "JBJ GLOBAL REAL ESTATE".
- Footer: completely different style — gold text links instead of champagne gradient buttons.
- Missing: Recommended For You section entirely.
- Missing: Ticket support embed.
- Missing: Suggested actions.
- Champagne background: uses `#f5f0e6` with sharp `border-radius:16px` — inconsistent with rounded 24px.

**6. `send-idea-approved-email`**
- Recommended For You: uses letter placeholders in colored squares (AI, G, P) instead of SVG icons.
- Title should be "IDEA RECEIVED" not "Idea Approved" (user wants stages: Received → Under Review → Accepted).
- Sub-header band needs to be taller/more 3D (same height as header).
- Missing: green "Contact Us" box.
- Missing: ticket support embed.

**7. `send-ticket-status-email`** (Support ticket)
- Completely different template: gold hero header instead of black header with monogram.
- No monogram/logo in header.
- Footer: minimal, missing social links, missing champagne buttons, missing founder credit.
- Missing: Recommended For You.
- Missing: suggested actions.

**8. `send-admin-message`** (Admin replies)
- Header: monogram only 80px (should be 180px).
- Missing: Recommended For You section.
- Missing: suggested actions.
- Footer: different style — gold text links instead of champagne gradient buttons.

**9 & 10. `send-inquiry-email` / `send-market-report-email`**
- These are admin-only notification emails (sent TO company, not to users). No user-facing template needed. However, they should still use CAPITAL LETTERS for company email.

### Survey/Review Bugs

**Survey (`submit-ticket-survey` edge function)**
- The user reported "edge function returned anon 2XX status code" — this is likely because the `ticket_surveys` table RLS has NO INSERT policy for public/anon users. The edge function uses service role key so inserts work, but the contextual survey path inserts into `user_feedback` which requires `user_id = auth.uid()` for INSERT — and contextual surveys set `user_id: null`. This will fail for unauthenticated users.
- Fix: The edge function already uses service role client, so this should work. Need to verify the actual error.

**Review flow**
- `customer_reviews` INSERT policy requires `auth.uid() IS NOT NULL` — reviews from email links won't work for unauthenticated users. The FeatureReviewPrompt does `user?.id || null` for user_id but the RLS check is on `auth.uid()`, not on the column value.

---

### IMPLEMENTATION PLAN

#### Phase 1: Create Shared Email Template Module
Create `supabase/functions/_shared/email-html.ts` containing:
- `svgIcons` object with all premium black outline SVGs (building, heart, headset, ticket, gear, book, house, lock, chart, academy)
- `sharedHeader(departmentLabel)` — black header with 180px monogram, wordmark, centered with equal padding
- `goldSubHeader(title)` — gold gradient band, same height as header, edge-to-edge
- `recommendedActionsHtml()` — 3-card row with SVG icons (AI Tools, Guides, Properties)
- `inquiryBox(contextLabel)` — green bordered contact box
- `ticketSupportEmbed()` — ticket support banner matching website style
- `feedbackHtml(context)` — Review + Survey buttons
- `sharedFooterHtml()` — unified footer with champagne gradient social buttons, founder credit, copyright
- `emailShell(header, body, footer)` — white outer background, champagne rounded container

All company email references written as `CONTACT@JBJ.AE`.

#### Phase 2: Rewrite All 8 User-Facing Templates
Each template will import from the shared module and use identical header/footer/sections:

1. **send-welcome-email** — Fix icon rendering (table-based centering), fix header padding, add ticket support embed
2. **send-password-change-confirmation** — Complete rewrite as single unbroken card, use PNG monogram in gold circle (not SVG), 3-card recommendations, add ticket support
3. **send-email-otp** — Add recommended actions, suggested shortcuts, ticket support, feedback section, increase "Need help" line height
4. **send-cv-status-email** — Replace Unicode emojis with SVG icons, fix survey link `/survey` → `/ticket-survey`, unify header/footer
5. **send-application-status-email** — Add monogram to header, add recommended section, add ticket support, unify footer with champagne buttons
6. **send-idea-approved-email** — Replace letter placeholders with SVG icons, rename to "Idea Received", add green contact box, add ticket support, make sub-header taller
7. **send-ticket-status-email** — Replace gold hero with unified black header, add monogram, add full footer, add recommended section
8. **send-admin-message** — Enlarge monogram to 180px, add recommended section, unify footer

#### Phase 3: Fix Survey Edge Function
- Verify the `submit-ticket-survey` edge function works for unauthenticated contextual surveys (it uses service role so should bypass RLS)
- Test each context type (listing, job, inquiry, password_change, general)

#### Phase 4: Fix Review Flow
- Ensure `FeatureReviewPrompt` works for unauthenticated users coming from email links (may need to allow anon inserts or prompt login first)

#### Phase 5: Deploy & Test All Templates
- Deploy all modified edge functions
- Send test emails for every template type to verify:
  - Centered monogram + wordmark in black header
  - Gold sub-header edge-to-edge, same height
  - SVG icons rendering (with table-based centering)
  - Recommended For You with gear/book/house icons
  - Green contact box with CONTACT@JBJ.AE
  - Ticket support embed
  - Feedback buttons (Review + Survey)
  - Unified champagne-button footer with social links
  - Single unbroken card layout (no three dots)
  - All company email in CAPITAL LETTERS
- Take screenshots of each received email as proof

#### Phase 6: End-to-End Survey & Review Test
- Submit a test survey via the ticket-survey page for each context
- Submit a test review via the reviews page
- Verify data persists in the database

---

### Technical Detail: SVG Rendering in Email

SVGs inside HTML emails are stripped by Gmail. The solution:
- For benefit icons: use `<img>` tags pointing to hosted SVG/PNG assets in the storage bucket, OR use HTML/CSS shapes
- For the lock icon: use the monogram PNG in a gold circle with CSS
- For Recommended For You cards: use HTML/CSS box icons with border styling, not inline SVGs

This ensures rendering across Gmail, Outlook, Apple Mail, and mobile clients.

