## Plan

1. **Filter panel placement**
   - Change only the property filter opened from the horizontal header so it behaves like the AED currency dropdown: it opens directly under the header border, aligned to the clicked filter button, not overlapping the header.
   - Keep the existing champagne/ink filter contrast and existing responsiveness; no unrelated style changes.

2. **Currency hover restriction**
   - Remove the full emerald block highlight from currency rows on hover/highlight.
   - Keep currency rows champagne/ink on hover with only a subtle hover treatment.
   - Reserve emerald background + white text only for the active selected currency row.

3. **Technical scope**
   - Update the filter panel component positioning logic and/or dialog styling so the panel top starts at the header bottom line.
   - Add scoped currency-menu CSS overrides so global Radix highlighted rules cannot force emerald hover inside the AED dropdown.
   - Avoid touching unrelated header/menu components.

4. **Validation proof**
   - Use Playwright to manually click the filter button and AED dropdown.
   - Capture screenshots proving:
     - filter panel starts below the header and is attached to the filter trigger area;
     - currency hover does not become a full emerald block;
     - selected AED remains emerald with white text;
     - dropdowns still open/close quickly.
   - Inspect DOM bounding boxes/styles for the filter panel top and currency row hover/active colors before reporting completion.