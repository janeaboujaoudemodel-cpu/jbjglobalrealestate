

## Diagnosis

Both `renderTopArcTextPath` and `renderBottomArcTextPath` use the **exact same SVG arc path**:

```
M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}
```

This path draws the **top half** of the circle in both cases. That's why Arabic (top) and English (bottom) are rendering on top of each other — they're both placed on the same top arc.

The same issue affects the location arcs: English location top arc and Arabic location bottom arc both sit on the top half.

## Fix (single file: `src/lib/stampOfficialTemplate.ts`)

### 1. Fix `renderBottomArcTextPath` — use actual bottom arc path

Change the arc path from the top semicircle to the **bottom semicircle**:

```
M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}
```

This sweeps from right (3 o'clock) clockwise through the bottom to left (9 o'clock). Text placed on this path sits along the bottom half. The existing string-reversal logic for English text will keep it reading left-to-right.

### 2. Fix location English arc — swap to bottom, Arabic to top

Currently the layout has English location on top arc and Arabic on bottom. Per the user's rule (Arabic always on top, English always on bottom), swap them:
- **Arabic location** → top arc (using `renderTopArcTextPath`)
- **English location** → bottom arc (using `renderBottomArcTextPath`)

### Summary of changes

| What | Current (broken) | Fixed |
|------|-----------------|-------|
| `renderBottomArcTextPath` arc path | Same as top: left→right via top | Right→left via **bottom** semicircle |
| Location Arabic | Bottom arc | **Top** arc |
| Location English | Top arc | **Bottom** arc |

No geometry or font size changes needed — only the arc path direction and location arc assignment.

