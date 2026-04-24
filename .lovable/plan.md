## Plan

I confirmed this is a real regression, not just a styling issue.

Current backend audit shows the logo data is heavily polluted:
- 633 developer records total
- 296 `logo_url` values point to `reelly-backend`
- 238 `logo_url` values point to `api.reelly.io/vault`
- 87 logo filenames look suspicious (`Screenshot`, `WhatsApp`, `Frame`, `convert.io`, etc.)
- 5 developers are missing logos entirely

There are also frontend violations where non-canonical assets can still render as logos.

### What I will implement after approval

1. Clean and re-lock the developer logo source of truth
- Audit every developer record in the backend and classify each logo as:
  - verified official logo
  - suspicious/unverified
  - missing
- Replace wrong logos with official developer logos only.
- If a logo cannot be verified from official sources, clear it instead of showing a project photo or fake substitute.
- Keep `feature_image_url` only for hero/card imagery, never as a logo.

2. Add backend logo governance so this cannot regress again
- Add a migration for logo governance metadata and auditability, including fields/table support for:
  - verification status
  - source domain/source type
  - verified timestamp
  - lock status
  - review notes
- Add a database-level guard so locked developer logos cannot be overwritten by sync jobs or unsafe update paths.
- Route future unverified logo candidates into review/staging instead of directly writing to the live `developers.logo_url` field.

3. Stop the automatic overwrite paths that are currently damaging logos
- Patch the backend functions that currently write directly into `developers.logo_url` from third-party feeds or guessed sources.
- Specifically harden the flows found in:
  - `supabase/functions/reelly-dictionary-sync/index.ts`
  - `supabase/functions/mirror-developer-logos/index.ts`
  - `supabase/functions/sync-provident-logos/index.ts`
  - `supabase/functions/sync-developer-data/index.ts`
  - `supabase/functions/provident-full-sync/index.ts`
  - `supabase/functions/ai-find-developer-logos/index.ts`
  - `supabase/functions/find-developer-logos-v2/index.ts`
- Change them so they can only:
  - write reviewed candidates to staging, or
  - update non-live helper fields, but never overwrite a locked canonical logo.

4. Fix all frontend rendering globally
- Enforce a single canonical logo resolver globally so all pages pull logos from approved fields only.
- Remove every remaining path that can render the wrong thing as a developer logo.
- Fix known violations already found:
  - `src/components/ContinueSearching.tsx` currently uses `item.imageUrl` as a developer logo for developer cards
  - `src/components/ProjectFilters.tsx` prefers `logo_url_processed` over canonical `logo_url`
  - `src/components/developer-portal/DeveloperSelectDropdown.tsx` prefers processed over canonical logo
  - `src/components/home/FeaturedListings.tsx` hardcodes a local Binghatti asset instead of using the database source of truth
  - `src/components/DeveloperSearchModal.tsx` and `src/components/project-detail/DeveloperInfoCard.tsx` still use inline `<img>` logo rendering instead of the locked logo component
- Replace all invalid logo fallbacks with the approved fallback only: `Building2` icon.
- Remove letter/monogram fallbacks for developer logos.

5. Align the UI with the existing lock standard
- Reuse the existing global lock intent in `src/config/master-lock.ts` and make the implementation actually enforce it.
- Ensure all developer logos render through `src/components/ui/DeveloperLogo.tsx` or a strict shared resolver/helper.
- Ensure no resolver ever falls back to:
  - `feature_image_url`
  - `cover_image_url`
  - project images
  - generated initials
  - placeholder photos

6. Verify the full platform after the fix
- Re-audit the backend after cleanup to confirm suspicious logo URLs are eliminated.
- Check all developer logo touchpoints across public and admin surfaces, including:
  - developer cards
  - project cards
  - featured listings
  - search modal
  - filters
  - continue searching/history cards
  - recommended projects/developers
  - developer detail/info cards
  - listing admin approval screens
- Confirm every rendered logo is either:
  - the verified official logo, or
  - the approved icon fallback if no verified logo exists.

## Technical details

### Frontend files to update
- `src/components/ContinueSearching.tsx`
- `src/components/DeveloperCard.tsx`
- `src/components/DeveloperSearchModal.tsx`
- `src/components/ProjectFilters.tsx`
- `src/components/home/FeaturedListings.tsx`
- `src/components/project-detail/DeveloperInfoCard.tsx`
- `src/components/ui/DeveloperLogo.tsx`
- `src/utils/developerLogo.ts`
- any other remaining inline logo renderers found during final sweep

### Backend/data work
- Migration for logo governance + lock enforcement
- Developer record cleanup in the backend
- Hardening of the direct-write server functions listed above
- Optional mirrored storage for verified external logos so rendering does not depend on fragile third-party URLs

### Non-negotiable rules that will be enforced
- Only real developer logos are allowed
- `logo_url` is the canonical live logo field
- No project photo may ever be used as a developer logo
- No generated letters/monograms as logo substitutes
- Unverified incoming logo data must not overwrite a locked verified logo
- Frontend must render from the canonical approved source only

Once you approve, I’ll implement the cleanup, global renderer fixes, backend lock, and overwrite protection in one pass.