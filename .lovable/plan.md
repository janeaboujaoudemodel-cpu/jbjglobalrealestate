

## Fix Plan: Podcast Visibility for Owner & AI Tools Footer Color Matching

### Issue 1: Podcast Section Not Showing for Owner

**Root Cause Analysis:**

The `PodcastVisibilityGate` component (line 20-23) returns `null` during loading state **before** checking if the user is the Owner:

```typescript
// Current problematic code
if (isVisibilityLoading) {
  return null;  // <-- Returns null, doesn't check isOwner first!
}
```

This means even the Owner sees nothing during the loading phase. The fix is to check `isOwner` **before** checking the loading state so the Owner always sees the content immediately.

Additionally, the `isOwner` state in `AuthContext.tsx` (line 44-50) checks `VITE_OWNER_EMAIL` but the auth loading itself might still be in progress. We need to ensure the Owner check doesn't get blocked.

**Fix Location:**
- `src/components/home/PodcastVisibilityGate.tsx`

**Solution:**

```typescript
export const PodcastVisibilityGate = ({ children }: PodcastVisibilityGateProps) => {
  const { isPodcastVisible, isLoading: isVisibilityLoading } = usePodcastVisibility();
  const { user, isOwner, loading: isAuthLoading } = useAuth();

  // Owner ALWAYS sees the podcast section - check first, before loading states
  if (isOwner) {
    return <>{children}</>;
  }

  // For non-owners, wait for both auth AND visibility to resolve
  if (isAuthLoading || isVisibilityLoading) {
    return null;
  }

  // Non-owner: only show if visibility is enabled
  if (!isPodcastVisible) {
    return null;
  }

  return <>{children}</>;
};
```

This ensures:
1. Owner sees podcast **immediately** if `isOwner` is true
2. Non-owners wait for loading to complete
3. Non-owners only see if `isPodcastVisible` is true

---

### Issue 2: AI Tools Footer Color Matching

**Current Problem:**

The footer's "Professional Tools" section (lines 763-782 of Footer.tsx) uses generic white/gold styling for all AI tool links:

```typescript
// Current generic styling - no color differentiation
<Link
  to={link.href}
  className="text-black hover:text-gold ... bg-white/80 border border-gold/30"
>
```

Each AI tool has a distinct accent color **inside** the tool page:
- **AI ROI Calculator**: Emerald
- **AI Price Predictor**: Blue
- **AI Lead Qualification**: Purple
- **AI Translation Hub**: Amber
- **AI Objection Handler**: Rose
- etc.

**Solution:**

Create a color mapping object and update the footer to render each AI tool link with its matching accent color.

**Files to Modify:**
- `src/components/Footer.tsx`

**Implementation:**

1. Create a color mapping constant at the top of Footer.tsx:

