## Issues confirmed (from live page inspection)

Screenshot of `/ai-meeting-summarizer` confirmed all four bugs:

1. **Sidebar highlighted hubs are color-coded** — AI Home Finder (violet), List Your Property (sky blue), Careers (rose), Resale Properties (emerald). User wants them all on the unified champagne+gold palette like the rest of the sidebar.
2. **Tools (and other expanded sections) show a border around every sub-item** — under TOOLS, each entry has a visible `border` rectangle framing it. User wants only spacing between items, no border-frame on each row, when a section is expanded.
3. **AI Meeting Summarizer "Back" button reads as white-on-white** — comes from `Button variant="dark-outline"` in `src/components/ai-tools/AIToolPremiumLayout.tsx`, which renders `bg-transparent text-white`. On certain hero gradients (and after the contrast guard remaps), the pill effectively becomes white-on-white and is unreadable until hover.
4. **Slow opening on the AI Meeting Summarizer route** — caused by the lazy chunk being downloaded only on click. Add a hover-prefetch so it begins loading as soon as the user moves over the link in the sidebar / hubs.

Contact and Support icons in the bottom of the sidebar are already `text-red-600` ✓ — no change needed.

## Fix plan

### 1. Unify highlighted hubs to gold — `src/components/navigation/GlobalVerticalNav.tsx`

Replace the four per-item color branches in `getItemStyle` (lines 781–804) with a single gold-styled branch covering all four hrefs (`/join`, `/quiz`, `/listing-portal` highlight, `/resale-properties`):

```ts
if (
  item.href === '/join' ||
  item.href === '/quiz' ||
  (item.href === '/listing-portal' && item.highlight) ||
  item.href === '/resale-properties'
) {
  return shouldHighlight
    ? "bg-gradient-to-r from-[#F7F1E6] to-[#D8C7A6] text-[#1A1A1A] border border-gold/50 font-bold"
    : "text-[#1A1A1A]/85 font-semibold hover:bg-gold/10 border border-gold/25 hover:border-gold/45";
}
```

Also remove the `isSaturatedColorRow` early return in `getIconStyle` and `getIconTileClass` (lines 833-834 and 847-849) so these rows now use the standard gold icon + tile styling. Result: a fully consistent champagne+gold sidebar.

### 2. Remove per-item borders in expanded sections — `GlobalVerticalNav.tsx`

The framing comes from `getItemStyle`'s default branch (line 817) returning `border border-[#1A1A1A]/10 hover:border-gold/30` on every row, which is visible inside the expanded accordion (lines 1211–1247).

Strip the `border *` classes from the **non-highlighted/default** branches so only spacing remains. Active state keeps its gold pill (no outer border ring; the gradient fill conveys selection). Specifically:

- Line 808 default branch: drop `border border-[#1A1A1A]/10`.
- Line 813 `item.highlight` rest branch: drop `border border-[#1A1A1A]/10`.
- Line 817 default rest branch: drop `border border-[#1A1A1A]/10 hover:border-gold/30`.
- Increase row vertical spacing in the accordion list from `space-y-0.5` → `space-y-1` (line 1214) for cleaner separation.

This rule applies automatically everywhere `getItemStyle` runs (Properties, Tools, Insights, Services, Partners, Broker, Investor, Company, Legal, Productivity, My Account, Suites, Admin) — so the user's "applies to all expansions" request is honored in one place.

The mega-menu flyouts (developers/areas at lines 990 and shortcuts at 917) keep their outline borders since they live inside a separate floating panel and use them as data-card chrome, not row framing — leaving them unchanged is consistent with the user's intent ("expansion" of the inline accordion).

### 3. Fix Back button contrast — `src/components/ai-tools/AIToolPremiumLayout.tsx`

Replace `variant="dark-outline"` (line 201) with an explicit, guard-immune high-contrast pill:

```tsx
<Button
  size="sm"
  onClick={...}
  data-no-contrast-guard
  className="mb-6 relative z-10 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#FDFBF7] border-2 border-[#FDFBF7]/30 hover:border-[#FDFBF7]/60"
>
  <ArrowLeft className="h-4 w-4 mr-2" />
  Back
</Button>
```

Black-on-champagne text guaranteed against any hero gradient color, and `data-no-contrast-guard` prevents the runtime guard from remapping it. This is used by every premium AI tool page (Meeting Summarizer, Call Summarizer, Document Generator, Contract Reviewer, etc.), so all of them get the fix in one edit.

### 4. Speed up Meeting Summarizer load — prefetch on hover

In `src/components/navigation/GlobalVerticalNav.tsx`, add a lightweight prefetch trigger to nav links that point to lazy AI tool pages. On `onMouseEnter` of a `Link` whose `href` starts with `/ai-`, dynamically `import()` the matching page module so the chunk is already cached when the user clicks.

Implementation: a small `prefetchAITool(href)` helper map keyed by href returning the same dynamic import the route uses (mirrors what `AIToolRoutes.tsx` already lazy-loads). Wire it on the regular `<Link>` in the section accordion render (line 1220) and on highlight rows (line 1144). No bundle cost — these are the same chunks that load on click anyway.

Optionally also add `<link rel="modulepreload">` for the most-used AI tool chunks in `index.html`, but the hover-prefetch alone typically eliminates the perceived delay.

## Files to edit

- `src/components/navigation/GlobalVerticalNav.tsx` — unify highlighted hubs to gold; strip per-row borders from accordion items; add hover-prefetch for `/ai-*` links.
- `src/components/ai-tools/AIToolPremiumLayout.tsx` — replace `dark-outline` Back button with a high-contrast ink pill carrying `data-no-contrast-guard`.

## Out of scope

- Contact/Support icons (already `text-red-600`, no change).
- Mega-menu flyout panels (developers/areas/shortcuts) — their card borders are intentional and not what the user is complaining about.
- Per-tool chunk size reduction — only adding hover-prefetch; no refactor of the AI Meeting Summarizer component itself, per the No-Removal policy.