

## Fix All Faded/Gray Data Colors on Project Detail & AI Intelligence

### Problems Identified

**1. ProjectAIAnalyzer.tsx — Major Issues (the page you're viewing)**

| Location | Current | Problem |
|----------|---------|---------|
| Rating card (dark bg) | `text-gray-600` for rating explanation | Invisible on dark background |
| Rating subtitle | `text-gold/70` | Faded, low contrast |
| Price/sqft value | `text-gold` | Should be vibrant emerald |
| Price/sqft `/sqft` label | `text-gray-600` | Gray, faded |
| Price/sqft area average | `text-gray-600` | Gray |
| Dubai Avg bar color | `#9CA3AF` (gray) | Must be a distinct color |
| Y-axis tick fill | `#71717a` (gray) | Must be black |
| Supply/Demand absorption | `text-gold` | Should be vibrant blue |
| Supply/Demand labels | `text-gray-600` | Gray, faded |
| Supply/Demand progress bar | Gold gradient | Should be blue-to-emerald |
| Investment Metrics labels | `text-gold/60` | Extremely faded on dark cards |
| Investment Metrics values | `text-gold` | Should use emerald/blue |
| All body/detail text | `text-gray-600`, `text-gray-700` | Faded |
| Footer disclaimer | `text-gray-600` | Faded |
| Loading state text | `text-gray-600` | Faded |
| "Not available" messages | `text-gray-600 italic` | Should be red (issue) |

**2. ProjectDetailTabs.tsx — All labels gray**

| Location | Current | Problem |
|----------|---------|---------|
| Tab triggers | `text-gray-600` | Faded inactive tabs |
| All detail labels | `text-gray-600 text-sm` | Gray labels for Starting Price, Handover, etc. |
| Description text | `text-gray-600` | Faded |
| All "coming soon" messages | `text-gray-600` | Should be red (issue) |

**3. QuickFactsBar.tsx**

| Location | Current | Problem |
|----------|---------|---------|
| Fact labels | `text-muted-foreground` | Faded |
| Updated date | `text-muted-foreground` | Faded |
| No-status fallback | `bg-muted text-muted-foreground` | Gray |

### Plan

#### File 1: `ProjectAIAnalyzer.tsx` — Complete color overhaul

- **Rating card (dark bg):** `text-gray-600` → `text-white/80` for explanation text; `text-gold/70` → `text-gold` for subtitle
- **Price/sqft:** Large value `text-gold` → `text-emerald-600`; `/sqft` and average labels `text-gray-600` → `text-black/80 font-medium`
- **Dubai Avg bar:** `#9CA3AF` → `#3B82F6` (blue) to differentiate from area price
- **Y-axis ticks:** `fill: "#71717a"` → `fill: "#111111"`
- **Supply/Demand:** Absorption `text-gold` → `text-blue-600`; progress bar gold gradient → `linear-gradient(90deg, #3B82F6, #10B981)`; labels `text-gray-600` → `text-black/80 font-medium`
- **Investment Metrics dark cards:** Labels `text-gold/60` → `text-white/80 font-medium`; Rental Yield value `text-gold` → `text-blue-400`; Capital Growth value `text-gold` → `text-emerald-400`
- **All body text:** `text-gray-700` → `text-black/90`; `text-gray-600` → `text-black/80`
- **"Not available" messages:** `text-gray-600 italic` → `text-red-600 font-medium` (issue = red)
- **Footer:** `text-gray-600` → `text-black/80`
- **Loading text:** `text-gray-600` → `text-black/80`

#### File 2: `ProjectDetailTabs.tsx`

- Tab triggers: `text-gray-600` → `text-black/80`
- All detail labels (Starting Price, Handover, etc.): `text-gray-600 text-sm` → `text-black/80 text-sm font-medium`
- Description text: `text-gray-600` → `text-black/90`
- "Coming soon" / empty states: `text-gray-600` → `text-red-600 font-medium`

#### File 3: `QuickFactsBar.tsx`

- Fact labels: `text-muted-foreground` → `text-black/80 font-medium`
- Updated date: `text-muted-foreground` → `text-black/70`
- No-status fallback: `bg-muted text-muted-foreground` → `bg-red-50 text-red-600 border-red-200`

#### File 4: `InvestmentMetricsSection.tsx` — Already mostly fixed, verify dark-card contrast

- Confirm all metric labels and values use the semantic colors from the previous fix

### Files Modified

| File | Changes |
|------|---------|
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Replace all gray with vibrant semantic colors; fix dark-card contrast; issues in red |
| `src/components/project-detail/ProjectDetailTabs.tsx` | Replace all gray labels; empty states in red |
| `src/components/project-detail/QuickFactsBar.tsx` | Replace muted-foreground; no-status → red |

