

# Referral System Overhaul - Complete Implementation Plan

## Summary of Changes

This plan addresses all the issues you identified with the referral onboarding system and adds a comprehensive referral code tracking system.

---

## Part 1: Logo and Header Fixes (ReferralOnboarding.tsx)

### Issue 1: Duplicate "JBJ GLOBAL REAL ESTATE" Text
**Current State (Lines 253-261):**
- Monogram image (lg size: 100x100px)
- Text "JBJ GLOBAL REAL ESTATE" on two lines immediately under monogram (REMOVE THIS)
- Gold "Join the Referral Circle" title below

**Fix:**
- Delete lines 254-261 (the text span "JBJ GLOBAL REAL ESTATE")
- Keep only the monogram (increase size by 70%: from 100x100 to ~170x170px)
- Keep the gold "Join the Referral Circle" title

**Result:**
```text
[Large Monogram - 170x170px]
        
Join the Referral Circle
Earn 5% or 2.5% Commission
```

---

## Part 2: Signature Pad Fix (SignaturePad.tsx)

### Issue: "Confirm" button not saving signature
**Root Cause:** The `stopDrawing` function only calls `onSignatureChange` if `hasSignature` is true, but there's a race condition where `hasSignature` may not be set yet.

**Current Problem (Lines 93-100):**
```typescript
const stopDrawing = () => {
  setIsDrawing(false);
  // Problem: hasSignature may be stale in this closure
  if (canvas && hasSignature) {
    onSignatureChange(canvas.toDataURL('image/png'));
  }
};
```

**Fix:** 
1. Always trigger signature save when user stops drawing (if canvas has content)
2. Check canvas pixels for actual content instead of relying on state
3. Ensure `confirmSignature` function works reliably

---

## Part 3: Button Styling Fixes (ReferralOnboarding.tsx)

### Issue: Back button too small and wrong style

**Current State (Lines 555-590):**
- Back button uses `variant="outline"` with `flex-1`
- Submit button uses custom inline styling (not matching the Button component)
- Back button appears smaller due to inconsistent styling

**Fix:**
1. Change Back button to `variant="secondary"` with matching size
2. Change Submit button to use `<Button variant="primary">` 
3. Add `size="lg"` to both buttons for balanced appearance
4. Ensure both buttons have equal flex width

**Code Change:**
```tsx
{/* Back Button - Secondary */}
{currentStep > 1 && (
  <Button
    variant="secondary"
    size="lg"
    onClick={handleBack}
    className="flex-1"
  >
    <ArrowLeft className="w-4 h-4 mr-2" />
    Back
  </Button>
)}

{/* Submit Button - Primary */}
<Button
  variant="primary"
  size="lg"
  onClick={handleNext}
  disabled={isSubmitting}
  className="flex-1"
>
  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
  {currentStep === 3 ? 'Submit' : 'Continue'}
  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
</Button>
```

---

## Part 4: Contract Document Logo Fix (ReferralContract.tsx)

### Issue: Duplicate company name text in contract header

**Current State (Lines 28-33):**
```tsx
<img src={jbjFullLogoLight} alt="..." className="h-16 mx-auto mb-4" />
<h1>JBJ GLOBAL REAL ESTATE</h1>  // DUPLICATE - logo already has this text
<p>Real Estate Brokerage</p>
<p>Dubai, United Arab Emirates</p>
```

**Fix:**
1. Use the full logo (which includes "JBJ GLOBAL REAL ESTATE" text)
2. Increase logo size (from h-16 to h-28)
3. Remove the duplicate `<h1>JBJ GLOBAL REAL ESTATE</h1>` text
4. Keep only "Real Estate Brokerage" and location sublines

**Result:**
```text
[Large Full Logo with integrated company name - h-28]
Real Estate Brokerage
Dubai, United Arab Emirates
```

---

## Part 5: Success Message Update (ReferralOnboarding.tsx)

### Issue: Wrong success message text

