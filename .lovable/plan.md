

## Add Project Page Sub-Navigation Under Scroll Header

### Current State
The project detail page (`ProjectDetailLayout.tsx`) has a sticky sub-navigation bar (lines 568-620) that appears on scroll. It uses a `bg-black` background, sits at `top-20`, and shows ALL visible section tabs (up to 17 tabs). The main GlobalHeader remains visible above it, creating two stacked headers.

### What the User Wants
When scrolling on a project page, the main GlobalHeader should hide (just like on developer/area pages) and the sticky sub-nav should move to the top. Below it, a compact line in a **darker champagne** color should display a curated set of shortcuts: **Details, Gallery, Developer, Location, Brochure, AI Analyzer, Mortgage, Register Interest**.

### Changes

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

#### 1. Add `filter-bar-fixed` body class when sticky nav is active
Add a `useEffect` that toggles `filter-bar-fixed` on `document.body` when `showStickyNav` is true, so GlobalHeader hides automatically (using the existing MutationObserver logic in GlobalHeader).

#### 2. Move sticky nav to `top-0`
Change the sticky nav from `top-20 sm:top-24 lg:top-28` to `top-0` since the GlobalHeader will be hidden.

#### 3. Restyle with darker champagne background
Replace `bg-black` with a darker champagne gradient (`bg-gradient-to-r from-[#EDE0C8] via-[#E2D4B8] to-[#D4C4A8]`) and update text colors to dark (`text-black`, active: `text-gold` with champagne highlight).

#### 4. Curate the tab list to 8 items
Replace the dynamic `visibleTabs` rendering with a fixed curated set:

| Tab | Icon | Scrolls to |
|-----|------|-----------|
| Details | FileText | detailsRef |
| Gallery | ImageIcon | galleryRef |
| Developer | Building2 | developerRef |
| Location | MapPin | locationRef |
| Brochure | Download | brochureRef |
| AI Analyzer | Sparkles | aiRef |
| Mortgage | Calculator | mortgageRef |
| Register Interest | UserPlus | inquiryRef |

These will always be shown (no conditional filtering needed for this compact bar). The full tab list remains available in the main content area if needed.

### Visual Result

```text
+-----------------------------------------------------------------------+
| Details | Gallery | Developer | Location | Brochure | AI | Mortgage | Register Interest |
+-----------------------------------------------------------------------+
  ^-- darker champagne background, gold active state, compact single line
```

### Files Summary

| File | Action |
|------|--------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add body class toggle, move to top-0, restyle champagne, curate 8 tabs |

