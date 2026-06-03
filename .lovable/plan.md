# AI Home Finder — Never-Empty Matchmaker + Persistence

## Goals

1. Never show "We couldn't load…" — always return 3 properties: exact matches first, then nearest matches with a transparent label.
2. Add a **Criteria × Properties** comparison table: user requirements as rows, top 3 properties as columns, with ✓ / ✗ / "≈" cells.
3. Persist the entire matchmaker session (answers, lead form, results) so refresh/close/reopen resumes from the last reached step (quiz → lead form → results), and offer a "Start a new match" action.
4. Rename UX from "Quiz" to **Matchmaker** in visible copy (route stays `/quiz-results` for compatibility).
5. Validate flow A→E in browser with screenshots.

## 1. Nearest-match fallback (Quiz.tsx → proceedToResults + QuizResults.tsx)

Tiered scoring instead of binary filter:

- **Tier 1 — Exact**: passes all hard filters (budget, bedrooms, area, timeline).
- **Tier 2 — Close**: relax ONE filter at a time, in priority order: area → timeline → bedrooms ±1 → budget ±25%.
- **Tier 3 — Nearest**: drop area + timeline, keep budget±50% & bedrooms±2.
- **Tier 4 — Top-rated fallback**: any non-sold-out project, ordered by score.

Always return 3 slugs. Pass per-slug match metadata via URL-safe state:

- New URL params: `tiers=exact,close,nearest` (one per slug) and `relaxed=area|timeline|none`.
- Or persist full match payload in `sessionStorage` keyed by `session=<id>` (also restored on reload — see §3).

Results page banner copy adapts:
- All exact → "3 perfect matches".
- Mixed → "1 exact match + 2 closest alternatives".
- All nearest → "No exact matches in inventory — here are the closest 3 to your criteria".

Empty state from §current code is removed; replaced by a guaranteed Tier-4 fallback (only if DB truly returns zero published projects, show a single retry CTA — extremely rare).

## 2. Criteria × Properties comparison table (new section in QuizResults.tsx)

New `<MatchCriteriaTable />` component rendered above the Top-3 cards.

Columns: Your requirement · Property #1 · Property #2 · Property #3.

Rows generated from answers:

| Criterion | Your pick | P1 | P2 | P3 |
|---|---|---|---|---|
| Budget | AED 2–5M | ✓ 3.4M | ≈ 5.6M | ✓ 4.1M |
| Bedrooms | 2 BR | ✓ | ✓ | ✗ Studio–1BR |
| Area | Dubai Marina | ✓ | ≈ JLT (nearby) | ✗ Business Bay |
| Timeline | Ready by 2026 | ✓ Q4 2025 | ✓ 2026 | ≈ 2027 |
| Location type | Beachfront | ✓ Sea view | ✗ City | ✓ Marina |
| Features | Pool, Gym | ✓ ✓ | ✓ ✗ | ✓ ✓ |

Cell rendering:
- `✓` emerald (`#10B981`) on tiffany-tinted panel — match.
- `≈` amber (`#F59E0B`) — close/partial match (e.g., adjacent area, ±10% budget).
- `✗` red (`#EF4444`) — does not match.

Each cell also shows the actual value for transparency. The same table is included in the PDF report (`buildPdf`) — adds one new branded autoTable above existing comparison.

## 3. Session persistence (refresh/close-safe)

New `useMatchmakerSession` hook (read/write to `localStorage` under `jbj.matchmaker.session.v1`):

```
{
  sessionId,
  step: "quiz" | "lead-form" | "results",
  answers,
  currentQuestionIndex,
  formData,
  resultSlugs,
  resultTiers,
  createdAt,
  updatedAt
}
```

Behavior:

- **Quiz.tsx**: on every `setAnswers` / `setCurrentStep` / `setShowForm` → write to storage. On mount, if a session exists and `step !== "completed-discarded"`, restore state silently and show a small dismissable chip: *"Resuming your matchmaker — [Start over]"*.
- **After `proceedToResults`**: write `step: "results"` + `resultSlugs` before navigating.
- **QuizResults.tsx**: on mount, if URL has no `projects=` param but session has `resultSlugs`, reconstruct URL via `navigate(..., { replace: true })`. If URL has slugs, just hydrate criteria from session for the comparison table.
- **"Start a new match" button** on results page: clears storage, routes to `/quiz`. Replaces today's auto-empty fallback to retake.
- A "Would you like to refine your match?" prompt only appears when user manually returns to `/quiz` while a session exists.

## 4. Copy rename (Quiz → Matchmaker)

Visible labels only — files: `Quiz.tsx`, `QuizResults.tsx`, share modal, PDF header.

- "Retake the AI quiz" → "Start a new match"
- "Your AI-Selected Properties" stays.
- Hero/intro pill: "#1 AI Property Matchmaker" (already correct).
- Loading/toasts: "Finding your matches…" instead of "Saving quiz…".
- Routes, query keys, table names untouched.

## 5. Validation (flow A→E with browser tool)

After build:

- **A**: `/quiz` fresh — answer all questions → see Lead Form → submit → land on `/quiz-results` with 3 cards + new comparison table. Screenshot.
- **B**: Pick deliberately impossible combo (budget under-1m + Palm Jumeirah + Ready). Confirm Tier-3/4 fallback returns 3 properties with the "closest alternatives" banner and the table shows ≈/✗ cells. Screenshot.
- **C**: Mid-quiz refresh → resume on same question with answers intact. Screenshot.
- **D**: Refresh on results page → still shows the same 3 properties + table. Screenshot.
- **E**: Click "Download Report" → PDF includes branded header, criteria table, top-3 comparison. Click "Share with Consultant" → modal is tiffany-themed. Screenshot.

Console + network checked for errors at each step.

## Technical files touched

- `src/pages/Quiz.tsx` — tiered recommendation engine, persistence writes, copy.
- `src/pages/QuizResults.tsx` — remove hard empty state, add `<MatchCriteriaTable />`, banner copy by tier, resume from session, PDF additions.
- `src/components/matchmaker/MatchCriteriaTable.tsx` — new.
- `src/hooks/useMatchmakerSession.ts` — new.
- No DB schema changes; existing `quiz_responses` insert kept.

## Out of scope

- Renaming routes/tables.
- Re-theming unrelated pages.
- Changing scoring weights beyond the tiered relaxation logic above.
