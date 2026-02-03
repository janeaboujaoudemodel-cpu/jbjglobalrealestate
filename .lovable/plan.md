

# Comprehensive Mobile Menu, Currency Selector, Hero & UI Fixes
*Fixing 8 Critical Issues Across Header, Market Intelligence, and Navigation*

---

## Summary of Issues Identified

From my code analysis, I've identified the following problems that need to be fixed:

| # | Issue | Root Cause | Files Affected |
|---|-------|------------|----------------|
| 1 | Mobile menu touches/overlaps header | `SheetContent` uses `inset-y-0` (full height) + `mt-20` but z-index conflicts | `GlobalHeader.tsx`, `sheet.tsx` |
| 2 | Mobile menu logo/wordmark cropped | Container has fixed `max-h-[calc(100vh-80px)]` but content overflows on scroll | `GlobalHeader.tsx` |
| 3 | Guides need arrows/collapsibles | Mobile menu links are flat list, no expandable sections | `GlobalHeader.tsx` |
| 4 | Language icon labeled for Currency | `LanguageSwitcher` mobile label says "Select Language" but user expected separation | `LanguageSwitcher.tsx`, `GlobalHeader.tsx` |
| 5 | No currency selector in header | Currency selector doesn't exist globally - only inside SearchModule | New component needed |
| 6 | GuidedTour doesn't guide to hamburger | Tour shows features but doesn't actually open the hamburger | `GuidedTour.tsx` |
| 7 | Market Intelligence hero has no photo/video | Hero uses black gradient only, no asset | `MarketIntelligence.tsx` |
| 8 | Broken 404 links | MegaMenuBrokerHub links to `/broker-certifications` (wrong) | `MegaMenuBrokerHub.tsx`, `MegaMenuMore.tsx`, `GlobalHeader.tsx` |

---

## Implementation Plan

### Phase 1: Fix Mobile Menu Container (Logo/Wordmark Cropping)

**Problem:** The SheetContent applies `inset-y-0 right-0 h-full` from base styles, then `max-h-[calc(100vh-80px)] mt-20` from GlobalHeader. This creates a conflict where the menu both fills the screen AND has margin-top, causing overflow issues.

**Solution:** Override the sheet positioning to start BELOW the header properly.

**File:** `src/components/GlobalHeader.tsx` (line 612-615)

**Current:**
```tsx
<SheetContent
  side="right"
  className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l border-gold/30 w-[320px] p-0 flex flex-col max-h-[calc(100vh-80px)] mt-20 pt-0"
>
```

**Fixed:**
```tsx
<SheetContent
  side="right"
  className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l border-gold/30 w-[320px] p-0 flex flex-col !top-[128px] !h-[calc(100vh-128px)] !inset-y-auto"
>
```

This uses `!important` overrides to:
- Set `top` to 128px (header height)
- Set height to remaining viewport
- Remove the conflicting `inset-y-0`

---

### Phase 2: Add Collapsible Arrows for Guides/Hubs in Mobile Menu

**Problem:** Mobile menu shows flat lists without visual hierarchy. User wants collapsible sections with arrows.

**Solution:** Convert guide/hub sections to use `Collapsible` component with chevron icons.

**File:** `src/components/GlobalHeader.tsx` (lines 658-822)

**New Structure:**
```tsx
// Add new MobileMenuSection component
const MobileMenuSection = ({ 
  title, 
  links, 
  defaultOpen = false 
}: { 
  title: string; 
  links: Array<{ href: string; label: string; icon: any }>; 
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">
        <span>{title}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-gold transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
            >
              <link.icon className="w-4 h-4 text-gold" />
              {link.label}
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
```

Apply this pattern to:
- Buy section
- Rent section
- Projects section
- Developers section
- Areas section
- Services section
- Resources & Guides section
- Partners & Tools section

---

### Phase 3: Separate Language and Currency Icons

**Problem:** Language icon is doing double duty. User wants separate currency selector.

**Solution:** Create new `CurrencySwitcher` component and add it to mobile menu + desktop header.

**New File:** `src/components/CurrencySwitcher.tsx`

