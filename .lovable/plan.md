# Fix Broker Academy (`/broker/learning`)

Five tight fixes on `src/pages/broker/BrokerLearning.tsx` (+ small lesson-content file + reuse of the existing certificate component). No new dependencies, no schema changes.

## 1. Padding — Certificates & Progress section is touching the bottom

Wrap the page container so the final section breathes:

- Current: `className="w-full px-1 lg:px-2 py-2 flex flex-col gap-14"` then the Certificates section sits flush against the footer.
- Change page wrapper to `px-4 lg:px-8 pt-6 pb-16 gap-14` and add `pb-2` inside the Certificates section block so its bottom card has visible breathing room.

## 2. Premium locked Certificate — reuse the existing component

We already have `src/components/certification/CertificatePreview.tsx` (gold medallion, ribbon, JBJ chrome, `isLocked` prop). Reuse it — do not re-build.

- Replace the third "Books in progress" KPI tile (or extend the Certificates row to a 2-up + certificate panel) with a `<CertificatePreview isLocked={!allModulesComplete} />` panel inside a champagne card.
- Compute `allModulesComplete = TRAINING.every(m => (m.progress || 0) >= 100)`.
- When locked: render a clean **gold Lock icon** absolutely positioned `top-3 right-3` over the certificate (lucide `<Lock />`, `text-[#B89555]`, no fill, no badge ring — just the icon on a faint cream disc to feel premium).
- When unlocked: show the live certificate with the broker's `full_name` (already wired in `CertificatePreview` via `useAuth`) and a "Broker — Market Intelligence" title line driven by which modules they completed.
- Keep the existing "Certificates earned" + "Training progress" tiles; the certificate becomes a third sibling card spanning a wider column on `md:`.

## 3. Start button: white icon / white text on a white-ish hover state

Current button is `bg-[#102540] !text-white hover:bg-[#1a3d63] ... [&_svg]:!text-white`. Some users still see white-on-white on idle/hover because the Button shadcn variant overrides with its own foreground.

- Switch to a plain `<button>` (not shadcn `Button`) styled identically to the dialog's "Begin first lesson" CTA so behavior is guaranteed:
  `bg-[#102540] hover:bg-[#1a3d63] border border-[#B89555]/70 text-white` plus inline `style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}` and `data-allow-dark-cta data-no-contrast-guard`, with `<Play>` and label wrapped in `<span className="allow-white" style={{ color:"#FFFFFF" }}>`. This is the same hard-lock pattern already used on the AI Workspace Send button.

## 4. Start dialog must actually open the module with real content

Currently the dialog shows the topic list, then "Begin first lesson" just calls `setActiveModule(null)` (closes). Replace it with an in-dialog lesson viewer:

- Add new file `src/pages/broker/brokerLessonContent.ts` exporting a typed map keyed by module id (`reading-market`, `rent-conversations`, `buy-vs-rent`, `compliance-language`) where each value is `{ lessons: { title; body; bullets?; doAndDont? }[] }`. Content is sourced from the existing **Market Intelligence** reference material already in the page (`NEVER_SAY`, `ALWAYS_USE`, golden rules) plus short authored copy that matches each title exactly:
  - Reading the Market → trends / demand-supply signals / what data can vs cannot say / explaining to clients.
  - RENT Conversations → rent-trend phrasing, hesitation handling, area narratives.
  - BUY vs RENT Context → demand asymmetry, timing language.
  - Compliance & Language Guardrails → never-say list, always-use phrasing, insight vs advice.
- Replace dialog body with: progress bar at top, current lesson title, body paragraphs, bullet list, Prev / Next buttons, and a final-lesson "Mark complete" that bumps `m.progress` to 100 in local state (persistence is out of scope for this turn — the certificate unlock will react to local completion immediately).
- Keep the existing module header (icon, category, duration, lessons, +50 pts).

## 5. Book content correctness

`BookReader` (`src/pages/broker/BookReader.tsx`) already fetches per-book content from Supabase. No content rewrite this turn — verify the page renders the book whose id matches the route and ensure `Book3DCard.onOpen` opens the `BookDetailModal` whose **Read book** action navigates to `/broker/learning/book/:bookId`. If `BookDetailModal` is currently not routing to BookReader, fix the navigate target. (Read-only check first, surgical fix if needed.)

## Technical notes

- Files touched: `src/pages/broker/BrokerLearning.tsx` (layout, certificate panel, lesson dialog, Start button), new `src/pages/broker/brokerLessonContent.ts`, possibly one-line fix in `src/components/broker-education/BookDetailModal.tsx` for the Read action.
- No DB migration, no new edge function, no new package.
- Respects: No-Gold-Fills (lock icon is hairline gold on cream disc), Buttons-on-Champagne (Start CTA is navy not black), No-Gray (all surfaces stay champagne/cream).
