

# Fix Plan: Revert Founder Name + Fix LanguageProvider Crash

## Two Critical Issues

### Issue 1: Founder Name Was Wrongly Changed
The previous edits incorrectly changed "Jane Bou Jaoude" (capital B) to "Jane bou Jaoude" (lowercase b). The correct spelling is **"Jane Bou Jaoude"** with a capital B. All changes must be reverted.

**Files that were wrongly changed (need revert back to capital B):**

| File | What to fix |
|------|-------------|
| `src/constants/stats.ts` | `founder`, `founderBilingual` |
| `src/config/master-lock.ts` | `FOUNDER_NAME`, `FOUNDER_NAME_BILINGUAL`, `FOUNDER_FULL_TITLE` |
| `src/components/GlobalSEO.tsx` | 2 instances in JSON-LD schemas |
| `src/components/SEOHead.tsx` | `FOUNDER_KEYWORDS` line 20, lines 39, 54, 79 |
| `src/translations/en.ts` | `founder.name`, `founder.description2`, `report.description`, `report.createdBy` |
| `src/translations/fr.ts` | Same 4 keys |
| `src/translations/de.ts` | Same 4 keys |
| `src/translations/es.ts` | Same 4 keys |
| `src/translations/ru.ts` | Same 4 keys |
| `src/translations/ja.ts` | Same 4 keys |
| `src/translations/zh.ts` | Same 4 keys |
| `src/translations/nl.ts` | Same 4 keys |
| `src/translations/he.ts` | Same 4 keys |
| `src/translations/tr.ts` | Same 4 keys |
| `src/translations/pl.ts` | Same 4 keys |
| `src/translations/hi.ts` | Same 4 keys |
| `src/translations/fa.ts` | Same 4 keys |

All changes: case-sensitive replace `Jane bou Jaoude` back to `Jane Bou Jaoude`.

### Issue 2: "useLanguage must be used within a LanguageProvider" Crash

The `LanguageProvider` wraps the entire app in `App.tsx` (line 327), so this error only occurs if the provider itself crashes during initialization. The most likely cause is a syntax error introduced in one of the translation files during the previous batch edits. When a translation file fails to import, the `LanguageProvider` component fails to mount, and any child calling `useLanguage()` throws.

**Fix:** Reverting the translation files (Issue 1) will restore valid syntax and fix this crash. I will also verify each translation file's closing syntax to ensure no truncation or bracket mismatch.

---

## Execution

**Single batch:** Revert all 18 files simultaneously (constants, SEO, GlobalSEO, and 13 translation files). This is a straightforward find-and-replace: `Jane bou Jaoude` back to `Jane Bou Jaoude` in every file that was changed.

