# Plan: Consolidate all AI tool pages into a single canonical URL

## Goal
- One URL for AI tools: **`/ai-hub`** (the strongest, richest page: 772 lines, full tool registry, role-aware visibility, video hero, gated for logged-in users).
- Import the missing sections from `/services/ai-tools` into `/ai-hub`.
- Delete `/services/ai-tools` and its component file.
- No duplicated tools, no duplicated sections.
- FAQ answers rewritten to align with UAE regulation (RERA / DLD / Dubai Land Department, UAE AML, UAE Consumer Protection, UAE Data Protection Law PDPL).

## Why `/ai-hub` wins
| Aspect | `/ai-hub` (AIHub.tsx, 772 lines) | `/services/ai-tools` (AITools.tsx, 390 lines) |
|---|---|---|
| Tool inventory | Full registry, role-aware, categorized | 5 static cards |
| Hero | Video background | Static gradient placeholder |
| Auth | Gated, integrates UserMode + visibility | Public marketing only |
| Sections present | Tools registry, categories | Hero, Tools, How It Works, Transparency, FAQ, CTA |

`/ai-hub` already has: Hero, Tools Library, CTA equivalents. **Missing** from it: How It Works, Transparency & Responsible Use, FAQ.

## Changes

### 1. `src/pages/AIHub.tsx` — add 3 sections (no duplicates)
Append below the existing tool grid, above the existing footer/CTA:
- **How It Works** — 4 numbered steps (Input → Review → Save → Share).
- **Transparency & Responsible Use** — single shield card; UAE-aligned copy explicitly stating outputs are non-binding, do not constitute regulated advice, and that valuations require a RERA-certified valuer.
- **Frequently Asked Questions** — 8 items, UAE-compliant answers (see below).
- Styling: champagne bands via `.jj-band`, IconTile primitives, ink text on champagne (no `#1A1A1A`-on-`#1A1A1A` from the legacy file). Reuse Accordion from existing UI kit.
- Add `<SEOFaqSchema>` JSON-LD using the new FAQ array so we keep SEO value of the old page.

### 2. UAE-aligned FAQ rewrites
1. **Do these tools guarantee returns?** — No. All outputs are illustrative scenarios for informational purposes only. They are not investment advice under UAE Securities and Commodities Authority (SCA) rules and do not guarantee any financial outcome.
2. **Can I use tool outputs as an official valuation?** — No. Official property valuations in the UAE must be issued by a RERA-certified valuer registered with the Dubai Land Department (DLD) or the relevant Emirate's land authority. Tool outputs are indicative only.
3. **Why do inputs matter so much?** — Scenario accuracy depends entirely on the assumptions you enter. Inputs should reflect verified figures (DLD transaction records, signed agreements, official service charges). Inaccurate inputs produce non-representative outputs.
4. **Can I save my results?** — Yes, when logged in. Saved data is stored in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL); you may request export or deletion at any time.
5. **Can I compare multiple projects?** — Yes. Comparisons use publicly available project information and DLD-published data where applicable. Final terms must always be confirmed with the developer's official SPA and RERA project trust account details.
6. **Do the tools work for all Emirates?** — Tools are designed to be Emirate-agnostic. Regulatory references default to Dubai (RERA/DLD); Abu Dhabi (DMT/ADREC), Sharjah (SRERD) and other authorities have their own rules — always verify locally.
7. **Can a broker generate a client PDF?** — Yes, where the feature is available. Brokers must hold a valid RERA broker card and comply with Law No. (6) of 2019 and Bylaw No. (85) of 2006 regulating real estate brokers; PDFs must not be presented as regulated advice.
8. **Can I request a custom tool?** — Yes — submit a request via Concierge or Support. Custom tools that touch payments, escrow, or AML-regulated activity will be reviewed for UAE Central Bank and Ministry of Economy AML/CFT compliance before release.

### 3. Delete the duplicate page and route
- Remove file: `src/pages/services/AITools.tsx`.
- Remove route + lazy import in `src/routes/PublicRoutes.tsx` (`/services/ai-tools` → `<AITools />`).
- Add 301-style client redirect: `<Route path="/services/ai-tools" element={<Navigate to="/ai-hub" replace />} />` so external links/SEO are preserved.
- Update `public/sitemap.xml`: drop `/services/ai-tools`, ensure `/ai-hub` is present.
- Sweep references in `src/components/Footer.tsx`, `src/seo/serviceSeoCatalog.ts`, and any nav menu — repoint any link pointing to `/services/ai-tools` to `/ai-hub`.

### 4. Verify no other duplicate AI hub URLs remain
Audit and confirm canonical = `/ai-hub`. Existing individual tool pages (e.g. `/ai-property-analyzer`, `/ai-roi-calculator`) are **tool detail pages**, not hub duplicates — they stay. Only the hub URL is being consolidated.

### 5. Validation
- Visit `/ai-hub`: confirm new sections render, no `#1A1A1A`-on-`#1A1A1A` contrast issues, accordion works.
- Visit `/services/ai-tools`: confirms it redirects to `/ai-hub`.
- `rg "/services/ai-tools"` returns zero remaining links (except the redirect itself).

## Out of scope
- No backend / RLS changes.
- No edits to individual `/ai-*` tool pages.
- No memory writes (this is a content consolidation, not a new standard).
