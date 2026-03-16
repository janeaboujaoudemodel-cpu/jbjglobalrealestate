

## Plan: Global Routing and Sitemap Integration for Developer Routes

### Current State Assessment

**Existing routes (IMPLEMENTED):**
- `/developer-hub` → DeveloperHubOverview (auth-required, dedicated shell) — in `src/routes/DeveloperHubRoutes.tsx`
- `/developer-hub/company-registration` → DeveloperCompanyRegistration
- `/developer-hub/events` → DeveloperLaunchEvents
- `/developer-hub/projects` → redirects to `/developer-portal?tab=projects`
- `/developer-hub/crm` → DeveloperCRM
- `/developer-hub/reports` → DeveloperReports
- `/developer-portal` → DeveloperPortal (public route) — in `src/routes/PublicRoutes.tsx`

**Missing routes from spec:**
- `/developer-center` — NOT IMPLEMENTED (no page or route exists)
- `/developer-registration` — NOT IMPLEMENTED (exists only as `/developer-hub/company-registration`)
- `/submit-project` — NOT IMPLEMENTED (only via `/developer-portal?tab=submit`)
- `/submit-event` — NOT IMPLEMENTED (only via `/developer-hub/events`)
- `/my-projects` — NOT IMPLEMENTED (only via `/developer-portal?tab=projects`)
- `/my-events` — NOT IMPLEMENTED (no dedicated route)

**Sitemap page (`src/pages/Sitemap.tsx`):**
- Only has `/developer-portal` in the "Broker Hub" section (line 179)
- Missing all other developer routes

**robots.txt (`public/robots.txt`):**
- No developer routes listed

**SEO Breadcrumbs (`src/components/SEOBreadcrumbs.tsx`):**
- No developer route labels in `ROUTE_LABELS`

---

### Implementation Plan

#### 1. Add convenience redirect routes
**File:** `src/routes/PublicRoutes.tsx`

Add `<Navigate>` redirects so the requested URLs resolve to existing pages:

| New Route | Redirects To |
|-----------|-------------|
| `/developer-center` | `/developer-hub` |
| `/developer-registration` | `/developer-hub/company-registration` |
| `/submit-project` | `/developer-portal?tab=submit` |
| `/submit-event` | `/developer-hub/events` |
| `/my-projects` | `/developer-portal?tab=projects` |
| `/my-events` | `/developer-hub/events` |

These are simple `<Route path="..." element={<Navigate to="..." replace />} />` entries — no new pages needed.

#### 2. Add developer section to Sitemap page
**File:** `src/pages/Sitemap.tsx`

Add a new hub section in the `hubSections` array (after "broker-hub"):

```text
Developer Hub
├── Developer Center         → /developer-center
├── Developer Registration   → /developer-registration
├── Developer Portal         → /developer-portal
├── Submit Project           → /submit-project
├── Submit Event             → /submit-event
├── My Projects              → /my-projects
├── My Events                → /my-events
├── Developer CRM            → /developer-hub/crm
└── Developer Reports        → /developer-hub/reports
```

Icon: `Building2` (already imported).

#### 3. Add SEO breadcrumb labels
**File:** `src/components/SEOBreadcrumbs.tsx`

Add to `ROUTE_LABELS`:
- `/developer-center` → "Developer Center"
- `/developer-registration` → "Developer Registration"
- `/developer-portal` → "Developer Portal"
- `/submit-project` → "Submit Project"
- `/submit-event` → "Submit Event"
- `/my-projects` → "My Projects"
- `/my-events` → "My Events"
- `/developer-hub` → "Developer Hub"

#### 4. Allow crawling of public developer routes
**File:** `public/robots.txt`

Add explicit `Allow` directives for the public-facing developer routes:
```
Allow: /developer-center
Allow: /developer-portal
Allow: /developer-registration
Allow: /submit-project
Allow: /submit-event
```

Keep `/developer-hub` (auth-required) in disallow since it requires login.

#### 5. Add to GlobalSEO navigation schema
**File:** `src/components/GlobalSEO.tsx`

Add to the `SiteNavigationElement` ItemList:
- `{ position: 11, name: "Developer Center", url: "https://jbj.ae/developer-center" }`

---

### Files Modified
1. `src/routes/PublicRoutes.tsx` — 6 redirect routes added
2. `src/pages/Sitemap.tsx` — new "Developer Hub" section in hubSections array
3. `src/components/SEOBreadcrumbs.tsx` — 8 new ROUTE_LABELS entries
4. `public/robots.txt` — Allow directives for public developer routes
5. `src/components/GlobalSEO.tsx` — 1 navigation element added

### Database Changes
None.

### Testing Steps
1. Navigate to `/developer-center` → verify redirect to `/developer-hub`
2. Navigate to `/submit-project` → verify redirect to `/developer-portal?tab=submit`
3. Navigate to `/my-projects` → verify redirect to `/developer-portal?tab=projects`
4. Navigate to `/my-events` → verify redirect to `/developer-hub/events`
5. Navigate to `/developer-registration` → verify redirect to `/developer-hub/company-registration`
6. Navigate to `/submit-event` → verify redirect to `/developer-hub/events`
7. Visit `/sitemap` → verify "Developer Hub" section visible with all 9 links
8. View page source on any developer route → verify breadcrumb JSON-LD present

