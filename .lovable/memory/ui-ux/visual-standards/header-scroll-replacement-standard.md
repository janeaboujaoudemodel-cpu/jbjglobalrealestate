---
name: Header Scroll Replacement Standard (LOCKED)
description: Project/developer/area pages keep the normal global header at top; on scroll it is replaced by exactly two sticky rows.
type: design
---

# Header Scroll Replacement — Locked Standard

1. Do not redesign the global horizontal header, vertical sidebar, colors, pills, dropdowns, spacing, typography, or icons for this behavior.
2. At page top, show the normal global horizontal header exactly as approved.
3. On `/project/*`, `/developer/*`, and `/area/*` only, scrolling down hides/replaces the global horizontal header.
4. The replacement sticky area must be exactly two rows:
   - Row 1: project search/filter pills only, beginning with “Search area, project…” then More Filters, Price, Payments, Handover, Bedrooms, Status, Construction, Views, sort pills, Map, Saved Filters.
   - Row 2: project section tabs only: Developer, Floor Plans, Specs, Amenities, Location, Brochure, Payment Plan, AI Analyzer, plus Register Interest CTA.
5. No third row, no global header controls in the replacement, no vertical text, no wrapping into multiple rows; use horizontal scrolling on narrow screens.
6. When scrolling back to the top, restore the normal global horizontal header and stop the sticky replacement.
7. Before claiming completion, validate visually with screenshots for desktop top, desktop scrolled, iPad landscape scrolled, iPad portrait scrolled, and mobile scrolled.