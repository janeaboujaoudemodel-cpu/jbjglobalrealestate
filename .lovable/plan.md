

## Footer Button Styling Fix - Toolkit Hub & Mortgage Calculator

### Current Issue

The **Toolkit Hub** and **Mortgage Calculator** buttons in the footer have very light/faint backgrounds (`bg-gold/5`) compared to other tools which have more visible filled backgrounds (`bg-[color]-50/50`).

### Current Styling

| Button | Background | Text | Result |
|--------|------------|------|--------|
| Toolkit Hub | `bg-gold/5` (5% opacity - barely visible) | `text-gold` | Looks almost transparent |
| Mortgage Calculator | `bg-gold/5` (5% opacity - barely visible) | `text-gold` | Looks almost transparent |
| Other tools | `bg-[color]-50/50` (50% opacity of color-50) | `text-[color]-600` | Visible filled background |

### Solution

Update both tools to have the same visible filled background style as other buttons, while keeping the gold text:

**New styling:**
- Background: `bg-gold/20` (20% opacity - visible champagne fill, matching the opacity level of other tools)
- Border: `border-gold/40` (keep as-is)
- Text: `text-gold` (keep gold as requested)
- Hover: `hover:bg-gold/30` (slightly stronger on hover)

---

### File Changes

**File:** `src/components/Footer.tsx`

#### Change 1: Toolkit Hub (Line 77)

**Before:**
```typescript
'/toolkit': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/10', bg: 'bg-gold/5' },
```

**After:**
```typescript
'/toolkit': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/30', bg: 'bg-gold/20' },
```

#### Change 2: Mortgage Calculator (Line 31)

**Before:**
```typescript
'/mortgage-calculator': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/10', bg: 'bg-gold/5' },
```

**After:**
```typescript
'/mortgage-calculator': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/30', bg: 'bg-gold/20' },
```

---

### Visual Result

| Button | Before | After |
|--------|--------|-------|
| Toolkit Hub | Near-transparent (5% gold) | Visible champagne fill (20% gold) with gold text |
| Mortgage Calculator | Near-transparent (5% gold) | Visible champagne fill (20% gold) with gold text |

Both buttons will now have a visible champagne/gold-tinted background matching the filled appearance of other toolkit buttons, while the text remains distinctively gold.

