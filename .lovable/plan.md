## Rebuild `/jbj-academy` — premium, 3D book library, certificate fix, owner CMS

### 1. Page layout & contrast (`src/pages/broker/BrokerLearning.tsx`)

- Center the title block: badge, `JBJ Broker Academy` H1, subtitle, and the 3 KPI tiles all centered, max-w-5xl.
- Replace empty black KPI tiles with proper `<IconTile tone="gold">` icons + tabular-nums values (Library books / Training modules / Your training %).
- Restyle Training Modules: 2-col grid, each card uses gold `IconTile` instead of empty black square, ink title on champagne, navy "Start" CTA via `.jj-cta-dark`.
- Quick Reference (NEVER Say / ALWAYS Use): keep 2-col, restyle headers with proper red/emerald icon tiles, ink body text, gold hairline borders.
- Take inspiration from `/help` page rhythm (centered hero, dense premium cards, generous section spacing). Add subtle framer-motion stagger on section reveal — no flashy chrome.

### 2. Books section — 3D premium shelf, 4-per-row

- Replace static `<Book3DCard>` (flat cover) with a true 3D book primitive: front cover, visible spine, back cover, page edges, soft floor shadow, hover rotateY tilt + lift.
- New component `src/components/broker-education/PremiumBook3D.tsx` with:
  - `perspective: 1600px`, `transform-style: preserve-3d`, idle `rotateY(-18deg)`, hover `rotateY(0)` with 600ms ease.
  - Spine = 36px wide slab with title rotated 90°, embossed gold rule.
  - Front cover = champagne or palette color + gold double-rule frame + book number + title + JBJ wordmark.
  - Back cover = ISBN-style label + JBJ monogram + 1-line description.
  - Page edges (top/right/bottom) = warm cream stripes.
- Per-book palette rotation (oxblood, navy, forest, aubergine, cognac, obsidian, bronze, teal, burgundy) — same shape, different color per book_number.
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (4-per-row on desktop) for tight library feel.
- Book number badge: redesigned as a luxury "tag" — gold-foil ribbon pinned to top-right of cover, with subtle shimmer animation (`@keyframes shimmer` sweeping a 30% white gradient across the foil every 4s).
- Remove "Professional Development" group from the academy page (already moved to toolkit Academy as broker-portal books). Sort order stays Foundations → Buyer/Investor → Seller/Landlord → Market Intelligence → Advanced.

### 3. Seed real content into existing books (DB)

- For each book where `broker_education_modules` is empty or thin, insert 4-6 modules with:
  - `title`, `description`, ~600-900 word `content` paragraph each.
  - Content sourced from public UAE government references the AI can cite by name (Dubai Land Department, RERA, DLD Open Data Portal, Bayanat Abu Dhabi, UAE Ministry of Economy, Dubai Statistics Center, Federal Tax Authority for VAT on commercial transactions, Dubai REST app). No fabricated stats — every figure either cites the source or is a worked example labeled "Worked example".
  - Insert via `supabase--insert` (single SQL with on-conflict guard so re-runs are idempotent).
- Books retain their cover and structure; this only fills empty chapters so they don't look hollow when opened.

### 4. Public vs broker-only audience (owner CMS feature)

- DB migration: add `audience text not null default 'brokers' check (audience in ('public','brokers','investors'))` to `broker_education_books`, plus index.
- Update RLS:
  - `select` for anon allowed when `audience = 'public' and is_restricted = false and deleted_at is null`.
  - Authenticated brokers see public + brokers + investors per `min_tier` (existing rule preserved).
- Update `useBrokerEducation` to pass the user's role/mode and filter accordingly.
- /jbj-academy page renders two top-level groups inside Books: **Public Library** (audience=public) and **JBJ Broker Library** (audience=brokers/investors), each with its own learning-path subgroups.

### 5. Owner CMS — already exists, extend it

Owner CMS lives at **`/owner/books`** (page `src/pages/owner/OwnerBooks.tsx`, already routed). Extend it to support the new workflow you described:

- Add audience selector (Public / Brokers / Investors) on each book row.
- Add **Chapters/Pages editor** drawer per book:
  - List modules ordered by `sort_order` with reorder, rename, edit content (rich textarea), delete (soft — only the chapter; book stays).
  - "Add chapter" / "Add page" buttons append a new `broker_education_modules` row.
  - "Replace content" replaces a single module's `content` without deleting the book.
  - Soft delete uses `deleted_at` on modules so content can be recovered.
- Surface a link to `/owner/books` from the academy page footer (owner-only, gated by `requireOwnerAuth` UI check).

### 6. Certificate fixes (`src/components/certification/CertificatePreview.tsx`)

- Remove the middle border (`inset-3 rounded-xl border`). Keep only the outer card border + the 4 corner angle flourishes.
- Remove the "JBJ · CERTIFIED" wordmark inside the `FoilSeal` (keep the badge icon and gold foil).
- Add shimmer animation: a 12% white diagonal gradient sweeps the whole certificate plate every 6s (`@keyframes cert-shimmer`), respects `prefers-reduced-motion`.
- Recipient/signature alignment:
  - Recipient name (the broker being certified) stays centered above "Certified JBJ Broker".
  - Signature block bottom-right unchanged but ensure name reads **Jeyhun Babayev** (already correct in code — verify against a fresh render; if the displayed "wrong name" is the recipient duplicating the signer, rename the recipient field to `userName` only and add `aria-label`).
- CTA polish: "Download Certificate" → `.jj-cta-dark` (navy + gold hairline + white text). "Share Achievement" → `.jj-cta-outline` (ink on champagne, gold hairline).

### 7. Validation

After build, run the visual QA loop:
- `browser--navigate_to_sandbox /jbj-academy`, `browser--screenshot full_page:true`.
- Inspect: centered title, no empty black squares, 4-per-row books, 3D tilt, gold ribbon shimmer, certificate with single inner frame + corner brackets + shimmer + correct names.
- Re-crop the certificate region with `image_tools--zoom_image` to confirm only one inner border remains and the "JBJ · CERTIFIED" wordmark is gone.
- Iterate until clean before delivering.

### Files touched

- `src/pages/broker/BrokerLearning.tsx` — layout, centering, contrast, IconTiles, grouping, 4-col grid, drop Professional Development.
- `src/components/broker-education/PremiumBook3D.tsx` — new 3D book primitive + shimmer keyframes.
- `src/components/broker-education/Book3DCard.tsx` — swap inner render to `<PremiumBook3D>` so existing call sites keep working.
- `src/components/certification/CertificatePreview.tsx` — border cleanup, shimmer, seal wordmark removal, CTA primitives.
- `src/pages/owner/OwnerBooks.tsx` — audience selector + chapter/page editor drawer.
- `src/hooks/useBrokerEducation.ts` — read & filter by `audience`.
- New migration: add `audience` column + RLS + index.
- New migration / `supabase--insert`: seed real cited content into thin chapters.

No routes, sidebar, or sitemap changes.
