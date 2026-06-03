# AI Home Finder — Results polish, PDF rebuild & Applications hub

Scope = the AI Home Finder ("Matchmaker") flow only. Champagne/gold theme everywhere else is untouched; this surface stays Tiffany cyan / deep navy.

## 1. Results page UI (`src/pages/QuizResults.tsx`, `MatchCriteriaTable.tsx`)

**a. "View Properties" anchor button** under the criteria table:
- Renders only when `projects.length > 0`.
- Tiffany 3D glow CTA (`aihf-cta-glow`) with `ChevronDown` icon, label "View these properties".
- Smooth-scrolls to a new `#aihf-top-pick` anchor placed on the #1 card.

**b. #1 card + "More Great Options" cards** — already have `<Link to="/project/:slug">` View Property. Verify the link, harden the CTA copy ("Explore Property →"), and add a small **"Back to my AI matches"** floating CTA on `/project/:slug` only when the visitor arrived from `/quiz-results` (detect via `document.referrer` or `sessionStorage.matchmaker-return`). The floating CTA returns to `/quiz-results` with the persisted session.

**c. Theme the heart / shortlist / Add Badge buttons** to match Tiffany:
- `FavoriteButton` inside `.aihf-results` already inherits white via CSS — extend `AIHF_RESULTS_STYLE` to repaint heart fill + shortlist icon to `#5EEAD4` / `#22D3EE` on hover + active, with a soft cyan glow.
- `Add Badge` dropdown trigger: swap `text-[#B89555]` / `bg-[#FDFBF7]` to Tiffany tokens (`bg-[#031E18]`, `border-[#5EEAD4]/40`, `text-[#67E8F9]`); medal labels stay color-coded but on dark surface.

**d. Price pill fix on cards** (issue circled in screenshot):
- The "FROM AED 2.8M" pill overflows + uses champagne/grey. Scope a local override inside `.aihf-results .price-pill-premium` so the pill background is a translucent ink tile with a Tiffany hairline (`rgba(94,234,212,0.55)`), `From` chip stays light cyan, value uses `--price-orange`, and the pill auto-wraps (`flex-wrap`, `max-w-full`). Reduce internal padding so it never clips the parent tile.

