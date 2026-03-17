

## Comprehensive Fix Plan — All Missing Implementations

After thorough code inspection, here are all issues that were previously claimed as implemented but are **NOT IMPLEMENTED** or only **PARTIALLY IMPLEMENTED**.

---

### ISSUE 1: Company Profile Brochure — Text is black on dark background
**File:** `src/components/books/CompanyProfileBrochure.tsx`  
**Status:** NOT IMPLEMENTED  
**Problem:** Lines 94-96 use `text-black` and `text-black/50` — completely unreadable on the dark section background in `HomepageBookMarquee.tsx`.  
**Fix:**
- Line 94: `text-black` → `text-[#E8DCC8]` (warm light tone)
- Line 95: `text-black/50` → `text-zinc-400`

---

### ISSUE 2: AI Home Finder — Icon & badge should match purple style (balanced)
**File:** `src/pages/Index.tsx`  
**Status:** PARTIALLY IMPLEMENTED — badge has subtle purple but icon circle is still gold-only  
**Problem:** Line 457-458: The Sparkles icon circle uses `from-gold/20 to-gold/10` and `border-gold/30`. The "AI-Powered" badge is subtle purple. User wants balanced purple treatment — icon, accent border, and light glow become purple while card stays luxury.  
**Fix:**
- Line 451: Badge stays `bg-purple-900/10 border-purple-800/20 text-purple-900` (already done)
- Line 457: Icon circle background: `from-purple-500/20 to-purple-400/10`, border: `border-purple-400/30`, shadow: `shadow-[0_0_30px_rgba(139,92,246,0.25)]`
- Line 458: Sparkles icon: `text-purple-500` (hover: `text-purple-400`)
- Add a subtle purple accent to the top shine line (line 446): `via-purple-400/30`

---

### ISSUE 3: AI Home Finder — Floating animation on load
**File:** `src/pages/Index.tsx`  
**Status:** NOT IMPLEMENTED  
**Problem:** No floating idle animation. Currently only has entry scale (0.97→1) and hover.  
**Fix:** Add a CSS keyframe `@keyframes float` with subtle y-axis oscillation (0→-8px→0, 6s ease-in-out infinite). Apply to the motion.div wrapper via a `<style>` tag or inline animation. This creates a gentle floating feel after initial load.

---

### ISSUE 4: Chat Support — Elegant pulse on collapsed button
**File:** `src/components/chat/CollapsedChatButton.tsx`  
**Status:** PARTIALLY IMPLEMENTED — has `showAttentionPulse` banner mode but no elegant always-on pulse  
**Problem:** The collapsed circle button (line 114-122) has no pulse. Only the expanded banner mode (line 78-112) has a green dot pulse. User wants an elegant pulse on the circle button too.  
**Fix:** When `showAttentionPulse` is false (circle mode), add a gold ring pulse animation around the circle button: a `before` pseudo-element or sibling div with `animate-ping` at `border-gold/30` to create a gentle outward pulse ring. Apply via CSS: `ring-2 ring-gold/30 animate-[pulse_2s_ease-in-out_infinite]`.

---

### ISSUE 5: Explore Our Services — Section padding too tight
**File:** `src/pages/Index.tsx`  
**Status:** NOT IMPLEMENTED  
**Problem:** Line 396: `py-8 md:py-12` — services section touches the next section (toolkit). 
**Fix:** Change to `py-12 md:py-20` (48px → 80px desktop) for proper breathing room.

---

### ISSUE 6: Header — No navigation arrows for horizontal scroll
**File:** `src/components/navigation/HorizontalUtilityBar.tsx`  
**Status:** NOT IMPLEMENTED — `ChevronLeft`/`ChevronRight` are imported but never rendered as scroll navigation arrows  
**Problem:** No arrow buttons were added to Row 1 for controlled horizontal scrolling.  
**Fix:** Wrap Row 1 content in a relative container. Add positioned left/right arrow buttons (absolute, at edges) that call `scrollBy` on the row. Show/hide based on scroll position using a `useRef` + scroll event listener. Arrows: 28px gold circles with `ChevronLeft`/`ChevronRight`, subtle border, appear only on overflow.

---

### ISSUE 7: Sidebar — Bottom section rounded borders
**File:** `src/components/navigation/GlobalVerticalNav.tsx`  
**Status:** PARTIALLY IMPLEMENTED — `rounded-xl overflow-hidden` was mentioned but line 1226 shows only `rounded-xl overflow-hidden` on the bottom container  
**Verification needed:** Line 1226 already has `rounded-xl overflow-hidden` — this appears implemented. Will confirm no visual clipping remains.

---

### ISSUE 8: Company Profile page — Text contrast on dark sections
**File:** `src/pages/CompanyProfile.tsx`  
**Status:** NOT IMPLEMENTED  
**Problem:** `SectionShell` uses `bg-black` (line 58). Inside sections, text uses `text-black` (e.g., lines 1133, 1147, 1167, 1197) which is invisible on black background. The previous fix only changed one subtitle.  
**Fix:** In `SectionShell`, change `bg-black` → `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` (dark luxury brown per brand standard). Then update all inner text to use `text-white` or `text-[#E8DCC8]` instead of `text-black`. Headers: `text-white`, body: `text-white/80`, muted: `text-zinc-400`, gold accents stay `text-gold`.

---

### ISSUE 9: Sidebar text readability
**File:** `src/components/navigation/GlobalVerticalNav.tsx`  
**Status:** IMPLEMENTED (verified) — Section headers at line 1166 use `text-black/65` default and `text-black/85` highlighted. Divider at line 1225 uses `via-gold/50`. Sub-items use proper contrast via `getItemStyle`.

---

### Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/books/CompanyProfileBrochure.tsx` | Fix text colors for dark bg |
| `src/pages/Index.tsx` | AI Home Finder purple balanced styling, floating animation, services padding |
| `src/components/chat/CollapsedChatButton.tsx` | Add elegant pulse ring to circle button |
| `src/components/navigation/HorizontalUtilityBar.tsx` | Add scroll navigation arrows to Row 1 |
| `src/pages/CompanyProfile.tsx` | Fix SectionShell bg + all text contrast |

### Spacing Values
- Services section: `py-8 md:py-12` → `py-12 md:py-20` (80px desktop)
- AI Home Finder floating: `translateY(0) → translateY(-8px)` over 6s
- Header arrows: 28px circles, gold border
- Chat pulse ring: 2s ease-in-out infinite

