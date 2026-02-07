
# Plan: Remove "About Jane bou Jaoude" & Apply Founder Toggle

## Problem Statement

The user wants to:
1. **Remove the "About Jane bou Jaoude" label** from the More dropdown - since it's redundant with the existing "Founder & Leadership" page
2. **Wrap all founder-related links with the founder visibility toggle** so they disappear when founder visibility is disabled

---

## Current State Analysis

### Already Correctly Implemented ✅
- **Footer.tsx** - Uses `isFounderVisible` conditional for founder link (line 141)
- **About.tsx** - Founder section wrapped with `<FounderContent>` (line 215)
- **FounderPhilosophySection.tsx** - Entire component wrapped with `<FounderContent>`
- **Sitemap.tsx** - Uses `hideFounderLinks={!isFounderVisible}` prop to filter founder links (line 499)
- **Founder.tsx** (the page) - Already uses `useFounderVisibility` to redirect when hidden

### Needs Changes ❌
1. **MegaMenuMore.tsx (line 63)**
   - Currently: `{ label: 'About Jane bou Jaoude', href: '/founder', icon: UserCircle }`
   - Problem: Uses personal name instead of generic "Founder & Leadership"
   - Problem: Not wrapped with founder visibility conditional

2. **DigitalCard.tsx**
   - The entire page is Jane bou Jaoude's personal digital business card
   - Links to `/founder` page
   - Should be wrapped with `<FounderContent>` or hidden when founder visibility is off

---

## Implementation Plan

### Phase 1: MegaMenuMore.tsx - Apply Founder Toggle

**File:** `src/components/header/MegaMenuMore.tsx`

**Changes:**
1. Import `useFounderVisibility` hook
2. Rename link from "About Jane bou Jaoude" to "Founder & Leadership"
3. Make the link conditionally visible based on founder toggle

```text
BEFORE (lines 1-14):
import React from 'react';
import { 
  Briefcase, Building2, Users, Calculator, Scale, Award, 
  ...
} from 'lucide-react';
import { ... } from '@/components/header/mega-menu-primitives';
import { useUserModeContext } from '@/contexts/UserModeContext';

AFTER:
import React from 'react';
import { 
  Briefcase, Building2, Users, Calculator, Scale, Award, 
  ...
} from 'lucide-react';
import { ... } from '@/components/header/mega-menu-primitives';
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';
```

```text
BEFORE (line 63):
{ label: 'About Jane bou Jaoude', href: '/founder', icon: UserCircle },

AFTER (make conditional):
...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
```

Also update the hook usage:
```text
BEFORE (line 20):
const { isBrokerMode } = useUserModeContext();

AFTER:
const { isBrokerMode } = useUserModeContext();
const { isFounderVisible } = useFounderVisibility();
```

---

### Phase 2: DigitalCard.tsx - Wrap with Founder Toggle

**File:** `src/pages/DigitalCard.tsx`

**Changes:**
1. Import `FounderContent` and `useFounderVisibility`
2. Wrap the entire page content with `<FounderContent>` with a fallback redirect or message

**Option A - Redirect when hidden:**
```tsx
import { Navigate } from "react-router-dom";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

const DigitalCard = () => {
  const { isFounderVisible, isLoading } = useFounderVisibility();
  
  if (isLoading) return null;
  if (!isFounderVisible) return <Navigate to="/" replace />;
  
  // ... rest of component
};
```

**Option B - Wrap content (preserves route but hides content):**
```tsx
import { FounderContent } from "@/components/FounderContent";

// Wrap return JSX with:
return (
  <FounderContent fallback={<Navigate to="/" replace />}>
    {/* existing content */}
  </FounderContent>
);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/header/MegaMenuMore.tsx` | Rename link, add founder visibility conditional |
| `src/pages/DigitalCard.tsx` | Wrap with founder visibility (redirect when hidden) |

---

## Security & UI Confirmation

- **No security layer changes** - AuthContext, OwnerGuard, RLS untouched
- **No UI theme changes** - Same colors, fonts, spacing
- **Owner name lock** - "Jane bou Jaoude" spelling preserved where still used
- **Consistency** - All founder links now match pattern used in Footer and Sitemap

---

## Expected Result

When **Founder Visibility = ON**:
- More dropdown shows: "About JBJ" → "Founder & Leadership" → "Meet the Team" → etc.
- `/digital-card` page accessible

When **Founder Visibility = OFF**:
- More dropdown shows: "About JBJ" → "Meet the Team" → etc. (no founder link)
- `/digital-card` redirects to homepage
- All other founder toggles continue working as implemented

---

## Verification Checklist

- [ ] "About Jane bou Jaoude" label is removed from More dropdown
- [ ] Link renamed to "Founder & Leadership" 
- [ ] Link hidden when founder visibility is OFF
- [ ] DigitalCard page redirects when founder visibility is OFF
- [ ] No UI theme changes made
- [ ] No security layer changes made
