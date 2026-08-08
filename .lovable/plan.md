# Global Developer Logo Standardization Across the Platform

## Verified current state

- The database contains **630 visible developer records**. **172 have no `logo_url`**, while **261 are marked `logo_status = missing`** and 172 are marked unavailable.
- Only **11 developer identities** currently have dedicated verified white artwork in `verifiedWhiteLogos.ts`; the broader repository contains about 70 developer/logo assets.
- `DeveloperLogo.tsx` is used on many public surfaces, but it still intentionally renders typed developer-name plates when artwork is absent, blocked, or awaiting validation. This directly conflicts with the existing master lock, which forbids typed-name substitutes.
- Several platform surfaces still render `logo_url` through raw `<img>` elements instead of the canonical component, including admin, CRM, brokerage visits, developer visits, toolkit, and owner workflows.
- Logo dimensions are overridden independently by individual screens, including compact squares and custom 44×99 plates, so the visible artwork footprint is not globally consistent.
- The current regression suite checks a small curated sample rather than the complete 630-developer inventory, and no repository-wide gate currently rejects new raw developer-logo `<img>` usages.

## Goal

Make every real developer logo consistently visible everywhere it appears: the same official artwork, pure-white treatment, emerald ombre plate, normalized visual footprint, immediate atomic loading, and no typed names, initials, white blocks, wrong-brand marks, or missing cards.

## Implementation plan

### 1. Create one authoritative logo manifest for all 630 developers

- Build an inventory keyed by immutable developer ID, with normalized aliases only for resolving duplicate legal/trading names.
- Record for every developer: official artwork source, verified white asset, source URL, verification status, intrinsic dimensions, safe visible scale, and audit result.
- Preserve existing database logo URLs as read-only and never modify owner-uploaded project media, covers, documents, or developer cards.
- For every unresolved identity, source the official logo from the developer’s official website or existing verified database artwork; never generate or type a substitute.
- Store new binary artwork through the project asset CDN and keep only asset pointers in the repository.

### 2. Replace the fragmented resolver with one canonical identity pipeline

- Consolidate verified artwork, known-logo maps, special-case assets, paint overrides, and brand aliases behind one resolver.
- Resolve by developer ID first, then approved normalized identity aliases; reject wrong-brand, favicon, screenshot, project-photo, opaque slab, and low-resolution candidates.
- Remove all `forceNameplate` paths and the typed-name fallback from public rendering. An unresolved developer remains in the catalog but is reported as an audit failure rather than being represented by fake artwork.
- Preload/decode the approved artwork before revealing the plate so the emerald surface and logo appear together without plate-first flashing.

### 3. Enforce one component across the entire platform

- Replace every raw developer-logo `<img>` and parallel logo helper with the canonical `DeveloperLogo` component across public pages, project/developer details, cards, search, filters, compare, favorites, mortgage, area pages, CRM, admin, broker, owner, developer portal, toolkit, and visit workflows.
- Keep genuine project photography separate; only developer identity artwork is standardized.
- Remove component-level paint, inversion, background, padding, and shape logic that bypasses the canonical system.

### 4. Normalize size by context, not by developer

- Define fixed semantic sizes inside the component: full card/detail plate, compact result row, and micro table/avatar.
- Use one emerald three-stop ombre surface, white official artwork, `object-contain`, consistent padding and radius.
- Normalize the visible ink bounds of every logo using measured transparent bounds, so wide and square marks appear equally prominent without cropping or distortion.
- Remove developer-specific CSS scale hacks after their normalized values are represented in the manifest.

### 5. Add hard regression gates

- Add inventory tests covering all 630 developer IDs: each must resolve to approved official artwork with no nameplate fallback.
- Add image-quality tests for transparency/opaque slabs, blank files, tiny files, wrong-brand mappings, and visible artwork bounds.
- Add a repository scan that fails when developer logo fields are passed to raw `<img>` elements or when new typed/initial fallback logic is introduced.
- Expand component tests across all semantic sizes and variants, including atomic loading and consistent plate styling.

### 6. Perform exhaustive visual validation

- Generate screenshot contact sheets for **every developer directory card across every pagination page**, on desktop and mobile.
- Open and capture **all 630 developer detail identity plates**, recording logo source, rendered dimensions, artwork bounds, and pass/fail.
- Audit project/property cards and project-detail developer sections for every developer represented by a project, plus search, compare, favorites, mortgage, area, CRM, admin, broker, owner, and developer-portal surfaces.
- Automatically flag empty plates, text inside logo plates, white slabs, broken images, inconsistent dimensions, clipped marks, and plate/logo loading separation; fix every failure and repeat until the failure list is empty.
- Deliver a final developer-by-developer audit list with screenshot references and any genuinely unsourceable official identities clearly identified—without removing their cards or inventing logos.

## Guardrails

- No developer card is hidden or removed.
- No AI-generated, recreated, initial-based, or typed-name logo is allowed.
- Official artwork may be recolored to pure white but not redrawn or altered in shape.
- Owner-entered project photos, covers, details, and documents remain untouched.
- The same resolver, artwork, color, size logic, and plate layout apply everywhere.

## Technical scope

- Canonical logo component/resolver, verified asset manifest, logo artwork guard, existing logo overrides, all developer-logo call sites, regression tests, static enforcement script, and visual-audit tooling.
- Database changes are limited to logo audit/source metadata if required; existing `logo_url` values and owner content remain read-only.