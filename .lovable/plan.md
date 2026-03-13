

## Plan: Fix Bottom Arc Readability + Ring Gap + Arabic Arc Width

### Issues to Fix

1. **English bottom arc text is reversed** — currently text follows a right-to-left path, making it read backwards. Fix: reverse the text string before placing on the bottom arc path, so it reads naturally left-to-right.

2. **Location bottom arc (Arabic) same issue** — same reversal fix needed.

3. **Gap between 2nd and 3rd circle too wide** — increase `INNER_R_PCT` from `0.22` to `0.26` to bring inner ring closer to middle ring.

4. **Arabic top arc text has gaps near separators** — Arabic letter-spacing is currently `1`, too tight compared to English (`4`). Increase Arabic letter-spacing to `3` and widen the arc spread so Arabic fills edge-to-edge like English does on the bottom.

### Technical Changes (single file: `src/lib/stampOfficialTemplate.ts`)

| Change | Detail |
|--------|--------|
| `renderBottomArcTextPath` | Reverse the input text string before rendering, so characters read L→R when placed on the R→L bottom arc path |
| `INNER_R_PCT` | `0.22` → `0.26` (decrease middle-to-inner gap) |
| Arabic top arc letter-spacing | `1` → `3` (wider to fill arc edge-to-edge) |
| Location bottom arc | Apply same string reversal for Arabic location text |

