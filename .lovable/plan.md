

## Plan: Rename AI Hub + Remove "AI" from Amanda Labels

### What's happening now

1. **AI Hub page** (`/ai-hub`, `AIHub.tsx`): Title says "JBJ Tools Hub", SEO says "JBJ Tools Hub | Free AI Tools...". The owner sidebar label says "JBJ AI Tools Hub". You want it renamed to **"JBJ Royal Tools Hub"** everywhere — sidebar, page title, SEO.

2. **Amanda Clarke references**: In `EmailClient.tsx`, she's labeled "Amanda Clarke — AI Assistant" with an "Auto" badge. The word "AI" must be removed from all user-facing labels. She should appear as "Amanda Clarke — Executive Assistant" or similar. No mention of AI anywhere in the frontend for Amanda.

3. **Legacy RoyalToolsHub**: The old champagne page (`RoyalToolsHub.tsx`) still exists as a file but is no longer routed from owner sidebar (it was redirected to `/ai-hub`). The merge of tools into `AIHub.tsx` was already completed. No action needed on the old page beyond confirming the redirect stays.

### Changes

**1. Owner Sidebar — rename label**
- `OwnerSidebarNav.tsx` line 76: Change `"JBJ AI Tools Hub"` → `"JBJ Royal Tools Hub"`

**2. AIHub.tsx — rename page title and branding**
- Line 650 SEO title: `"JBJ Royal Tools Hub | Free Tools for Investors & Brokers"`
- Line 651 description: remove "AI" references, keep "tools"
- Line 652 keywords: `"JBJ Royal Tools Hub"` instead of `"JBJ Tools Hub"`
- Line 704-705 hero title: `"JBJ Royal Tools Hub"` 
- Line 713 subtitle: keep as-is or adjust
- Line 720: `"Free tools • Property analysis..."` (drop "AI" prefix)
- Line 846: `"Discover All Free Tools"` (drop "AI")
- Line 1047: `"30+ free tools for property analysis..."` (drop "AI")

**3. EmailClient.tsx — remove AI label from Amanda**
- Line 634: `"Amanda Clarke — AI Assistant"` → `"Amanda Clarke — Executive Assistant"`
- Any other "AI" references in Amanda's panel labels

**4. Premium exterior look (sidebar entry)**
- The sidebar entry for "JBJ Royal Tools Hub" will use a `Crown` icon (from lucide-react) instead of `Sparkles` to look more premium and attract attention, matching the "Royal" branding.

### Recommendation for the page interior (not applied, for your review)

I have one recommendation for the AIHub page interior that I will NOT apply without your approval:

**Recommendation**: Add a subtle animated gold crown/royal crest watermark behind the hero title, and replace the "Free for All Users" pill badge with a more premium "Royal Collection" badge with a crown icon. This would reinforce the "Royal Tools Hub" branding without changing any tool cards, categories, or layout structure. Everything else (colorful category sections, search, filters, glow effects) stays exactly as-is.

Should I mock this up, or do you prefer to keep the interior exactly as it is now?

