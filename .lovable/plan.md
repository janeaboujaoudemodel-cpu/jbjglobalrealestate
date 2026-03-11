
## Goal
Fix (1) slow page transitions + “broken/empty then fixed” rendering, (2) left/right content jumping when scrolling, (3) missing global Back button, (4) duplicate Mortgage Calculator title/subtitle, (5) broken horizontal header behavior when vertical nav is minimized, and (6) add a premium JBJ intro splash with slogan music (auto-play + fallback).

---

## What I found (from code + profiling)
- **Big CLS/layout shift (~0.22)** is caused by fixed UI layers appearing/disappearing (e.g., fixed top utility bar + “filter-bar-fixed” behavior), plus per-page custom padding logic.
- **Properties page content jumps left/right** because `PropertiesReelly.tsx` conditionally adds extra `lg:pl-[200px]` inside the page while the layout (`MainLayout.tsx`) already handles sidebar padding via body classes. This double-handling shifts the content.
- **“Bio” is actually `/founder`** (Founder & Leadership). It can feel slow because the route is lazy-loaded and the app currently uses a **top-level `<Suspense fallback={<PageLoader/>}>` around all routes**, which temporarily replaces the whole page with a full-screen loader (looks like “broken/empty”).
- **Mortgage Calculator duplication**: `MortgageCalculatorPage` has its own hero title + subtitle, then renders `<MortgageCalculator compact />`, which also renders its own “Mortgage Calculator” title/subtitle in compact mode.
- **Horizontal header shows Owner/CRM shortcuts when sidebar minimized** because `HorizontalUtilityBar.tsx` intentionally injects those shortcuts when `sidebarCollapsed === true`. This conflicts with your requirement that shortcuts remain in the **vertical sidebar shortcuts** even when minimized.
- Performance profile shows:
  - **FCP ~12.6s** and high style recalculation on mobile.
  - A visible **React warning** about refs in the homepage section (“FeaturedListings”)—warnings are expensive and should be removed.

---

## Clarifications applied (your answers)
- Intro music: **Auto-play + fallback** if blocked, with a visible “Play” control.
- Back button: **Everywhere (including home)**.

---

## Implementation Plan (grouped by outcome)

### 1) Make navigation fast + remove “broken/empty then fixed” flash
**Key change:** Stop using a full-app Suspense fallback that replaces everything on route chunk loads.

- **Refactor routing suspense strategy**
  - In `src/App.tsx`: remove the single `<Suspense fallback={<PageLoader />}>` that wraps `<Routes>`.
  - Replace it with **per-route Suspense** (or per-route-group Suspense) so the **layout stays mounted** (header/sidebar remain stable) while only the page area shows a premium skeleton/loader.
  - Create a **layout-safe route fallback** that renders inside `<main>` (not full-screen black), preventing the “broken layout then fixes itself” perception.

- **Remove expensive React warning**
  - Find the `FeaturedListings` ref warning source and fix it properly (either remove the ref being passed, or convert the target component to `forwardRef` where needed). This also reduces console churn and dev overhead.

**Files likely touched**
- `src/App.tsx`
- `src/components/PageLoader.tsx` (adjust to a “page-area” loader variant)
- `src/pages/Index.tsx` and/or `src/components/home/FeaturedListings.tsx` (ref warning fix)

---

### 2) Fix left/right shifting and keep content perfectly centered while scrolling
- **Remove duplicate sidebar padding logic inside pages**
  - In `src/pages/PropertiesReelly.tsx`: remove the conditional `showStickyNav ? 'lg:pl-[200px]' : ''` from the internal container.
  - Ensure the page uses only `container mx-auto` / consistent padding and relies on `MainLayout.tsx`’s `[body.jj-vertical-nav-active_&]:lg:pl-[200px]` system.
- **Standardize sticky bars**
  - Keep fixed filter bars aligned using the same sidebar offsets (active vs collapsed) and avoid mixing `left-0` with additional internal padding that changes mid-scroll.

**Also apply the same audit** to other pages toggling `filter-bar-fixed`:
- `src/pages/AreaGuides.tsx`
- `src/pages/AreaDetail.tsx`
- `src/pages/Developers.tsx`
- `src/pages/DeveloperDetail.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`

---

### 3) Add a true Global Back Button (everywhere)
Implement a single shared component and render it in both desktop and mobile headers.

- Create `src/components/navigation/GlobalBackButton.tsx`
  - Behavior:
    - On click: `navigate(-1)`
    - If there’s no usable history: fallback to `/`
  - Styling: premium champagne pill (matches your institutional header standard).
- Add it to:
  - `src/components/navigation/HorizontalUtilityBar.tsx` (desktop top bar; far-left, before minimize/search)
  - `src/components/GlobalHeader.tsx` (mobile header; left side near logo)

This guarantees “Back” exists on all pages without relying on each page author.

---

### 4) Fix Mortgage Calculator duplicate title + upgrade the nude/beige premium styling
**Duplicate fix**
- Update `src/components/MortgageCalculator.tsx`:
  - Add prop: `showHeading?: boolean` (default `true`)
  - In `compact` mode, allow `showHeading={false}` to hide the compact title/subtitle block.
