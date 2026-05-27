
## Goal
Lock a single global rule-set across **every** current and future template (Form A/B/F/I/U, Broker Referral, Partner family ×5, PAA, Job Offer, Letterhead, future). Fix the chrome, signature, per-page strip, and labeling; surface the PAA; rename Careers Portal → Document Studio (owner-only); enable inline preview editing; recommend an AI model upgrade — all without removing existing features.

---

## 1 · Letterhead chrome (global)
- Reduce header height ~50% (target ≈ 92px vs current ≈ 152px). Keep a fixed 42px DocuSign safe band above it.
- **Bigger monogram**: 200×200 (was 160×160); pull the vertical gold hairline closer to the monogram (≈ 12px gap instead of 26px) so it sits left of the wordmark.
- Centered wordmark stays one line; remove ornamental padding.
- **"Generated DD Month YYYY"** date moves out of the header overlay → renders as a small right-aligned line on the FIRST INTERIOR ROW under the letterhead (not on top of chrome). Pages 2…N continue to show it top-right under the safe band.
- Last-page footer reserve stays as-is.

## 2 · Per-page signature strip (global)
Today every page renders Name + Signature + Date rows. New rule:
- **Inner pages (1 … N-1)**: ONLY a single short signature line (≈ 260px wide), label "Signature:" + ink rule. **No Name, no Date.**
- A thin gold hairline (`#B89555` @ 55% opacity, 1px) renders flush against the very bottom interior of every page — single line, not a frame.
- **Last page**: the full official signature block (see §3) — the per-page strip is suppressed automatically via `data-signature-block="1"`.

## 3 · Last-page signature block (global)
Current cell shows "Authorised Signatory" as heading and the company name in the title slot. Replace with:
- Heading removed (or kept as small uppercase eyebrow only if RERA-required — Form I keeps "Signature & Company Stamp of Agent A/B" because that wording is statutory).
- Inside the cell, on the line:
  - **Signature:** ____ (handwritten/DocuSign — the line is what is signed ON, not under)
  - **Name:** Jane Bou Jaoude
  - **Title:** Founder & CEO
  - **Date:** auto-today
- Lines shortened to ≈ 168px (already done) so they don't run edge-to-edge.
- **Remove the "JBJ GLOBAL REAL ESTATE" caption** under the stamp — the stamp already carries the name. The cell shows only Signature/Name/Title/Date; stamp overlays the bottom-right.

## 4 · Party A / Party B labeling rule (global, lockable)
- **Page 1 only** — print an introductory line directly under the eyebrow:
  > **Party A:** JBJ Global Real Estate L.L.C S.O.C  
  > **Party B:** {recipientName / partnerName}
- All subsequent references in the body use the short tokens "Party A" / "Party B" only.
- The signature cell shows the party's NAME (not "JBJ Global Real Estate" twice). Eliminate `${partnerLabel} (Party B)` duplicate in `partnersForms.ts` line 106 etc.

## 5 · Form I specific fixes
- Increase parties column padding (10px → 14px) and font (10.2px → 11px / line-height 1.55) — content was too crushed.
- Expand "P.O. BOX", "PH", "FAX", "BRN", "DED LISC" abbreviations to "Phone", "Fax", "Broker Reg. No.", "DED Licence" etc. Keep "ORN" + "BRN" (RERA-statutory).
- Keep the explicit 2-page split: P1 = eyebrow + Party A/B intro line + Parties + Property/Commission; P2 = Declarations + RERA signatures (stamp on JBJ side only).

## 6 · PAA surfacing
- PAA composer already exists (`composers/index.ts:932`) and catalog id `paa` exists (`documentCatalog.ts:595`) but is filtered out of the Document Studio launcher by audience. Fix: add PAA to the **owner/contracts** catalog filter so it appears alongside Form A/B/F/I/U and the Partner family.
- Verify with a preview render in `/owner/careers-portal?section=contracts`.

