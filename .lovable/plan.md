
## What I’m going to fix (based on what I found in the code + your report)

### A) Project page sticky header “Active section” gets stuck (e.g., shows Mortgage/AI Analyzer while you’re elsewhere)
**Current root cause (confirmed in `ProjectDetailLayout.tsx`):**
- The scroll-spy uses an `IntersectionObserver` and sets the active tab for *any* intersecting section inside a loop.
- Multiple sections can be “intersecting” at the same time, and the callback order is not stable → the active tab can jump or get stuck on an earlier/later section (like `mortgage`).

**Fix plan:**
1. Replace the “first intersecting wins” logic with a deterministic selection:
   - Track all observed entries.
   - Choose the section with the **highest `intersectionRatio`**, and as a tie-breaker the one **closest to the top** of viewport.
2. Adjust observer settings to match the real sticky header height:
   - Update `rootMargin` to account for the two-row sticky sub-nav so sections don’t “activate” too early/late.
   - Use a small `threshold` array (e.g., `[0.1, 0.25, 0.4, 0.6]`) so ratios are meaningful.
3. Fix click-to-scroll behavior:
   - Change `scrollIntoView` from `block: "center"` to `block: "start"` + rely on `scroll-mt-*` so the section aligns properly under the sticky bar (prevents odd mid-section alignment that confuses the observer).

Files:
- `src/components/project-detail/ProjectDetailLayout.tsx`

---

### B) Make the active highlight MUCH more visible + add gold borders under header / under header “arrow”
**Current:**
- The active pill style exists but can be subtle during fast scroll.

**Fix plan:**
1. Upgrade active tab styling:
   - Add a stronger gold glow + thicker border + subtle underline bar under the active pill.
2. Add a clear gold bottom border indication for the sticky sub-nav row (the one with the horizontal pills) so it reads as a “control bar”.
3. Remove/replace the “thin white divider” that appears under the global header when transparent:
   - In `GlobalHeader.tsx` there is an explicit white gradient divider shown when transparent (`via-white/30`).
   - Replace it with a gold gradient divider (so you never see a white line artifact).

Files:
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/GlobalHeader.tsx`

---

### C) Make the gold horizontal scroller draggable (not only arrow buttons) — globally
**Current root cause (confirmed in `PremiumHorizontalScrollHint.tsx`):**
- The rail/thumb is visual only; no pointer dragging is implemented.

**Fix plan:**
1. Implement drag-to-scroll on the gold rail:
   - `pointerdown` on rail/thumb → start drag
   - `pointermove` → compute desired scrollLeft based on rail position ratio
   - `pointerup/cancel` → stop drag
2. Support both mouse + touch (pointer events) and keep it smooth.
3. Keep arrows working as-is.

Files:
- `src/components/ui/PremiumHorizontalScrollHint.tsx`
(Automatically improves every page using it: Project sticky tabs, FilterShortcutBar, etc.)

---

### D) Mega-menu hover videos/images load slowly / require multiple hovers
**Current root cause (confirmed in `mega-menu-primitives.tsx`):**
- When a `video` is provided, the static image layer is forced `opacity-0` immediately, even before the video is ready → user sees blank/slow loads until video buffers.

**Fix plan:**
1. Always show the static image immediately.
2. Only fade the image out **after** `videoReady === true`.
3. Add lightweight “preload on first hover”:
   - When user hovers a top nav item (Buy/Sell/Rent/Developers…), programmatically warm up:
     - `new Image().src = heroImageUrl`
     - create a detached `<video preload="auto">` and set `src` to prime cache
4. Ensure these heavy MP4s are not blocking interaction:
   - Keep the video muted/inline, but don’t hide the UI while it loads.

Files:
- `src/components/header/mega-menu-primitives.tsx`
- `src/components/GlobalHeader.tsx`

---

### E) Location flyover “not working at all”
**What I see in code (`ProjectLocationFlyover.tsx`):**
- It only runs after pressing the play button (not automatic).
- It uses Esri satellite tiles; if tile loading fails/rate-limits, the map can look “dead”.
- Also, flyover only renders if `project.latitude && project.longitude` (truthy check) — this can incorrectly hide the flyover if values are `0` or malformed.

**Fix plan:**
1. Make flyover more reliable:
   - Render flyover when coords are **valid numbers** (`!= null`, `!isNaN`, and not `0/0`), not just truthy.
2. Add a tile fallback:
   - If satellite tile errors occur, automatically switch to OSM street tiles (so the user always sees something).
3. Add “auto-play once when user scrolls into Location section” (recommended for your requirement “it has to work”):
   - Use an `IntersectionObserver` on the flyover container: when ~40% visible, auto-start if it hasn’t run yet.
   - Keep the Play/Replay button for manual control.

Files:
- `src/components/project-detail/ProjectLocationFlyover.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx` (render condition)

---

### F) “No divider inside location” + “white divider still showing”
**Likely causes:**
- The “white divider” you’re seeing is very likely the transparent-header divider in `GlobalHeader.tsx` (confirmed).
- Any “divider inside location” can also be caused by borders inside map containers and section wrappers, not only the `SectionDivider` component.

**Fix plan:**
1. Replace the global header white divider with gold (covered in B).
2. Audit the Location section wrapper and both map components to ensure:
   - No accidental `bg-white` blocks between champagne sections
   - Borders are gold/neutral and never white “gaps”

Files:
- `src/components/GlobalHeader.tsx`
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/project-detail/ProjectLocationMap.tsx`

