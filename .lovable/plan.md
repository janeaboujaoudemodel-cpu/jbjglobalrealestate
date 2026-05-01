## Goal

1. Delete the homepage "Continue Searching / Trending Projects" section.
2. Reshape the JBJ Royal Tools Hub showcase on the homepage: drop AI Video Studio + Voice Studio, add Business Card Maker + Logo Maker, and recolor each tile per the brief.
3. Hide AI Video Studio + Voice Studio across the entire public website (not yet ready).
4. Build an admin "AI Tools Visibility" panel: per-tool public/hidden toggle that gates every AI tool everywhere.

## Files to change

- `src/pages/Index.tsx` — remove the `<ContinueSearching>` block (lines 346–351).
- `src/components/home/ToolkitShowcaseCard.tsx` — replace the 8-tool list (drop Video/Voice Studio, add Business Card Designer + AI Logo Maker), assign tone colors per tile, switch the icon tile from flat champagne to per-tool tone backgrounds.
- New DB migration adding `ai_tool_visibility` (id text PK, is_public boolean default true, updated_at, updated_by) with RLS — public can `select`, owner/admin can `upsert/update`.
- New hook `src/hooks/useToolVisibility.ts` — returns `{ visibleIds: Set<string>, isHidden(id), loading }`. Subscribes to realtime changes so toggles take effect instantly.
- `src/config/royalToolsRegistry.ts` — keep entries but add a `defaultHidden?: boolean` flag; mark `ai-video-studio`, `voice-studio` (and any other "not yet ready" duplicates) with `defaultHidden: true`.
- `src/pages/AIHub.tsx`, `src/pages/toolkit/RoyalToolsHub.tsx`, `src/components/home/ToolkitShowcaseCard.tsx`, `src/components/header/MegaMenuToolkit.tsx`, `src/components/Footer.tsx`, `src/config/globalSearchIndex.ts`, `src/config/shortcutsConfig.ts` — filter every render by the visibility hook so a tool flipped off in admin disappears site-wide. The admin AI Tools Control Panel itself ignores the filter.
- `src/pages/owner/AIToolsControlPanel.tsx` — add a "Public Visibility" column to each tool row: a `<Switch>` writing to `ai_tool_visibility` via upsert. Show a header summary (X/Y public).
- `src/routes/OwnerRoutes.tsx` — add `<Route path="ai-tools-control" element={<OwnerGuard><AIToolsControlPanel /></OwnerGuard>} />` if not already routed; add a sidebar link in `OwnerSidebarNav.tsx`.

## Tile recoloring (homepage Royal Tools showcase)

Apply per-tile tone (icon container bg + icon color + hover ring) using existing palette tokens:

- Property Evaluator → blue (`bg-blue-500/15 text-blue-600`)
- Property Comparison → emerald/green (`bg-emerald-500/15 text-emerald-600`)
- Mortgage Calculator → champagne gold (`bg-[#B89555]/15 text-[#B89555]`)
- AI Home Finder → vivid purple (matches global AI purple theme — `bg-purple-500/15 text-purple-600`)
- Rental Index → darker green (`bg-green-700/15 text-green-700`)
- AI Interior Design → light purple/pink (`bg-pink-400/15 text-pink-500`)
- Business Card Designer → ink/champagne neutral (`bg-[#1A1A1A]/10 text-[#1A1A1A]`)
- AI Logo Maker → amber (`bg-amber-500/15 text-amber-600`)

Card body, title, description and CTA stay champagne/ink so contrast guards remain happy. Only the small icon chip changes color — matches the existing `IconTile` semantic-tone standard.

Final order on homepage grid:
1. Property Evaluator (blue) · 2. Property Comparison (green) · 3. AI Home Finder (purple) · 4. Mortgage Calculator (gold) · 5. Rental Index (dark green) · 6. AI Interior Design (pink) · 7. Business Card Designer (ink) · 8. AI Logo Maker (amber).

## Visibility system — technical

```sql
create table public.ai_tool_visibility (
  tool_id text primary key,
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table public.ai_tool_visibility enable row level security;
create policy "Anyone can read tool visibility" on public.ai_tool_visibility for select using (true);
create policy "Owner/admin can upsert" on public.ai_tool_visibility for all
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'owner'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'owner'));
-- Seed: hide the not-ready tools by default
insert into public.ai_tool_visibility (tool_id, is_public) values
  ('ai-video-studio', false),
  ('voice-studio', false)
on conflict (tool_id) do nothing;
alter publication supabase_realtime add table public.ai_tool_visibility;
```

`useToolVisibility` returns a memoised set; all public tool surfaces filter via `tools.filter(t => visibility.isPublic(t.id))`. Admin pages bypass the filter.

## Acceptance checklist

- Homepage no longer shows the Continue Searching / Trending Projects section.
- Royal Tools Hub showcase on homepage shows exactly the 8 tiles above, with the colored icon chips, no Video/Voice Studio.
- Visiting `/ai-hub`, `/toolkit`, header mega menu, footer, and global search returns no results for AI Video Studio or Voice Studio.
- Owner AI Tools Control Panel shows a "Public" toggle per tool; flipping any toggle hides/shows that tool everywhere within ~1s (realtime).
- Admin still sees and can administer hidden tools from the control panel.
- No contrast / faded-gold / white-on-light regressions on the recolored tiles.
