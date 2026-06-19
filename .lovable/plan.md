## 1. Fix "Register Your Interest" form — Size field (and overall polish)

**File:** `src/components/project-detail/ProjectInquiryForm.tsx` (lines ~394–414)

Problems in screenshot:
- "Size (sqft) — optional" label wraps awkwardly because the field sits in a tight 2-col grid next to Bedrooms.
- Two inputs labelled `From` / `To` with a tiny vertical "t / o" between them — visually broken and unprofessional.
- Duplicate-looking `To` placeholder.

Recommended fix (pro real-estate UX, not literal "min/max"):
- Replace the dual From/To inputs with a **single segmented Size selector** using standard market buckets:
  `Any · < 800 · 800–1,200 · 1,200–1,800 · 1,800–2,500 · 2,500+ sqft`
  (matches how Bayut/PF/Dubizzle frame off-plan size demand; reduces friction vs typing numbers).
- Place Size on **its own full-width row** below Bedrooms — never squeezed into a half-column.
- Rename the label to **"Preferred Size"** (drop "— optional"; mark required fields with `*` instead).
- Keep underlying form state numeric (`sizeMin`/`sizeMax`) so CRM payload + downstream analytics don't change.
- Apply the same row-per-field rhythm to the rest of the form (Bedrooms full-width, Developer full-width, Emirate + Location side-by-side only on ≥md, stacked on mobile) so nothing wraps mid-word again.

## 2. Brochure flow — never show Chrome "blocked" again

**File:** `src/components/project-detail/PremiumBrochureCard.tsx`

New deterministic logic on click:

```
if (brochureUrl exists)
  → stream via download-file edge fn (already implemented) → auto-save PDF
else
  → call edge fn `brochure-auto-fetch` (NEW)
       1. Look up developer official site for this project slug → try /brochure, /downloads
       2. If none: query Provident developer pages (off-plan only) for matching project
       3. If a PDF is found:
            - upload to `project-brochures` storage bucket
            - patch `projects.brochure_url`
            - return signed URL → client streams it as download immediately
       4. If still nothing: return `{ found:false }` → UI flips button to
          **"Request Brochure"** which opens the existing `LeadCaptureModal`
          (no more dead Download button, no Chrome block page).
```

Button states become:
- `Download Brochure` (has URL) — always streams through proxy, never opens a new tab.
- `Fetching Brochure…` (auto-scrape in progress, max 8s)
- `Request Brochure` (auto-scrape returned nothing) — opens lead modal.
- `Unlock Brochure` (locked / not logged in) — unchanged.

## 3. Lock "No secondary scraping" rule globally

Add a hard rule to project memory + enforce in the new edge function:

- **Allowed sources:** developer official websites + Provident (off-plan partner feed) + any source flagged `is_primary_partner=true` in `scrape_allowed_sources` table.
- **Forbidden sources:** Bayut, Dubizzle, PropertyFinder, JustProperty, and any listing aggregator/secondary-agent portal — even if a URL is pasted, the fetcher must reject with `403 secondary_source_blocked`.
- Wire the same allowlist into existing scrapers (`ai-enrich-project`, `universal-link-extractor`, provident sync) so the rule is global, not just for brochures.
- Save as a Core memory: *"Scraping allowed only from developer-direct off-plan sources + Provident. Secondary portals (Bayut/Dubizzle/PF/etc.) are permanently forbidden — enforced at edge-function layer."*

## 4. Technical summary

| Area | Change |
|---|---|
| `ProjectInquiryForm.tsx` | Replace From/To inputs with segmented Size buckets; restack grid |
| `PremiumBrochureCard.tsx` | Add auto-fetch state; remove tab-opening fallback entirely |
| `supabase/functions/brochure-auto-fetch/index.ts` | NEW — developer-site + Provident scraper, writes back to `projects.brochure_url` |
| `supabase/functions/_shared/sourceAllowlist.ts` | NEW — central allow/deny list reused by all scrapers |
| `ai-enrich-project`, `universal-link-extractor`, provident sync | Import shared allowlist; reject secondary URLs |
| Memory | Save Core rule: no secondary scraping |

## Out of scope (call out, don't touch)
- Lead-capture modal styling (already standardised).
- Existing `download-file` proxy edge function (works correctly).
- Mortgage / Gallery / Map work from previous turns.

Ready to implement on approval.
