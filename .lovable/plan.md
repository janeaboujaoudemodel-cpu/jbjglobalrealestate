

## Mortgage Calculator Layout & Content Update Plan

### Overview
This plan addresses three main requests:
1. Update the "Mortgage Advisor" section text to mention **licensed partners**
2. Remove the CTA button from inside the calculator component and move it to the bottom of the champagne section
3. Fix the overall layout alignment

---

### Changes to Make

#### 1. Update Advisor Section Text (MortgageCalculatorPage)

**Current text:**
> "Our calculator gives you instant estimates, but for personalized guidance, our dedicated mortgage advisors partner with leading UAE banks to secure the best rates and terms for your property investment."

**Updated text:**
> "Our calculator gives you instant estimates, but for personalized guidance, **through our licensed partners**, we connect you with dedicated mortgage advisors who work with leading UAE banks to secure the best rates and terms for your property investment."

Also update the title from "Prefer a Mortgage Advisor?" to "Prefer a Mortgage Advisor **Through Our Licensed Partners**?"

**File:** `src/pages/MortgageCalculator.tsx` (lines 85-89)

---

#### 2. Remove CTA Button from Calculator Component

Remove the "Request Mortgage Partner Introduction" button and its container from inside `MortgageCalculator.tsx`.

**Current location:** Lines 367-378 (inside the Results Section)
```tsx
{/* CTA - Premium Gold Button - Centered at bottom */}
<div className="pt-6 mt-4 border-t border-gold/20 flex justify-center">
  <a href={INQUIRY_FORM_URL} ...>
    <Button ...>
      Request Mortgage Partner Introduction
    </Button>
  </a>
</div>
```

**Action:** Delete this entire block from the component.

**File:** `src/components/MortgageCalculator.tsx`

---

#### 3. Add CTA Button to Bottom of Champagne Section (Calculator Hero Area)

Add the "Request Mortgage Partner Introduction" button at the **bottom of the Hero Section** (the champagne layer containing the calculator), positioned **under the Loan Term section, centered**.

**New placement:** After `<MortgageCalculator />` and before the closing `</div>` of the Hero Section (around line 70-71).

**New code to add:**
```tsx
{/* CTA Button - Centered at bottom of calculator section */}
<div className="mt-8 lg:mt-12 flex justify-center">
  <a 
    href={INQUIRY_FORM_URL} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="block w-full max-w-md"
  >
    <Button 
      variant="primary" 
      className="w-full h-14 text-base font-semibold group shadow-lg hover:shadow-[0_14px_45px_rgba(200,167,102,0.4)] hover:-translate-y-1 transition-all duration-300"
    >
      Request Mortgage Partner Introduction
      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
    </Button>
  </a>
</div>
```

**Additional imports needed:**
- `ArrowRight` from `lucide-react`
- `Button` from `@/components/ui/button`
- `CONTACT_INFO` from `@/constants/stats` (for `INQUIRY_FORM_URL`)

**File:** `src/pages/MortgageCalculator.tsx`

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/MortgageCalculator.tsx` | Remove CTA button block (lines 367-378) |
| `src/pages/MortgageCalculator.tsx` | 1. Add imports for ArrowRight, Button, CONTACT_INFO<br>2. Update advisor section title to mention "licensed partners"<br>3. Update advisor description text to mention "through our licensed partners"<br>4. Add CTA button after the `<MortgageCalculator />` component |

---

### Visual Layout After Changes

```text
┌─────────────────────────────────────────────────────┐
│  HERO SECTION (Champagne Layer)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Title: Mortgage Calculator                    │  │
│  │ Description text...                           │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ CALCULATOR COMPONENT                          │  │
│  │  ┌─────────────────┬─────────────────────┐    │  │
│  │  │ Inputs:         │ Results:            │    │  │
│  │  │ • Property Price│ • Monthly Payment   │    │  │
│  │  │ • Down Payment  │ • Breakdown Cards   │    │  │
│  │  │ • Interest Rate │ • Payment Visual    │    │  │
│  │  │ • Loan Term     │ • Disclaimer        │    │  │
│  │  └─────────────────┴─────────────────────┘    │  │
│  │  (CTA BUTTON REMOVED FROM HERE)               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ [Request Mortgage Partner Introduction] ←NEW  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

