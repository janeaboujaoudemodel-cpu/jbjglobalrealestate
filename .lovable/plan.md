# Show All Developers on the Relationships Page

## Why it stops at 93

The Relationships → Developer Registry tab reads from `crm_developer_registry`, which currently has **exactly 93 rows** (verified via DB query). It is not a UI / pagination limit — the table only contains the 93 entries seeded by `public.seed_crm_developer_registry`, a hard-coded VALUES list of curated UAE developers.

Meanwhile, your master `public.developers` catalog has **633 rows** that never get imported into the CRM registry. That mismatch is the gap you're seeing.

## Fix — "Import All Developers" action

Add a one-click action that imports the full developer catalog into the registry, alongside the existing curated "Pre-fill" button (which stays — no removal).

### 1. New hook: `useImportAllDevelopersToRegistry` in `src/hooks/useCRMRelationships.ts`

Pure client-side import (no DB migration needed — RLS already lets owners insert their own rows):

```ts
export const useImportAllDevelopersToRegistry = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");

      const slugify = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");

      const PAGE = 1000;
      let from = 0;
      let imported = 0;

      // Page through the catalog (Supabase caps a single request at 1000 rows).
      while (true) {
        const { data: devs, error } = await supabase
          .from("developers")
          .select("name, slug, website_url")
          .or("is_hidden.is.null,is_hidden.eq.false")
          .order("name")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!devs?.length) break;

        const rows = devs
          .filter(d => d.name?.trim())
          .map(d => ({
            owner_id: user.id,
            developer_name: d.name,
            developer_slug: d.slug?.length ? d.slug : slugify(d.name),
            website: d.website_url ?? null,
            developer_contact: {},
            status: "not_started",
            required_docs_complete: false,
            priority: "medium",
          }));

        if (rows.length) {
          // Idempotent — never overwrites existing curated entries.
          const { error: upErr } = await supabase
            .from("crm_developer_registry")
            .upsert(rows, {
              onConflict: "owner_id,developer_slug",
              ignoreDuplicates: true,
            });
          if (upErr) throw upErr;
          imported += rows.length;
        }

        if (devs.length < PAGE) break;
        from += PAGE;
      }
      return imported;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
      toast.success(`Imported ${count} developers from the catalog`);
    },
    onError: (e: any) => toast.error(e.message || "Import failed"),
  });
};
```

Why this is safe:
- The unique constraint `(owner_id, developer_slug)` already exists, so `ignoreDuplicates: true` makes the operation idempotent — no duplicates, no overwrites of existing curated rows.
- Only the signed-in owner's `owner_id` is used; RLS policy `owner_full_dev_registry` allows that insert.
- Pagination handled in 1000-row pages so even a 10k-row catalog would still work.

### 2. UI button in `src/pages/CRMRelationships.tsx` (Developer Registry tab)

Right next to the existing "Pre-fill" button (line 662):

```tsx
const importAll = useImportAllDevelopersToRegistry();
…
<Button
  variant="outline"
  onClick={() => importAll.mutate()}
  disabled={importAll.isPending}
>
  {importAll.isPending ? "Importing…" : "Import all developers"}
</Button>
```

After the call resolves, the React Query cache is invalidated and the registry list re-renders with the full set (≈633 rows). The list, search, and status filters already work for any size — the only reason it "stopped" was that the data wasn't there.

### 3. No removals, no schema changes

- Existing "Pre-fill" curated seed stays.
- No DB migration needed (we use the existing table, constraints, and RLS).
- No reduction in feature surface.

## Files touched

- `src/hooks/useCRMRelationships.ts` — add `useImportAllDevelopersToRegistry`.
- `src/pages/CRMRelationships.tsx` — add "Import all developers" button on the Developer Registry tab toolbar.

## Verification

1. Open Relationships → Developer Registry → click "Import all developers".
2. Toast shows the imported count (~633).
3. Refresh / scroll — the registry list now shows all developers (no longer capped at 93).
4. Click again → toast shows the same count, but no duplicates appear (idempotent).
