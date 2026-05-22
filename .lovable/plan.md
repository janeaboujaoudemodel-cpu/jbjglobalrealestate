## What's broken

You're seeing a fake/generic building image on a project card instead of the real developer logo. Two root causes:

1. **Database has wrong values in `developers.logo_url`** for many developers — some rows still hold project screenshots, WhatsApp images, IG post images, or `snapedit_*.jpeg` URLs that slip past our forbidden-pattern filter (e.g. Ellington, Modon, Kamdar, Hayaat in current data). The `bare` overlay then dutifully renders them as if they were logos.
2. **The `bare` overlay on project cards has no rounded corners** — it's a hard 4:3 box with only a drop-shadow, which is what looks "buggy" sitting on the photo.

We curated 13 official local logos in `public/developers/logos/` and locked them in a previous migration, but the rest of the catalog (≈600 developers) was never repointed to clean URLs, and the verified/locked flags weren't set for them.

## Plan

### 1. Database — restore + harden developer logos (migration)

- **Re-run the junk purge with a wider net.** Null out any `logo_url` (where `logo_locked=false`) that matches the current forbidden patterns plus the newly-observed ones: `snapedit`, `reelly-backend.s3.*_n_[hash]\.webp` (Instagram post mirrors), `*_feature_*.webp`, `tilal_*`, `/vault/.../[a-z0-9]+\.jpe?g`, generic `/[0-9]+x[0-9]+/`. Mark those rows `logo_verified=false`.
- **Repoint the 13 curated top-tier developers** (emaar, damac, nakheel, sobha, meraas, aldar, ellington, binghatti, select-group, danube, majid-al-futtaim, dubai-properties, omniyat) to their local `/developers/logos/<slug>-logo.webp` (or `.png`) asset and set `logo_verified=true`, `logo_locked=true`, `logo_source='curated_official'`. This guarantees those always render correctly.
- **Promote `logo_url_processed` to `logo_url`** for the 10 rows where canonical is empty but processed exists.
- Leave every other developer with `logo_url=NULL` rather than a fake image — the UI already handles null cleanly (no overlay rendered on the photo).

### 2. Resolver — tighten the allow-list

In `src/utils/developerLogo.ts`, extend `FORBIDDEN_LOGO_PATTERNS` with the same patterns used in the migration so any future bad URL is rejected at render time even if it sneaks back into the DB.

### 3. UI — round + polish the overlay on project photos

In `src/components/ui/DeveloperLogo.tsx`, `variant="bare"`:
- Add `rounded-xl` corners, a subtle translucent champagne plate behind the logo (`bg-[#FDFBF7]/92 backdrop-blur-sm`), 1px gold hairline `border border-[#B89555]/40`, and tighter padding so wordmarks still read fully.
- Keep `object-contain` and the soft shadow for legibility.
- Keep the null-when-invalid behavior — never render the Building2 icon over a public listing photo.

No structural changes to `ProjectCard.tsx` / `ReellyProjectCard.tsx` / `FeaturedListings.tsx` — they already pass the canonical URL through the resolver.

### 4. QA pass

After migration + UI change, sample 8–10 random project cards (top-tier devs + mid-tier + ones now without logos) and confirm:
- Top-tier devs show their real wordmark on a rounded champagne plate.
- Devs with no clean logo show no overlay at all (clean photo).
- No project photo is ever used as a logo.

## Technical notes

- Migration is data + constraints only; no schema change.
- `logo_locked` trigger from `20260424144138` already protects curated rows from sync-job overwrites.
- The `bare` variant change is CSS-only inside `DeveloperLogo.tsx`; all call sites stay identical.
- Files touched: 1 new migration, `src/utils/developerLogo.ts`, `src/components/ui/DeveloperLogo.tsx`.
