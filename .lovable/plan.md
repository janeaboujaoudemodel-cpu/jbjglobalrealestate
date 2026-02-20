
# Comprehensive Plan: Market Report Gating, Area Photos Fix & Areas Page Hero

This plan addresses four distinct issues reported.

---

## Part 1 — Market Report "Unlock Your Investment Edge" Gating

### Current State
The form already implements `useLeadCapture` and `isLeadCaptured`. Returning users who registered anywhere on the site (brochure, chat, other forms) get pre-filled form and a "Welcome back" bypass screen. **What is missing:**
- No user behavior tracking table to record which pages users visit, which AI tools they use, how long they spend on the page, and when they download the book
- No notification sent to the owner when a returning recognized user re-downloads the book

### Changes Required

**New database table: `user_activity_log`**
```sql
CREATE TABLE user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_email text NOT NULL,
  event_type text NOT NULL,        -- 'page_view', 'book_download', 'ai_tool_used', 'time_on_page'
  event_data jsonb DEFAULT '{}',   -- { page, tool_name, duration_seconds, details }
  page_url text,
  created_at timestamptz DEFAULT now()
);
```
RLS: insert-only for anon (tracking events), select restricted to service role (admin only).

**New hook: `useActivityTracking.ts`**
- Fires `page_view` event on mount with page URL, referrer, and lead email from localStorage
- Fires `time_on_page` event on unmount with duration in seconds
- Exposes `trackEvent(type, data)` for one-off events (book download, AI tool used)
- Reads lead email from `localStorage['jj_captured_lead']` — no login required

**`src/pages/MarketReport.tsx` changes:**
- Add `useActivityTracking` hook on mount — tracks how long user spends on this page
- After `handleSubmit` succeeds, call `trackEvent('book_download', { form_source: 'new_lead' })`
- After `handleDirectDownload` succeeds, call `trackEvent('book_download', { form_source: 'returning_lead' })`
- Send a **returning-user notification** inside `handleDirectDownload`: call `send-market-report-email` edge function with a flag `isReturning: true` so the owner knows this is a tracked re-download

**Admin visibility:**
- The existing `/admin/leads` CRM leads dashboard will gain an "Activity" tab that queries `user_activity_log` by email, showing a timeline of events per lead

---

## Part 2 — Area Card Broken Photos Fix

### Root Cause
`optimizeStorageImageUrl` converts `/object/public/` → `/render/image/public/` and appends `?width=600&quality=70`. Supabase image transformation fails on some files (especially `.jpg` files not stored as original-upload) returning a 404 or broken image.

The area card `<img>` in `AreaGuides.tsx` has no `onError` handler, so when the optimized URL fails the card shows a broken image icon instead of falling back.

### Fix
**`src/pages/AreaGuides.tsx`** — Add `onError` fallback to the area card image:
```tsx
<img
  src={optimizeStorageImageUrl(area.hero_image_url || area.image_url, 600, 70)}
  alt={area.name}
  className="..."
  loading={index < 8 ? "eager" : "lazy"}
  onError={(e) => {
    // Fall back to raw URL without transformation
    const rawUrl = area.hero_image_url || area.image_url;
    if (rawUrl && e.currentTarget.src !== rawUrl) {
      e.currentTarget.src = rawUrl;
    }
  }}
/>
```

This ensures:
- All 193 existing area cards with DB images continue to display
- MBR District 11, Al Jadaf, and any others with render-endpoint issues automatically fall back to the direct storage URL
- Existing good images are untouched (locked as per area-data-lock constraint)

---

## Part 3 — Other Emirates Areas

### Current State
The database already contains areas for all Emirates:
- Abu Dhabi: 17 areas (Al Bateen, Reem Island, Yas Island, Saadiyat Island, etc.)
- Ajman: 8 areas
- Ras Al Khaimah: 7 areas (split across "Ras Al Khaimah" and "Ras al-Khaimah" emirate labels)
- Sharjah: 9 areas
- Fujairah: 1 area
- Umm Al Quwain: 2 areas

**All of these are already showing in the grid** since `useAreas()` fetches all active areas. The photos are already set for all non-Dubai areas in the DB.

The emirate filter in `FilterShortcutBar` needs to normalize the emirate label variants ("Ras Al Khaimah" vs "Ras al-Khaimah" vs "Ras al-Khaimah Emirate") so the filter groups them correctly.

### Fix in `src/pages/AreaGuides.tsx`
Add emirate normalization when displaying the emirate badge and when filtering:
```tsx
function normalizeEmirate(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('abu dhabi')) return 'Abu Dhabi';
  if (lower.includes('ras al') || lower.includes('ras-al')) return 'Ras Al Khaimah';
  if (lower.includes('sharjah')) return 'Sharjah';
  if (lower.includes('ajman')) return 'Ajman';
  if (lower.includes('fujairah')) return 'Fujairah';
  if (lower.includes('umm')) return 'Umm Al Quwain';
  return raw;
}
```

---

## Part 4 — Areas Page Hero Section + Scroll-Triggered Header

### Current State
`AreaGuides.tsx` immediately locks the filter bar fixed and shows the vertical nav — no hero section exists. The user expects:
1. A premium hero section at the top (full-screen, like Properties page)
2. When at the hero, the GlobalHeader shows normally (horizontal at top)
3. When scrolling down past the hero, the vertical nav appears on the left and the filter bar takes over
4. When scrolling back up to the hero, it reverts to GlobalHeader

### Changes

**`src/pages/AreaGuides.tsx`:**

Add hero section at the top:
```tsx
<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
  {/* Background video/image — premium UAE aerial */}
  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('...')" }} />
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
  
  {/* Hero Content */}
  <div className="relative z-10 text-center px-4">
    <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Explore UAE</span>
    <h1 className="text-white text-5xl md:text-7xl font-bold mb-6">UAE Communities</h1>
    <p className="text-zinc-300 text-xl max-w-2xl mx-auto mb-10">
      Discover the UAE's most prestigious communities across all seven emirates
    </p>
    <button onClick={scrollToGrid} className="...">Explore Areas ↓</button>
  </div>
  
  {/* Emirate count badges */}
  <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6">
    {/* Dubai, Abu Dhabi, Sharjah, RAK, Ajman, Fujairah, UAQ counts */}
  </div>
</section>
```

**Scroll-triggered header switch (same pattern as Properties/Developers/Areas pages):**
```tsx
const heroRef = useRef<HTMLDivElement>(null);
const [pastHero, setPastHero] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      const isHeroVisible = entry.isIntersecting;
      setPastHero(!isHeroVisible);
      
      if (isHeroVisible) {
        document.body.classList.remove('filter-bar-fixed');
      } else {
        document.body.classList.add('filter-bar-fixed');
      }
    },
    { threshold: 0.1 }
  );
  if (heroRef.current) observer.observe(heroRef.current);
  return () => observer.disconnect();
}, []);
```

The vertical nav and fixed filter bar only render when `pastHero === true`, matching the exact pattern already used in `PropertiesReelly.tsx` and `Developers.tsx`.

---

## Implementation Scope

| Task | File | Change |
|---|---|---|
| New DB table for activity tracking | Migration | `user_activity_log` table + RLS |
| Activity tracking hook | `src/hooks/useActivityTracking.ts` | New file |
| Book download tracking + returning-user notification | `src/pages/MarketReport.tsx` | ~30 lines |
| Area card image `onError` fallback | `src/pages/AreaGuides.tsx` | 6 lines |
| Emirate label normalization | `src/pages/AreaGuides.tsx` | 15 lines |
| Hero section + scroll-triggered header | `src/pages/AreaGuides.tsx` | ~100 lines |
