

# Why Dubai Section & Podcast Visibility Implementation Plan

## Summary of Changes

This plan addresses all the requested changes to the "Why Dubai Became the Capital of Global Investors" section and implements an admin-only visibility toggle for the JBJ Podcast section.

---

## Part 1: Why Dubai Section - Video Transition Fixes

### Issue 1: Black Screen Between Scene Transitions
**Current State (Lines 40-62):**
```tsx
<AnimatePresence mode="wait">
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 1.2 }}  // Too slow - causes black gap
```

**Problem:** The `mode="wait"` combined with 1.2s transition creates a visible black gap when one video fades out before the next fades in.

**Fix:**
1. Change `mode="wait"` to `mode="sync"` - Allows outgoing/incoming to overlap
2. Reduce transition duration from 1.2s to 0.6s for faster crossfade
3. Add `preload="auto"` to improve video loading time
4. Implement video preloading for smoother transitions

**New Code:**
```tsx
<AnimatePresence mode="sync">
  <motion.div
    key={currentScene}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6 }}  // Faster crossfade
    className="absolute inset-0"
  >
    <video
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"  // Changed from "metadata" for faster loading
    >
```

---

## Part 2: Title Readability - White Text with Gold Accent

### Current State (Lines 78-84):
```tsx
<h2 className="... text-primary-foreground ...">
  <T>Why Dubai Became the Capital of</T>{" "}
  <span className="text-gold"><T>Global Investors</T></span>
</h2>
```

**Fix:** Make the main title pure white for better contrast, keep only "Global Investors" in gold:

```tsx
<h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
    style={{ 
      fontFamily: "Poppins, sans-serif",
      textShadow: '0 2px 8px rgba(0,0,0,0.6)'  // Add shadow for readability
    }}>
  <T>Why Dubai Became the Capital of</T>{" "}
  <span className="text-gold"><T>Global Investors</T></span>
</h2>
```

---

## Part 3: Premium Stats Cards Redesign

### Current State (Lines 90-103):
Simple cards with minimal styling:
```tsx
<div className="rounded-md border border-gold/20 bg-black/40 backdrop-blur-sm px-2 py-2 text-center">
```

**New Premium Design:**
- Glass morphism effect with stronger blur
- Gradient gold border that glows on hover
- Larger, bolder value text
- Better padding and spacing
- Subtle shimmer animation

**New Code:**
```tsx
<div className="mt-6 grid grid-cols-4 gap-2 max-w-md">
  {stats.map((s, index) => (
    <motion.div
      key={s.label}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative rounded-xl overflow-hidden"
    >
      {/* Gradient border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold/40 via-gold/20 to-gold/40 p-[1px]">
        <div className="h-full w-full rounded-xl bg-black/60 backdrop-blur-md" />
      </div>
      
      {/* Content */}
      <div className="relative px-3 py-3 text-center">
        <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gold leading-none"
             style={{ textShadow: '0 0 20px rgba(200,167,102,0.5)' }}>
          {s.value}
        </div>
        <div className="mt-1 text-[9px] md:text-[10px] uppercase tracking-wider text-white/70 font-medium">
          <T>{s.label}</T>
        </div>
      </div>
      
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
           style={{ boxShadow: '0 0 30px rgba(200,167,102,0.4)' }} />
    </motion.div>
  ))}
</div>
```

---

## Part 4: CTA Button - Match Homepage Hero Style

### Current State (Lines 105-112):
```tsx
<Button asChild variant="primary" size="lg">
  <Link to="/guides/investment">
    <T>Explore Investment Opportunities</T>
    <ArrowRight className="w-5 h-5" />
  </Link>
</Button>
```

**Fix:** Use `PremiumHeroButton` component to match homepage hero:

```tsx
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

<div className="mt-8 md:mt-10">
  <PremiumHeroButton href="/guides/investment" size="lg">
    <T>Explore Investment Opportunities</T>
  </PremiumHeroButton>
</div>
```

This applies the exact same styling as the homepage hero buttons:
- Transparent background with white border
- White text with gold arrow icon
- On hover: Champagne gradient fill, gold border, black text

---

## Part 5: Remove Gold Circle Bulb

**Note:** The search through the code did not find any explicit "gold circle bulb" element. The user may be referring to:
1. A visual artifact in the video itself (cannot fix via code)
2. The navigation dots which were already removed (see line 117: "NO DOTS - removed as per user request")

If there's any remaining gold circle, it might be coming from the video content itself, not the code overlay.

---

## Part 6: JBJ Podcast Section - Admin-Only Visibility

