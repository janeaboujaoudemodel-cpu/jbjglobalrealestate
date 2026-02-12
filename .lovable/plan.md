

## Two Changes

### 1. Hide the fixed filter/search bar when scrolling reaches "Ready to Get Started"

The area page (`AreaProjectsGrid`) and the developer page (`DeveloperDetail`) both render a fixed filter bar via `createPortal` when the user scrolls past the projects section. Currently these bars stay visible all the way to the bottom of the page.

**Solution:** Add a second IntersectionObserver (a "bottom sentinel") that watches the `CombinedContactNewsletter` section rendered in `MainLayout`. When the "Ready to Get Started" section enters the viewport, set a flag that hides the fixed bar.

**Files to change:**

- **`src/components/area-detail/AreaProjectsGrid.tsx`** -- Add a second ref targeting an element near the end of the projects section (or the footer area). Use a second IntersectionObserver that sets `isFixed = false` when the bottom sentinel is visible. The portal render condition becomes `isFixed && !bottomReached`.

- **`src/components/area-detail/AreaStickySearchBar.tsx`** -- Same pattern: add a bottom sentinel observer. When the "Ready to Get Started" section enters the viewport, hide the sticky bar. Since this component does not have direct access to the CTA section, we will observe a DOM query (`document.querySelector('.combined-contact-newsletter')` or similar) by adding a stable class name to the CombinedContactNewsletter wrapper.

- **`src/pages/DeveloperDetail.tsx`** -- Same pattern for the developer page fixed filter portal.

- **`src/components/CombinedContactNewsletter.tsx`** -- Add a stable `id="ready-to-get-started"` to the outer `<section>` element so all sticky bars can observe it.

### 2. Add JBJ AI Analyzer to the Developer Detail page

The developer page currently has no AI analyzer. The area page has `AreaAIAnalyzer` and the project page has `ProjectAIAnalyzer`. We will create a `DeveloperAIAnalyzer` component following the same pattern as `ProjectAIAnalyzer` (simpler card-based layout).

**What it does:** When the section scrolls into view, it auto-triggers the existing `ai-property-analyzer` edge function with a developer-focused context string (developer name, founded year, headquarters, number of projects, etc.). The AI returns structured sections (Overview, Portfolio Strength, Investment Metrics, Pros, Cons, Rating) which are rendered in the same card grid layout.

**Files to create/change:**

- **New: `src/components/developer/DeveloperAIAnalyzer.tsx`** -- A new component modeled after `ProjectAIAnalyzer`. Props: `developerName`, `foundedYear`, `headquarters`, `completedProjects`, `activeProjects`, `projectCount`. Uses the same `ai-property-analyzer` edge function with a developer-focused context string. Same section extraction, rating display, pros/cons cards, and JBJ branding footer.

- **`src/pages/DeveloperDetail.tsx`** -- Import and render `DeveloperAIAnalyzer` after the projects grid section (before the closing `</div>`), passing the developer's metadata as props.

### Technical Details

**Bottom sentinel approach for hiding fixed bars:**

```text
  [Projects Grid]
       |
  [Fixed filter visible while scrolling here]
       |
  [CombinedContactNewsletter #ready-to-get-started]  <-- second observer target
       |
  [Footer]
```

- Each component with a fixed bar will query `document.getElementById('ready-to-get-started')` inside a `useEffect` and attach an IntersectionObserver to it.
- When the element enters the viewport (even partially), the fixed bar hides with a fade-out transition.

**DeveloperAIAnalyzer** reuses the existing `ai-property-analyzer` edge function -- no new backend function needed. The context string will be formatted as: `"Developer: {name}. Founded: {year}. HQ: {headquarters}. Projects: {count}. Completed: {completed}."` which the AI model will use to generate a developer-focused analysis.
