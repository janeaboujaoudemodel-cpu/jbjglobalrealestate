## Goal

Bring `/cv-builder` up to the same premium standard as Document Studio: full-page A4 preview, real editor controls on the left, AI assistant rail on the right, photo + socials, saved CVs that can be re-opened/edited, and AI-assisted writing + AI re-generation from an uploaded old CV.

## Layout (3-pane, full-page)

```text
┌─ Sub-header (Back · title · Save · Download · Saved CVs ▾) ─────────────────┐
│ LEFT 340px        │  CENTER (A4 preview, scrollable, multi-page)   │ RIGHT 320px │
│ Sections list     │   ┌──────────── A4 page 1 ────────────┐         │ AI helper   │
│ (Personal / Photo │   │  [Photo]  Name · Headline         │         │ rail        │
│  Summary / Exp /  │   │  email · phone · location · socials│        │             │
│  Edu / Skills /   │   │  ── Summary ──                    │         │ • Write     │
│  Langs / Certs /  │   │  ── Experience ──                 │         │   summary   │
│  Socials)         │   │  …                                │         │   with AI   │
│ Each row: drag,   │   └───────────────────────────────────┘         │ • Improve   │
│ edit, delete,     │   ┌──────────── A4 page 2 ────────────┐         │   bullets   │
│ duplicate, +Add   │   └───────────────────────────────────┘         │ • Re-write  │
│                   │                                                  │   from      │
│                   │                                                  │   uploaded  │
│                   │                                                  │   CV        │
└───────────────────┴──────────────────────────────────────────────────┴─────────────┘
```

- Center preview becomes full-width of the middle column (no more cramped card). Each A4 page = real `210×297mm` scaled to container width with `aspect-[210/297]`, white background, gold hairline, centered with shadow — same visual language as Document Studio pages.
- Pages auto-add when content overflows (already implemented in measurement, just visualized).

## Left rail — real editor controls

Per section row:
- Edit (inline open), Delete (trash), Duplicate, drag-handle to reorder.
- Each repeater group (Experience / Education / Cert) shows `+ Add experience`, etc., as a primary gold-hairline button (not text link).
- New **Photo** field at the top of Personal Details: upload (jpg/png), crop to square, stored as base64 in draft + `cv-photos` bucket on save. Remove button.
- New **Socials** repeater under Personal Details: Email, Phone, Website, LinkedIn, Instagram, Facebook, X/Twitter, WhatsApp, custom URL — each rendered in preview header with its icon.

## Right rail — AI assistant (mirrors Document Studio's AI panel)

A persistent `AICVAssistant` column with:
1. **Write summary with AI** — small textarea ("describe yourself in a few words / target role"), calls `cv-ai-assist` edge function with action `summary` → fills `data.summary`.
2. **Improve experience bullets** — per-experience "Polish with AI" button writes back into `bullets`.
3. **Regenerate from uploaded CV** — upload PDF/DOCX, sends to `cv-ai-parse` edge function which returns structured `CVData`; preview-then-apply (same pattern as AI enrich).
4. **Translate CV** — pick target language, regenerate copy.

All AI calls use Lovable AI Gateway (`openai/gpt-5.5` for parsing, `google/gemini-3.5-flash` for short rewrites). No new secrets.

## Saved CVs

- New table `user_cvs (user_id, title, data jsonb, photo_url, updated_at, deleted_at)` with RLS (`user_id = auth.uid()`), GRANTs for authenticated + service_role.
- Sub-header dropdown **Saved CVs** lists user's CVs (uses `Document Action Picker` standard: Preview / Edit / Delete with 30-day Recently Deleted tab).
- **Download** button also auto-saves the current CV (insert/update) so the user can re-open and edit it later.
- Anonymous visitors keep the existing `localStorage` draft path; saving requires login (ActionGate).

## Storage

- New bucket `cv-photos` (public read, owner write under `user_id/…`).
- New bucket `cv-uploads` (private; ingest path for "regenerate from old CV", auto-deleted after parse).

## Edge functions

- `cv-ai-assist` — `{ action: 'summary' | 'bullets' | 'translate', payload }` → returns text/JSON.
- `cv-ai-parse` — accepts `{ fileUrl }`, parses with `openai/gpt-5.5`, returns full `CVData` shape.

Both deploy with default `verify_jwt = false` + in-code auth check.

## Files to change / add

- Rewrite `src/pages/CVBuilder.tsx` (3-column shell, full-page preview, new sub-header).
- New `src/components/cv-builder/CVPreviewA4.tsx` — pure preview component (photo header, socials icons, sections, page break).
- New `src/components/cv-builder/CVEditorRail.tsx` — left rail with edit/delete/duplicate/reorder.
- New `src/components/cv-builder/CVAIAssistant.tsx` — right rail.
- New `src/components/cv-builder/SavedCVsMenu.tsx` — dropdown + dialog (Action Picker pattern).
- New `src/hooks/useUserCVs.ts` — list/save/soft-delete/restore.
- New edge functions `supabase/functions/cv-ai-assist/index.ts`, `supabase/functions/cv-ai-parse/index.ts`.
- Migration: `user_cvs` table + `cv-photos`, `cv-uploads` buckets + policies.

## Not changing

- Document Studio templates and signature/lock standards stay untouched.
- Existing draft auto-save (`localStorage`) preserved for non-logged-in flow.
- PDF export pipeline kept; only the on-screen preview gets the new full-page treatment.

## Open questions

1. Photo style on the CV — circular avatar in a left sidebar column of the A4, or square in the top-right corner? (Default: circular, top-left next to name.)
2. Should "Saved CVs" be owner/admin only, or available to every signed-in user? (Default: every signed-in user, RLS scoped to `auth.uid()`.)