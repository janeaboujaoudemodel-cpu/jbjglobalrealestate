

## Fix Multiple Issues: Chat Widget, Property Counts, Area Photos, Price Trend, and Developer Page Divider

### Issue 1: Chat Widget -- Auto-Minimize on Detail Pages and Show Project Photo

**Current state**: The collapsed chat button shows a generic `SquareChatIcon`. The user wants it to:
- Show the project's cover photo instead of the building/chat icon (filling the circular frame with `object-cover`)
- Auto-minimize (collapse) when navigating to a project or area detail page

**Changes**:

| File | Change |
|------|--------|
| `src/components/MainLayout.tsx` | Detect when user navigates to `/project/*` or `/area/*` routes and auto-collapse the chat widget |
| `src/components/chat/CollapsedChatButton.tsx` | Accept an optional `projectImageUrl` prop and render it as the icon background using `object-cover` inside the circular frame, falling back to the existing `SquareChatIcon` |
| `src/components/AIChatWidget.tsx` | Pass `projectImageUrl` prop through from MainLayout context |

**Implementation detail**: MainLayout already knows the current route via `useLocation()`. When `pathname` starts with `/project/`, extract the slug and query the project's `cover_image_url` from the existing `useProjectBySlug` hook. Pass this image URL down to `AIChatWidget` and then to `CollapsedChatButton`.

---

### Issue 2: Property Count on Area Page Header Shows Wrong Number

**Current state**: The AreaHeroSection (on individual area detail pages like `/area/business-bay`) shows `area.project_count_sale ?? area.property_count` from the `areas` table. The user says this shows stale/incorrect counts.

The `areas.property_count` and `areas.project_count_sale` columns are static values that were set during sync and are not dynamically recalculated when projects are added or deleted.

**Fix**: Instead of relying on stale `areas.property_count`, dynamically count the actual projects in the database for that area.

| File | Change |
|------|--------|
| `src/pages/AreaDetail.tsx` | Add a query to count projects from the `projects` table where `area_name` or `location` matches the area, then pass the live count to `AreaHeroSection` |
| `src/components/area-detail/AreaHeroSection.tsx` | Accept and prefer a `liveProjectCount` prop over the static `area.property_count` |

---

### Issue 3: Area Photos -- Add Real Community Photos for Missing/Wrong Areas

**Current state**: All 185 areas have images stored in the `area-images` bucket. The user specifically mentions:
- **Al Jadaf**: Shows a single building instead of the full community
- **MBR District 11**: Shows no photo (or a broken one)
- Many other areas may have building-only photos instead of community aerial views

**Fix**: Update the `enrich-area-images` edge function's `CURATED_AREA_IMAGES` map with verified community-level aerial URLs for Al Jadaf, MBR District 11, and audit other areas. Then re-run the function to re-download and store corrected images.

| File | Change |
|------|--------|
| `supabase/functions/enrich-area-images/index.ts` | Add/update curated URLs for Al Jadaf (community aerial), MBR District 11, and other areas needing correction. Use verified Wikipedia/editorial sources showing full community views |

After deploying, invoke the edge function to process the updated areas.

---

### Issue 4: Binghatti Price Per Sqft Trend Showing -12% Decline

**Current state**: The `DeveloperAIAnalyzer` component has a `parsePricePerSqftMetrics` function (line 52-66) that extracts price data from AI-generated text. If the AI text contains a negative percentage, it generates a chart showing declining prices. The default fallback `annualGrowth` is `0.08` (8%), but if the AI returns something like "-12%", it faithfully charts a decline.

The problem is the AI analysis is generating incorrect/misleading price trend data for Binghatti. Binghatti operates across many areas (JVC, Business Bay, Downtown, etc.), each with different price/sqft -- averaging them creates misleading figures.

**Fix**: Add a guard in the chart function to never show a negative growth for developers, since developer-level price/sqft aggregations are inherently unreliable. Clamp the minimum growth to 0% and add a disclaimer.

| File | Change |
|------|--------|
| `src/components/developer/DeveloperAIAnalyzer.tsx` | In `parsePricePerSqftMetrics`, clamp `annualGrowth` to a minimum of `0`. Add a note in the chart footer that developer-level price/sqft varies by area and should not be interpreted as a market trend |

---

### Issue 5: Developer Page Divider -- Remove Highlighted Background Between Projects and DLD Widget

**Current state**: On the Binghatti developer page (line 412), the projects grid is wrapped in a `bg-gradient-to-br from-[#F5EBD7]/60 via-[#EDE0C8]/50 to-[#E2D4B8]/40 rounded-2xl border border-gold/30 p-6` container, creating a highlighted champagne box around the project cards.

The `SectionDivider` between the projects and the DLD Market Widget uses `variant="champagne"` which adds its own champagne gradient background.

The user wants:
- Remove the highlighted champagne box around the project cards (keep normal/transparent background)
- Keep only the gold divider line, but make it stronger/more visible
- No highlighted section background

**Changes**:

| File | Change |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Remove the `bg-gradient-to-br from-[#F5EBD7]/60...` wrapper div around the project grid (line 412). Keep the grid cards directly on the page background |
| `src/pages/DeveloperDetail.tsx` | For the SectionDivider, keep `variant="champagne"` but reduce vertical padding since both adjacent sections share the same background |

---

### Summary of Files to Modify

1. `src/components/MainLayout.tsx` -- auto-minimize chat on detail pages, pass project image
2. `src/components/chat/CollapsedChatButton.tsx` -- show project photo in icon frame
3. `src/components/AIChatWidget.tsx` -- accept and forward project image prop
4. `src/pages/AreaDetail.tsx` -- live project count query
5. `src/components/area-detail/AreaHeroSection.tsx` -- accept live project count
6. `supabase/functions/enrich-area-images/index.ts` -- update curated area image URLs
7. `src/components/developer/DeveloperAIAnalyzer.tsx` -- clamp price/sqft growth, add disclaimer
8. `src/pages/DeveloperDetail.tsx` -- remove highlighted project grid wrapper, strengthen divider

