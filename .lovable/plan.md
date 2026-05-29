## Goal

Two connected features for the owner:

1. A new **Owner Books Library** in the backend where you attach/upload book files, JBJ auto-generates a styled cover + table of contents + chapter summaries, and you can edit/restyle/delete any book at any time. Books surface to brokers in the Broker Portal Books section.
2. A persistent **JBJ Web Developer** assistant that lives in a small floating dock on every owner page. You tell it what to change, it makes the change, you see Approve / Reject / Take me there.

---

## Part 1 — Owner Books Library

### 1.1 Backend storage + schema

- New private storage bucket `owner-books` (owner-only RLS) — accepts PDF, DOCX, EPUB, MD, TXT.
- New columns on existing `broker_education_books` table:
  - `source_file_url text` — uploaded original file
  - `source_file_name text`, `source_mime text`, `source_size_bytes int`
  - `ai_generated_summary text`
  - `ai_generated_chapter_count int`
  - `cover_style jsonb` — palette, font pair, layout variant chosen for the auto-generated cover
  - `sync_filename boolean default true` — when true, the book title mirrors the uploaded filename until the owner edits the title manually
  - `last_ai_restyle_at timestamptz`
  - `deleted_at timestamptz` — soft delete (Document Action Picker standard)
- Reuse existing `broker_education_modules` table for chapters; add `estimated_minutes int` and `ai_summary text`.

No new tables required — we extend the existing books schema so brokers see everything in one place.

### 1.2 Upload + auto-extract pipeline

New edge function `owner-book-ingest`:
1. Receives uploaded file URL + owner JWT (validated via `requireOwnerAuth`).
2. Parses content:
   - PDF → text per page (pdfjs in Deno worker)
   - DOCX → mammoth-style HTML
   - EPUB → chapter HTML
   - MD/TXT → raw
3. Sends parsed text to `google/gemini-2.5-pro` via Lovable AI Gateway with a structured tool-call schema returning:
   - `title`, `subtitle`, `summary` (2–3 sentences)
   - `chapters[]` with `title`, `html_content`, `estimated_minutes`, `ai_summary`
   - `recommended_cover` (palette name, accent hex, layout variant from a curated list — never raw gold fill)
4. Inserts the book + chapter rows, marks `sync_filename=true` so the title tracks the filename until the owner changes it.

### 1.3 Owner UI — `/owner/books`

New page in the owner backend with:
- Library grid of all books (cover-only, no 3D frame — clean flat cover thumb), search + filters (published / draft / deleted).
- **Attach Book** button → file picker → progress strip → ingestion log lines stream in.
- **Add Book Manually** button → opens an empty book in the editor.
- Per-card actions via the global **Document Action Picker** (Preview / Edit / Delete) — soft delete + 30-day Recently Deleted tab.
- **Bulk re-sync filenames** action.

Book Editor (`/owner/books/:id`):
- Left rail: editable title, subtitle, summary, cover style picker (palette + font pair + layout), publish toggle, sync-filename toggle.
- Center: chapter list — drag to reorder, edit title/date/estimated minutes/HTML, add/delete chapter.
- Right rail: **Restyle with AI** panel — free-text instruction box ("take the title up", "move the cover image down", "restyle as luxury editorial"). Sends to `owner-book-restyle` edge function which returns a diff applied to `cover_style` + chapter HTML; owner sees Before/After preview, then Approve / Reject.

### 1.4 Reader changes (broker + owner preview)

`BookReader.tsx` is updated to:
- **Remove the 3D book frame** entirely on the page background.
- Render a clean, flat **Cover page** (palette + layout from `cover_style`) → **TOC page** (chapter list, each row shows title + estimated minutes + arrow that jumps the user directly to that chapter) → chapter pages → **Back cover** with summary.
- TOC arrow scrolls/animates straight to the chapter spread, not just the next page.
- Cover keeps existing pagination + audio.

This preserves all existing reader features (no removal).

### 1.5 Broker portal surface

The existing `BrokerLearning` / `BrokerEducation` Books section automatically picks up new rows from `broker_education_books` where `deleted_at IS NULL AND is_published = true`. No broker-side rebuild needed.

---

## Part 2 — Persistent "JBJ Web Developer" assistant

### 2.1 Dock UI

A small floating champagne pill on every owner-authenticated page (mounted in `OwnerLayout` or App root behind an owner guard) — never on public/broker/investor pages. Click to expand into a slide-up chat panel anchored bottom-right, with:
- Free-text instruction input ("on the home page, move the search bar up")
- Optional target picker: **This page** / **Pick a page** dropdown
- History of requests with status chips: `Pending`, `Ready to review`, `Approved`, `Rejected`
- Each request row shows:
  - The page it touched
  - "View change" button → if same route, scrolls + highlights; if different route, **Take me there** navigates to that route and highlights
  - **Approve** / **Reject** buttons

### 2.2 How changes are produced

Two modes, owner picks at install time:

- **Lovable build mode (recommended)**: the assistant routes the instruction into a Lovable build request (using the existing internal owner-only build pipeline you already have for AI tools). Approve = keep, Reject = automatic revert via the existing version-history rollback.
- **Soft mode (CSS-only overlay)**: for quick visual nudges (move up/down, padding, color), generates a scoped `style` override stored per-route in a new `owner_ui_overrides` table:
  - `route_pattern text`, `selector text`, `css jsonb`, `status text`, `created_by uuid`
  - Loader hook reads the row, injects a `<style data-owner-override>` block on matching routes.
  - Approve flips `status=approved` (override stays); Reject deletes the row.

I will implement **Soft mode first** because it's safe, fully reversible, never breaks the live site, and matches "approve/reject after I see the change". Hard code-edit mode can come in a follow-up once you've used the soft flow.

### 2.3 Approve / Reject / Take me there flow

- On submit: a row is written to `owner_change_requests` with `route`, `instruction`, `status='ready'`, `proposed_override`.
- Toast: "Web developer is ready — review on `/page`". Click → either we're already there (auto-scroll + outline pulse on the changed element) or we navigate via `useNavigate` then pulse.
- Approve → updates `owner_ui_overrides.status='approved'`.
- Reject → soft-deletes both rows.

### 2.4 Safety

- `owner-web-dev-apply` edge function uses `requireOwnerAuth`; only the owner JWT can write or approve.
- All writes go through `admin_edit_log` so the existing Owner Provenance + Undo timeline already covers everything.
- Hard-coded blocklist on selectors (no `auth`, `payment`, `admin` containers can be overridden).

---

## Open questions

1. **Web Developer mode**: do you want me to start with **Soft mode (CSS overlay, fully safe, instant)** as described in 2.2, or wait until I can wire **Lovable build mode (actually edits source code)**? Soft mode ships in this batch; build mode would be a separate larger phase.
2. **Books — file types**: confirm PDF, DOCX, EPUB, MD, TXT is the right set, or do you also want `.pages` / `.mobi`?
3. **Books — public reader surface**: brokers only, or should investors also see selected books?

I'll wait for your answer on those before writing the migration and the new pages.