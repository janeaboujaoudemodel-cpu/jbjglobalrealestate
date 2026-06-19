---
name: Off-Plan Default Recommendation Rule
description: Recommended Projects strip and any recommendation surface must prefer off-plan inventory; never promote Ready/Completed/Handed-Over projects unless the user explicitly filters for ready.
type: feature
---

# Off-Plan Default Recommendation Rule

Globally, every "Recommended", "More like this", "You may also like", and "Trending" recommendation strip on the public site MUST default to **off-plan** projects only.

- Exclude any project whose `handover_date` matches `/ready|completed|handed over/i`.
- Exclude any project with a handover year strictly before the current calendar year (already-delivered).
- Sale-status badges on recommendation cards MUST use champagne+gold treatment (`bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/70`); never orange, emerald-500, or red-500 fills.
- Owner/admin or explicit user filters for "Ready" override this default ONLY inside the user's own search.

Implemented in `src/components/project-detail/RecommendedProjects.tsx`.
