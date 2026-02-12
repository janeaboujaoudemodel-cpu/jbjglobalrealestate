
## Fix Filters, Prices, Payment Plans, Icons, and Visual Issues

### 1. Fix Binghatti Skyblade Price (Database Correction)

**Problem:** "Binghatti Skyblade" (id: `2e08730e`) has `price_from: 13,389,999` but the correct starting price is approximately AED 1,600,000.

**Solution:** Update the database record with the correct price. Also identify and fix the duplicate entry "Binghatti Skyblade Binghatti" (id: `2c43a30d`) which has null price and appears to be a duplicate.

**SQL Migration:**
```sql
UPDATE projects SET price_from = 1600000 WHERE id = '2e08730e-dbf9-4f36-89bf-3053ecacff59';
DELETE FROM projects WHERE id = '2c43a30d-138d-432e-b90a-67425446f561';
```

---

### 2. Payment Plan Badge Not Showing on Listing Cards

**Problem:** Only 91 out of 2,410 projects have `payment_breakdown` data. The code in `ProjectCard.tsx` (lines 359-375) correctly reads `payment_breakdown` and displays percentages -- but most projects simply lack this data in the database.

**Solution:** The payment plan badge code is correct. The issue is missing data. We will create a backend function that extracts payment plan data from project descriptions (many contain text like "60/40" or "80/20") and populates `payment_breakdown` for all projects where it can be reliably parsed. This will dramatically increase the number of cards showing the badge.

**File:** New edge function `extract-payment-plans/index.ts` that:
- Scans all projects with null/empty `payment_breakdown`
- Parses descriptions and other text fields for payment plan patterns
- Updates the database with structured `payment_breakdown` JSON

---

### 3. FilterShortcutBar Icons Too Small

**Problem:** The utility buttons (Saved, Currency, Mode) in `UtilityButtons` use `w-3.5 h-3.5` icons inside very compact `px-2.5 py-1.5` pills with `text-[11px]` font. This makes them appear tiny and hard to interact with.

**Solution:** Increase icon sizes from `w-3.5 h-3.5` to `w-4 h-4`, and increase pill padding from `px-2.5 py-1.5` to `px-3 py-2` with `text-xs` font size.

**File:** `src/components/filters/FilterShortcutBar.tsx`
- Line 604-608: Update `btnBase` padding and font size
- Lines 644, 706: Update icon sizes in Saved and Mode buttons
- Row 1 pill icons (Map, Sort): Update from `w-3.5 h-3.5` to `w-4 h-4`

---

### 4. Fixed Filter Bar Not Edge-to-Edge / Background Mismatch

**Problem:** The fixed portal filter bar (lines 367-385 of `DeveloperDetail.tsx`) uses `mx-1 sm:mx-2 md:mx-3 lg:mx-4` margins and has `border-t-0 rounded-none` but still shows a visible gap and potential background mismatch with the page.

**Solution:** Remove horizontal margins from the fixed bar so it spans full viewport width, and ensure the background gradient matches the page's champagne theme seamlessly.

**File:** `src/pages/DeveloperDetail.tsx`
- Line 368: Change margins to `mx-0` for true edge-to-edge
- Verify the gradient matches the inline filter bar

---

### 5. Champagne Layer Behind Listing Cards + CTA Button

**Problem:** Project listing cards and the "Explore All X Projects" CTA sit directly on the page background without a distinct container layer.

**Solution:** Wrap the project grid and the CTA button in a champagne-gradient container with rounded corners and a subtle border, creating visual separation from the background and the DLD widget below.

**File:** `src/pages/DeveloperDetail.tsx`
- Wrap lines 401-423 (grid + CTA) in a new `div` with champagne gradient background, rounded corners, padding, and gold border

---

### 6. Divider Between "Explore All" and DLD Market Intelligence

**Problem:** The `SectionDivider` at line 460 uses `bg="bg-transparent"` which makes it nearly invisible.

**Solution:** Replace with a visible champagne-background divider with a stronger gold line. Use `variant="champagne"` and remove the `bg` override.

**File:** `src/pages/DeveloperDetail.tsx`
- Line 460: Change from `<SectionDivider fullWidth bg="bg-transparent" />` to `<SectionDivider variant="champagne" />`

---

### Summary of All File Changes

| File | Change |
|------|--------|
| Database migration | Fix Skyblade price to 1.6M, remove duplicate |
| `src/components/filters/FilterShortcutBar.tsx` | Increase icon sizes and pill padding |
| `src/pages/DeveloperDetail.tsx` | Edge-to-edge fixed bar, champagne layer around cards, fix divider |
| `supabase/functions/extract-payment-plans/index.ts` | New: parse payment plans from descriptions |