### Database Changes

**Create new site_settings entry:**
```sql
INSERT INTO public.site_settings (setting_key, setting_value, description)
VALUES (
  'podcast_visibility',
  '{"enabled": false}'::jsonb,
  'Controls visibility of JBJ Podcast section on homepage. When disabled, section is hidden from all users except admins.'
);

-- Create RPC function to toggle podcast visibility
CREATE OR REPLACE FUNCTION public.set_podcast_visibility(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.site_settings
  SET setting_value = jsonb_build_object('enabled', p_enabled),
      updated_at = now(),
      updated_by = auth.uid()
  WHERE setting_key = 'podcast_visibility';
  
  RETURN p_enabled;
END;
$$;
```

### New Context: PodcastVisibilityContext

**Create:** `src/contexts/PodcastVisibilityContext.tsx`

```tsx
// Similar structure to FounderVisibilityContext
// - Fetches 'podcast_visibility' from site_settings
// - Provides isPodcastVisible, isLoading, togglePodcastVisibility
// - For non-admins: section is hidden when disabled
// - For admins/owners: section is always visible for testing
```

### New Component: PodcastVisibilityToggle

**Create:** `src/components/admin/PodcastVisibilityToggle.tsx`

- Similar UI to FounderVisibilityToggle
- Placed in Admin panel Security tab next to Founder toggle
- Shows current status (Visible/Hidden)
- Toggle switch with confirmation dialog

### Update Index.tsx

**Current (Line 634-635):**
```tsx
{/* JBJ PODCAST SECTION */}
<JBJPodcastSection />
```

**New:**
```tsx
{/* JBJ PODCAST SECTION - Admin-controlled visibility */}
<PodcastVisibilityGate>
  <SectionDivider />
  <JBJPodcastSection />
</PodcastVisibilityGate>
```

**PodcastVisibilityGate Logic:**
```tsx
const PodcastVisibilityGate = ({ children }) => {
  const { isPodcastVisible, isLoading } = usePodcastVisibility();
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check if current user has admin/owner role
    if (user) {
      Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
      ]).then(([adminRes, ownerRes]) => {
        setIsAdmin(adminRes.data || ownerRes.data);
      });
    }
  }, [user]);
  
  // Admin/Owner always sees podcast for testing
  if (isAdmin) return <>{children}</>;
  
  // Non-admin: only show if enabled
  if (!isPodcastVisible) return null;
  
  return <>{children}</>;
};
```

### Update Admin.tsx - Security Tab

**Add to imports:**
```tsx
import { PodcastVisibilityToggle } from "@/components/admin/PodcastVisibilityToggle";
```

**Update Security TabsContent (Line 484-487):**
```tsx
<TabsContent value="security" className="space-y-8">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <SecurityDashboardSummary />
    <FounderVisibilityToggle />
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <PodcastVisibilityToggle />
  </div>
</TabsContent>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/WhyDubaiCapitalSection.tsx` | Fix transitions, title, cards, CTA button |
| `src/contexts/PodcastVisibilityContext.tsx` | **CREATE** - Context for podcast visibility |
| `src/components/admin/PodcastVisibilityToggle.tsx` | **CREATE** - Admin toggle component |
| `src/components/home/PodcastVisibilityGate.tsx` | **CREATE** - Gate component for conditional rendering |
| `src/pages/Index.tsx` | Wrap podcast section with visibility gate |
| `src/pages/Admin.tsx` | Add podcast toggle to Security tab |
| `src/App.tsx` | Add PodcastVisibilityProvider |
| Database Migration | Add podcast_visibility setting and RPC function |

---

## Visual Summary

| Element | Before | After |
|---------|--------|-------|
| Video transition | 1.2s with black gap | 0.6s smooth crossfade |
| Title color | primary-foreground | Pure white with text shadow |
| Stats cards | Simple bordered boxes | Premium glass cards with glow |
| CTA button | Basic Button component | PremiumHeroButton (matches homepage) |
| Podcast section | Always visible | Admin toggle controls visibility |

---

## Admin Panel Addition

The Security tab in Admin panel will have:

```
+----------------------------------+----------------------------------+
|   Security Dashboard Summary     |   Founder Visibility Control     |
+----------------------------------+----------------------------------+
|   Podcast Visibility Control     |                                  |
+----------------------------------+----------------------------------+
```

Podcast toggle will show:
- Current status (Visible to Public / Hidden - Admin Only)
- Toggle switch
- Confirmation dialog when changing
- Info notice explaining the toggle only affects public visibility, admin always sees it

