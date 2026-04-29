# AI Research & Backfill for Developer Registry — with Per-Field Sources

## Why

The Developer Registry currently has 93 rows, but **0 phones, 0 emirates, 0 websites** stored on the registry itself, even though:

- The master `public.developers` catalog has `headquarters` and `website_url` for hundreds of UAE developers.
- Lovable AI, Perplexity, and Firecrawl are all available for live web research.

We'll add a one-click "Research & enrich" workflow that fills missing fields from (1) our own master catalog, then (2) AI/web research, and records *where each value came from* so the user can audit it on each card.

## Scope of fields to enrich

For every registry row, attempt to fill (only where currently empty):

- `developer_email` (corporate sales/info email)
- `phone` (HQ phone)
- `emirate` (Dubai / Abu Dhabi / etc.)
- `website`
- `developer_contact` jsonb → `{ name, role, phone, email }` (point of contact)

## Data model — provenance

New jsonb column on `crm_developer_registry`:

```
field_sources jsonb default '{}'::jsonb
```

Shape:
```jsonc
{
  "phone":      { "source": "perplexity",   "url": "https://...", "fetched_at": "2026-04-29T..." },
  "emirate":    { "source": "master_catalog", "fetched_at": "..." },
  "website":    { "source": "perplexity",   "url": "https://...", "fetched_at": "..." },
  "developer_email": { "source": "ai_inference", "fetched_at": "..." },
  "developer_contact": { "source": "manual", "fetched_at": "..." }
}
```

`source` values: `master_catalog`, `perplexity`, `firecrawl`, `ai_inference`, `manual`.
`manual` is set automatically when the user edits a field via the existing edit dialog.

A small DB trigger on `crm_developer_registry` updates `field_sources[<field>] = {source: 'manual', fetched_at: now()}` whenever the underlying field changes and `field_sources` wasn't explicitly set in the same statement.

## Edge function — `enrich-developer-registry` (new)

Path: `supabase/functions/enrich-developer-registry/index.ts`

Inputs (POST JSON):
- `ids?: string[]` — specific registry rows; if omitted, picks rows missing any of the target fields, ordered by `created_at` ASC, capped at `batchSize`.
- `batchSize?: number` (default 8, max 25)
- `useWeb?: boolean` (default true) — toggle Perplexity/Firecrawl research.

Per row pipeline (only fills empty fields, never overwrites existing values):

1. **Master-catalog fill** — left-join `developers` by `lower(slug)`. If matched and registry field is empty:
   - `website` ← `developers.website_url`
   - `emirate` ← parse from `developers.headquarters` (regex: Dubai|Abu Dhabi|Sharjah|Ajman|Ras Al Khaimah|Fujairah|Umm Al Quwain).
   - Source: `master_catalog`.

2. **Perplexity research** (`sonar` model) — single grounded query per developer:
   > "For the UAE real estate developer "<name>", return strict JSON: { hq_emirate, hq_address, phone, sales_email, website, contact_name, contact_role }. Only include fields you can verify from official sources (developer's own site, DLD, RERA, LinkedIn). Use null for unknown."
   - Use `response_format: json_schema` for structured output.
   - Citations from `data.citations[0]` saved as `url`.
   - Source: `perplexity`.

3. **Firecrawl fallback** — only when Perplexity returned a website but no phone/email, scrape `<website>/contact` (or `/`) with `formats: ['markdown']`, then a small Lovable AI extraction call to pick `phone`/`email` out of the markdown. Source: `firecrawl`.

4. **AI inference last resort** — `google/gemini-3-flash-preview` produces a best-guess `developer_email` (e.g. `info@<domain>`) only if no email was found and a website domain is known. Source: `ai_inference`. Marked clearly in the UI as inferred.

For each filled field, set both the value AND `field_sources[field] = {source, url?, fetched_at}` in a single update so the auto-`manual` trigger does not fire.

Returns `{ processed, results: [{ id, name, filled: ['phone','website',...], skipped: [...] }] }`.

Auth: standard JWT verification + `requireOwnerAuth`-equivalent check that the caller owns the registry rows (matches existing patterns in `crm-relationship-ai`).

Rate limits: 8 rows per request, 1.2 s delay between Perplexity calls. Surface 402/429 from Perplexity/Firecrawl back to the client as toasts.

## Hook — `useEnrichDeveloperRegistry`

In `src/hooks/useCRMRelationships.ts`:

```ts
export const useEnrichDeveloperRegistry = () =>
  useMutation({
    mutationFn: async (input: { ids?: string[]; useWeb?: boolean } = {}) => {
      const { data, error } = await supabase.functions.invoke("enrich-developer-registry", { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-developer-registry"] });
      toast({ title: "Enrichment complete", description: `${data.processed} developers updated.` });
    },
    onError: (e: any) => toast({ title: "Enrichment failed", description: e.message, variant: "destructive" }),
  });
```

## UI changes — `src/pages/CRMRelationships.tsx`

1. **Toolbar button** in the Developer Registry tab, next to the existing **Pre-fill** / **Import all developers**:

   - **"Research & enrich"** — runs `useEnrichDeveloperRegistry` with no `ids`, `useWeb: true`.
     - Shows a confirm dialog: "This will research up to 8 developers per click using AI + web sources. Continue?"
     - Loading state with spinner; disabled while running.

