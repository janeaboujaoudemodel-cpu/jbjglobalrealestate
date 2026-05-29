## What I found (inspection summary)

I inspected the whole academy/certification stack. Findings:

### Visual problems you flagged
1. **Book covers are crowded.** `PremiumBookCover` stacks 6 ornaments on every cover — JBJ medallion ring, title block, gold rule, subtitle, *full Burj Khalifa skyline silhouette*, double gold frame, "No. X" tag, footer wordmark. On long titles ("Buyer & Investor Advisory" etc.) the title runs into the medallion above and the skyline below. That's the "overlay hiding the title/description" you see, plus the "lines/designs on the books" you want removed.
2. **The card under each cover repeats** the title, the learning-path chip, and the description — so the same title is shown twice (once engraved, once below), creating the cluttered feel.
3. **Certificate contrast issues.** Faded champagne text on dark obsidian: body copy uses `text-[#EFE6D6]/65` and `/80` → fails contrast on the dark plate; the "Company Seal" dashed placeholder reads as a broken element; the giant `PREVIEW` watermark you want gone; mobile stamp duplicated below; "Founder & CEO" / signature line cramped against the date column.

### Critical wiring gap (nothing currently works end-to-end)
4. **No code writes to `broker_education_progress`.** I grepped the entire repo — the table is only read, never written. So:
   - Lessons can't be marked complete from `BookReader`.
   - `broker_points` (shown on `/broker/account` as "Points Earned") is never incremented.
   - The certificate unlock condition (`allModulesComplete`) is computed from local React state only, not from the DB — so it resets on refresh and never reflects real progress.
   - The `broker_education_tests` table (75 modules × N questions) exists but has zero UI.
5. **Two certification systems coexist.** `CertificationSection` (phases via `useCertification`) is imported in `BrokerLearning.tsx` but never rendered — only `CertificatePreview` is used. Dead import → confusion about which is authoritative.

---

## Plan (3 acts)

### Act 1 — Book cover & library layout (premium + readable)

`src/components/books/PremiumBookCover.tsx`
- Delete the Burj-Khalifa skyline block (lines 108–127) and the double-frame inner ring. Keep only: dark gradient, single 1px gold hairline frame inset 8%, left spine, optional `No. X` tag.
- Remove the JBJ circular medallion above the title. Title sits centered, vertically balanced.
- Title block: tighten `splitTitle` to max 3 lines, drop max font-size to `clamp(9px, 9.5cqw, 44px)`, increase line-height to 1.15 so descenders don't clip the gold rule.
- Move footer wordmark `JBJ GLOBAL REAL ESTATE` from bottom-edge to a single-line eyebrow above the title, smaller, in `#B89555`. Drop "| BROKER LEARNING LIBRARY".
- Subtitle (learning path) stays under the gold rule.

`src/components/broker-education/Book3DCard.tsx`
- Remove the title `<h3>` and the description `<p>` block (lines 96–104) — the cover already shows the title. Keep only: learning-path chip + CTA button.
- Rebalance card min-height (currently `min-h-[218px]`) since two text blocks are leaving. Replace with `min-h-[120px]` so the cover dominates the card visually.
- Replace status badge with a discreet gold dot + small "In progress 3/5" / "Completed" pill in the cover top-right (no colored fills — uses `#EFE6D6` + ink per the No-Gold-Fills rule).

`src/pages/broker/BrokerLearning.tsx`
- Library grid → switch to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` so books feel like a real shelf, not 1 per row on tablet.
- Group label upgraded to PremiumSectionCard band per memory: full-bleed champagne band with gold hairline title rule.
- Add a chapter/lesson flow strip under each group: `Foundations · 4 books · 20 lessons · ~3h 30m`.

### Act 2 — Certificate redesign (contrast + signature block + stamp-as-seal)

`src/components/certification/CertificatePreview.tsx`
- **Remove `PREVIEW` watermark entirely.** Locked state is already communicated by the lock badge on the parent panel.
- **Switch dark obsidian plate → premium champagne plate** to match the rest of the academy: background `linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)`, gold hairline frame, ink text `#1A1A1A`. (Dark plate violates the Champagne-Dominant core rule.)
- All body copy goes to solid `#1A1A1A` (no opacity) — kills the faded-contrast issue.
- **Stamp-as-seal:** drop the dashed "Company Seal" placeholder. Render the owner stamp (already fetched via `useOwnerSignatureAssets("stamp")`) centered behind the signature row at 130px with `mix-blend-multiply` + 0.85 opacity so it reads as an embossed wax seal, not a floating image. If no stamp uploaded → use a static gold-foil seal SVG (lucide `BadgeCheck` inside a conic gold ring) — never a dashed empty box.
- **Signature block rebuild** (under signature image):
  - Line 1: "Jeyhun Babayev" — `font-semibold text-[#1A1A1A]`
  - Line 2: "Founder & CEO" — `text-[#1A1A1A]/70 text-[11px] uppercase tracking-[0.18em]`
  - Line 3: "JBJ Global Real Estate" — `text-[#B89555] text-[10px]`
  - Gold hairline above the block, fixed 300px width, right-aligned per the Signature+Gold Divider Lock memory.
