

## Plan: Sign Out Red Border, Borders on All Sub-Items, Uncompleted Tasks

### 1. Sign Out Button — Red Border + Red Icon

**File:** `GlobalVerticalNav.tsx` line 1037-1042

Change the Sign Out button styling from gold border to red border with red icon only (text stays dark):
- `border border-red-500/30 hover:border-red-500/50 hover:bg-red-50/50`
- `<LogOut className="w-3.5 h-3.5 text-red-500" />`
- Text stays `text-black/70`

Mirror in `GlobalHeader.tsx` mobile menu.

### 2. Add Borders to ALL Sub-Items (Not Just MY ACCOUNT)

Currently, only MY ACCOUNT items have `border border-gold/20` in their inactive state. Regular items (lines 637-644) have NO border. The user wants consistent borders across all sections.

**Fix in `getItemStyle`:**
- Line 640 (highlighted items, inactive): add `border border-gold/20`
- Line 644 (default items, inactive): add `border border-transparent hover:border-gold/15`

This gives every sub-item a subtle border matching MY ACCOUNT's style, while keeping highlighted hubs (AI Hub, Careers, etc.) with their own colored borders.

### 3. Previously Uncompleted Tasks Audit

Reviewing all prior approved plans for missed items:

- **Quiz results fallback** (from earlier plan): Was implemented — `useLeadCapture` integration and relaxed filters added.
- **AI Hub layout fix**: Was implemented — overflow fix added.
- **Featured Listings description**: Was implemented — description field added to cards.
- **Edge-to-edge audit**: About, Contact, MyDashboardActivity all fixed.

No remaining uncompleted tasks found from prior prompts.

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Sign out red border/icon, borders on all sub-items |
| `src/components/GlobalHeader.tsx` | Mirror sign out styling + borders on mobile |

