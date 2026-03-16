

## Plan: Remove Rail Borders, Keep Only Dividers

**File:** `src/components/navigation/HorizontalUtilityBar.tsx`

### Changes

1. **Left rail (line 118):** Remove `border border-black/10 bg-black/[0.04]` — make it borderless and transparent, keeping only the `railDivider` vertical lines between fields.

2. **Right rail (line 247):** Remove `border border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.03)]` — same treatment, borderless with only vertical dividers separating groups.

Both containers keep their `flex items-center h-8 shrink-0` layout — only the border and background classes are stripped.

