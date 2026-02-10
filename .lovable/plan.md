

# Fix Language System and Mobile Content Overflow

## Root Cause Analysis

The language switching issues (mixed languages, layout breaking, content overflowing cards) all stem from one component: **GlobalTranslator.tsx**.

This component uses a browser-level MutationObserver to intercept ALL text on the page and replace it after React has already rendered. This causes:

- **Mixed languages**: React renders content, then GlobalTranslator replaces some text nodes but misses others, creating a half-English, half-Arabic page
- **Layout breaking on switch**: Text replacement happens AFTER layout is calculated, causing reflows and content jumping
- **Content overflowing cards**: Translated text (especially Arabic, German, Russian) is often longer than English, and since the translation happens after render, CSS containers don't adapt properly
- **Infinite loops**: The MutationObserver detects its own text changes and re-triggers, causing flickering

## The Fix

### Step 1: Remove GlobalTranslator (the broken component)

Remove `GlobalTranslator` from `App.tsx`. This single change eliminates all the race conditions, mixed-language artifacts, and layout-breaking behavior.

### Step 2: Ensure all UI text uses `t()` function (React-native translation)

The app already has ~24 components using `t('key', 'fallback')` properly through React context. This is the correct approach - translations happen BEFORE render, so the layout engine sees the final text and sizes containers correctly.

For any remaining hardcoded strings in key user-facing components (headers, buttons, labels), wrap them with `t()` calls using existing translation keys.

### Step 3: Add global CSS overflow protection

Add defensive CSS rules to prevent ANY text from breaking out of its container, regardless of language:

```text
- word-break: break-word on all card containers
- overflow-wrap: anywhere on text elements
- min-width: 0 on flex children (prevents flex items from overflowing)
- hyphens: auto for long words in non-English languages
```

### Step 4: RTL layout fix

Ensure the `dir="rtl"` attribute on `<html>` (already set by LanguageContext) works with Tailwind's RTL utilities. Add `rtl:` prefixed classes where needed for padding/margin direction.

## Files to Modify

1. **`src/App.tsx`** - Remove `GlobalTranslator` import and usage
2. **`src/components/GlobalTranslator.tsx`** - Delete this file entirely
3. **`src/App.css`** or **`src/index.css`** - Add global overflow-protection CSS rules
4. **Key components** (homepage sections, cards, headers) - Verify `t()` usage covers all visible text

## Technical Details

### Why `t()` is correct and GlobalTranslator is not

```text
t() approach (correct):
  React state changes -> component re-renders -> translated text in JSX -> layout calculated -> painted

GlobalTranslator approach (broken):
  React renders English -> layout calculated -> painted -> MutationObserver fires -> DOM text replaced -> layout recalculated -> repainted -> MutationObserver fires again (loop)
```

### Overflow protection CSS

```text
.card, [class*="rounded"] {
  overflow: hidden;
  word-break: break-word;
}

* {
  overflow-wrap: break-word;
}
```

### What stays working

- The `t()` function in LanguageContext (unchanged, already correct)
- All 15 language translation files (unchanged, already complete)
- The `<T>` component for inline text translation (unchanged)
- Language switcher UI (unchanged)
- RTL support for Arabic, Persian, Hebrew (unchanged)

## Impact

- No more mixed languages when switching
- No more layout breaking on language change
- Content stays within card boundaries on all devices
- Faster rendering (no MutationObserver overhead running every 1.5 seconds)
- Some hardcoded English strings in components that don't use `t()` will remain in English until individually wrapped - but this is better than the current broken mixed-language state

