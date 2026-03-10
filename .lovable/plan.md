

# Deep Website Audit & Infrastructure Improvement Plan

## Audit Findings

After a thorough review of the codebase (1,004-line App.tsx with 200+ routes, 1,886-line index.css, 1,648-line GlobalHeader, 885-line GlobalVerticalNav, and 250+ components), I've identified issues across **6 categories**: Bugs, Responsive/Device Compatibility, Performance, UX/Usability, Code Quality, and Security.

---

## Category 1: Bugs & Functional Issues

### 1.1 Mobile Navigation Overlap
The `GlobalVerticalNav` hamburger button (`fixed top-4 left-4 z-[10050]`) overlaps with the `GlobalHeader` on mobile. Both render on `lg:hidden` — the header has its own menu button at the same position. This causes a **double hamburger** or click interception issue on tablets/phones.

**Fix**: Hide the vertical nav hamburger on mobile since `GlobalHeader` already handles mobile navigation. The vertical nav should be desktop-only (`hidden lg:block` for the hamburger trigger too — but currently it's `lg:hidden`).

### 1.2 Footer Left Padding Not Responsive to Nav State
The footer wrapper uses a static `lg:pl-[200px]` but doesn't account for collapsed nav state (`48px`). When the sidebar is collapsed, the footer has excess left padding.

**Fix**: Use the same body-class-driven approach: `[body.jj-vertical-nav-active_&]:lg:pl-[200px] [body.jj-vertical-nav-collapsed_&]:lg:pl-[48px]`

### 1.3 ContinueSearching Missing Nav-Aware Padding
The `ContinueSearching` component referenced in memory as needing `jj-vertical-nav-active` responsive padding, but the component is rendered inside `<main>` which already has the padding. However, any full-width sections inside may bleed. Need to verify edge cases.

### 1.4 Duplicate Route Definitions
Several routes are defined twice — once in the Owner shell (`/owner/*`) and once in the MainLayout:
- `/crm`, `/crm/leads`, `/crm/tasks`, etc. exist both under `/owner/crm/*` and `/crm/*`
- `/listing-admin` exists under both `/owner/listing-admin` and `/listing-admin`
- `/automations` and `/owner/automations` both exist

**Fix**: Consolidate to single route definitions. Redirect legacy paths to the owner shell.

### 1.5 Mega Menu Z-Index Conflicts
Mega menus use `z-[10000]` while dialogs use `z-[10050]`. The vertical nav mobile drawer uses `z-[10100]`. This stack is functional but fragile. Any new modal could break layering.

---

## Category 2: Responsive & Device Compatibility

### 2.1 Hero Section on Small Devices
The homepage hero uses `pt-72 sm:pt-60 md:pt-64 lg:pt-72` which pushes content very far down on mobile. On short phones (iPhone SE, 667px height), the search bar may be partially hidden below the fold.

**Fix**: Use `pt-[40vh]` or clamp-based values instead of fixed rem values for the hero content positioning.

### 2.2 Mega Menu Width on Tablets
The mega menu flyout is `w-[440px]` which doesn't fit on tablets (768px) when the sidebar (200px) is open, leaving only 568px — the menu fits but barely. On landscape phones or small tablets this clips.

**Fix**: Add responsive width: `w-[min(440px,calc(100vw-240px))]` to prevent overflow.

### 2.3 Footer Card Grid on Small Screens
Footer uses `grid-cols-2` gap layout for link cards which can get cramped on phones under 375px width.

### 2.4 GlobalHeader File Size (1,648 lines)
While not a direct bug, this monolithic component is hard to maintain and likely causes unnecessary re-renders on any state change. The header handles mega menus, search, language, currency, auth, and mobile menu all in one component.

---

## Category 3: Performance Improvements

### 3.1 QueryClient Retry Strategy
The `QueryClient` retries 3 times with exponential backoff up to 15s. For failed network requests, this means users wait up to ~30s before seeing an error. This is too aggressive for a real estate browsing experience.

**Fix**: Reduce to `retry: 1` for most queries, keep `retry: 3` only for critical data fetches.

### 3.2 Shell Defer Timer (2s)
`MainLayout` defers `SecurityShield`, `MarketingScripts`, and `CommandPaletteRoot` by 2 seconds. This is fine, but the `PopupLayer` defers until scroll > 50% on homepage, which means popups won't trigger for users who don't scroll.

### 3.3 Framer Motion on Homepage
The hero uses multiple `motion.div` components with `staggerChildren`. While visually nice, framer-motion is a heavy dependency. The hero could use CSS animations instead for faster FCP.

### 3.4 Video Preload Strategy
Hero video uses `preload="none"` which is correct, but the `onCanPlay` opacity transition means the video pops in abruptly on fast connections. Consider `onCanPlayThrough` for smoother experience.

---

## Category 4: UX & Usability Improvements

### 4.1 No Loading Feedback on Route Transitions
When navigating between lazy-loaded pages, `PageLoader` shows a spinner. But the spinner has no context — users don't know what's loading. Add route-aware loading text.

### 4.2 Search Accessibility
`GlobalSearchModal` is triggered by `⌘K` shortcut shown in the sidebar, but there's no visible search bar on mobile header for quick access.

### 4.3 Back Navigation on Full-Screen Pages
Per the memory standard, full-screen pages need a visible "← Back" button. Several toolkit pages and AI tool pages may be missing this.

### 4.4 Scroll-to-Top Behavior
`ScrollToTopOnMount` resets scroll on every route change, but for pages with tabs (like `/properties?transactionType=buy`), query parameter changes shouldn't reset scroll.

### 4.5 AI Home Finder Prominence
The AI Home Finder (`/quiz`) CTA is buried ~70% down the homepage. For a key differentiator, it should be more prominent — perhaps as a floating entry point or integrated into the hero.

---

## Category 5: Code Quality & Maintainability

### 5.1 App.tsx is 1,004 Lines
The routing file has grown unwieldy. Split into route groups: `PublicRoutes`, `OwnerRoutes`, `ToolkitRoutes`, `AdminRoutes`.

### 5.2 Inconsistent Suspense Fallbacks
Some routes use inline Suspense with custom spinners, others rely on the parent `<Suspense fallback={<PageLoader />}>`. This creates inconsistent loading experiences.

### 5.3 Unused Context Nesting
The provider tree is 9 levels deep: `AuthProvider > BrandPaletteProvider > UserModeProvider > FounderVisibilityProvider > PodcastVisibilityProvider > ActiveLeadProvider > PopupCoordinatorProvider`. Several of these may not be needed on every page.

---

## Category 6: Security Observations

### 6.1 Owner Verification Cache
`AuthContext` caches owner status in `sessionStorage` for instant access. While it verifies in background, there's a brief window where a non-owner could see owner UI if sessionStorage was tampered with. The background verify fixes this, but the UX flash could confuse users.

### 6.2 BrokerGuard vs OwnerGuard Consistency
Some AI tools use `BrokerGuard` (e.g., `/ai-lead-qualification`, `/ai-contract-reviewer`) while similar tools don't. The access control pattern isn't consistent across all AI tools.

---

## Implementation Plan (Priority Order)

### Phase 1: Critical Bug Fixes (Immediate)
1. **Fix mobile nav overlap** — Remove the vertical nav hamburger on mobile; let GlobalHeader own mobile navigation entirely
2. **Fix footer padding** — Use body-class-driven responsive padding matching the main content area
3. **Consolidate duplicate routes** — Redirect legacy CRM/admin paths to `/owner/*` shell
4. **Fix hero content positioning** — Use viewport-relative units for mobile hero padding

### Phase 2: Responsive Polish
5. **Mega menu responsive width** — Cap at viewport-aware max width
6. **Tablet breakpoint audit** — Test and fix all sections at 768px-1024px range where sidebar + content compete for space
7. **Footer grid mobile** — Ensure 1-column on very small screens

### Phase 3: Performance & UX
8. **Reduce query retries** — Set default retry to 1
9. **Unify Suspense fallbacks** — Use `PageLoader` consistently across all routes
10. **Add route-context to loading states** — Show "Loading Properties..." instead of generic spinner
11. **Video transition improvement** — Use `onCanPlayThrough` and smoother fade

### Phase 4: Architecture Cleanup
12. **Split App.tsx** into route group files
13. **Flatten context providers** — Compose only where needed using route-level providers
14. **Standardize z-index scale** — Create a `z-index.ts` constants file

This is a significant scope. I recommend tackling **Phase 1** first (4 tasks, ~1 session), then Phase 2-4 incrementally.

