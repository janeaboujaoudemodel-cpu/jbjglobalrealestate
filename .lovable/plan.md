# Careers / Application Form — Full Overhaul

Fixes the broken `/careers` route, the submit-failure that ejects users to the property page, the cramped layout, hard-to-read selects without search/flags, and the always-on Sales Qualification block. Also expands CV uploads to images.

---

## 1. Fix the broken `/careers` route

`/careers` is referenced from the homepage support card and "Meet the Team" but **no route exists** — it falls through to NotFound. We'll register `/careers` as an alias of `/join` so existing links work and the page actually opens.

In `src/routes/PublicRoutes.tsx`, alongside the existing `/join` route, add:
```tsx
<Route path="/careers" element={<JoinApplication />} />
```

## 2. Full-width premium layout

The page is currently constrained to `max-w-2xl` (narrow column with a huge gap on the right). We'll:
- Widen the container to `max-w-5xl` and center it.
- Use a 2-column responsive grid for paired fields (already partially done) so the form fills the width without feeling stretched.
- Increase form padding, restore champagne page background consistency, and make the headline section full-bleed.

## 3. Reusable "premium select" treatment for Nationality, Language, Country, City

The project already has battle-tested components we'll wire in instead of bare `<Select>`s:
- `src/components/ui/nationality-select.tsx` — flags + built-in search.
- `src/components/ui/language-multi-select.tsx` — flags + search (we'll use single-select mode for Preferred Language).
- `src/components/ui/searchable-select.tsx` — generic searchable dropdown for Country and City.

For each we'll:
- Replace the current `<Select>` blocks for **Nationality**, **Preferred Language**, **Country**, **City**.
- Add flag emoji + country name in each option row, larger text (`text-base`), comfortable row height (`py-2.5`), and a sticky search input pinned at the top of the dropdown.
- Constrain dropdown width to match the trigger (no edge-to-edge sprawl) and cap height with internal scroll so long lists don't push the page.
- Apply this same pattern wherever these selects are used across other forms (HR Agent, Onboarding, Broker join, Investor join) so the experience is consistent site-wide.

## 4. Open Positions: Apply button, search, "View more", count

Currently every open position card auto-renders fully expanded with no way to filter. We'll redesign the section:
- Add a **search input** above the grid ("Search positions by title, department or location").
- Show a **count chip** ("12 open positions") next to the section heading.
- Initially render only the **first 6 positions**; add a **"View all positions"** button that expands the rest in place.
- Each card gets a clear **"Apply"** button (ink-on-champagne, gold hover) that selects the position and smooth-scrolls down to the form fields. Clicking the card body still selects it for accessibility.
- Remove the secondary "Or select a general category" fallback dropdown when DB positions exist (it currently duplicates the choice and confuses users).

## 5. Role-aware qualification block (Sales vs. non-Sales)

Right now the Sales Qualification section appears for a fixed list of position values. We'll refactor it so the block is chosen by the **department** (or `is_broker_role` flag) of the actually selected position:

- **Sales / Brokerage** (department in `Sales`, `Brokerage`, or `is_broker_role = true`): show today's Sales Qualification block (deals closed, value, projects, developers, references).
- **Marketing**: marketing-specific questions (campaigns managed, budget handled, tools, portfolio link).
- **HR / Operations / Admin**: years of experience, systems used, certifications.
- **Tech / Web Development**: years of experience, stack, GitHub/portfolio link.
- **General / Other**: short "Tell us about yourself" + years of experience.

A small mapping helper picks which block to render based on the resolved position object — no qualification fields ever leak across categories.

## 6. CV upload: photos accepted + larger drop zone + clearer hints

Today the file input only accepts `.pdf,.doc,.docx`. We'll:
- Accept **PDF, Word, and images** (`.pdf,.doc,.docx,.png,.jpg,.jpeg,.heic,.webp`).
- Bump the inline file-type validation list accordingly.
- Increase the drop-zone padding, raise the helper-text size to `text-base`, and explicitly say: *"Upload your CV — PDF, Word, or a clear photo (JPG/PNG/HEIC). Max 10 MB."*
- Keep the 10 MB cap but show file size after selection.

## 7. Fix the broken Submit flow ("kicked out to property page")

Two real bugs combine here:
1. **Field-validation jump**: required HTML inputs inside hidden/conditional sections cause the browser to scroll to an invisible field and the form never submits. We'll only mark fields `required` when their parent block is actually rendered, and add a top-level "fix these fields" summary on submit.
2. **Auth redirect loop**: when an unauthenticated user clicks Submit, `handleSubmit` calls `navigate("/auth?redirect=/join")`. After auth, some flows land users on the home/properties page instead of returning here. We'll:
   - Persist the in-progress form to `sessionStorage` on submit-when-signed-out, navigate to `/auth?redirect=/careers`, and rehydrate on return.
   - On successful insert, navigate to `/onboarding` only if the user is authenticated and the insert truly succeeded; otherwise show a toast and stay on the form so users can retry.
   - Wrap the submit handler in a try/catch that **never** triggers a route change on failure (current code's `finally` is fine, but the unhandled rejection from `uploadCV` was bubbling and the error boundary was bouncing users away).

## 8. Typography & contrast pass

- Increase base form font to `text-base` (currently mixed `text-sm` / `text-xs`), labels to `text-sm font-semibold text-[#1A1A1A]`.
- Inputs/selects: champagne surface `bg-[#FDFBF7]`, ink text `#1A1A1A`, gold focus ring — matches global Institutional Form Standard.
- Add visible placeholder examples to every text input: First Name → "e.g. Sarah", Last Name → "e.g. Khan", City → "e.g. Dubai", Phone already has one. All placeholders use ink at 60% so they're clearly readable on champagne.

## 9. Files to change

- `src/routes/PublicRoutes.tsx` — add `/careers` route.
- `src/pages/JoinApplication.tsx` — layout widening, swap selects to flag/searchable variants, position search + view-more + Apply buttons, role-aware qualification renderer, CV photo support, submit/auth fix, placeholders & typography.
- `src/components/ui/searchable-select.tsx` — minor: ensure it accepts a `renderOption` for flag rendering on Country (re-used pattern).
- (No DB migrations needed — all changes are client-side.)

## 10. Out of scope / preserved

- No removal of any existing fields, references, consent checkboxes, or honeypot.
- HR Jessica CTA card preserved.
- All existing translations and analytics remain intact.
