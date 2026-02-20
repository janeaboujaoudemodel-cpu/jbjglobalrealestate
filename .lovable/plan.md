

# Fix Quiz / AI Home Finder: Multiple UI and Logic Issues

## Issues to Fix (8 items)

### 1. Founder Name Not Wrapped with FounderContent Toggle
**Lines 494-498 and 642-645 in Quiz.tsx** display "The Founder & CEO, Jane Bou Jaoude" in plain text without the `<FounderContent>` wrapper. When the admin toggle hides founder info, these still show.

**Fix:** Import `FounderContent` and wrap both instances. Show fallback text "JBJ Global Real Estate Team" when founder is hidden.

---

### 2. "Select All" / "Clear All" Buttons Not Visible (Purple on Purple)
**Lines 698-716 in Quiz.tsx** — the buttons use `border-purple-500/50 text-white` and `border-zinc-700 text-white` on a purple/dark background, making them nearly invisible.

**Fix:** Change both buttons to use solid white background with dark text: `bg-white text-zinc-900 hover:bg-zinc-200 border-white/80` so they stand out clearly, matching the style of the Next button area.

---

### 3. "Location Type" Question Needs to Be Multi-Select with "Select All"
**Line 92-99 in Quiz.tsx** — `location_type` is currently `type: "single"`. The user wants it to allow multiple selections and include a "Select All" option.

**Fix:** Change `type: "single"` to `type: "multiple"` and add `hasSelectAll: true` to the `location_type` question definition.

---

### 4. Back Button Missing on Quiz Question Screen
**Lines 753-763 in Quiz.tsx** — Only a "Next" button exists, centered. There is a Back in the header but the user wants explicit Back/Next buttons at the bottom.

**Fix:** Replace the single centered Next button with a two-column layout:
- Left: "Back" button (goes to previous step or exit)
- Right: "Next" button (current behavior)

---

### 5. Auto-Recognize Logged-In Users (Skip Form)
**Lines 507-660 in Quiz.tsx** — The form always shows asking for name, email, phone, nationality, language. If the user is already logged in (`user` from `useAuth()`), their profile data should be auto-filled and the form should be skipped or pre-populated.

**Fix:** When `user` is authenticated, auto-populate `formData` from the user's profile (query the `profiles` table for name, phone, nationality, language). If all required fields are filled from the profile, skip the form entirely and go straight to results. Same principle applies to any other download forms that ask for details.

---

### 6. Nationality / Preferred Language Dropdowns — Black on Black (Unreadable)
**Lines 577-596 in Quiz.tsx** — The `SearchableSelect` component has `bg-white text-black` styling (from searchable-select.tsx line 75), but on the dark quiz background (zinc-900/50), the trigger button renders with white background which should be fine. However, the issue is the popover content and trigger might not have proper contrast on this dark page.

**Fix:** Pass custom `triggerClassName` to both SearchableSelect instances in the quiz form to use dark-themed styling: `bg-zinc-800/50 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white`. Also pass a `className` for the popover to use dark styling.

---

### 7. "Add Badge" Button Not Visible (Gray on Dark Background)
**Lines 343-345 and 408 in QuizResults.tsx** — The badge button uses `border-white/40 text-white bg-white/10 hover:bg-white/20` which is extremely faint on the dark background.

**Fix:** Change to a more visible style: `border-purple-500 text-white bg-purple-600/30 hover:bg-purple-600/50 border` to make it clearly visible with a purple accent.

---

### 8. Project Cards Need Purple Border + Consistent Height for Area Guide Cards
**Lines 383-434 in QuizResults.tsx** — The "More Great Options" cards have no visible border, and area guide cards may render shorter.

**Fix:** Add `border-2 border-purple-500/40 rounded-2xl overflow-hidden` to each card wrapper div. Add `min-h-[420px]` to ensure consistent card heights across the grid.

---

## Technical Details

### Files to Edit

| File | Changes |
|------|---------|
| `src/pages/Quiz.tsx` | (1) Import + wrap founder text with `FounderContent`, (2) Fix Select All/Clear All button colors, (3) Change location_type to multiple + hasSelectAll, (4) Add Back button next to Next, (5) Auto-fill form from profile + skip if complete, (6) Fix SearchableSelect dark theme |
| `src/pages/QuizResults.tsx` | (7) Fix Add Badge button visibility, (8) Add purple border + min-height to cards |
| `src/components/ui/searchable-select.tsx` | Add support for dark-mode variant via optional prop or triggerClassName override |

### Auto-Recognize User Logic

```text
// In Quiz.tsx, after user is available:
useEffect(() => {
  if (user) {
    // Fetch profile from profiles table
    supabase.from("profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setFormData(prev => ({
            fullName: data.full_name || data.display_name || prev.fullName,
            email: user.email || prev.email,
            phone: data.phone || prev.phone,
            nationality: data.nationality || prev.nationality,
            preferredLanguage: data.preferred_language || prev.preferredLanguage,
          }));
        } else {
          // At minimum fill email from auth
          setFormData(prev => ({ ...prev, email: user.email || prev.email }));
        }
      });
  }
}, [user]);

// In handleNext — if user is logged in and formData is complete, skip form
const handleNext = () => {
  if (currentStep < QUIZ_QUESTIONS.length - 1) {
    setCurrentStep(currentStep + 1);
  } else {
    // If logged in and all fields filled, skip form
    if (user && isFormValid()) {
      proceedToResults();
    } else {
      setShowForm(true);
    }
  }
};
```

### Back/Next Button Layout

```text
<div className="flex justify-between mt-10 gap-4">
  <Button
    onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setStarted(false)}
    variant="outline"
    className="border-white text-white bg-white/10 hover:bg-white/20 px-8 py-6 text-lg"
  >
    <ChevronLeft className="w-5 h-5 mr-2" />
    Back
  </Button>
  <Button
    onClick={handleNext}
    disabled={!isAnswered()}
    className="bg-gradient-to-r from-purple-600 to-purple-800 ..."
  >
    {currentStep === QUIZ_QUESTIONS.length - 1 ? "Continue" : "Next"}
    <ChevronRight className="w-5 h-5 ml-2" />
  </Button>
</div>
```

