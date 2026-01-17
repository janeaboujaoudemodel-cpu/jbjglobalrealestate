# Global Button and Image System - Complete Migration Plan

## Overview
This plan enforces a GLOBAL LOCK on button styling and image handling across the entire codebase. No partial completion - all 252+ files will be migrated in full.

---

## PHASE 1: Button System Hard-Lock (252+ Files)

### Step 1.1: Lock Button Component Variants
**File:** `src/components/ui/button.tsx`

**Action:** Remove ALL legacy variants, keep ONLY 3:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-white text-gold border-2 border-gold hover:bg-transparent hover:text-gold",
        secondary: "bg-transparent text-gold border-2 border-gold hover:bg-white hover:text-gold",
        media: "bg-transparent text-white border-2 border-white hover:bg-white hover:text-gold hover:border-gold",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)
```

**Deleted variants:** `gold`, `goldOutline`, `heroOutline`, `default`, `destructive`, `outline`, `ghost`, `link`

### Step 1.2: Migration Rules for All Files

| Old Pattern | New Pattern |
|-------------|-------------|
| `variant="gold"` | `variant="primary"` |
| `variant="goldOutline"` | `variant="secondary"` |
| `variant="heroOutline"` | `variant="media"` |
| `variant="default"` | `variant="primary"` |
| `variant="outline"` | `variant="secondary"` |
| `variant="ghost"` | `variant="secondary"` |
| `variant="destructive"` | `variant="primary"` |
| `variant="link"` | `variant="secondary"` |

### Step 1.3: Forbidden Classes to Remove

All Button components must have these classes STRIPPED from className:
- `bg-gold`, `bg-gold/*`
- `shadow-*`, `shadow-lg`, `shadow-gold/*`
- `hover:scale-*`, `hover:scale-105`
- `btn-premium`
- Any gradient classes on buttons
- Any glow effects

### Step 1.4: Files to Migrate (Full List - 252+ Files)

**Priority 1 - Core Pages:**
- src/pages/Index.tsx
- src/pages/About.tsx
- src/pages/Properties.tsx
- src/pages/Contact.tsx
- src/pages/Services.tsx
- src/pages/Communities.tsx
- All files in src/pages/services/*

**Priority 2 - CRM System:**
- All files in src/components/crm/*
- All files in src/pages/CRM*.tsx

**Priority 3 - Chat and Communication:**
- All files in src/components/chat/*
- All files in src/components/communication/*

**Priority 4 - Admin and Dashboard:**
- All files in src/components/admin/*
- All files in src/components/dashboard/*

**Priority 5 - All Remaining Components:**
- All remaining files in src/components/*
- All remaining files in src/pages/*

---

## PHASE 2: Portrait Image System (Global Application)

### Step 2.1: Fix PortraitImage Component
**File:** `src/components/ui/portrait-image.tsx`

**Requirements:**
- Subject fills 70-85% of container
- Head NEVER cropped
- Subject centered
- No tiny portraits

**Implementation:**
```typescript
const PortraitImage = ({ src, alt, className, focus = "upper" }: PortraitImageProps) => {
  const focusPosition = {
    upper: "center 20%",
    center: "center center", 
    lower: "center 80%",
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ 
          objectPosition: focusPosition[focus],
          minHeight: "100%",
          minWidth: "100%"
        }}
      />
    </div>
  );
};
```

### Step 2.2: Apply PortraitImage Globally

**Files to update:**
- src/pages/About.tsx (Founder section)
- src/pages/MeetTheTeam.tsx (All team members)
- src/components/team/* (Employee cards)
- src/components/crm/* (User avatars)
- src/components/employee-hub/* (Profile images)
- src/components/ui/avatar.tsx (Base avatar component)

### Step 2.3: Avatar Component Update
**File:** `src/components/ui/avatar.tsx`

Ensure AvatarImage uses:
```typescript
objectFit: 'cover'
objectPosition: 'center 20%'
```

---

## PHASE 3: Fix AdminBypass for Preview/Screenshots

**File:** `src/components/AdminBypass.tsx`

Add these routes to PUBLIC_ROUTES for testing:
```typescript
const PUBLIC_ROUTES = [
  "/install",
  "/vapi-prompt", 
  "/areas",
  "/area/",
  "/seller-guide",
  "/seller-listing",
  "/video-builder",
  "/about",        // ADD
  "/contact",      // ADD
  "/services",     // ADD
  "/communities",  // ADD
  "/properties",   // ADD
];
```

---

## PHASE 4: Verification Checklist

### Search Verification (Must show 0 matches):
1. `variant="gold"` - 0 matches
2. `variant="goldOutline"` - 0 matches
3. `variant="heroOutline"` - 0 matches
4. `<Button.*className=.*bg-gold` - 0 matches on Button components
5. `<Button.*className=.*shadow-` - 0 matches on Button components
6. `<Button.*className=.*hover:scale` - 0 matches on Button components

### Screenshot Verification:
1. Home page hero buttons - correct hover inversion
2. About page buttons - correct hover inversion
3. About page founder portrait - fills frame, no head crop
4. CRM buttons - consistent styling
5. MeetTheTeam page - all portraits correct

---

## Implementation Order

1. Update button.tsx (remove legacy variants)
2. Fix all build errors from removed variants
3. Migrate all button usages file by file
4. Update portrait-image.tsx
5. Update avatar.tsx
6. Apply PortraitImage to all people images
7. Update AdminBypass for testing
8. Run verification searches
9. Take verification screenshots

---

## Acceptance Criteria

- ZERO legacy button variants in codebase
- ZERO forbidden button classes on Button components
- ALL people images use PortraitImage rules
- ALL buttons follow inverted hover behavior
- Screenshots prove compliance