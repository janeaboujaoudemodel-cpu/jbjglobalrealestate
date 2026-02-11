

# Fix Plan: Brochure Logo, Form Enhancements, Contact Card Borders, Sticky Nav Scroll, and CallToAction Removal

## 1. Use Uploaded JBJ Logo in Brochure Card Circle

**File:** `src/components/project-detail/PremiumBrochureCard.tsx`

- Copy `user-uploads://fulllogo-11.jpg` to `src/assets/jbj-fulllogo-dark-bg.jpg`
- Import this new image and use it as the `src` in the brochure card monogram circle (line 151), replacing `jbjMonogramNobuffer`
- The dark background of the uploaded logo will blend well with the dark overlay in the circle container

## 2. Register Interest Form Enhancements

**File:** `src/components/ConsultationRequestForm.tsx`

- **Widen form:** Change `max-w-lg` to `max-w-xl` on both the form container (line 208) and success state (line 188) to give more breathing room
- **Gold project name in title:** When `projectName` is provided, render the title so the project name appears in gold. Split the title to render "Register Interest in" in black and the project name in `text-gold`
- **Champagne card background:** The form container already has `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]` -- this is confirmed correct

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

- The outer wrapper at line 1115 already applies champagne gradient -- confirmed good

## 3. Remove the "Request a Callback Now" Section

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

- Remove line 1127: `<CallToActionSection projectName={project.name} projectId={project.id} />` since its fields are now consolidated into the ConsultationRequestForm
- This eliminates the duplicate form on the project detail page

## 4. WhatsApp and Call Us Card Borders to Gold in CombinedContactNewsletter

**File:** `src/components/CombinedContactNewsletter.tsx`

- **WhatsApp card (line 29):** Change `border-emerald-500` to `border-gold` and shadow to `shadow-gold/20`, hover to `hover:border-gold/40`
- **Call Us card (line 40):** Change `border-blue-500` to `border-gold` and shadow to `shadow-gold/20`, hover to `hover:border-gold/40`

## 5. Fix Sticky Sub-Navigation Horizontal Scroll

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

The sticky nav at line 577 uses `overflow-x-auto` but touch/swipe gestures conflict with browser back/forward navigation. Fixes:

- Add `touch-action: pan-y` via inline style on the scrollable container to prevent horizontal swipes from triggering browser navigation
- Add `overscroll-behavior-x: contain` to trap the scroll within the container
- Optionally add left/right scroll arrow buttons that appear when content overflows, so users can navigate tabs without swiping

## 6. Improve Sticky Nav Styling

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

- Match the tab styling to the champagne/gold theme of the Register Interest section
- Active tab: keep `bg-gold/10 text-gold border border-gold/30`
- Inactive tab: use `text-white/70 hover:text-gold hover:bg-gold/5` for better contrast on the dark background

## Summary of Files to Change

| File | Change |
|------|--------|
| `src/assets/jbj-fulllogo-dark-bg.jpg` | Copy uploaded logo image |
| `src/components/project-detail/PremiumBrochureCard.tsx` | Use new logo in brochure circle |
| `src/components/ConsultationRequestForm.tsx` | Widen to max-w-xl; gold project name in title |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Remove CallToActionSection; fix sticky nav scroll with touch-action and overscroll-behavior |
| `src/components/CombinedContactNewsletter.tsx` | Change WhatsApp and Call Us card borders to gold |

