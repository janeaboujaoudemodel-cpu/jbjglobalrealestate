

## Audit of Previous Tasks — Status

| Task | Status | Issue |
|------|--------|-------|
| Remove rail borders from HorizontalUtilityBar | Done | Verified: lines 118 and 247 have no borders |
| Fix white gap below horizontal header (body bg) | Done | `index.css` and `MainLayout.tsx` both set `#E8DCC8` |
| Green dot on sidebar monogram logo | **NOT DONE** | Line 1079: `bg-emerald-400` dot still present |
| Company name on 2 lines only | **NOT DONE** | Text can wrap to 4 lines due to wide letter-spacing and missing `whitespace-nowrap` |

---

## Fix Plan

**File:** `src/components/navigation/GlobalVerticalNav.tsx`

### 1. Remove the green dot (line 1079)

Delete this element entirely:
```html
<div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#E8DCC8]" />
```

The `<div className="relative">` wrapper around the image can also be simplified since it only existed to position the dot.

### 2. Fix company name to strictly 2 lines (lines 1082-1085)

Add `whitespace-nowrap` to both text spans to prevent any wrapping:
- Line 1083: `"JBJ GLOBAL"` span — add `whitespace-nowrap`
- Line 1084: `"REAL ESTATE"` span — add `whitespace-nowrap`

Also reduce the excessive letter-spacing that causes overflow on narrower sidebar widths:
- `tracking-[0.2em]` → `tracking-[0.15em]` for "JBJ GLOBAL"
- `tracking-[0.25em]` → `tracking-[0.18em]` for "REAL ESTATE"

This ensures the company name renders as exactly 2 lines regardless of sidebar width.

