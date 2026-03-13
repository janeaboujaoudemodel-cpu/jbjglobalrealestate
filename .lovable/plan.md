

## Plan: Icon Audit, Landing Page Fixes, Business Card Templates & Routing Bug Fix

### Scope Summary

This plan covers 5 workstreams the user identified:

1. **Platform-wide emoji/icon audit** — remove all standard emojis, replace with Lucide SVG icons
2. **Fix ComingSoon/maintenance landing page** — ensure it works standalone, looks premium
3. **Business card digital landing page** — deploy edge functions, add template gallery, fix AI model
4. **URL routing bug** — visiting the website root must go to homepage, not `/card`
5. **Front/Back highlighting and edge function connectivity**

---

### 1. Emoji/Icon Audit — Replace All Standard Emojis with Lucide Icons

**Files with emojis to fix** (found via search):

| File | Emojis Found | Replacement |
|------|-------------|-------------|
| `DigitalLandingPageEditor.tsx` | `✨ Hero Bio`, `🔗 Social Links`, `🏢 Featured Projects`, `⭐ Testimonials` + social platform emojis (`📸`, `▶️`, `🎵`, `💬`, `✈️`) | Use `Sparkles`, `Link2`, `Building2`, `Star`, and matching Lucide/react-icons for each platform |
| `FoundersHotLeadsPanel.tsx` | `⭐ VIP` badge | Use `Star` Lucide icon |
| `StampHistoryDashboard.tsx` | `★ FAV`, `★` markers | Use `Star` Lucide icon with fill |
| `Quiz.tsx` | `🏢`, `🏠`, `🏘️`, `🌆`, `📐` option icons + `✨` in toasts | Use `Building2`, `Home`, `Landmark`, `Sunrise`, `Ruler` Lucide icons; remove emoji from toast strings |
| `BeautyFilters.tsx` | `✨`, `🌟`, `🎭`, `📷`, `🟫`, `⬜`, `✂️`, `💁`, `⭐`, `🌊`, `🌿`, `👁️`, `💋` preset/look emojis | Replace all with descriptive text labels or small Lucide icons |
| `EmailClient.tsx` | `📊`, `📅` in email body strings | Remove emojis from mock data strings |
| `Documents.tsx` | `✨ AI Document Editor` dialog title | Use `Sparkles` icon inline |
| `DeveloperPortal.tsx` | `📅` date prefix | Use `Calendar` Lucide icon |
| `ListingPortalSubmit.tsx` | `📁`, `🏠`, `📄`, `🖼️` type labels | Use `Folder`, `Home`, `FileText`, `Image` Lucide icons |
| `VoiceStudioPro.tsx` | `✨` in toast | Remove emoji from toast string |
| `AIVideoStudio.tsx` | `✨` in toast | Remove emoji from toast string |
| `slash-command-executor.ts` | `📊` in message strings | Remove emoji |
| `StampProjectWizard.tsx` | `★` glyph for stamp separator — **KEEP** (this is a design glyph for stamps, not UI chrome) |

**Rule**: Every emoji in UI labels, button text, section headers, toasts, badges, and option labels gets replaced with a Lucide SVG icon or removed entirely. Decorative stamp glyphs in the stamp generator are excluded.

---

### 2. Fix ComingSoon / Maintenance Landing Page

**Current state**: `ComingSoon.tsx` exists but is not wired to any route in the route files. It uses `Crown` and `Sparkles` Lucide icons (already compliant).

**Changes**:
- Wire `/coming-soon` route in `PublicRoutes.tsx` so it's accessible
- Ensure the page works as a standalone maintenance/splash page
- Add a configurable mode prop or URL param: `?mode=maintenance` | `coming-soon` | `opening-soon` | `welcome-back` that changes the heading text
- Keep the current premium black+gold design (already looks good)

---

### 3. Business Card Digital Landing Page — Templates, Edge Functions, AI Model

**Current state**: 
- `DigitalLandingPageEditor.tsx` lets users build a landing page with bio, social links, featured cards, testimonials
- The AI card design generator edge function exists (`ai-card-design-generator`, `ai-card-gallery-generator`)
- `SharedBusinessCard.tsx` renders shared cards at `/card/:token`
- No template gallery exists for landing page designs

**Changes**:

#### 3a. Add Template Gallery for Digital Landing Pages
- Create `DigitalLandingPageTemplates.tsx` component with 6-8 pre-built template previews
- Templates: "Minimal Dark", "Corporate Gold", "Creative Gradient", "Photo-First", "Social Hub", "Magazine", "Portfolio"
- Each template defines: layout structure, color palette, font pairing, section order
- User can select a template to auto-populate the landing page editor
- Add color palette picker that syncs with the chosen template
- Option: "Match from website" (extracts colors from a URL), "Match from photo" (upload image, extract dominant colors via edge function), "Match from Instagram" (paste IG URL)

#### 3b. Color Extraction Edge Function
- Create or extend an edge function `extract-logo-colors` (already exists) to accept image uploads and return dominant color palette
- This feeds into both business card and landing page color matching

#### 3c. Fix Edge Function Connectivity
- Verify `ai-card-design-generator` and `ai-card-gallery-generator` are properly configured in `config.toml` with `verify_jwt = false`
- Ensure the SharedBusinessCard page at `/card/:token` properly loads and renders without redirecting

#### 3d. Trade License / Instagram / Prompt-Based Generation
- In the digital card editor, add upload fields for:
  - Trade license (parsed via existing `document-ocr` edge function to auto-fill company info)
  - Instagram page URL (scrape profile info via edge function)
  - Free-text prompt describing the business
- These inputs feed into the AI card gallery generator to produce matching designs

---

### 4. URL Routing Bug Fix — Root Domain Must Go to Homepage

**Root cause**: The SPA fallback in `_redirects` sends all paths to `index.html`, and React Router handles routing. The issue is likely browser caching or a service worker caching `/card` as the last visited page, causing it to reopen on next visit.

**Investigation needed**: Check if there's a service worker or PWA manifest caching the `/card` route. The `_redirects` file looks correct (SPA fallback is last).

**Fix**:
- Verify no service worker is aggressively caching navigation to `/card`
- Ensure `/card` route does NOT have any redirect logic that captures the root `/` path
- Check `DigitalCard.tsx` for any `window.location` or history manipulation that might affect the root URL
- If there's a PWA `sw.js`, ensure it doesn't cache navigation requests

---

### 5. Files to Modify

| File | Changes |
|------|---------|
| ~15 component/page files | Remove emojis, replace with Lucide icons |
| `src/routes/PublicRoutes.tsx` | Add `/coming-soon` route |
| `src/pages/ComingSoon.tsx` | Add mode support (maintenance/opening-soon/welcome-back) |
| `src/components/corporate-suite/DigitalLandingPageEditor.tsx` | Replace all emojis with Lucide icons, add template selection |
| New: `src/components/corporate-suite/DigitalLandingPageTemplates.tsx` | Template gallery component |
| `src/components/corporate-suite/BusinessCardCenterPanel.tsx` | Wire template selection into digital card flow |
| `supabase/config.toml` | Verify edge function JWT settings |
| `public/_redirects` | Verify routing rules |

This is a large scope. I recommend implementing in phases: (1) emoji audit + routing fix first, (2) template gallery + edge functions second.