```tsx
import { DollarSign, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CURRENCIES = [
  { code: 'AED', symbol: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
];

const CURRENCY_KEY = 'jj_currency';

interface CurrencySwitcherProps {
  variant?: 'default' | 'mobile' | 'icon-only';
}

const CurrencySwitcher = ({ variant = 'default' }: CurrencySwitcherProps) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem(CURRENCY_KEY) || 'AED';
  });

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_KEY, code);
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: code }));
  };

  const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const isMobile = variant === 'mobile';
  const isIconOnly = variant === 'icon-only';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <button className="flex flex-col items-center gap-1.5 text-black hover:text-gold py-2 px-3 transition-colors">
            <DollarSign className="w-5 h-5 text-black" />
            <span className="text-[9px] text-black font-medium">Currency</span>
          </button>
        ) : isIconOnly ? (
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/10 group">
            <DollarSign className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all" />
          </button>
        ) : (
          <button className="h-10 px-3 text-gold hover:text-gold-light rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">{currentCurrency.code}</span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={12}
        className="z-[9999] min-w-[240px] rounded-xl shadow-2xl p-0 border-2 border-gold/40"
        style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
      >
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
        <div className="p-3">
          {CURRENCIES.map((curr) => (
            <DropdownMenuItem 
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 my-0.5 ${
                currency === curr.code 
                  ? 'bg-gold/15 border border-gold/30' 
                  : 'hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{curr.flag}</span>
                <span className={`text-sm font-semibold ${
                  currency === curr.code ? 'text-gold' : 'text-black'
                }`}>{curr.name} ({curr.symbol})</span>
              </span>
              {currency === curr.code && <Check className="w-4 h-4 text-gold" />}
            </DropdownMenuItem>
          ))}
        </div>
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySwitcher;
```

**Update GlobalHeader.tsx:**
- Import `CurrencySwitcher`
- Add to mobile Quick Actions Row (line 634):
```tsx
<LanguageSwitcher variant="mobile" />
<CurrencySwitcher variant="mobile" />
```

---

### Phase 4: Add Auto-Walkthrough + Help Button for Mobile Menu

**Problem:** User wants arrows pointing to Guides/Sitemap/Favorites on first visit, plus a persistent Help button.

**Solution:** Create `MobileMenuWalkthrough` component with step-by-step highlighting.

**New File:** `src/components/MobileMenuWalkthrough.tsx`

```tsx
// Highlights specific menu items with animated arrows
// Shows on first visit, dismissible
// "Help" button in menu footer to re-trigger

const WALKTHROUGH_KEY = 'jj_mobile_walkthrough_done';

interface WalkthroughStep {
  targetId: string;
  label: string;
  description: string;
}

const STEPS: WalkthroughStep[] = [
  { targetId: 'mobile-guides', label: 'Guides Library', description: 'Find all buyer, seller, tenant, and landlord guides here' },
  { targetId: 'mobile-favorites', label: 'Favorites', description: 'Save and compare your favorite properties' },
  { targetId: 'mobile-sitemap', label: 'Sitemap', description: 'Browse all pages on one screen' },
];

const MobileMenuWalkthrough = ({ 
  isOpen, 
  onComplete,
  onClose 
}: { 
  isOpen: boolean;
  onComplete: () => void;
  onClose: () => void;
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Renders overlay with arrow pointing to current target
  // "Next" / "OK" button to advance
  // Stores completion in localStorage
};
```

**Add to GlobalHeader mobile menu:**
- Add data-id attributes to key links: `data-id="mobile-guides"`, `data-id="mobile-favorites"`, `data-id="mobile-sitemap"`
- Add Help button at bottom of ScrollArea:
```tsx
<button 
  onClick={() => setShowWalkthrough(true)}
  className="flex items-center gap-2 px-4 py-3 text-sm text-gold hover:bg-gold/10 rounded-lg w-full"
>
  <HelpCircle className="w-4 h-4" />
  Help & Navigation Guide
</button>
```

---

### Phase 5: Generate & Add Market Intelligence Hero Asset

**Problem:** Market Intelligence page has no hero background, just black gradients.

**Solution:** Create an edge function to generate an AI hero image for Market Intelligence, then use it as the background.

**New Edge Function:** `supabase/functions/generate-hero-image/index.ts`

```typescript
// Calls Lovable AI with Gemini image model
// Prompt: "Professional, cinematic hero image for a real estate market intelligence dashboard. 
//          Abstract data visualization, dark background with gold accents, Dubai skyline silhouette,
//          flowing charts and graphs, premium financial aesthetic. 16:9 aspect ratio."
// Saves to storage bucket, returns URL
```

**Update Market Intelligence Page:**
```tsx
// src/pages/MarketIntelligence.tsx
<section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
  {/* Hero background image */}
  <img 
    src="/lovable-uploads/market-intelligence-hero.jpg"
    alt=""
    className="absolute inset-0 w-full h-full object-cover"
  />
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
  // ... rest of hero content
</section>
```

---

### Phase 6: Fix Broken 404 Links

**MegaMenuBrokerHub.tsx (line 25):**
```tsx
// WRONG:
{ name: 'Certifications', href: '/broker-certifications', icon: Award },
// CORRECT:
{ name: 'Certifications', href: '/services/broker-certification', icon: Award },
```