---

### G) Add “Property Map” on Project page, and ensure it exists on Area + Developer pages (all of the above)
**Current state:**
- Area page already has a map (`AreaMapSection`).
- Developer page already has a projects map (`DeveloperProjectsMap`) with a Leaflet implementation.
- Project page only has the single-project location map, not a nearby “property map view”.

**Fix plan:**
1. Project page: add a **Nearby Properties Map** section (within/after Location):
   - Query projects in same area (and/or same developer) with valid coordinates.
   - Render a multi-marker map (reuse existing map patterns, gold pins, and popups).
2. Area page: keep existing, but ensure it never silently returns null when it should display.
3. Developer page: keep existing, but ensure coordinates filtering includes valid `0`-safe checks and map init isn’t blocked by interaction overlay.

Files (new + existing):
- Create: `src/components/project-detail/ProjectNearbyPropertiesMap.tsx` (or similar)
- Edit: `src/components/project-detail/ProjectDetailLayout.tsx`
- Verify: `src/components/area-detail/AreaMapSection.tsx`
- Verify: `src/components/developer/DeveloperProjectsMap.tsx`

---

### H) “Keep searching…” section hidden/corrupted under vertical nav/header
**Likely cause:**
- Pages that show the fixed left vertical nav don’t always guarantee consistent left offset for *all* sections/components.
- Best fix is to centralize this in the vertical nav itself.

**Fix plan:**
1. In `PropertiesVerticalNav.tsx`, when it mounts, add `document.body.classList.add("jj-vertical-nav-active")`, and remove on unmount.
2. In `ContinueSearching.tsx` (and any other affected reusable strips), add conditional layout padding at `lg:` when that body class is present:
   - e.g., apply `lg:pl-[200px]` to the outer section container.
   - This prevents any section from hiding behind the fixed vertical nav.

Files:
- `src/components/navigation/PropertiesVerticalNav.tsx`
- `src/components/ContinueSearching.tsx`
- `src/index.css` (optional helper class if needed)

---

### I) Developer monogram/logo disappears on hover
**Related evidence:**
- Console warning: “Function components cannot be given refs… Check `RecommendedProjects` at `DeveloperLink`”.
- This is usually caused by `asChild`/ref passing patterns; even if it doesn’t crash, it can create weird re-render/DOM replacement behavior under hover.

**Fix plan:**
1. Convert `DeveloperLink` to `React.forwardRef` so it can accept refs safely when wrapped by other components.
2. Ensure nested links don’t break card hover:
   - Keep `stopPropagation` but also ensure it’s not causing navigation/hover state resets.
3. Audit other project cards for any `group-hover:opacity-0` rules applied to logo layers.

Files:
- `src/components/ui/developer-link.tsx`
- Likely audit: `src/components/ProjectCard.tsx`, `src/components/ContinueSearching.tsx`, other listing cards

---

## “C panel” deep explanation (where to find it + how it works)
Because you said you don’t know where it is and mean “workflow/system to generate emails”, I’ll document (in-app + in chat) the actual places in this app that currently exist:
1. **CRM Lead Detail → Email tab**: uses `SmartEmailComposer` to generate subject/body via backend AI and then opens the user’s mail app (mailto) today.
2. **Founder Assistant → tools**: has email composer tools listed (AI generation side).
3. **Unified Inbox / Email Client** (if present): how Gmail integration would connect (OAuth tokens → list threads → send).

Deliverable:
- Add an Owner-only “How Email Works” help modal/page with:
  - Where to access each panel
  - What is AI-generated vs what is actually sent
  - What needs Gmail OAuth vs what is local draft-only

Files:
- Add: `src/pages/owner/OwnerEmailHelp.tsx` (or a modal inside Founder Assistant)
- Add route + link from Founder Assistant

(Implementation will respect platform limits: the app can draft emails and manage inbox via Gmail OAuth; for non-auth outbound sending, it must go through your connected Gmail account flow.)

---

## Proof / screenshots (what I will do after implementing)
After code changes (in build mode), I will:
1. Open `/project/vivida-residences-3281`
2. Scroll through Details → Gallery → Units → Location → Register Interest and confirm the correct tab highlights (not stuck on Mortgage/AI).
3. Start the flyover (auto-play or press Play), confirm it animates, and capture screenshots:
   - One showing flyover running with step overlay
   - One showing the sticky nav highlighting correctly
4. Hover Buy/Projects/Developers menus and capture a screenshot showing the featured card displays immediately (image first, video fades in)

---

## Implementation order (fastest path to visible improvement)
1) Fix scroll-spy selection + click-to-scroll alignment (ProjectDetailLayout)  
2) Stronger active highlight styling + gold borders + remove white header divider  
3) Drag-to-scroll for gold rail (PremiumHorizontalScrollHint)  
4) Mega-menu featured card media fallback + preloading  
5) Flyover reliability: valid-coords check + tile fallback + auto-play on view  
6) Add nearby properties map to project page  
7) Vertical nav overlap fix for “Continue Searching” via body class approach  
8) Developer logo hover disappearance + forwardRef fix + card audit

