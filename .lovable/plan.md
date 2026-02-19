
# Company Stamp — Two Bug Fixes

## Bug 1: 404 When Clicking "Open" on a Saved Project

**Root Cause** (`src/components/stamp-generator/StampProjectsDashboard.tsx`, line 169):

The Open button navigates to the wrong URL:
```
navigate(`/toolkit/stamp-generator/${project.id}`)
```

But the router in `App.tsx` only has this route defined:
```
/toolkit/stamp-generator/:projectId/generate
```

The `/generate` suffix is missing. React Router finds no matching route and falls through to the 404 page.

**Fix**: Change the navigation target to include `/generate`:
```typescript
// Before (broken)
navigate(`/toolkit/stamp-generator/${project.id}`)

// After (correct)
navigate(`/toolkit/stamp-generator/${project.id}/generate`)
```

**File**: `src/components/stamp-generator/StampProjectsDashboard.tsx` — line 169

---

## Bug 2: Owner's Company Name Showing as Example in Hero Section

**Root Cause** (`src/pages/toolkit/StampGeneratorPage.tsx`, line 85):

The first mock stamp in the hero gallery is hardcoded with the owner's real company name:
```typescript
<MockStamp label="JBJ GLOBAL REAL ESTATE LLC" sub="OFFICIAL STAMP" variant="round"/>
```

This makes the landing page look like it's the owner's personal tool, not a neutral product demo.

**Fix**: Replace the first example stamp with a neutral fictional company name. The three other stamps already use neutral names (Alpha Consulting Group, Summit Properties, Nexus Advisory LLC). The first will become a generic food/holding group name:

```typescript
// Before
<MockStamp label="JBJ GLOBAL REAL ESTATE LLC" sub="OFFICIAL STAMP" variant="round"/>

// After
<MockStamp label="GOLDEN PALM HOLDING GROUP" sub="OFFICIAL STAMP" variant="round"/>
```

**File**: `src/pages/toolkit/StampGeneratorPage.tsx` — line 85

---

## Files to Edit

| File | Line | Change |
|------|------|--------|
| `src/components/stamp-generator/StampProjectsDashboard.tsx` | 169 | Add `/generate` to navigation URL |
| `src/pages/toolkit/StampGeneratorPage.tsx` | 85 | Replace owner company name with neutral fictional name |
