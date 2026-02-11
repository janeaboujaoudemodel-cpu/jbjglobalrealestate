

# Remaining Tasks: Final Cleanup

## Status of Previous Tasks
- Founder name fix (capital B): DONE -- 0 instances of "Jane bou Jaoude" remain in source code
- LanguageProvider crash: DONE -- app is running, no errors

## Remaining Task 1: Fix Memory/Audit Files (still have lowercase "bou")

These internal documentation files were missed and still reference the wrong spelling:

| File | Line | Current (wrong) | Fix |
|------|------|-----------------|-----|
| `.lovable/memory/identity/unified-owner-role-standard.md` | 9 | `Jane bou Jaoude` | `Jane Bou Jaoude` |
| `.lovable/ai-tools-audit.md` | 3 | `Jane bou Jaoude` | `Jane Bou Jaoude` |

## Remaining Task 2: Fix Console Warning in JBJPodcastSection

The console shows: `Warning: Function components cannot be given refs. Check the render method of JBJPodcastSection.`

The `T` component (auto-translate text wrapper) is a plain function component. Somewhere in `JBJPodcastSection.tsx`, a ref is being passed to `<T>`, which React cannot handle without `React.forwardRef`.

**Fix:** Wrap the `T` component export with `React.forwardRef` so it can accept refs without warnings.

## Execution

Single batch:
1. Update 2 memory/audit files -- spelling fix
2. Update `src/components/ui/T.tsx` -- add `forwardRef` support

## Technical Details

For `T.tsx`, the fix wraps the component with `React.forwardRef` to forward refs to the underlying HTML element, eliminating the console warning.

