
# Header Navigation & Mega Menu Fixes

## Issues Identified

### 1. Hover Behavior - Menu Disappearing/Not Clicking
**Root Cause:** There's a gap between the navigation pill buttons and the mega menu panels. When the mouse moves from the button to the panel, it crosses empty space which triggers `handleMegaMenuLeave` and starts a 220ms timeout to close the menu.

**Current Code Problem (GlobalHeader.tsx lines 87-93):**
```tsx
const handleMegaMenuLeave = () => {
  if (pinnedMenu) return;
  megaMenuTimeoutRef.current = setTimeout(() => {
    setActiveMegaMenu(null);
  }, 220);  // Too short for moving to panel
};
```

**Also:** The mega menu panels are positioned inside a `<div className="relative z-50">` which doesn't extend the hover zone from the buttons to the panels.

---

### 2. "More" Menu Scrolling Issue
**Current State:** The More menu has 4 columns with these link counts:
- Column 1 (About & Company): 11 links
- Column 2 (Resources & Guides): 12 links
- Column 3 (Partners & Tools): 11 links
- Column 4 (Legal & Trust): 7 links

The last items (Philanthropy, Investor Education, Landlord Portal, Broker FAQ) require scrolling to see.

**Fix Required:**
1. Reduce padding and spacing to fit all content
2. Move overflow items from longer columns to fill the gap in Column 4 (Legal & Trust)
3. Set a fixed max-height that fits within viewport without scrolling

---

### 3. Search Menu Issues
**Current State (MegaMenuSearch.tsx):**
- Quick Links column has 13 links, causing vertical overflow
- Section divider cuts through Careers line
- Large gap below contact section unused
- Search placeholder text is small

**Fix Required:**
1. Move items after Careers to fill contact section space
2. Remove excess links from Quick Links
3. Enlarge search placeholder text
4. Fix divider alignment
5. Reduce overall height

---

### 4. "View All Developers/Areas" CTA Title Too Small
**Current State (MegaMenuDevelopers.tsx lines 83-90):**
The emphasis link uses `compact` mode which makes the title small despite the card having a large gold background.

**Fix Required:**
Increase title text size in emphasis links or add a special class for these CTAs.

---

### 5. Section Title Divider Alignment
Previously fixed with `min-h-[36px]` on `MegaMenuSectionTitle`, but need to verify this is consistently applied.

---

### 6. Security Hardening
**Current Security Findings:**
- `SUPA_rls_policy_always_true`: Overly permissive RLS policies detected
- `rental_listings_landlord_exposure`: Landlord contact info in plaintext
- `crm_leads_assignment_gaps`: Complex RLS policies may allow viewing unassigned leads

---

## Solution

### Phase 1: Fix Hover Behavior (GlobalHeader.tsx)

**Changes:**
1. **Increase hover timeout from 220ms to 350ms** - More time to move mouse between elements
2. **Add a "bridge zone"** - Invisible div connecting nav buttons to mega menu panels
3. **Ensure mega menu panel extends hover zone** - Add `onMouseEnter` to clear any pending close timeout

```tsx
// Line 90: Increase timeout
megaMenuTimeoutRef.current = setTimeout(() => {
  setActiveMegaMenu(null);
}, 350);  // Was 220ms

// Lines 1101-1118: Wrap mega menus with proper hover zone
{activeMegaMenu && (
  <div 
    className="absolute left-0 right-0 z-50"
    style={{ top: '100%', paddingTop: '8px' }}  // Bridge gap
    onMouseEnter={() => {
      if (megaMenuTimeoutRef.current) {
        clearTimeout(megaMenuTimeoutRef.current);
        megaMenuTimeoutRef.current = null;
      }
    }}
    onMouseLeave={handleMegaMenuLeave}
  >
    {activeMegaMenu === 'buy' && <MegaMenuBuy onClose={closeMegaMenu} />}
    {/* ... other menus */}
  </div>
)}
```

---

### Phase 2: Fix "More" Menu (MegaMenuMore.tsx)

**Current Column Counts:**
- About & Company: 11
- Resources & Guides: 12
- Partners & Tools: 11
- Legal & Trust: 7

**Redistribution Strategy:**
Move 4 items from longest columns to Legal & Trust:
- Move "Broker FAQ" from Column 2 to Column 4 (already there, but ensure no duplicate)
- Move "Investor FAQ" from Column 2 to Column 4 (already there)
- Keep all 4 columns balanced at ~10 items each

