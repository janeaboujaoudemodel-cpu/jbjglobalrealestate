---
name: src/index.css Freeze
description: No new !important declarations, :root blocks, or global class definitions in src/index.css — flag instead
type: constraint
---
Forbidden from Aug 14 2026 onward: adding any new `!important` declaration, new `:root` block, or new global class definition to `src/index.css`.

**Why:** the file is 32k+ lines of ad-hoc patches and is mid-consolidation; new global additions conflict with that work.

**How to apply:** scope new styling to the specific component or a dedicated scoped stylesheet under `src/styles/`. If a task appears to require an `!important` override in `src/index.css`, stop and flag it to the owner instead of adding it.