- Update `src/pages/MortgageCalculator.tsx`:
  - Use `<MortgageCalculator compact showHeading={false} />` so the page hero remains the single title source.

**Premium styling upgrades (your nude/beige contrast request)**
- In `src/pages/MortgageCalculator.tsx`:
  - Make “Ready to Secure Your Mortgage” a full-bleed section with **square corners** (no rounded outer edges).
  - Upgrade CTA button (more premium, less “basic black”):
    - Champagne gradient active state, gold border, controlled shadow, high-contrast typography.
  - Disclaimer block:
    - Use the same nude/brown palette contrast (lighter + darker) with refined border and typography.

---

### 5) Fix “minimized vertical header breaks horizontal header” + keep shortcuts in the vertical sidebar
**Goal:** When sidebar is minimized:
- Horizontal utility bar should NOT display owner shortcut strip.
- Vertical sidebar (collapsed state) should still show the important shortcuts as icons and keep them “highlighted”.

**Changes**
- In `src/components/navigation/HorizontalUtilityBar.tsx`:
  - Remove (or restrict) the owner shortcut strip inside `sidebarCollapsed && isOwner`.
  - Keep horizontal bar focused on universal utilities (search, buy/rent/sell, currency/language, notifications).
- In `src/components/navigation/GlobalVerticalNav.tsx` collapsed view:
  - Add a dedicated **Collapsed Shortcuts block** (icons only) for:
    - Listing Admin, Assistant, Command Center, HR, CV Center, Customer Happiness, Inquiries, CRM
  - Ensure active highlight persists even in collapsed mode (use champagne gradient active background for active shortcut).

This matches your requirement: shortcuts belong to the vertical nav, not the horizontal bar.

---

### 6) Add the JBJ intro “slogan music + logo animation” splash (auto-play + fallback)
- Create `src/components/BrandIntroSplash.tsx`
  - Shows on first visit per session (`sessionStorage` flag like `jj_intro_seen=1`)
  - Displays:
    - JBJ monogram + wordmark
    - short premium animation (use existing animation utilities: `animate-fade-in`, `scale-in`, etc.)
- Audio behavior:
  - Attempt autoplay on first load.
  - If blocked: show a prominent “Play Intro” / “Enable Sound” button.
  - Always provide “Skip” and never trap the user.
  - Respect `prefers-reduced-motion`.
- Add to `src/App.tsx` (above routes) so it covers all pages uniformly, but only once per session.

**Audio asset**
- Add a short `public/audio/jbj-slogan-sting.mp3` (or store it in backend storage and reference a stable URL).
- (Optional next step) If you want me to *generate* it via ElevenLabs music, we’ll wire a backend function to generate/store it—but implementation can start with a placeholder track so the UX is built now.

---

### 7) Security + RLS + “cybersecurity hardening” (fast wins tied to your issue)
Because you’re seeing failing HEAD calls (admin tables) and you requested stronger security:
- Run backend security scan + linter.
- Fix/adjust access patterns so we don’t spam protected endpoints:
  - Gate “admin_tasks”/admin-only counts behind role checks (owner/admin only).
  - Consider replacing 4 parallel “count HEAD queries” with a single backend RPC that returns counts safely and efficiently.

This improves both **security** and **performance**.

---

## Acceptance tests (what you should feel immediately)
1. Clicking **Founder/Bio** opens quickly and does not show a “broken empty page” flash (layout stays stable).
2. On Properties pages, scrolling past hero **does not move content left/right**.
3. A **Back** button exists on **every page**, including home, and works reliably.
4. Mortgage Calculator shows **one** title/subtitle (no duplicates).
5. Minimizing the vertical sidebar does **not** inject Owner/CRM shortcuts into the horizontal bar; shortcuts remain in the sidebar.
6. Intro splash plays the short sting if allowed; otherwise shows an “Enable Sound” CTA, then continues.

---

## Files (expected)
- Routing/loading/performance:
  - `src/App.tsx`
  - `src/components/PageLoader.tsx`
  - `src/pages/Index.tsx`
  - `src/components/home/FeaturedListings.tsx`
- Centering/layout shift:
  - `src/pages/PropertiesReelly.tsx` (+ other `filter-bar-fixed` pages listed above)
  - `src/components/MainLayout.tsx` (only if needed for consistent offsets)
- Global back button:
  - `src/components/navigation/GlobalBackButton.tsx` (new)
  - `src/components/navigation/HorizontalUtilityBar.tsx`
  - `src/components/GlobalHeader.tsx`
- Mortgage:
  - `src/pages/MortgageCalculator.tsx`
  - `src/components/MortgageCalculator.tsx`
- Header/nav behavior:
  - `src/components/navigation/GlobalVerticalNav.tsx`
  - `src/components/navigation/HorizontalUtilityBar.tsx`
- Splash:
  - `src/components/BrandIntroSplash.tsx` (new)
  - `src/App.tsx`

