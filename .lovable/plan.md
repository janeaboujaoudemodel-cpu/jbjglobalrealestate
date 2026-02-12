

## Fix: Broken Filter Bar Layout + Sticky Behavior

### What Went Wrong

The developer filter dropdown was accidentally placed **inside** the search input's wrapper `<div>`. This means:
- The search icon, the text input, and the developer dropdown are all crammed into one relative container
- The layout collapses because the developer `Select` is positioned relative to the search field

### Fix (single file: `AreaProjectsGrid.tsx`)

**1. Fix the broken JSX nesting (lines 189-219)**

Close the search input's `<div className="relative flex-1 min-w-[200px]">` right after the clear-search button (after line 203), then place the Developer filter as a **sibling** alongside Status, Bedrooms, and Sort.

Corrected structure:
```text
<div class="flex flex-wrap items-center gap-3">
  |-- <div class="relative flex-1"> (search input + X button) </div>   <-- closes here
  |-- <Select> Developer </Select>      <-- sibling, not nested
  |-- <Select> Status </Select>
  |-- <Select> Bedrooms </Select>
  |-- <Select> Sort </Select>
  |-- Clear button
</div>
```

**2. Sticky behavior is already correct**

The `sticky top-[72px] z-30` class is applied and no ancestor has `overflow: hidden`. Once the JSX nesting is fixed, the sticky behavior will work as expected -- the bar stays inside the card in normal flow and pins under the header when scrolled past.

**3. No other changes needed**

All filter logic, developer options derivation, sentinel/shadow, and grid rendering are correct. This is purely a JSX structure fix on lines 189-219.