## 7 · Rename "Careers Portal" → "Document Studio" (owner-only)
- Rename the page heading + sidebar entry from "Careers Portal" to **"Document Studio"** at `/owner/careers-portal?section=contracts`.
- Add a clean route alias `/owner/document-studio` (keep the old path as a 301 redirect — strict no-removal policy).
- Confirm `OwnerGuard` wraps the route (it already does — line 199 of `AdminRoutes.tsx`). No frontend exposure to investors/brokers/devs.

## 8 · Editable preview (RECOMMENDATION — needs approval)
Today the preview is `contentEditable` on page 1 only. Proposal:
- **Inline WYSIWYG** on every rendered page — click any field to edit text in place.
- **Field toolbar** (floating on hover): Move ↑↓, Duplicate, Delete, Add Field Below.
- **Drag-and-drop** reorder within a page using `@dnd-kit/core` (already used elsewhere in the app — no new dep).
- **"+ Add field"** button at the bottom of each section opens a chip menu (Text · Date · Money · Dropdown · Signature · Checkbox).
- Edits persist back into `bodyHtml` (already wired for page 1 — extend to all pages).
- **Locked zones**: header, footer, official RERA clauses, signature block — guarded with `data-locked="1"` so user edits cannot break legal text or chrome.

**Before:** Only page-1 paragraph edits.  
**After:** Full deck editing on every page, drag/move/delete/duplicate/add — RERA + chrome stay legally locked.

## 9 · AI model upgrade (RECOMMENDATION — needs approval)
Current generation likely runs `google/gemini-2.5-flash` or `openai/gpt-5-mini`. Recommend switching the Document Studio generator + AI Edit Chat to **`openai/gpt-5.5`** (state-of-the-art reasoning, best instruction-following, strongest at structured legal text). Fallback for high-volume drafts: `openai/gpt-5.4-mini`.

**Before:** Mid-tier flash model, occasional clause drift, weaker formatting on long contracts.  
**After:** Top-tier reasoning → tighter legal phrasing, better field placement, stable cross-page references, fewer regenerations needed. Cost rises ~3–4× per generation; offset by fewer retries.

## 10 · Lock the global rule in memory
Update `mem://documents/multi-page-signature-rule` and `mem://documents/rera-forms-and-partners-standard` with the new clauses (header height, per-page = signature only + bottom gold hairline, last-page block layout, Party A/B intro line, no company caption under stamp, expanded abbreviations). Bump the Core index line so it applies to every future template by default.

---

## Technical Surface
- `src/templates/jbjLockedChrome.ts` — shrink header, enlarge monogram, move date out.
- `src/components/document-studio/DocumentStudio.tsx` — rewrite `renderPerPageUserSignature` (signature-only), add bottom gold hairline, extend `contentEditable` to all pages, mount drag/duplicate toolbar, swap AI model.
- `src/templates/composers/index.ts` (`signatureBlock`) — strip company caption, fix title → "Founder & CEO", shorten lines (already done).
- `src/templates/composers/partnersForms.ts` — fix duplicate "Party B" label, add Party A/B intro line.
- `src/templates/composers/reraForms.ts` — Form I decompression + abbreviation expansion + Party A/B intro line.
- `src/config/documentCatalog.ts` — surface PAA in owner/contracts audience.
- `src/pages/owner/CareersPortal.tsx` — rename to "Document Studio" heading; add `/owner/document-studio` route alias in `AdminRoutes.tsx`.
- `mem://` — update both rule files; bump Core index entry.

## Risks / No-Removal Compliance
- No existing template, route, field, or feature is deleted. Old routes 301-redirect.
- AI model swap is reversible (single config constant).
- Editable preview ships behind `data-locked` guards so RERA/chrome text remains immutable.

## Open decisions (please confirm before I build)
1. **Editable preview scope** — approve the full WYSIWYG + drag toolbar in §8? (Yes/No)
2. **AI model** — switch generator + chat to **`openai/gpt-5.5`** as recommended? (Yes / pick another / keep current)
3. **"Authorised Signatory" eyebrow** in last-page cell — remove entirely, or keep as a tiny uppercase label above Name? (Remove / Keep)
4. **Footer on every page vs last-page only** — current rule is last-page only; keep that? (Yes/No)
