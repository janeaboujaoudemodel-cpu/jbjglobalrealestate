

## Fix Guides Page Issues and Area Property Count

### Issue 1: White Text on Bright Buttons ("Not Sure Where to Start" Card)

**Problem:** The "Ask a Question" and "Contact Support" buttons in the "Not sure where to start?" card use `PremiumHeroButton`, which has hardcoded `text-white` and `border-white/70`. This component was designed for dark hero backgrounds. Inside the `jj-card-inner` (champagne gradient), the white text is nearly invisible.

**Fix:** Replace `PremiumHeroButton` with custom styled buttons that use black text, gold borders, and a 3D hover effect. The normal state will have `border-2 border-gold/40`, black text, and champagne fill. On hover, a 3D effect with elevated shadow and gold glow will activate.

Also stretch the "Not sure where to start" card by changing `max-w-3xl` to `max-w-5xl` so it fills more horizontal space.

**File:** `src/pages/Guides.tsx` (lines 406-421)

---

### Issue 2: Newsletter Email Field Needs Bold Border

**Problem:** In the "Ready to Get Started?" section, the compact newsletter email input has a thin `border border-gold/30`. It needs a bolder border matching the gold theme, and a 3D hover effect.

**Fix:** Update the compact variant input in `NewsletterBrevo.tsx` to use `border-2 border-gold/50` normally, and on hover/focus add a 3D shadow effect with `shadow-[0_4px_15px_rgba(200,167,102,0.3)]`.

**File:** `src/components/marketing/NewsletterBrevo.tsx` (line 127)

---

### Issue 3: Add 6th "What You'll Learn" Card

**Problem:** There are 5 learning topic cards. User wants a 6th card related to the existing "Fee clarity and what is paid when" topic, providing additional value.

**Fix:** Add a new entry to the `learningTopics` array with a relevant topic like "Payment plan structures and milestones" covering how installments work in off-plan purchases.

**File:** `src/pages/Guides.tsx` (lines 98-124)

---

### Issue 4: Guide Hero Section - Remove Book Placeholder, Add Video

**Problem:** The hero currently shows a static book/icon placeholder with "How to Use the Guides" and "Video placeholder only" text (lines 213-221). This looks unprofessional and the content overlaps visually.

**Fix:** Replace the placeholder with an actual background video element (using the same pattern as other hero sections). Use a Dubai real estate stock video. Remove the "How to Use the Guides" book icon overlay entirely. Clean up the hero content layout to prevent any overlap with proper z-indexing and spacing.

**File:** `src/pages/Guides.tsx` (lines 210-224)

---

### Issue 5: Area Page Property Count Shows Wrong Number

**Problem:** The user sees "2,409" properties on the area page. The `ProjectCountStat` component already queries the database dynamically (which now returns 1,808 after our cleanup). This is a browser cache issue -- the stale query result is cached by TanStack Query with `staleTime: 5 * 60 * 1000` (5 minutes).

**Fix:** Reduce the `staleTime` to 60 seconds so counts refresh faster. Additionally, invalidate this query key when the page loads to ensure fresh data.

**File:** `src/pages/AreaGuides.tsx` (line 33)

---

### Issue 6: Global Audit - PremiumHeroButton on Bright Backgrounds

**Problem:** `PremiumHeroButton` with white text may be used in other bright-background sections across the platform.

**Fix:** Add a `variant` prop to `PremiumHeroButton` supporting `"dark-bg"` (default, current behavior) and `"light-bg"` (black text, gold border, 3D hover). Update all instances where the button sits on champagne/light backgrounds to use `variant="light-bg"`.

**File:** `src/components/ui/premium-hero-button.tsx`

---

### Summary of Files Modified

| File | Change |
|------|--------|
| `src/components/ui/premium-hero-button.tsx` | Add `variant="light-bg"` support with black text, gold borders, 3D hover |
| `src/pages/Guides.tsx` | Use light-bg buttons in CTA card, stretch card wider, add 6th learning card, replace hero placeholder with video |
| `src/components/marketing/NewsletterBrevo.tsx` | Bold gold border on compact email input, 3D hover effect |
| `src/pages/AreaGuides.tsx` | Reduce staleTime for property count query |

