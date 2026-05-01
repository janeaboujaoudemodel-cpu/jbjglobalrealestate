# Media Ingestion — sidebar visibility, shortcuts, and Owner Templates mirror

Three small, independent changes. No backend / DB work — the ingestion tables, edge functions and hook already exist and stay untouched.

## 1. Keep the global sidebar visible on Media Ingestion

Today `/admin/media-ingestion` lives under `/admin/*`, which `MainLayout` treats as "back-office" and hides the global vertical sidebar + utility bar.

**Fix:** add an explicit allow-list exception so this one route keeps the full L-shaped frame.

- `src/config/mainLayoutRoutes.ts` — add a `BACK_OFFICE_EXCEPTIONS` set containing `/admin/media-ingestion`. Update `isBackOfficeRoute(pathname)` to return `false` when the path matches an exception.
- `src/pages/admin/MediaIngestionHub.tsx` — replace the page wrapper so it respects the sidebar offset (`pl-[200px]` collapsed `pl-[48px]`) and the 88px header spacer, matching the rest of the app.
- Verify nothing else depends on `/admin/media-ingestion` being back-office (smoke tests in `src/lib/serviceLayoutRegression.test.ts` only check `/listing-admin`, so they stay green).

## 2. Sidebar shortcut — always one click away

- `src/components/navigation/GlobalVerticalNav.tsx` — add a new owner-only entry "Media Ingestion" (Inbox icon, gold tone) in the existing owner shortcuts group, linking to `/admin/media-ingestion`. Gated by the same owner check used for the other admin shortcuts so non-owners don't see it.

## 3. CRM toolbar shortcut

- `src/pages/CRMRelationships.tsx` — in the page header toolbar (next to "Add Brokerage" / "Send Outreach" / "Edit Templates"), add a gold outline button **"Media Ingestion"** that `navigate("/admin/media-ingestion")`. Visible on all CRM tabs (Developers, Brokerages, …) so it's reachable from anywhere in CRM.

## 4. Mirror the hub inside Owner Templates / Comms

`/owner/templates` is currently a single-screen template manager. Mirror Media Ingestion there as a second tab so the comms team can attach freshly-merged brochures/videos to outgoing messages without leaving the page.

- `src/pages/OwnerTemplates.tsx` — wrap the existing content in a shadcn `Tabs` shell with two tabs:
  1. **Templates** (existing behaviour, unchanged — strict no-removal).
  2. **Media Ingestion** — renders `<MediaIngestionHub embedded />`.
- `src/pages/admin/MediaIngestionHub.tsx` — accept an optional `embedded?: boolean` prop. When true, drop the outer `min-h-screen bg-[#FDFBF7] pt-[88px]` wrapper and the `max-w-7xl` container so it fits inside the host page; otherwise behaviour is identical to today.
- Same `useMediaIngestion` hook, same `material_ingestion_jobs` table, same realtime channel — both routes show the same queue. No data duplication.

## Out of scope (confirmed)

- No DB migrations.
- No new edge functions.
- No changes to AI classification / merge logic.
- No changes to `owner_comm_templates` schema — owner comms still pulls templates from its own table; ingestion remains the asset side.

## Technical notes

```text
MainLayout
 └─ isBackOfficeRoute(path)
      ├─ matches BACK_OFFICE_PREFIXES?  (/admin, /listing-admin, /broker-dashboard)
      └─ AND not in BACK_OFFICE_EXCEPTIONS  ← new (/admin/media-ingestion)
            → false  → sidebar + utility bar render
```

Files touched:

- `src/config/mainLayoutRoutes.ts` (add exception)
- `src/pages/admin/MediaIngestionHub.tsx` (embedded prop, drop hard-coded full-screen wrapper when embedded; respect sidebar offset when standalone)
- `src/components/navigation/GlobalVerticalNav.tsx` (owner shortcut entry)
- `src/pages/CRMRelationships.tsx` (toolbar button)
- `src/pages/OwnerTemplates.tsx` (wrap in Tabs, add Media Ingestion tab)
