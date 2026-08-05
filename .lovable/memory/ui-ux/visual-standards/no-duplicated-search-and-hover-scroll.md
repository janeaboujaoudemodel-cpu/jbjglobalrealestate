---
name: No duplicated search inside the same field
description: When a surface already has a primary search input, nested panels/dropdowns must not add a second smaller search box. Gold borderless hover-scroll chevrons are the standard overflow affordance.
type: constraint
---
**No nested/duplicated search.** If a surface already exposes a primary search
field (e.g. the unified `PropertySearchBar` keyword input), any panel, dropdown,
or drawer opened from it must NOT render its own search input. Whenever two
search boxes serve the same field, the **smaller/inner one is always removed**
and the main one is kept. Applies site-wide, front end and back end.

Removed example: the "Search areas to include" input inside
`src/components/search/AreaIncludeExclude.tsx`.

**Overflow affordance standard:** horizontally scrollable pill rows (countries,
emirates, tabs, chips) use `src/components/ui/HoverScrollRow.tsx` — a clean gold
(`#B89555`) chevron with no border, no circle, no background, which starts a
smooth continuous scroll on hover and stops on leave. Arrows appear only when
content actually overflows in that direction.