**MegaMenuMore.tsx (line 29):**
```tsx
// WRONG:
{ label: 'Complaint Procedure', href: '/complaint', icon: ClipboardCheck },
{ label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
// CORRECT:
{ label: 'Complaint Procedure', href: '/services/complaint-procedures', icon: ClipboardCheck },
{ label: 'Testimonials', href: '/services/testimonials', icon: MessageCircle },
```

**GlobalHeader.tsx mobile links (line 389-393):**
```tsx
// WRONG:
{ href: "/complaint", label: "Complaint Procedure", icon: ClipboardCheck },
{ href: "/testimonials", label: "Testimonials", icon: Users },
// CORRECT:
{ href: "/services/complaint-procedures", label: "Complaint Procedure", icon: ClipboardCheck },
{ href: "/services/testimonials", label: "Testimonials", icon: Users },
```

**Mobile Area Links (line 366-369):**
```tsx
// WRONG: /areas/downtown-dubai (route doesn't exist)
// CORRECT: /area/downtown-dubai (uses :slug pattern)
{ href: "/area/downtown-dubai", label: "Downtown Dubai", icon: MapPin },
{ href: "/area/dubai-marina", label: "Dubai Marina", icon: MapPin },
{ href: "/area/palm-jumeirah", label: "Palm Jumeirah", icon: MapPin },
{ href: "/area/business-bay", label: "Business Bay", icon: MapPin },
```

**Mobile Developer Links (line 374-377):**
```tsx
// WRONG: /developers/emaar (route doesn't exist)
// CORRECT: /developer/emaar (uses :slug pattern)
{ href: "/developer/emaar", label: "Emaar Properties", icon: Building2 },
{ href: "/developer/damac", label: "DAMAC Properties", icon: Building2 },
{ href: "/developer/sobha", label: "Sobha Realty", icon: Building2 },
```

---

### Phase 7: Create Missing Philanthropy Page

**Problem:** `/philanthropy` is linked but page doesn't exist.

**New File:** `src/pages/Philanthropy.tsx`

```tsx
// Placeholder page with:
// - Hero section (jj-hero-fullscreen)
// - "Coming Soon" content
// - Contact CTA
// - Footer
```

**Add Route in App.tsx:**
```tsx
<Route path="/philanthropy" element={<Philanthropy />} />
```

---

## Files to Create/Modify Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/CurrencySwitcher.tsx` | CREATE | New currency selector component |
| `src/components/MobileMenuWalkthrough.tsx` | CREATE | Walkthrough/help overlay |
| `src/pages/Philanthropy.tsx` | CREATE | Missing page placeholder |
| `src/components/GlobalHeader.tsx` | MODIFY | Fix SheetContent, add collapsibles, add currency switcher, fix 404 links |
| `src/components/header/MegaMenuBrokerHub.tsx` | MODIFY | Fix `/broker-certifications` link |
| `src/components/header/MegaMenuMore.tsx` | MODIFY | Fix `/complaint` and `/testimonials` links |
| `src/pages/MarketIntelligence.tsx` | MODIFY | Add hero background image |
| `src/App.tsx` | MODIFY | Add Philanthropy route |
| `supabase/functions/generate-hero-image/index.ts` | CREATE | AI image generation for Market Intelligence hero |

---

## Technical Notes

### Currency System Architecture
- Store selected currency in `localStorage` with key `jj_currency`
- Dispatch `currencyChange` CustomEvent when changed
- Components like `ProjectCard`, `SearchModule`, `PropertyFilters` already have currency conversion logic
- They will listen to the global event to update their display

### Mobile Menu Walkthrough Flow
1. First visit: After 2 seconds, if `jj_mobile_walkthrough_done` not set, open hamburger
2. Show animated arrow pointing to "Guides Library"
3. User taps "Next" → arrow moves to "Favorites"
4. User taps "Next" → arrow moves to "Sitemap"
5. User taps "Done" → localStorage marked, walkthrough dismisses
6. "Help" button in menu footer can re-trigger anytime

### Hero Image Generation
- Uses `google/gemini-3-pro-image-preview` for higher quality
- Generates 1920x1080 cinematic image
- Uploads to Supabase storage
- Returns public URL for use in `<img>` tag

---

## Execution Order

1. Fix mobile menu container positioning (prevents cropping)
2. Add collapsible sections with arrows
3. Create CurrencySwitcher component
4. Add currency to mobile + desktop header
5. Fix all 404 broken links
6. Create Philanthropy placeholder page
7. Generate Market Intelligence hero image
8. Create MobileMenuWalkthrough component
9. Test end-to-end on mobile/tablet