**e. Criteria table redesign** (`MatchCriteriaTable.tsx`):
- Lighter cell surface: `rgba(8,47,73,0.55)` / `rgba(14,116,144,0.32)` alternation instead of near-black, with a soft inner cyan glow on the whole panel.
- Bigger property column headers showing rank pill (#1/#2/#3 in Tiffany gradient) + project name + a thumbnail (40×40 rounded) loaded from `project.cover_image_url`.
- New **summary footer row** under the body: per property, render two stat chips — `✓ N matched` (emerald) and `✗ M missed` + `≈ K close` (amber). Computed from existing `rows[].cells[i].verdict` counts. The #1 column gets a "Best fit — N/total criteria" callout to justify the ranking.
- Verdict pills become more readable: 24px circle with brighter foreground (`#34D399`, `#FBBF24`, `#F87171`), bold label, monospace value line.
- Sticky first column on horizontal scroll for mobile.

## 2. PDF rebuild (`buildPdf` in `QuizResults.tsx`)

Current PDF only ships project detail pages; user wants the criteria table inside the PDF and clickable listing links.

- **Page 1 — Cover/Hero**: Tiffany gradient band, monogram, client name + date, "Top 3 AI-Selected Properties for {Full Name}".
- **Page 2 — Criteria match table**: rebuild with `jspdf-autotable`, columns = `Requirement | #1 | #2 | #3`, each property cell renders verdict glyph (✓ ≈ ✗) + value, color-coded fills (emerald / amber / red @ 18% alpha) — generated from `buildCriteriaRowsForExport(answers, projects)` so the screen + PDF render the **same verdicts**. Footer row = match totals per property.
- **Page 3 — Side-by-side comparison** (existing attribute table, tightened cell padding so no blank gutters between rows; remove the legacy second `drawPageBg` call that left blank trailing pages).
- **Pages 4-6 — Per-property detail cards**: keep current layout but add `doc.link()` rectangle over the "Listing URL" row pointing to `https://jbj.ae/project/{slug}` (jsPDF native annotation, so it's clickable in any PDF viewer). Also render the cover image at top of each detail page.
- Fix the empty-page bug: `didDrawPage: drawPageBg + drawHeader` runs on the autoTable's auto-created next page; we'll guard so we don't `addPage()` before the next section if the table already advanced.
- Filename: `JBJ-AI-Matchmaker-{LastName}-{YYYYMMDD}.pdf`.

QA: render the PDF via `pdf-qa` script (existing `scripts/pdf-qa/`) for at least pages 1/2/3 and visually verify no blank gaps, links present.

## 3. Backend — save every submission (`supabase` migration + Quiz.tsx)

Today `quiz_responses` only saves when `user?.id` exists (anon visitors lost). Also no contact-detail columns.

New table:

```sql
CREATE TABLE public.matchmaker_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  nationality text,
  preferred_language text,
  answers jsonb NOT NULL,
  recommended_slugs text[] NOT NULL,
  recommended_project_ids uuid[],
  result_tier text NOT NULL CHECK (result_tier IN ('exact','close','nearest','fallback')),
  pdf_filename text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.matchmaker_submissions TO anon, authenticated;
GRANT ALL ON public.matchmaker_submissions TO service_role;
ALTER TABLE public.matchmaker_submissions ENABLE ROW LEVEL SECURITY;
-- Anyone can insert (anon allowed = lead capture)
CREATE POLICY "anyone_can_submit" ON public.matchmaker_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Owner/admin only can read
CREATE POLICY "owner_admin_can_read" ON public.matchmaker_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
```

Quiz.tsx `proceedToResults`: always insert into `matchmaker_submissions` (anon allowed via new policy), in addition to the existing `quiz_responses` write for logged-in users.

## 4. Owner hub — "Applications → AI Home Finder"

- Add route `/owner/applications/ai-home-finder` (under the existing owner shell), surfaced from the owner sidebar under a new **Applications** group (also stub `/owner/applications` index listing all app sources).
- Page shows a list of `matchmaker_submissions` rows: avatar, name, email, phone (with country flag from nationality), submitted at, top-3 project names, tier badge.
- Row click opens a drawer that renders the **same** report layout the client sees: hero, criteria table, top-3 cards (read-only), contact card with click-to-email / click-to-WhatsApp, and a **"Download PDF"** button reusing `buildPdf` with the stored answers + slugs.
- Privacy: this route is wrapped in `OwnerGuard`; emails are never shown in any non-owner UI per existing memory.

## 5. Files

- Edit: `src/pages/QuizResults.tsx`, `src/components/matchmaker/MatchCriteriaTable.tsx`, `src/pages/Quiz.tsx`, owner sidebar config.
- New: `src/pages/owner/AIHomeFinderSubmissionsPage.tsx`, `src/components/matchmaker/SubmissionDetailDrawer.tsx`, migration `add_matchmaker_submissions.sql`.
- No changes to champagne/gold global theme, no changes outside the AI Home Finder surface.

## 6. Validation

A. New anon match end-to-end → submission row appears in DB and `/owner/applications/ai-home-finder`.
B. Owner opens drawer → same report renders, Download PDF works, email/phone are visible.
C. Click "View these properties" → page scrolls to #1 card; clicking View Property → project page → "Back to my AI matches" returns to `/quiz-results` with persisted answers.
D. Download PDF → 1 cover + 1 criteria table page + 1 comparison page + 3 detail pages with clickable listing links, no blank gaps.
E. Mobile (375px) check: criteria table scrolls horizontally with sticky first column; price pill no longer clips.

Awaiting approval before any code changes.