```typescript
// AI Tool accent color mapping (matches inside tool pages)
const AI_TOOL_COLORS: Record<string, { border: string; text: string; hover: string; bg: string }> = {
  '/property-evaluator': { border: 'border-emerald-500/40', text: 'text-emerald-600', hover: 'hover:bg-emerald-50', bg: 'bg-emerald-50/50' },
  '/ai-price-predictor': { border: 'border-blue-500/40', text: 'text-blue-600', hover: 'hover:bg-blue-50', bg: 'bg-blue-50/50' },
  '/ai-roi-calculator': { border: 'border-emerald-500/40', text: 'text-emerald-600', hover: 'hover:bg-emerald-50', bg: 'bg-emerald-50/50' },
  '/ai-lead-qualification': { border: 'border-purple-500/40', text: 'text-purple-600', hover: 'hover:bg-purple-50', bg: 'bg-purple-50/50' },
  '/ai-translation-hub': { border: 'border-amber-500/40', text: 'text-amber-600', hover: 'hover:bg-amber-50', bg: 'bg-amber-50/50' },
  '/ai-objection-handler': { border: 'border-rose-500/40', text: 'text-rose-600', hover: 'hover:bg-rose-50', bg: 'bg-rose-50/50' },
  '/ai-market-report': { border: 'border-cyan-500/40', text: 'text-cyan-600', hover: 'hover:bg-cyan-50', bg: 'bg-cyan-50/50' },
  '/ai-video-tour-script': { border: 'border-violet-500/40', text: 'text-violet-600', hover: 'hover:bg-violet-50', bg: 'bg-violet-50/50' },
  '/ai-email-generator': { border: 'border-teal-500/40', text: 'text-teal-600', hover: 'hover:bg-teal-50', bg: 'bg-teal-50/50' },
  '/ai-social-media': { border: 'border-pink-500/40', text: 'text-pink-600', hover: 'hover:bg-pink-50', bg: 'bg-pink-50/50' },
  '/ai-neighborhood-insights': { border: 'border-indigo-500/40', text: 'text-indigo-600', hover: 'hover:bg-indigo-50', bg: 'bg-indigo-50/50' },
  '/ai-property-analyzer': { border: 'border-orange-500/40', text: 'text-orange-600', hover: 'hover:bg-orange-50', bg: 'bg-orange-50/50' },
  '/rental-index': { border: 'border-blue-500/40', text: 'text-blue-600', hover: 'hover:bg-blue-50', bg: 'bg-blue-50/50' },
  '/mortgage-calculator': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/10', bg: 'bg-gold/5' },
  '/compare': { border: 'border-blue-500/40', text: 'text-blue-600', hover: 'hover:bg-blue-50', bg: 'bg-blue-50/50' },
  '/quiz': { border: 'border-purple-500/40', text: 'text-purple-600', hover: 'hover:bg-purple-50', bg: 'bg-purple-50/50' },
  '/interior-design-ai': { border: 'border-rose-500/40', text: 'text-rose-600', hover: 'hover:bg-rose-50', bg: 'bg-rose-50/50' },
  '/virtual-staging-ai': { border: 'border-amber-500/40', text: 'text-amber-600', hover: 'hover:bg-amber-50', bg: 'bg-amber-50/50' },
  '/ai-follow-up-scheduler': { border: 'border-green-500/40', text: 'text-green-600', hover: 'hover:bg-green-50', bg: 'bg-green-50/50' },
  '/ai-client-matcher': { border: 'border-cyan-500/40', text: 'text-cyan-600', hover: 'hover:bg-cyan-50', bg: 'bg-cyan-50/50' },
  '/ai-competitor-analysis': { border: 'border-red-500/40', text: 'text-red-600', hover: 'hover:bg-red-50', bg: 'bg-red-50/50' },
  '/ai-investment-report': { border: 'border-emerald-500/40', text: 'text-emerald-600', hover: 'hover:bg-emerald-50', bg: 'bg-emerald-50/50' },
  '/ai-meeting-summarizer': { border: 'border-blue-500/40', text: 'text-blue-600', hover: 'hover:bg-blue-50', bg: 'bg-blue-50/50' },
  '/ai-description-writer': { border: 'border-violet-500/40', text: 'text-violet-600', hover: 'hover:bg-violet-50', bg: 'bg-violet-50/50' },
  '/ai-contract-reviewer': { border: 'border-slate-500/40', text: 'text-slate-600', hover: 'hover:bg-slate-50', bg: 'bg-slate-50/50' },
  '/ai-document-generator': { border: 'border-zinc-500/40', text: 'text-zinc-600', hover: 'hover:bg-zinc-50', bg: 'bg-zinc-50/50' },
  '/business-card-scanner': { border: 'border-gold/40', text: 'text-gold', hover: 'hover:bg-gold/10', bg: 'bg-gold/5' },
};

// Default color for tools not in the map
const DEFAULT_TOOL_COLOR = { border: 'border-gold/30', text: 'text-black', hover: 'hover:bg-white', bg: 'bg-white/80' };
```

2. Update the Professional Tools link rendering (lines 771-781):

```typescript
{professionalTools.map((link) => {
  const colors = AI_TOOL_COLORS[link.href] || DEFAULT_TOOL_COLOR;
  return (
    <Link
      key={link.href}
      to={link.href}
      className={`transition-all duration-300 text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl group ${colors.bg} border ${colors.border} shadow-sm hover:shadow-md ${colors.hover}`}
    >
      <span className={`${colors.text} group-hover:brightness-110 transition-colors font-medium`}>
        {link.label}
      </span>
    </Link>
  );
})}
```

---

### Files to Modify Summary

| File | Change |
|------|--------|
| `src/components/home/PodcastVisibilityGate.tsx` | Check `isOwner` BEFORE loading states |
| `src/components/Footer.tsx` | Add AI tool color mapping and apply to links |

---

### Testing Checklist

1. **Podcast Visibility:**
   - Log in as Owner account
   - Navigate to homepage
   - Verify podcast section is visible
   - Log out or use incognito
   - Verify podcast section is hidden for visitors

2. **Footer AI Tool Colors:**
   - Scroll to footer "Professional Tools" section
   - Verify each tool has its distinct accent color
   - Click on "AI ROI Calculator" - should have emerald styling in footer
   - Click on "AI Price Predictor" - should have blue styling in footer
   - Verify hover effects work with matching colors

