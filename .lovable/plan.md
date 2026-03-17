

## Fix Layout, Spacing, Readability — AI Home Finder + Sidebar

### 1. AI Home Finder Card — Centering & Spacing (`src/pages/Index.tsx`)

**Lines 411-477** — The section currently has no background matching other sections and no dividers around it.

**Changes:**
- **Add `SectionDivider`** above the AI Home Finder section (after line 410, before line 411) — matches the pattern used between all other sections
- **Add `SectionDivider`** below the section (after line 477, before line 479)
- **Add section background** to match other sections: `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` — currently the section has no explicit bg class, inheriting inconsistently
- **Add vertical padding**: Change `min-h-[340px]` to `py-16 md:py-20 min-h-[340px]` for proper breathing room matching other sections
- **Max-width constraint on card**: Add `max-w-2xl` to the motion.div wrapper so it doesn't stretch too wide, keeping it centered and proportional

### 2. AI Comparison Section Spacing (`src/pages/Index.tsx`)

**Lines 479-486** — The AI Comparison section has no divider above it and sits right under the Home Finder.

- The new `SectionDivider` added after the Home Finder section (point 1) handles separation above the comparison widget.

### 3. Sidebar — Divider Above Contact/Support (`src/components/navigation/GlobalVerticalNav.tsx`)

**Line 1224-1226** — Currently there's already a thin gold divider (`h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent`). This is too subtle.

**Change:**
- Increase divider opacity: `via-gold/20` → `via-gold/35`
- Add `my-1` padding around the divider for clearer separation

### 4. Sidebar Text Readability (`src/components/navigation/GlobalVerticalNav.tsx`)

**Section headers (line 1166-1169):**
- Default state: `text-black/45` → `text-black/65` (stronger contrast)
- Hover: `hover:text-black/70` → `hover:text-black/85`

**Sub-items (line 1204):**
- Check `getItemStyle` and `getIconStyle` functions for contrast values and increase them similarly

**Let me check those functions:**

The `getItemStyle` function likely controls nav item text. Section headers at `text-black/45` are too faint on the champagne background — bumping to `text-black/65` default and `text-black/80` highlighted gives readable but still elegant contrast.

### Files Modified
1. **`src/pages/Index.tsx`** — Add dividers, section bg, vertical padding, max-width on card
2. **`src/components/navigation/GlobalVerticalNav.tsx`** — Strengthen bottom divider, increase sidebar text contrast

### Spacing Values
- Section padding: `py-16 md:py-20` (64px / 80px)
- Card max-width: `max-w-2xl` (672px)
- Sidebar divider: `via-gold/35`, `my-1`
- Text contrast: `text-black/45` → `text-black/65`

### No Changes To
- Layout structure, sidebar width, header height, fonts, colors palette, card 3D transforms

