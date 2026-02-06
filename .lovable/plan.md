
# Fix Plan: Critical Post-Publish Issues

Based on my thorough investigation, here are all the issues identified and the proposed solutions:

---

## Issue Summary

| # | Issue | Root Cause | Priority |
|---|-------|------------|----------|
| 1 | Sign In/Sign Up infinite loading | Auth loading state not completing properly | Critical |
| 2 | Newsletter "Stay in the Loop" not working | `capture-lead` edge function call failing | Critical |
| 3 | Support ticket not saving/sending emails | Edge function not being triggered properly | Critical |
| 4 | Hero search bar gap around search button | Search button has padding wrapper causing visual gap | Medium |
| 5 | Website slowness/video loading | Video preload optimization needed | Medium |
| 6 | Homepage divider inconsistency | Missing dividers between some sections | Medium |
| 7 | AI Home Finder not centered vertically | Section padding asymmetry | Low |
| 8 | E-book page broken title/text | Content rendering issues in MarketReport.tsx | Medium |
| 9 | Download Book section styling | Section not using consistent layer styling | Medium |

---

## Detailed Fixes

### 1. Fix Auth Sign In/Sign Up Infinite Loading

**Problem**: The Auth.tsx loading state shows a spinner when `loading` is true from AuthContext, but the loading state may not resolve properly on the published site.

**Location**: `src/contexts/AuthContext.tsx` and `src/pages/Auth.tsx`

**Fix**:
- Add a timeout safety mechanism to the auth loading state
- Ensure the loading state completes even if session check fails
- Add error boundary handling for auth initialization

```typescript
// In AuthContext.tsx - add timeout to prevent infinite loading
useEffect(() => {
  let mounted = true;
  let timeoutId: NodeJS.Timeout;

  const applySession = async (nextSession: Session | null) => {
    if (!mounted) return;
    // ... existing logic
    if (mounted) setLoading(false);
  };

  // Safety timeout - force loading to false after 5 seconds
  timeoutId = setTimeout(() => {
    if (mounted && loading) {
      console.warn('Auth loading timeout - forcing completion');
      setLoading(false);
    }
  }, 5000);

  // ... rest of existing logic

  return () => {
    mounted = false;
    clearTimeout(timeoutId);
    subscription.unsubscribe();
  };
}, []);
```

---

### 2. Fix Newsletter "Stay in the Loop" Functionality

**Problem**: Network request shows `capture-lead` edge function call failing with "Failed to fetch" error. The edge function exists and has proper code, but the call is failing on the published site.

**Location**: `src/components/marketing/NewsletterBrevo.tsx` and `supabase/functions/capture-lead/index.ts`

**Fix**:
- Add better error handling and retry logic
- Ensure the Supabase client is properly initialized before making calls
- Add fallback mechanism if capture-lead fails
- Check if the issue is related to CORS or network timeouts

```typescript
// In NewsletterBrevo.tsx - add retry logic and better error handling
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email) return;

  setIsSubmitting(true);

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Try capture-lead with retry
    let retryCount = 0;
    const maxRetries = 2;
    let success = false;

    while (retryCount <= maxRetries && !success) {
      try {
        const { data: captureResult, error: captureError } = await supabase.functions.invoke('capture-lead', {
          body: {
            email: normalizedEmail,
            fullName: name || null,
            source: 'newsletter',
            subSource: source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            pageSource: window.location.pathname,
            contactType: 'client',
          },
        });

        if (!captureError && !(captureResult as any)?.error) {
          success = true;
        } else {
          throw captureError || new Error((captureResult as any)?.error);
        }
      } catch (err) {
        retryCount++;
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    if (!success) {
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Continue with Brevo sync...
    // ... rest of existing code
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    toast.error('Something went wrong. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### 3. Fix Support Ticket System

**Problem**: Support tickets not being saved to database or sending confirmation emails. The edge function `submit-support-ticket` exists but may not be deployed or is failing silently.

**Location**: `src/components/SupportTicketBox.tsx` and `supabase/functions/submit-support-ticket/index.ts`

**Fix**:
- Verify edge function is deployed
- Add better error handling and user feedback
- Ensure the email sender configuration is correct (using `onboarding@resend.dev` which is only for testing)

```typescript
// In submit-support-ticket/index.ts - fix email sender
// Change from:
from: "JBJ Support <onboarding@resend.dev>",
// To verified domain:
from: "JBJ Support <NOREPLY@JBJGLOBALREALESTATE.COM>",
```

---

### 4. Fix Hero Search Bar Gap

**Problem**: Visual gap around the search button/icon in the hero section. The search button is wrapped in a padding container creating unwanted spacing.

**Location**: `src/components/home/HeroSearchBar.tsx` (lines 914-923)

**Fix**:
```typescript
// Current (with gap):
<div className="p-1.5">
  <Button onClick={handleSearch} className="h-10 px-6 py-2.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-xl transition-all duration-300 shadow-lg hover:shadow-gold/30">
    <Search className="w-4 h-4 mr-1.5" />
    Search
  </Button>
