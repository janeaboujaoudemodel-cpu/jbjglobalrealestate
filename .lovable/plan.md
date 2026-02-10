
# Fix Language System and Ticket UI

## Problem 1: Language Not Switching

**Root cause:** Removing `GlobalTranslator` was correct (it caused mixed languages and loops), BUT many components have hardcoded English strings that were only translated by GlobalTranslator's DOM mutation. The `t()` function works, but dozens of text strings bypass it entirely.

**Examples found:**
- `ServicesGrid.tsx`: Card titles "Buy", "Rent", "Sell", "Management" and descriptions are hardcoded in a static array (lines 24-53), rendered directly without `t()`
- `Index.tsx` line 218: `"Trusted By Thousands"` hardcoded
- `Index.tsx` line 226: `"Excellence Guaranteed"` hardcoded
- Many other components define text in static arrays/objects outside the render function, never passing through `t()`

**Fix:** Wrap all user-visible hardcoded strings in `t()` calls across the major public-facing components. This is a systematic sweep of:

1. **`src/components/home/ServicesGrid.tsx`** -- Move service card titles/descriptions to use `t()` keys
2. **`src/pages/Index.tsx`** -- Replace all hardcoded section labels ("Trusted By Thousands", "Excellence Guaranteed", card labels like "Investors", "Brokers", "Landlords", "Tenants", "Developers", etc.) with `t()` calls
3. **`src/components/home/WhyChooseUs.tsx`** -- Value prop titles/descriptions through `t()`
4. **`src/components/home/TestimonialsSection.tsx`** -- Section headings and testimonial labels through `t()`
5. **`src/components/home/AreasWeCover.tsx`** -- Section heading through `t()`
6. **`src/components/home/FeaturedListings.tsx`** -- Tab labels and section text through `t()`
7. **`src/components/home/TrustBar.tsx`** -- Trust item labels through `t()`
8. **All 15 translation files** (`en.ts`, `ar.ts`, `es.ts`, `fr.ts`, `ru.ts`, `zh.ts`, `hi.ts`, `fa.ts`, `tr.ts`, `de.ts`, `it.ts`, `nl.ts`, `he.ts`, `pl.ts`, `ja.ts`) -- Add new translation keys for each hardcoded string

This ensures that when the user switches language, React re-renders with the correct language text already computed, and the layout adapts naturally.

---

## Problem 2: Ticket Detail Panel -- Ticket Number Shows Vertical

**Root cause:** In `TicketDetailPanel.tsx` line 275-277, the ticket number is displayed in a `div` that wraps vertically when the header is narrow. The ticket number, priority badge, and status badge are in a flex container but without `flex-wrap` control, causing the number to stack vertically.

**Fix:** In `TicketDetailPanel.tsx`:
- Make the header layout use `flex-row items-center gap-2 flex-wrap` properly
- Keep ticket number, priority, and status badges on a single horizontal line with `whitespace-nowrap`
- Reduce padding to prevent overflow in the 500px panel width

---

## Problem 3: Ticket Detail Panel -- Overall UI Too Tall/Spacious

**Root cause:** The detail panel sections (Customer Details, Description, Actions, AI Suggestions, Conversation) each have generous padding (`p-4`, `space-y-6`) making the panel feel stretched.

**Fix:** Compact the TicketDetailPanel:
- Reduce `space-y-6` to `space-y-4`
- Reduce section padding from `p-4` to `p-3`
- Make customer details grid tighter
- Reduce AI suggestion card padding
- Make reply composer more compact (reduce textarea rows from 3 to 2, reduce padding)

---

## Problem 4: AI Suggest Reply Takes Too Long

**Root cause:** The `ai-ticket-reply-suggest` edge function uses a non-streaming call to the AI gateway. The response time depends on the model used and prompt length.

**Fix:** 
- Check the edge function for the model being used and switch to a faster model if needed (e.g., `google/gemini-2.5-flash-lite` for simple reply suggestions)
- Add a "Generating..." progress indicator with elapsed time so the user knows it is working
- Add a timeout (30 seconds) so it doesn't hang indefinitely

---

## Technical Summary

### Files to modify:
1. **`src/components/home/ServicesGrid.tsx`** -- Use `t()` for card text
2. **`src/pages/Index.tsx`** -- Use `t()` for all hardcoded section strings
3. **`src/components/home/WhyChooseUs.tsx`** -- Use `t()` for value props
4. **`src/components/home/TestimonialsSection.tsx`** -- Use `t()` for section text
5. **`src/components/home/AreasWeCover.tsx`** -- Use `t()` for section text
6. **`src/components/home/FeaturedListings.tsx`** -- Use `t()` for tab labels
7. **`src/components/home/TrustBar.tsx`** -- Use `t()` for trust items
8. **All 15 translation files** -- Add new keys for every hardcoded string
9. **`src/components/support/TicketDetailPanel.tsx`** -- Fix header layout (horizontal ticket number), compact all sections
10. **`supabase/functions/ai-ticket-reply-suggest/index.ts`** -- Optimize model choice for speed