**Current State (Lines 607-624):**
```tsx
<h2>Congratulations! 🎉</h2>
<p>Welcome to the JBJ Global Real Estate Referral Circle!</p>
...
<span>Application submitted for review</span>  // WRONG
```

**Fix:**
- Change "Application submitted for review" to "Your application has been successfully submitted"
- Anyone can be a referral partner (no review implication)

---

## Part 6: Admin Signature System (New Feature)

### New Components:
1. **ReferralAdminDashboard.tsx** - New page for managing referrals
2. **AdminSignatureUpload.tsx** - Component for uploading/saving company signature

### Database Changes:
- Add `company_signature_url` column to `site_settings` table (key: `referral_company_signature`)
- Add `company_stamp_text` column (value: "JBJ Global Real Estate L.L.C.")

### Contract Update:
- Display saved company signature in the "For JBJ Global Real Estate" section
- Add company stamp text below signature

---

## Part 7: Referral Code System (New Feature)

### Where Users Can Enter Referral Codes:

| Location | Implementation |
|----------|---------------|
| **Contact Form** | Add optional "Referral Code" field |
| **Property Inquiry** | Add "Referral Code" field when contacting about property |
| **Dedicated Page** | New `/redeem-referral` page for entering codes |

### Database Schema Changes:

**New table: `referral_code_usages`**
```sql
CREATE TABLE referral_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  referral_partner_id UUID REFERENCES referral_partners(id),
  used_by_name TEXT NOT NULL,
  used_by_email TEXT NOT NULL,
  used_by_phone TEXT,
  property_interest TEXT,
  source TEXT NOT NULL, -- 'contact_form', 'property_inquiry', 'dedicated_page'
  lead_id UUID REFERENCES leads(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'converted', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Admin Features (ReferralAdminDashboard):
1. **Search by referral code** - Instantly find the partner who owns this code
2. **View all code usages** - See every client who entered this code
3. **Track conversions** - Link code usage to actual property sales
4. **Upload company signature** - For auto-signing contracts

---

## Part 8: Store Form Data with Referral Code

### What Gets Stored:
- All referral partner form data (already stored in `referral_partners` table)
- The generated referral code (already stored)
- Contract signature (needs to be stored)

### Add to `referral_partners` table:
```sql
ALTER TABLE referral_partners ADD COLUMN signature_data_url TEXT;
ALTER TABLE referral_partners ADD COLUMN nationality TEXT;
ALTER TABLE referral_partners ADD COLUMN passport_number TEXT;
ALTER TABLE referral_partners ADD COLUMN contract_signed_at TIMESTAMPTZ;
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/ReferralOnboarding.tsx` | MODIFY | Fix logo, buttons, success message |
| `src/components/referral/SignaturePad.tsx` | MODIFY | Fix signature saving logic |
| `src/components/referral/ReferralContract.tsx` | MODIFY | Fix duplicate logo, add company signature |
| `src/pages/ReferralAdmin.tsx` | CREATE | Admin dashboard for referral management |
| `src/components/referral/AdminSignatureUpload.tsx` | CREATE | Company signature upload component |
| `src/pages/RedeemReferral.tsx` | CREATE | Dedicated page for entering referral codes |
| `src/pages/Contact.tsx` | MODIFY | Add referral code field |
| Database Migration | CREATE | Add new columns and table |

---

## Implementation Priority

1. **Phase 1 - UI Fixes** (Immediate)
   - Logo fixes in ReferralOnboarding.tsx
   - Button styling fixes
   - Signature pad fix
   - Contract document logo fix
   - Success message update

2. **Phase 2 - Database & Storage**
   - Add new columns to referral_partners
   - Create referral_code_usages table
   - Add site_settings for company signature

3. **Phase 3 - Admin Features**
   - ReferralAdminDashboard page
   - Company signature upload
   - Referral code search

4. **Phase 4 - Code Entry Points**
   - Add field to Contact form
   - Create RedeemReferral page
   - Add to property inquiry flows