</div>

// Fixed (no gap, button fills to edge):
<Button
  onClick={handleSearch}
  className="h-full px-6 py-3.5 bg-gold hover:bg-gold-dark text-black font-bold text-sm rounded-r-xl transition-all duration-300 shadow-lg hover:shadow-gold/30"
>
  <Search className="w-4 h-4 mr-1.5" />
  Search
</Button>
```

---

### 5. Improve Website Speed and Video Loading

**Problem**: Website feels slow, videos not loading fast.

**Location**: `src/pages/Index.tsx` (video element)

**Fix**:
- Add `preload="metadata"` instead of `preload="auto"` for faster initial load
- Add loading priority hints
- Consider lazy loading non-critical videos

```html
<video 
  autoPlay 
  loop 
  muted 
  playsInline
  preload="metadata"  <!-- Changed from "auto" -->
  poster={luxuryVillaHero}  <!-- Add poster for immediate visual -->
  webkit-playsinline="true"
  className="absolute inset-0 w-full h-full object-cover z-[1]"
>
```

---

### 6. Fix Homepage Divider Consistency

**Problem**: Some sections have two dividers, some have none. The spacing between sections is inconsistent.

**Location**: `src/pages/Index.tsx`

**Current State Analysis**:
- Developer Partners → Trust Bar: Has divider ✓
- Featured Listings → Find Your Starting Point: Missing divider
- Explore Services → Toolkit Showcase: Missing divider
- AI Home Finder → AI Comparison: Missing divider

**Fix**: Add missing `<SectionDivider />` components between all major sections for consistent rhythm.

---

### 7. Center AI Home Finder Vertically

**Problem**: The AI Home Finder card is not centered vertically within its section.

**Location**: `src/pages/Index.tsx` (lines 496-544)

**Fix**:
```typescript
// Current:
<section className="py-12 md:py-16 bg-black">

// Fixed with equal padding and flex centering:
<section className="py-12 md:py-16 bg-black flex items-center justify-center">
```

---

### 8. Fix E-book/Market Report Page

**Problem**: The "Download your free book now" page has broken title and text.

**Location**: `src/pages/MarketReport.tsx`

**Fix**: Review and fix the content rendering, ensure proper text styling and readability.

---

### 9. Fix Download Book Section Styling

**Problem**: The Download Book section cards (Welcome Back, What You Will Receive, Created by JBJ) should match the "Unlock Your Investment Edge" section styling.

**Location**: `src/pages/MarketReport.tsx`

**Fix**: Apply consistent `jj-layer-2` wrapper and champagne gradient styling to match other premium sections.

---

## Implementation Order

1. **Critical** - Fix Auth loading (unblocks user access)
2. **Critical** - Fix Newsletter edge function calls
3. **Critical** - Fix Support Ticket system
4. **High** - Fix Search bar visual gap
5. **Medium** - Add missing homepage dividers
6. **Medium** - Optimize video loading
7. **Medium** - Fix AI Home Finder centering
8. **Medium** - Fix MarketReport page styling
9. **Low** - Fine-tune other visual polish

---

## Technical Notes

### Edge Function Deployment
The edge functions exist but may need redeployment. Will deploy:
- `capture-lead`
- `newsletter-subscribe`
- `submit-support-ticket`

### RESEND_API_KEY Configuration
The `RESEND_API_KEY` secret is configured, but the email sender in `submit-support-ticket` uses `onboarding@resend.dev` which only works for test emails. This needs to be changed to the verified domain sender.

### Auth Context Race Condition
The auth loading issue may be caused by a race condition between `getSession()` and `onAuthStateChange`. Adding a timeout safety net prevents infinite loading states.
