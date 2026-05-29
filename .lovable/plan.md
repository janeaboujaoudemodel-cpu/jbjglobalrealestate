## Goal
Replace the scattered book-card / strip code with a single canonical system used on the homepage, `/guides`, every guide page, and `BookShelf`. Faster smooth motion, no white cut above covers, unique 3D cover per guide, titles engraved on the cover only.

## What ships

### 1. Canonical primitives (one source of truth)
- **`src/components/books/BookCard.tsx`** — the only 3D book card. Owns: perspective wrapper, soft ground shadow, spine, hover rotateY, ring, sizing variants (`xs | sm | md | lg`). Renders `<PremiumBookCover>` only — no caption beneath, no top white sheen overlay. Clickable wrapper accepts `as="a" | "button"` and `onClick`/`href`.
- **`src/components/books/BookCarousel.tsx`** — the only horizontal book strip. CSS-keyframe marquee on a duplicated track (translateX 0 → -50%), animation-duration tuned for premium-smooth pace (≈ 38s desktop / 28s mobile = noticeably faster than today's ~60s+ rAF loop, still luxurious). Pause on hover and during pointer drag; drag scrubs the track; click-vs-drag threshold preserved.

### 2. Unique cover per guide (3D variety, single source)
- `PremiumBookCover` already supports 5 tones (`black / emerald / navy / espresso / burgundy`). Today `BookCoverFace` LOCKS every book to `black` — that's why every cover looks identical.
- Remove the lock. Pick the tone deterministically from a stable hash of `book.title` so every book always renders with the same unique tone (and updating it once in `PremiumBookCover` propagates everywhere). Optionally extend with one more tone (`forest`) so the rotation across the current ~10 guides is more varied.
- Title stays engraved on the cover (already implemented inside `PremiumBookCover`). No code path will render a separate `<p>{book.title}</p>` under a book anymore.

### 3. Remove the white "cut" above covers
- Drop the `bg-gradient-to-b from-white/15 to-transparent` top sheen strips inside `BookShelf` and `GuideBookSection`.
- Trim the top sheen layer inside `PremiumBookCover` (the `inset-x-0 top-0 h-[35%]` overlay) so the cover art reads flush.
- Audit every card wrapper for `mt-*` / padding that creates a visible gap above the cover.

### 4. Wire the canonical components everywhere (deletes the duplicates)
Files refactored to use `<BookCard />` / `<BookCarousel />` and to drop their per-book caption `<p>`:
- `src/components/home/HomepageBookMarquee.tsx` — replace the inline `BookMarqueeStrip` + caption with `<BookCarousel books={allBooks} />`.
- `src/pages/Guides.tsx` — both the library grid and the Company Profile row use `<BookCard />`; remove the two `<p className="…">{book.title}</p>` captions.
- `src/components/books/BookShelf.tsx` — internal grid uses `<BookCard />`; remove the caption under each tile (modal keeps the title as the modal header — that's not "under the book").
- `src/components/books/GuideBookSection.tsx` — hero cover uses `<BookCard size="lg" />`; remove the inline 3D wrapper + the white sheen layer; right-column TOC heading stays (it's the page title, not a caption under a book).
- `src/components/broker-education/Book3DCard.tsx` — re-export `<BookCard />` to keep existing imports working without a second 3D implementation.

### 5. QA after build (mandatory)
Use `browser--navigate_to_sandbox` + `browser--screenshot` on:
- `/` — capture the carousel (still + after a short wait to confirm motion direction looks right) and verify no white band above covers, each visible cover has a distinct tone, no captions under tiles.
- `/guides` — capture the library grid and the Company Profile row: each cover unique, titles only on the covers, no white cut, hover lift smooth.

## Technical notes

- Marquee uses CSS keyframes (`@keyframes bookmarquee { to { transform: translateX(-50%); } }`) on a `flex w-max` track of `[...books, ...books]`. `animation: bookmarquee var(--book-marquee-duration, 38s) linear infinite`. Hover sets `animation-play-state: paused`. Pointer drag pauses + applies a manual `translateX` offset stored in a ref, which is reapplied as a negative `animation-delay` on release so the loop continues from the user's scrub position. This is dramatically smoother than the per-frame rAF loop currently in `HomepageBookMarquee` and removes the "broken/jumpy" feel.
- Tone mapping is a tiny pure helper inside `PremiumBookCover` — exported so future cover utilities can reuse it. Memory standard "PremiumBookCover.tsx is the single source of truth" stays intact.
- No DB / RLS / route changes. No removals of pages or links. No marketing copy changes.

## Out of scope
- Cover artwork redesign (the engraved title + skyline + tone gradients already match the locked premium style).
- Modal / TOC behavior — untouched aside from the caption removal.

```text
homepage ──┐
guides   ──┼──► <BookCarousel> ──► <BookCard> ──► <PremiumBookCover (tone = hash(title))>
shelf    ──┘                      ▲
guide page ────────────────────────┘ (single hero card)
```