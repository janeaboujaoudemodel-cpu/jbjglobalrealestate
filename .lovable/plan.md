
# Comprehensive Fixes Plan

## Issues to Address

### 1. Add "Loyalty" Value Card to Company Profile
**Current State:** The values array has 5 items: Clarity, Integrity, Discipline, Responsiveness, Accountability
**Fix:** Add a 6th value "Loyalty" after Responsiveness

**File:** `src/pages/CompanyProfile.tsx` (lines 91-97)
```typescript
values: [
  { title: "Clarity", description: "Information presented accurately, without exaggeration." },
  { title: "Integrity", description: "Advice aligned with client objectives, not incentives." },
  { title: "Discipline", description: "Consistent processes and risk-aware execution." },
  { title: "Responsiveness", description: "Direct access and timely communication." },
  { title: "Loyalty", description: "Long-term commitment to client success and trust." },  // NEW
  { title: "Accountability", description: "Responsibility throughout the transaction lifecycle." }
]
```

---

### 2. Fix Working Hours
**Current State:** 
- Company Profile: `"Sunday–Thursday, 9:00–6:00"` (line 209)
- Contact page: `"Sun–Thu | 9AM–6PM UAE"` (line 278)

**Required:** Monday to Sunday, 9AM to 9PM

**Files to Update:**

1. `src/pages/CompanyProfile.tsx` (line 209):
```typescript
workingHours: "Monday–Sunday, 9:00 AM – 9:00 PM"
```

2. `src/pages/Contact.tsx` (line 278):
```typescript
value: "Mon–Sun | 9AM–9PM UAE",
```

---

### 3. Make Website JBJ.AE All Capital Everywhere
**Current State:** Found 91 files with `jbj.ae` - mixed case usage (e.g., `www.jbj.ae`, `jbj.ae`, `JBJ.ae`)

**Required:** Always `JBJ.AE` in all caps

**Key Files to Update:**

1. `src/pages/CompanyProfile.tsx` (line 207):
```typescript
website: "WWW.JBJ.AE",  // was www.jbj.ae
```

2. `src/config/ai-brain-training.ts` (line 153):
```typescript
website: 'WWW.JBJ.AE',  // was www.JBJ.ae
```

3. `src/components/executive/ExecutiveChatPanel.tsx` (line 198):
```typescript
🌐 Website: WWW.JBJ.AE
```

4. `src/components/home/CTABand.tsx` (line 17):
```typescript
website: "https://JBJ.AE",
```

5. `src/components/crm/BulkWhatsAppModal.tsx` (line 47):
```typescript
🔗 https://JBJ.AE
```

6. `src/pages/MarketReport.tsx` - Multiple occurrences need updating to `JBJ.AE`

7. All email addresses should also follow the existing FULL CAPS rule: `CONTACT@JBJ.AE`, `PRIVACY@JBJ.AE`, etc.

---

### 4. Align "Ready to Connect" Cards with "Get Started" Title
**Current State:** The section has title "Ready to Connect?" with 3 CTA cards below in a grid

**Issue:** Cards may not be visually aligned with the title

**File:** `src/pages/CompanyProfile.tsx` (lines 1208-1239)

**Fix:** Add consistent max-width container and ensure title and cards share the same alignment:
```tsx
<SectionShell>
  <div className="max-w-6xl mx-auto">  {/* Add consistent container */}
    <div className="text-center mb-12">
      <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Get Started</span>
      <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
        Ready to Connect?
      </h2>
    </div>

    <motion.div
      className="grid md:grid-cols-3 gap-6"  {/* Remove max-w-6xl here since parent has it */}
      ...
    >
```

---

### 5. Fix Hamburger Menu Icon & Text Alignment
**Current State:** Quick Actions Row (lines 638-661) - icons and text may not be perfectly aligned

**Issue:** "My Account" text not aligned under the icon, icons not same size/line

**File:** `src/components/GlobalHeader.tsx` (lines 638-661)

**Fix:** Standardize all quick action buttons with fixed width, centered content:
```tsx
{/* Quick Actions Row - All aligned, all black, no shadows */}
<div className="flex items-center justify-evenly px-4 py-3 border-b border-gold/20">
  <button
    className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
    onClick={...}
  >
    <Search className="w-5 h-5" />
    <span className="text-[9px] font-medium text-center">Search</span>
  </button>
  <Link
    to={user ? "/my-account" : authHref}
    onClick={() => setMobileMenuOpen(false)}
    className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
  >
    <User className="w-5 h-5" />
    <span className="text-[9px] font-medium text-center whitespace-nowrap">{user ? "Account" : "Sign In"}</span>
  </Link>
  <LanguageSwitcher variant="mobile" />
  <CurrencySwitcher variant="mobile" />
</div>
```

