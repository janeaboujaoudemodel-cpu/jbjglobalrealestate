
# Comprehensive Fix Plan -- Add New Lead Form, CRM Layout, Homepage Performance & Video Scenes

This plan addresses all reported issues across the CRM and homepage in a single pass.

---

## 1. Add New Lead Form (`CRMLeadModal.tsx`)

**Problems**: Form is cropped at bottom, padding issues around birthday, no auto-save, no flags on language/nationality/city, no searchable dropdowns.

**Fixes**:
- Change `DialogContent` to use `max-h-[90vh] overflow-y-auto` so the form scrolls within the dialog and is never cropped
- Add consistent `space-y-3` padding between all fields including birthday label and input
- Replace plain `Input` for **Nationality** with a searchable `Command`-based dropdown listing all countries with flag emojis (e.g. "British", "Emirati", "Indian")
- Replace **Preferred Language** `Select` with a searchable `Command`-based dropdown with flag emojis (e.g. "English", "Arabic", "Russian")
- Replace **Country** `Input` with a searchable `Command`-based dropdown with flag emojis
- Replace **City** `Input` with a searchable `Command`-based dropdown (populated based on selected country, with common cities)
- Add `useFormAutoSave` hook integration (already exists in codebase at `src/hooks/useFormAutoSave.ts`) to auto-save all form fields to localStorage, restoring on re-open
- Create a shared data file `src/data/countries.ts` with country names, codes, flag emojis, nationalities, languages, and major cities

---

## 2. Team Communication Attach Button (`CRMCommunicationPanel.tsx`)

**Problem**: The Paperclip (attach) button at line 452-454 is a ghost button with no `onClick` handler -- clicking it does nothing.

**Fix**:
- Add a hidden `<input type="file">` ref
- Wire the Paperclip button's `onClick` to trigger the file input
- On file select, show a toast confirming the file name (full upload integration would require storage, but the button will at least open the file picker and acknowledge the selection)

---

## 3. CRM Vertical Sidebar

**Problem**: User wants a persistent vertical sidebar in the CRM (like the Owner Command Center) so they don't have to navigate back each time.

**Fix**:
- The CRM already has `CRMToolsSidebar` imported. Verify it renders persistently on the left side with the same champagne gold styling. If it's toggled/hidden by default, make it visible by default on desktop with a collapse toggle.

---

## 4. Mortgage Calculator Duplicate Title (`Index.tsx` + `MortgageCalculator.tsx`)

**Problem**: The homepage section at line 478 shows "Mortgage Calculator" as its own heading, then the `<MortgageCalculator compact />` component renders in compact mode (no internal title), BUT the section heading at line 478-479 is fine -- it shows "Mortgage" in black and "Calculator" in gold. The issue is likely that the non-compact header (lines 201-212) is also rendering. 

**Fix**:
- The compact mode (line 99) returns early before the non-compact header, so the homepage should only show one title. Investigate if `compact` prop is missing. Looking at line 487: `<MortgageCalculator compact />` -- this is correct. The duplicate may come from the section heading AND the compact cards having similar styling. Will verify and ensure only ONE title ("Mortgage" in black + "Calculator" in gold) appears.

---

## 5. Why Dubai Section -- Remove Photo, Fix Video Loading (`WhyDubaiCapitalSection.tsx`)

**Problem**: Shows a static photo of Burj Khalifa before video loads; video takes time to load.

**Fix**:
- Add `preload="auto"` for the first video scene to start loading immediately
- Use `poster` attribute with a dark/black poster or gradient so no static photo appears
- Ensure crossfade only triggers after `canplay` event fires

---

## 6. Remove "Burj Al Arab Aerial" Video Scene Completely

**Problem**: The `burj-al-arab-aerial.mp4` scene (described as "Icon tower" between Burj Khalifa and Palm scenes) must be deleted from the entire website.

**Files affected**:
- `src/components/PropertiesHeroVideo.tsx` -- Remove `burjAlArabVideo` from `VIDEO_SCENES` array (keep only downtown/burj-khalifa scene)
- `src/components/header/MegaMenuDevelopers.tsx` -- Replace `burjAlArabVideo` import with a different premium video (e.g. `why-dubai-downtown-burj-khalifa.mp4` or `dubai-landmarks-hero.mp4`)
- `src/components/home/WhyDubaiCapitalSection.tsx` -- This file does NOT use burj-al-arab-aerial (it uses downtown, burj-khalifa-day-to-night, and atlantis-palm), so the "second scene" complaint may refer to `burj-khalifa-day-to-night.mp4`. Since user says to keep Burj Khalifa and Palm but remove the middle one, the WhyDubai section is fine (3 scenes: downtown, burj-khalifa, atlantis-palm). The issue is only in PropertiesHeroVideo and MegaMenuDevelopers.

**Replacement**: Use `dubai-landmarks-hero.mp4` for the MegaMenuDevelopers featured card video.

---

## 7. Homepage Loading Performance

**Problem**: Navigation from CRM to homepage is slow; videos and content sections take time.

**Fix**:
- Ensure videos use `preload="none"` with IntersectionObserver (already implemented in WhyDubaiCapitalSection)
- For PropertiesHeroVideo, reduce to 1 scene (removing burj-al-arab), which cuts loading in half
- Add `fetchPriority="high"` to first visible content images
- Use `Suspense` boundaries already in place -- verify they have lightweight fallbacks

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/crm/CRMLeadModal.tsx` | Scrollable dialog, auto-save, searchable flag dropdowns for nationality/language/country/city, padding fixes |
| `src/data/countries.ts` | NEW -- Country data with flags, nationalities, languages, cities |
| `src/components/crm/CRMCommunicationPanel.tsx` | Wire attach button to file input |
| `src/pages/CRM.tsx` | Ensure CRMToolsSidebar is visible by default on desktop |
| `src/pages/Index.tsx` | Remove duplicate mortgage title if present |
| `src/components/home/WhyDubaiCapitalSection.tsx` | Video preload optimization |
| `src/components/PropertiesHeroVideo.tsx` | Remove burj-al-arab scene, keep only downtown scene |
| `src/components/header/MegaMenuDevelopers.tsx` | Replace burj-al-arab video with dubai-landmarks-hero |