**Additional Changes:**
1. Reduce container padding: `py-4 lg:py-5` (from `py-6 lg:py-8`)
2. Reduce link spacing: `space-y-0` (from `space-y-0.5`)
3. Remove `maxHeight: 'calc(100vh - var(--header-height, 128px) - 24px)'` and `overflowY: auto` from MegaMenuShell (only for More menu)

---

### Phase 3: Fix Search Menu (MegaMenuSearch.tsx)

**Changes:**
1. **Reduce Quick Links** - Remove items after Careers (My Favorites, AI Tools, Property Map, Compare Properties, AI Home Finder)
2. **Move contact section up** - No wasted vertical space
3. **Enlarge search placeholder** - Change `placeholder` font size from default to `text-base`
4. **Fix divider** - Ensure it doesn't cut through any items
5. **Reduce overall padding** - `py-5 lg:py-6` (from `py-6 lg:py-7`)

---

### Phase 4: Fix "View All" CTA Size (mega-menu-primitives.tsx)

**Changes to MegaMenuIconLink:**
When `emphasis={true}`, use larger title text:
```tsx
<span className={cn(
  "block font-bold transition-colors duration-300",
  emphasis
    ? "text-black group-hover:text-black text-base"  // Larger for CTAs
    : "text-black group-hover:text-gold",
  compact && !emphasis ? "text-sm" : "text-sm"
)}>
```

Also update icon container for emphasis to be slightly larger:
```tsx
compact && !emphasis ? "w-8 h-8" : emphasis ? "w-10 h-10" : "w-10 h-10"
```

---

### Phase 5: Security Hardening

1. **Run full security scan** to identify all RLS policy issues
2. **Review and tighten RLS policies** on:
   - `rental_listings` - Add encryption or restrict landlord contact visibility
   - `crm_leads` - Simplify policy conditions to prevent unassigned lead access
3. **Add frontend security reinforcement** via SecurityShield component (already exists)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/GlobalHeader.tsx` | Fix hover behavior - increase timeout, add bridge zone |
| `src/components/header/MegaMenuMore.tsx` | Redistribute links, reduce padding, remove scroll |
| `src/components/header/MegaMenuSearch.tsx` | Reduce links, move contact up, enlarge search text |
| `src/components/header/mega-menu-primitives.tsx` | Increase emphasis link title size, fix MegaMenuShell for no-scroll option |
| Database Migration | Tighten RLS policies for rental_listings and crm_leads |

---

## Technical Details

### MegaMenuMore.tsx - New Link Distribution

**Column 1 - About & Company (10 items):**
About Us, Meet the Team, Our Brokers, Careers, Our Awards, Press Kit, Company Profile, Contact Us, Complaint Procedure, Testimonials

**Column 2 - Resources & Guides (10 items):**
Guides Library, Market Intelligence, News & Insights, FAQ, Buyer Guide, Seller Guide, Rent Guide, Tenant Guide, Landlord Guide, Golden Visa Guide

**Column 3 - Partners & Tools (10 items):**
Partners Hub, Mortgage Partners, Legal Partners, Company Setup, Visa Services, Referral Partner, AI Home Finder, Property Map, Compare Properties, Sell Your Property

**Column 4 - Legal & Trust (9 items):**
Terms of Service, Privacy Policy, Cookies Policy, Trust & Audit Center, Intellectual Property, Investor FAQ, Broker FAQ, Investor Education, Landlord Portal

**Total: 39 items (down from 41 by removing duplicates)**

### MegaMenuSearch.tsx - Simplified Quick Links

**Quick Links (9 items only):**
About Us, Meet the Team, Our Brokers, Area Guides, Developers, Buyer Guide, Seller Guide, Careers, AI Home Finder

**Contact section unchanged** - placed in proper position to fill space

---

## Visual Result

| Component | Before | After |
|-----------|--------|-------|
| Hover behavior | Menu disappears when moving mouse | Smooth transitions with extended hover zone |
| More menu | Requires scrolling, unbalanced columns | All 39 links visible without scrolling |
| Search menu | Overflow links, cut divider | Clean layout, balanced sections |
| View All CTAs | Small text in large card | Larger, balanced text fills card properly |
| Section dividers | Sometimes misaligned | Perfectly aligned at same vertical position |
