

## Fix Three Issues: Developer Logo Fit, Chat Auto-Minimize on Recommendations, and Filter Sold-Out Projects

### Issue 1: Developer Card Logo -- Full Fit Without White Borders or Cropping

**Problem**: The logo overlay on developer cards currently has `p-1.5` padding inside a white box, creating visible white borders around the logo. The user wants the logo to fill the entire frame with no white space, but still without cropping.

**Fix**: Remove the `p-1.5` padding from the logo container so the logo fills the full 56x56px box. Keep `object-contain` to prevent cropping.

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` (line 88) | Change `bg-white p-1.5` to `bg-white p-0` -- remove all padding so the logo fills edge-to-edge inside the rounded box |

---

### Issue 2: Auto-Minimize Chat When "Recommended for You" Popup Appears

**Problem**: The `PropertyRecommendationPopup` (the behavior-based "Recommended for You" popup that appears in the bottom-right corner) overlaps with the JBJ Support chat widget. When the recommendation popup opens, the chat should auto-minimize.

**Current architecture**: The popup lives in `PopupLayer.tsx` and has no connection to the chat widget state in `MainLayout.tsx`.

**Fix**: Use a custom event to communicate between the recommendation popup and the chat widget.

| File | Change |
|------|--------|
| `src/components/PropertyRecommendationPopup.tsx` | When `setIsOpen(true)` is called, also dispatch a custom event `window.dispatchEvent(new Event('recommendation-popup-opened'))` |
| `src/components/MainLayout.tsx` | Add a `useEffect` that listens for the `recommendation-popup-opened` event and calls `setIsChatCollapsed(true)` + `setShowAttentionPulse(false)` |

---

### Issue 3: Stop Recommending Sold-Out Projects

**Problem**: Both `RecommendedProjects` (on project detail pages) and `PropertyRecommendationPopup` (the behavior popup) can show projects that are sold out. The user does not want sold-out projects recommended.

**Fix**: Filter out sold-out projects in both components.

| File | Change |
|------|--------|
| `src/components/project-detail/RecommendedProjects.tsx` (line 27) | Add filter: exclude projects where `sale_status` contains "sold" (case-insensitive) |
| `src/components/PropertyRecommendationPopup.tsx` (lines 89-93, 107-112) | Add `.not('sale_status', 'ilike', '%sold%')` to both the primary and fallback database queries |

---

### Summary of All Changes

| # | File | What Changes |
|---|------|-------------|
| 1 | `src/components/DeveloperCard.tsx` | Remove `p-1.5` padding from logo container |
| 2 | `src/components/PropertyRecommendationPopup.tsx` | Dispatch event on open + filter out sold-out projects from queries |
| 3 | `src/components/MainLayout.tsx` | Listen for recommendation popup event, auto-collapse chat |
| 4 | `src/components/project-detail/RecommendedProjects.tsx` | Filter out sold-out projects from recommendations |
