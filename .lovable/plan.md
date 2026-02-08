

## Combined Mode View - Dual Tier Display Implementation

### Overview

When users are in **Investor + Broker** combined mode, they will see BOTH their investor tier progress AND broker tier progress simultaneously. This gives users visibility into their standing in both tier ladders.

---

### Current Behavior

- Users in combined mode only see the **broker tier ladder** (more ambitious goals)
- Points are shared across both ladders, but only one is displayed
- Users cannot see their investor tier progress while in combined mode

---

### Proposed Changes

#### 1. Hook Enhancement: `useTierProgress.ts`

Add new return values for dual-tier support:

```typescript
interface TierProgressHook {
  // Existing
  tierProgress: TierProgress | null;
  allTiers: TierDefinition[];
  recentPoints: PointsLedgerEntry[];
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  currentTierType: 'broker' | 'client';
  
  // NEW for combined mode
  investorTierProgress: TierProgress | null;
  brokerTierProgress: TierProgress | null;
  allInvestorTiers: TierDefinition[];
  allBrokerTiers: TierDefinition[];
}
```

**Logic changes:**
- When `isCombinedMode` is true, fetch BOTH tier ladders from the database
- Calculate progress for both investor and broker tiers using the same shared points
- Return both sets of data for components to display

---

#### 2. Badge Level Card: `BadgesLevelCard.tsx`

**Combined Mode Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Level & Badges                      [Combined]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  INVESTOR PATH   │  │   BROKER PATH    │        │
│  │  🧭 Explorer     │  │   ⭐ Starter     │        │
│  │  250 pts         │  │   250 pts        │        │
│  │  ──────────      │  │   ──────────     │        │
│  │  Next: Seeker    │  │   Next: Rising   │        │
│  │  50 pts to go    │  │   250 pts to go  │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                     │
│  Total Points: 250                                  │
│              [View Full Progress →]                 │
└─────────────────────────────────────────────────────┘
```

**Changes:**
- Detect combined mode using `useUserModeContext().isCombinedMode`
- Render two side-by-side tier cards with color coding:
  - **Investor card**: Emerald/green theme (bg-emerald-500/10, border-emerald-500/30)
  - **Broker card**: Blue theme (bg-blue-500/10, border-blue-500/30)
- Show purple "Combined" badge in the header
- Display shared total points at the bottom

---

#### 3. Tier Progress Card: `TierProgressCard.tsx`

Create a conditional layout for combined mode:

**Single Mode (existing):**
- Shows one tier progress bar
- One set of benefits
- One tier history

**Combined Mode (new):**
- Two columns or stacked cards
- Each shows:
  - Tier badge with type indicator
  - Progress bar to next tier
  - Points needed
  - Key benefits (2 per tier)
- Shared "Your Activity" section at bottom

---

#### 4. Profile Summary Card: `ProfileSummaryCard.tsx`

**Combined mode change:**

Instead of showing one tier badge:
```tsx
<Badge>Starter</Badge>
```

Show both:
```tsx
<Badge className="bg-emerald-500/20 text-emerald-400">Explorer</Badge>
<Badge className="bg-blue-500/20 text-blue-400">Starter</Badge>
```

---

#### 5. Header Account Menu: `MegaMenuAccount.tsx`

Update the badge display:

**Current:**
```
Investor + Broker • 250 pts earned
```

**Enhanced:**
```
Explorer • Starter | 250 pts
```

Or with dual badges:
```
🧭 Explorer | ⭐ Starter • 250 pts
```

---

#### 6. Golden ID Card: `GoldenIDCard.tsx`

For combined mode, show both tiers on the card:

```
┌─────────────────────────────────────────────┐
│  [JB]  John Broker                          │
│        🧭 Explorer  |  ⭐ Starter           │
│                                             │
│  Member ID: JBJ-XXXX-XXXX                   │
│                                             │
│  ⭐ 250 pts                Since Jan 2026   │
│                                             │
│  [QR Code]            Scan to verify        │
└─────────────────────────────────────────────┘
```

---

### File Changes Summary

| File | Changes |
|------|---------|
| `src/hooks/useTierProgress.ts` | Add dual-tier fetching for combined mode, new return values |
| `src/components/dashboard/BadgesLevelCard.tsx` | Render two-column layout in combined mode |
| `src/components/tier/TierProgressCard.tsx` | Add dual-tier display variant |
| `src/components/dashboard/ProfileSummaryCard.tsx` | Show dual tier badges in combined mode |
| `src/components/header/MegaMenuAccount.tsx` | Update tier display for combined mode |
| `src/components/profile/GoldenIDCard.tsx` | Show both tiers on ID card |

---

### Color Coding Reference

| Mode | Primary Color | Badge Style |
|------|---------------|-------------|
| Investor Only | Emerald/Green | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` |
| Broker Only | Blue | `bg-blue-500/20 text-blue-400 border-blue-500/30` |
| Combined Mode | Purple (indicator) + Both colors for respective tiers | Purple badge for mode, then emerald + blue for tier cards |

---

### Database Query Changes

**Current query (single tier type):**
```sql
SELECT * FROM tier_definitions 
WHERE tier_type = 'broker' AND is_active = true
ORDER BY tier_order
```

**Combined mode (both tier types):**
```sql
-- Query 1: Investor tiers
SELECT * FROM tier_definitions 
WHERE tier_type = 'client' AND is_active = true
ORDER BY tier_order;

-- Query 2: Broker tiers
SELECT * FROM tier_definitions 
WHERE tier_type = 'broker' AND is_active = true
ORDER BY tier_order;
```

---

### Implementation Notes

1. **Performance**: The dual query approach adds one extra database call, but this is minimal overhead and can be parallelized with `Promise.all`

2. **Points Sharing**: Both tiers use the SAME point balance - the user earns once, progresses on both ladders simultaneously

3. **Responsive Design**: On mobile, the two-column tier cards should stack vertically

4. **Tier Icons**: Use existing icon maps:
   - Investor: Compass (Explorer), Search (Seeker), TrendingUp (Investor), Crown (Premium), Trophy (Elite)
   - Broker: Star (Starter), Zap (Rising), Award (Performer), Crown (Elite), Trophy (Legend)

