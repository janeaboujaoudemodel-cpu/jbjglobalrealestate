

## Unified Points & Loyalty Program - Implementation Plan

### Overview
Implement a **Unified Points** system where all activities earn into one shared pool regardless of mode. When the user switches modes, only the tier ladder display changes - points never disappear.

---

### Current State Analysis

**Database Structure:**
- `points_ledger` table tracks points with `user_mode` column (for audit)
- `tier_definitions` has two separate ladders:
  - **Broker tiers**: Starter (0-499) → Rising (500-1499) → Performer (1500-3999) → Elite (4000-9999) → Legend (10000+)
  - **Client/Investor tiers**: Explorer (0-199) → Seeker (200-499) → Investor (500-1499) → Premium (1500-3999) → Elite (4000+)

**Current Hook Behavior (`useTierProgress.ts`):**
- Sums ALL points from ledger (line 106) - already unified
- Switches tier ladder based on `isBroker` flag (line 62)
- Uses `useUserRole` to determine broker status

**Issue to Fix:**
- Currently uses `useUserRole().isBroker` which checks the user's **role** (permanent)
- Should use `useUserModeContext()` to check the user's **mode** (can switch anytime)

---

### Implementation Changes

#### File: `src/hooks/useTierProgress.ts`

**1. Change context source (line 4-5):**
```typescript
// BEFORE:
import { useUserRole } from "@/hooks/useUserRole";
// ...
const { isBroker } = useUserRole();

// AFTER:
import { useUserModeContext } from "@/contexts/UserModeContext";
// ...
const { isBrokerMode, isCombinedMode } = useUserModeContext();
```

**2. Update tier type selection logic (line 62):**
```typescript
// BEFORE:
const tierType = isBroker ? 'broker' : 'client';

// AFTER:
// In combined mode, show broker ladder (more ambitious goals)
// In broker-only mode, show broker ladder
// In investor-only mode, show client ladder
const tierType = isBrokerMode ? 'broker' : 'client';
```

**3. Add mode reactivity to loadProgress dependencies (line 160):**
```typescript
// BEFORE:
}, [user, tierType]);

// AFTER:
}, [user, isBrokerMode, isCombinedMode]);
```

**4. Export tier type for UI components:**
```typescript
interface TierProgressHook {
  tierProgress: TierProgress | null;
  allTiers: TierDefinition[];
  recentPoints: PointsLedgerEntry[];
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  currentTierType: 'broker' | 'client';  // NEW
}
```

---

#### File: `src/components/tier/TierProgressCard.tsx`

**Add mode indicator for clarity:**

When user switches modes, show a subtle label indicating which tier ladder they're viewing:

```typescript
// Add to CardHeader (around line 54-59):
<span className="text-xs text-white/50">
  {tierType === 'broker' ? 'Broker Tier' : 'Investor Tier'}
</span>
```

---

#### File: `src/components/tier/TierBadge.tsx`

**No changes needed** - already supports both tier types with proper colors and icons.

---

### User Experience Flow

```
User earns 1000 points total

In Investor Mode:
┌─────────────────────────────────┐
│ 🏆 INVESTOR TIER                │
│ Current: Investor (1000 pts)    │
│ Next: Premium at 1500 pts       │
│ Progress: ████████░░ 67%        │
└─────────────────────────────────┘

Switches to Broker Mode:
┌─────────────────────────────────┐
│ 🏆 BROKER TIER                  │
│ Current: Rising (1000 pts)      │
│ Next: Performer at 1500 pts     │
│ Progress: ████████░░ 67%        │
└─────────────────────────────────┘

Same 1000 points - different tier name!
```

---

### Benefits of Unified Points

1. **Simplicity**: Users don't lose progress when switching modes
2. **Motivation**: Combined mode users progress faster on both ladders
3. **Audit Trail**: `user_mode` column in ledger tracks which mode earned each point
4. **No Data Migration**: Current ledger structure already supports this

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useTierProgress.ts` | Switch from `useUserRole` to `useUserModeContext`, add mode reactivity |
| `src/components/tier/TierProgressCard.tsx` | Add tier type label for clarity |

---

### Testing Checklist

1. Log in as a user with some points
2. View tier progress in Investor mode - should show client tier
3. Switch to Broker mode - same points, broker tier name
4. Switch to Combined mode - should show broker tier (more ambitious)
5. Verify points total never changes during mode switches