Also update `LanguageSwitcher.tsx` and `CurrencySwitcher.tsx` mobile variants to use same fixed width:
```tsx
// LanguageSwitcher.tsx (lines 27-35)
<button
  type="button"
  className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
  aria-label={t('header.language')}
>
  <Globe className="w-5 h-5" />
  <span className="text-[9px] font-medium text-center">Language</span>  {/* Shorter label */}
</button>

// CurrencySwitcher.tsx (lines 52-56)
<button className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors">
  <DollarSign className="w-5 h-5" />
  <span className="text-[9px] font-medium text-center">Currency</span>
</button>
```

---

### 6. Fix Help & Navigation Guide Showing Black Pages
**Current State:** Clicking "Help & Navigation Guide" in hamburger menu triggers `setShowWalkthrough(true)` which opens `MobileMenuWalkthrough` component

**Issue:** Shows black/blank page - likely the walkthrough is looking for elements that don't exist or overlay is blocking

**File:** `src/components/MobileMenuWalkthrough.tsx`

**Root Cause:** The walkthrough targets elements by `data-walkthrough-id` (mobile-guides, mobile-favorites, mobile-sitemap) which may not exist in the current menu structure.

**Fix Options:**
1. Add the required `data-walkthrough-id` attributes to menu items
2. Or show `GuidedTour` instead (which is a modal, not walkthrough)

**Recommended Fix:** Switch to using `GuidedTour` component instead of `MobileMenuWalkthrough`:
```tsx
// In GlobalHeader.tsx (lines 1077-1092)
// Change from MobileMenuWalkthrough to GuidedTour
import GuidedTour from "@/components/GuidedTour";

// Replace MobileMenuWalkthrough with:
<GuidedTour
  isOpen={showWalkthrough}
  onClose={() => setShowWalkthrough(false)}
/>
```

---

### 7. Add Monogram Logo Under Help & Navigation Guide
**Current State:** The "Help & Navigation Guide" button has no logo beneath it

**User Question:** Should we add the monogram centered and bigger, or leave it without?

**Recommendation:** Adding the monogram would provide visual closure and reinforce branding. It should be:
- Centered below the Help & Navigation Guide button
- Smaller than the header monogram (about 48x48 or 56x56 pixels)
- Use the light background version (`jbjMonogramLightBg`)

**File:** `src/components/GlobalHeader.tsx` (after line 1083)

**Implementation:**
```tsx
{/* Help & Navigation Guide Button */}
<div className="h-px bg-gold/20 my-2" />
<button
  onClick={() => setShowWalkthrough(true)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold hover:bg-gold/10 transition-colors rounded-lg w-full text-left"
>
  <HelpCircle className="w-4 h-4 text-gold" />
  Help & Navigation Guide
</button>

{/* Monogram Branding Footer */}
<div className="mt-4 pt-4 border-t border-gold/20 flex justify-center">
  <img 
    src={jbjMonogramLightBg}
    alt="JBJ Global Real Estate"
    className="w-12 h-12 object-contain opacity-60"
  />
</div>
```

---

## Summary of Files to Modify

1. **`src/pages/CompanyProfile.tsx`**
   - Add "Loyalty" to values array
   - Update working hours to "Monday–Sunday, 9:00 AM – 9:00 PM"
   - Update website to "WWW.JBJ.AE"
   - Add max-width container around "Ready to Connect" section for alignment

2. **`src/pages/Contact.tsx`**
   - Update business hours to "Mon–Sun | 9AM–9PM UAE"

3. **`src/components/GlobalHeader.tsx`**
   - Fix quick actions alignment with fixed widths
   - Replace MobileMenuWalkthrough with GuidedTour
   - Add monogram below Help & Navigation Guide

4. **`src/components/LanguageSwitcher.tsx`**
   - Update mobile variant with fixed width and shorter label

5. **`src/components/CurrencySwitcher.tsx`**
   - Update mobile variant with fixed width

6. **Global JBJ.AE Capitalization** (multiple files):
   - `src/config/ai-brain-training.ts`
   - `src/components/executive/ExecutiveChatPanel.tsx`
   - `src/components/home/CTABand.tsx`
   - `src/components/crm/BulkWhatsAppModal.tsx`
   - `src/pages/MarketReport.tsx`
   - Other files with lowercase `jbj.ae` references

---

## Testing Checklist

- [ ] Company Profile shows 6 value cards including "Loyalty"
- [ ] Working hours shows "Monday–Sunday, 9:00 AM – 9:00 PM" on Company Profile
- [ ] Contact page shows "Mon–Sun | 9AM–9PM UAE"
- [ ] Website displayed as "JBJ.AE" or "WWW.JBJ.AE" everywhere (all caps)
- [ ] "Ready to Connect" cards aligned with section title
- [ ] Hamburger menu quick actions row: icons aligned, labels centered, same widths
- [ ] Help & Navigation Guide opens properly (no black page)
- [ ] Monogram appears below Help & Navigation Guide in hamburger menu
