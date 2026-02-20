
# Fix Stamp Refresh Redirect + Add Corporate Document Suite

## Problem 1: Refresh Returns to Homepage

**Root Cause:** The `RouteResume` component in `src/components/RouteResume.tsx` is imported and used by `Index.tsx` (the homepage component), but it is **not registered inside `App.tsx`** as a global component. This means on a hard refresh, when React hydrates, the Vite dev server correctly serves `/toolkit/stamp-generator/projects` — but `sessionStorage` does not persist across hard refreshes (only across soft navigations). Additionally, the `StampProjectsDashboard` checks `if (!user)` and redirects to `/auth?redirect=...`, but if auth is still loading, it falls through and shows nothing, which can sometimes land on `/`.

**The real culprit:** The stamp generator routes are nested inside `<AdminBypass><MainLayoutWrapper /></AdminBypass>` which renders a `<Outlet/>`. The `MainLayoutWrapper` includes `<PageNavigation/>`. On refresh, the auth session restores asynchronously, but the `StampProjectsDashboard` doesn't show a loader while auth is loading — it only shows one when `authLoading` is true. However, there may be a timing window where `user` is null briefly, triggering the redirect to `/auth`, which then redirects to the homepage.

**Fix:** The `StampProjectsDashboard` already handles `authLoading` with a loader (lines 91–102), but the `navigate('/auth?redirect=...')` on line 36 fires when `!user` even before auth finishes loading. The fix is to guard with `if (authLoading) return` before the `!user` check. This is already done but the `!user` branch fires on first render before auth resolves.

**Solution:** Add `if (authLoading) return;` as the very first check in the `useEffect` in `StampProjectsDashboard` — it's already there but needs to be more robust with a dedicated `isRestoring` state. More importantly, we need to ensure `RouteResume` is placed inside the `BrowserRouter` in `App.tsx` as a global route-level component so it actually runs.

## Problem 2: Corporate Document Suite Missing

The user requested adding a full **Corporate Document Suite** alongside the stamp generator covering:
- Business Cards (designer + templates)
- Cover Letters
- CV / Resume
- Landing Page / Website Builder (with DNS info)
- Presentation templates

None of these exist yet as dedicated creation tools. The existing `BusinessCardScanner` is OCR-only, not a design tool.

---

## Implementation Plan

### Part 1 — Fix the Refresh Redirect (Critical Bug)

**File:** `src/components/stamp-generator/StampProjectsDashboard.tsx`

The `useEffect` that checks auth currently does:
```typescript
useEffect(() => {
  if (authLoading) return;  // ✅ already exists
  if (!user) { navigate('/auth?...') ... }
  fetchProjects();
}, [user, authLoading]);
```

The problem is the dependency array fires on mount when `authLoading=false` and `user=null` momentarily (before the session check completes). Fix: add a small guard so the redirect only happens after auth is fully settled.

**Also fix:** Register `RouteResume` component in `App.tsx` inside the `BrowserRouter` so it can persist and restore the stamp route on refresh. Currently it's defined in `src/components/RouteResume.tsx` but **never imported in `App.tsx`** — it only exists as a standalone file. It needs to be placed inside the router to function.

### Part 2 — Corporate Document Suite Hub

Create a new hub page: `/toolkit/corporate-suite` that acts as the entry dashboard for all document types.

**New files to create:**

```
src/pages/toolkit/CorporateSuite.tsx          — Hub landing page with tool cards
src/components/corporate-suite/
  BusinessCardDesigner.tsx                    — Visual business card creator
  CVResumeBuilder.tsx                         — CV / Resume builder with templates
  CoverLetterGenerator.tsx                    — AI-powered cover letter
  PresentationCreator.tsx                     — Presentation templates
  LandingPageBuilder.tsx                      — Simple landing page / info on DNS
```

**New routes to add in `App.tsx`:**
```
/toolkit/corporate-suite              → CorporateSuite hub
/toolkit/corporate-suite/business-card → BusinessCardDesigner
/toolkit/corporate-suite/cv-resume    → CVResumeBuilder
/toolkit/corporate-suite/cover-letter → CoverLetterGenerator
/toolkit/corporate-suite/presentation → PresentationCreator
/toolkit/corporate-suite/landing-page → LandingPageBuilder
```

**Hub Page Design** (`CorporateSuite.tsx`):
- Same visual style as the stamp generator (gold gradient header, dark cards)
- 6 tool cards arranged in a 2×3 grid:
  1. **Company Stamp** → links to existing `/toolkit/stamp-generator`
  2. **Business Card Designer** → new
  3. **CV / Resume** → new
  4. **Cover Letter** → new
  5. **Presentation** → new
  6. **Landing Page** → new (with note about DNS connection)

**Business Card Designer** (MVP):
- Form: Name, Title, Company, Phone, Email, Website, Address
- 6 template layouts (Modern, Classic, Minimal, Bold, Creative, Corporate)
- Color picker (same 3-stop system as stamp generator)
- Live preview (HTML/CSS rendered card at 3.5" × 2" ratio)
- Export as PNG and PDF via `pdf-lib` (already installed)

**CV/Resume Builder** (MVP):
- Sections: Personal Info, Summary, Experience, Education, Skills, Languages
- 4 templates (Executive, Modern, Classic, Creative)
- AI-powered summary generator using Gemini Flash (already available)
- Export as PDF

**Cover Letter Generator** (MVP):
- Inputs: Job title, Company name, Your name, Key skills, Tone (Professional/Casual/Confident)
- AI generates the letter body via Gemini Flash
- Template selection (3 styles)
- Export as PDF

**Presentation Creator** (MVP):
- Links to existing `/presentations` (which is already built as an owner tool) with an upgrade notice
- Or creates a simple slide deck with a form

**Landing Page Builder** (MVP):
- Simple form: Business name, tagline, services, contact info, colors
- Generates a one-page preview
- Shows instructions on how to connect a custom domain (DNS A record pointing)
- Export as HTML file

### Part 3 — Link Corporate Suite from Stamp Dashboard

Update `StampProjectsDashboard.tsx` to add a "Corporate Suite" breadcrumb/button at the top so users can navigate between the stamp tool and the full suite.

---

## Technical Details

### Files to Edit:
1. `src/App.tsx` — Add `RouteResume` import + render, add 6 new corporate suite routes, lazy-import new pages
2. `src/components/stamp-generator/StampProjectsDashboard.tsx` — Fix the auth guard timing bug, add corporate suite navigation link

### Files to Create:
3. `src/pages/toolkit/CorporateSuite.tsx` — Hub page
4. `src/components/corporate-suite/BusinessCardDesigner.tsx` — Business card tool
5. `src/components/corporate-suite/CVResumeBuilder.tsx` — CV/Resume tool
6. `src/components/corporate-suite/CoverLetterGenerator.tsx` — Cover letter tool
7. `src/components/corporate-suite/LandingPageBuilder.tsx` — Landing page tool

### No new database tables needed
All tools will use the browser (PDF-lib for export, Gemini for AI text generation). Projects can optionally be saved to the existing pattern once the MVP is validated.

### Priority Order:
1. Fix refresh redirect bug (immediate UX fix)
2. Corporate Suite hub page
3. Business Card Designer (most requested)
4. CV/Resume Builder
5. Cover Letter Generator
6. Landing Page Builder

---

## Visual Design Language (Consistent with Stamp Generator)
- Background: `bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]`
- Cards: `bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm`
- Accent: `from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]`
- Icons: Lucide React
- Motion: Framer Motion for card hover effects
