

# Add Flags + Complete Lists to Register Interest Form

## Problem
The ConsultationRequestForm has:
- Only ~20 hardcoded nationalities without flags
- Only ~11 hardcoded languages without flags
- Missing the comprehensive lists and flag mappings already available in `localeOptions.ts`

## Changes

### File: `src/constants/localeOptions.ts`

**Add a nationality/country flags mapping** (similar to `LANGUAGE_FLAGS`):

Add a new `COUNTRY_FLAGS` record mapping country names to emoji flags. This will cover all countries returned by `getCountryList()`. Example entries:
```
"United Arab Emirates": "🇦🇪",
"India": "🇮🇳",
"United Kingdom": "🇬🇧",
"United States": "🇺🇸",
...
```

Add two helper functions:
- `getCountryWithFlag(country: string): string` -- returns "flag country"
- `getCountryOptionsWithFlags()` -- returns array of `{ value, label, flag }` objects

### File: `src/components/ConsultationRequestForm.tsx`

**1. Replace hardcoded lists with centralized ones:**
- Remove the local `NATIONALITIES` array (lines 62-67)
- Remove the local `LANGUAGES` array (lines 69-72)
- Import `getCountryList`, `getLanguageList`, `LANGUAGE_FLAGS`, `COUNTRY_FLAGS` from `@/constants/localeOptions`

**2. Add flags to nationality dropdown:**
- Replace `{NATIONALITIES.map(...)}` with `{getCountryList().map(country => ...)}` 
- Each `SelectItem` displays: `COUNTRY_FLAGS[country] + " " + country`

**3. Add flags to language dropdown:**
- Replace `{LANGUAGES.map(...)}` with `{getLanguageList().map(lang => ...)}`
- Each `SelectItem` displays: `LANGUAGE_FLAGS[lang] + " " + lang`

**4. Add search/scroll for long lists:**
- Wrap `SelectContent` with `max-h-[300px] overflow-y-auto` so the full lists are scrollable

## Result
- Nationality dropdown shows all world countries with their flag emojis
- Language dropdown shows all 100+ languages with their flag emojis
- Both lists are scrollable and sourced from the centralized `localeOptions.ts`
- No more hardcoded short lists

