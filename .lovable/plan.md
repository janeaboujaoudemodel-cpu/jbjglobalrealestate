

## Fix Plan: Search Field Sizing, Saved Heart Color, Scroll Timing, Currency/Size Conversion, and Vertical Nav Updates

### 1. Reduce Search Field Width in Row 1 (Normal Load)

**File: `src/components/filters/FilterShortcutBar.tsx`**
- Change the search slot container from `flex-1` to `max-w-[220px]` (or similar) so the search input takes less space and the remaining sort pills + controls appear larger and more prominent
- Keep `min-w-0` for overflow protection

### 2. Make Saved Heart Icon Red

**File: `src/components/filters/FilterShortcutBar.tsx`**
- In `ConnectedSavedButton` (line 699), change the Heart icon to have `text-red-500 fill-red-500` styling so it appears as a solid red heart

### 3. Fix Scroll Timing for Fixed/Unfixed Filter Bar

**File: `src/pages/PropertiesReelly.tsx`**
- The current `IntersectionObserver` uses `rootMargin: "-80px 0px 0px 0px"` which creates a delay
- Reduce the rootMargin to `"-1px 0px 0px 0px"` so the transition triggers almost immediately when the sentinel leaves the viewport
- Add CSS `transition-none` or `will-change: transform` to the filter section to eliminate visual lag during the fixed/unfixed state change

### 4. Wire Currency and Size Unit Conversions to All Filters

**File: `src/components/filters/FilterShortcutBar.tsx`**
- When currency changes (via `ConnectedCurrencyButton`), convert `priceMin`/`priceMax` values from old currency to new currency using exchange rates
- When switching between sqft/sqm in the Price popover tabs (`priceMode`), convert `sizeMin`/`sizeMax` values accordingly (1 sqm = 10.764 sqft)
- Listen for `currencyChange` custom events and update filter values accordingly
- Add conversion logic: maintain a base AED value and convert display values based on selected currency

### 5. Update PropertiesVerticalNav

**File: `src/components/navigation/PropertiesVerticalNav.tsx`**

**Logo section:**
- Make monogram larger: change `w-8 h-8` to `w-12 h-12`
- Add "Real Estate" text under "JBJ GLOBAL" as a second line

**Navigation items - expand the list:**
Current: Off-plan, Market, Guides, Services, About, Contact
New list:
- Off-plan (Properties)
- Buy
- Sell
- Rent
- List Your Property
- Developers
- Projects
- AI Tools (Toolkit)
- Market Intelligence
- Guides
- Services
- About

**Footer section:**
- Make "Contact Support" bolder/larger with gold styling
- Add "Support Ticket" link below it
- Remove the small logo from the bottom

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/filters/FilterShortcutBar.tsx` | Reduce search slot width; red heart icon on Saved; wire currency/size conversion to price/size filters |
| `src/pages/PropertiesReelly.tsx` | Fix IntersectionObserver rootMargin for faster scroll toggle |
| `src/components/navigation/PropertiesVerticalNav.tsx` | Bigger monogram; add "Real Estate" under company name; expand nav items (Buy, Sell, Rent, List, Developers, Projects, AI Tools, Market Intelligence); replace footer logo with Support Ticket link |

### Technical Details

**Currency conversion rates (approximate, stored as constants):**
```
AED: 1, USD: 0.2723, EUR: 0.2512, GBP: 0.2145, INR: 22.73
```
When user switches currency, multiply existing price filter values by `newRate / oldRate`.

**Size conversion:**
```
1 sqm = 10.764 sqft
```
When toggling priceMode between sqft and sqm, convert sizeMin/sizeMax accordingly.

**Scroll fix:**
```
rootMargin: "-1px 0px 0px 0px"  // instead of "-80px"
```
This triggers the fixed state as soon as the sentinel scrolls past the top edge, eliminating the delay.

**Heart icon:**
```tsx
<Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
```

**Vertical nav expanded items:**
```ts
const NAV_ITEMS = [
  { label: "Off-plan", href: "/properties", icon: Building2 },
  { label: "Buy", href: "/buy", icon: Home },
  { label: "Sell", href: "/sell", icon: Tag },
  { label: "Rent", href: "/rent", icon: Key },
  { label: "List Property", href: "/list-property", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building },
  { label: "Projects", href: "/projects", icon: Layers },
  { label: "AI Tools", href: "/toolkit", icon: Cpu },
  { label: "Market Intel", href: "/market-intelligence", icon: BarChart3 },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "About", href: "/about", icon: Users },
];
```
