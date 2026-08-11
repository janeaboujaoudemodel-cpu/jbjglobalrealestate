---
name: Persisted Card Logo Revalidation (LOCKED)
description: Cards restored from localStorage (Continue Searching / recently viewed) must revalidate the developer logo against the database on every mount, never keep the stored URL.
type: constraint
---
`ContinueSearching` persists recently viewed items (including
`developerLogo`) in `localStorage` (`jbj_recent_searches`). The self-heal
effect must run for EVERY property card — not only when `developerLogo` is
empty — and patch the item whenever the canonical resolver returns a different
URL. Otherwise retired artwork (e.g. Grovy's old circular Instagram mark)
sticks in a visitor's browser forever after the backend logo is replaced.
Resolution is session-cached by developer name, so revalidation costs one
request per developer.