- Date + Certificate ID move to a bottom strip below the signature row (centered), not a third column — fixes the cramped 3-column squeeze.
- Certificate ID rendered in gold monospace inside a small champagne pill.
- Medallion at top: keep the existing `CertificateMedallion` but recolor to read on champagne (inner disc → ink ring, gold conic outer stays).

### Act 3 — Wire the lesson → progress → points → certificate chain (the real gap)

This is what makes everything actually work end-to-end. New hook `src/hooks/useEducationProgress.ts`:

```text
markModuleStarted(bookId, moduleId)   → upsert progress row { status:'in_progress', started_at:now() }
markModuleCompleted(bookId, moduleId) → upsert { status:'completed', completed_at:now() }
                                       → award points via RPC (see migration below)
```

`useBrokerEducation` already reads progress — extend it to also return totals + points so the academy shows real numbers, not local state.

**Migration** (`add_lesson_completion_rpc`):
- `complete_module(_book_id uuid, _module_id uuid) returns broker_points` — SECURITY DEFINER. Upserts progress row, awards **10 points/lesson**, **+50 bonus** when last module of a book is completed, **+200 bonus** when all 15 books done. Updates `broker_points.total_points_earned` and recomputes `level = floor(total/500)+1`.
- `get_education_summary(_user uuid)` returning `{ total_lessons, completed_lessons, books_completed, points, level, is_certified }` — single round-trip for the dashboard.
- GRANTs: `EXECUTE ... TO authenticated`.

`BookReader.tsx`
- Add "Mark complete" button at end of each module → calls `markModuleCompleted`. Toast: "+10 points · Module 3/5 complete".
- Lesson timer chip at top of each module: `~{estimated_minutes} min · Lesson {module_number} of {total}`.
- Free-flow chapter rail in the left sidebar: clickable chapter list with check/lock/in-progress states, points pill per chapter.

`BrokerLearning.tsx`
- Replace local `moduleProgress` state with `useEducationProgress()`.
- New top KPI row: **Books completed · Lessons completed · Points earned · Level · Certificate status** (5 tiles, semantic icon tones per IconTile standard).
- Certificate unlock now driven by `summary.is_certified` from the DB — survives refresh.
- Delete the unused `CertificationSection` import.

### Recommendations (what's missing — answer to your question)

1. **Quizzes are dead data.** 75 lessons have `broker_education_tests` rows but no UI. Add a 3-question quiz gate at the end of each module (pass ≥ 2/3 → mark complete, +5 bonus points). Without this anyone can speed-click "Mark complete".
2. **No leaderboard / no streaks.** Add a weekly leaderboard panel (top 10 brokers by points this week) + daily-streak chip — the `broker_points` table can carry these with two new columns (`current_streak_days`, `last_active_date`).
3. **No completion email / no badge on broker profile.** When `is_certified` flips, send a Resend email with the cert PDF and stamp a "Certified JBJ Broker" badge on `broker_profiles.custom_label`.
4. **No mobile-first reader.** `BookReader` currently assumes desktop. Add a sticky bottom action bar on mobile (Prev · Mark complete · Next) and collapse the chapter rail behind a drawer.
5. **No "resume where I left off"** card on the academy header. Cheap win: show the last in-progress lesson with a one-click Continue.
6. **Decide one certification system.** Either delete `CertificationSection` + `useCertification` (recommended — they're unused) or wire them in place of `CertificatePreview` and delete the latter. Right now both exist and only one is rendered → tech debt.

---

## Technical notes

- All new colors stay within the locked palette: `#FDFBF7 / #F7F2EA / #EFE6D6 / #B89555 (hairline) / #1A1A1A`. No raw grays. Gold is hairline-only — no gold fills.
- Certificate plate becomes champagne (compliant) — no dark obsidian.
- Points RPC uses SECURITY DEFINER so the trigger can update `broker_points` even though RLS restricts direct user updates.
- Memory updates after build: add `mem://features/broker/academy-progress-wiring` and `mem://features/broker/certificate-champagne-standard`.

### Out of scope
- Rebuilding the quiz UI engine (recommended but listed under recommendations, not built in this pass unless you approve).
- Translations for new copy (existing `broker_education_books_translations` covers book titles; new strings will use English only for now).
- Email delivery on cert issue (recommendation #3).

If you want quizzes + leaderboard + cert email shipped in the same pass, say so and I'll fold them into the build.
