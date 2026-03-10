

## Plan: Fix Badge Overlap, Hover Text Wrapping & Enhance Horizontal Utility Bar

### 1. Fix Sale Status Badge Overlapping Favorite/Shortlist Buttons

**File:** `src/components/ProjectCard.tsx`

**Problem:** Both the sale status badge (line 280) and the favorite/shortlist buttons (line 188) use `top-3 right-3` positioning, causing them to stack on top of each other.

**Fix:**
- Move the favorite/shortlist buttons container down: change `top-3 right-3` to `top-3 right-3` but offset when sale status badge is present
- Better approach: Move the sale status badge to **top-left** (below dev logo if present, e.g. `top-16 left-3`) or to the **bottom-left** of the image area
- Simplest fix: Position sale status badge at `top-3 left-3` when dev logo is present (currently it goes to `top-3 right-3` and clashes). When dev logo exists, place badge below it at `top-16 left-3`

### 2. Fix ShortlistBadgeButton "Change" Text Wrapping

**File:** `src/components/ShortlistBadgeButton.tsx`

The "Change" / "Add Badge" text inside the button (line 109) can wrap to two lines on narrow cards. Fix by adding `whitespace-nowrap` to the button.

### 3. Enhance Horizontal Utility Bar with Premium Quick Links

**File:** `src/components/navigation/HorizontalUtilityBar.tsx`

Add premium quick-access links after the Search button, before the spacer. New items:

| Link | Icon | Route | Tooltip |
|------|------|-------|---------|
| Buy | `Building2` | `/properties?transaction=buy` | Browse Properties for Sale |
| Rent | `Key` | `/properties?transaction=rent` | Browse Rentals |
| Sell | `Tag` | `/listing-portal` | List Your Property |

These go as icon+label compact buttons (like the existing sqft toggle style) between Search and Favorites. Use gold styling consistent with existing items. Each is a small `Link` with icon + short text label visible at wider viewports.

Also add a gold-bordered **"My Account"** dropdown or direct link near the right side (currently just an icon — add a small label).

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/ProjectCard.tsx` | Fix badge z-positioning — sale status badge goes to left side below dev logo |
| `src/components/ShortlistBadgeButton.tsx` | Add `whitespace-nowrap` to prevent text wrapping |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Add Buy, Rent, Sell quick links with icons |