2. **Per-card per-field source chip** — on each developer card (the labeled grid we just shipped), append a tiny pill next to the value when `r.field_sources?.[field]` is set. Click opens a popover showing source + fetched date + link.

   ```tsx
   const FieldSource = ({ meta }: { meta?: { source: string; url?: string; fetched_at?: string } }) => {
     if (!meta) return null;
     const colors: Record<string, string> = {
       master_catalog: "bg-emerald-50 text-emerald-800 border-emerald-200",
       perplexity:     "bg-blue-50 text-blue-800 border-blue-200",
       firecrawl:      "bg-indigo-50 text-indigo-800 border-indigo-200",
       ai_inference:   "bg-amber-50 text-amber-900 border-amber-200",
       manual:         "bg-gray-100 text-gray-700 border-gray-200",
     };
     return (
       <Popover>
         <PopoverTrigger asChild>
           <button className={`text-[9px] uppercase tracking-wider px-1.5 py-px rounded-full border ${colors[meta.source] || colors.manual}`}>
             {meta.source.replace("_", " ")}
           </button>
         </PopoverTrigger>
         <PopoverContent className="text-xs">
           <div className="font-semibold capitalize">{meta.source.replace("_", " ")}</div>
           {meta.url && <a href={meta.url} target="_blank" rel="noopener noreferrer" className="underline break-all block mt-1">{meta.url}</a>}
           {meta.fetched_at && <div className="text-gray-500 mt-1">Fetched {new Date(meta.fetched_at).toLocaleString()}</div>}
         </PopoverContent>
       </Popover>
     );
   };
   ```

   Render `<FieldSource meta={r.field_sources?.phone} />` next to each labeled value (phone, email, website, office, point-of-contact name).

3. **Per-row "Enrich"** action — already-existing AI button beside Send/Remind/Edit gets a sibling **"Research"** button (icon `BookOpen`) that calls `useEnrichDeveloperRegistry({ ids: [r.id] })` for that single row.

## Migration

Single migration:

```sql
alter table public.crm_developer_registry
  add column if not exists field_sources jsonb not null default '{}'::jsonb;

-- Auto-mark manual edits
create or replace function public.mark_registry_field_sources()
returns trigger language plpgsql as $$
declare
  ts text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
begin
  if new.field_sources is null then new.field_sources := '{}'::jsonb; end if;
  if new.phone is distinct from old.phone and (new.field_sources -> 'phone') = (old.field_sources -> 'phone') then
    new.field_sources := jsonb_set(new.field_sources, '{phone}', jsonb_build_object('source','manual','fetched_at',ts), true);
  end if;
  if new.developer_email is distinct from old.developer_email and (new.field_sources -> 'developer_email') = (old.field_sources -> 'developer_email') then
    new.field_sources := jsonb_set(new.field_sources, '{developer_email}', jsonb_build_object('source','manual','fetched_at',ts), true);
  end if;
  if new.emirate is distinct from old.emirate and (new.field_sources -> 'emirate') = (old.field_sources -> 'emirate') then
    new.field_sources := jsonb_set(new.field_sources, '{emirate}', jsonb_build_object('source','manual','fetched_at',ts), true);
  end if;
  if new.website is distinct from old.website and (new.field_sources -> 'website') = (old.field_sources -> 'website') then
    new.field_sources := jsonb_set(new.field_sources, '{website}', jsonb_build_object('source','manual','fetched_at',ts), true);
  end if;
  if new.developer_contact is distinct from old.developer_contact and (new.field_sources -> 'developer_contact') = (old.field_sources -> 'developer_contact') then
    new.field_sources := jsonb_set(new.field_sources, '{developer_contact}', jsonb_build_object('source','manual','fetched_at',ts), true);
  end if;
  return new;
end$$;

drop trigger if exists trg_mark_registry_field_sources on public.crm_developer_registry;
create trigger trg_mark_registry_field_sources
  before update on public.crm_developer_registry
  for each row execute function public.mark_registry_field_sources();
```

(Trigger fires only on UPDATE so the bulk import path stays untouched.)

## Privacy / compliance

- Registry is owner-only (RLS + `OwnerGuard`); the new chip and source URL only appear on the internal page. Per project memory: developer/broker contact info is never displayed publicly — unchanged.
- We do NOT publish the AI-inferred email to the user-facing inquiry forms; it lives only inside the registry until the owner reviews it.
- Source chip clearly labels `ai inference` so any unverified value is auditable.

## Files touched

- `supabase/migrations/<ts>_registry_field_sources.sql` — new column + trigger.
- `supabase/functions/enrich-developer-registry/index.ts` — new edge function.
- `src/hooks/useCRMRelationships.ts` — add `useEnrichDeveloperRegistry`.
- `src/pages/CRMRelationships.tsx` — toolbar button, per-row "Research" button, `FieldSource` pills next to each value in the developer card.

## Verification

1. Click **Research & enrich** in Developer Registry → toast shows "N developers updated".
2. Reload the tab — cards now show populated phone/email/office/website with a tiny chip next to each value (e.g. `perplexity` blue, `master catalog` emerald, `ai inference` amber).
3. Click the chip — popover shows source, link (when available) and fetched date.
4. Edit a field manually → chip flips to gray `manual`.
5. Per-row "Research" button on a single card fills only that row.
