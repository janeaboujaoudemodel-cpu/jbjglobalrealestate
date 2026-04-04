
Root cause: the preview bundle is being built without `VITE_SUPABASE_URL` injected, so the app crashes before React mounts. I confirmed the local `.env` file exists, which means the real issue is not “missing file in repo” but “missing preview-time env injection”. Because the generated Supabase client and many frontend files read `import.meta.env.VITE_SUPABASE_*` directly, restoring `.env` alone does not fix the hosted preview.

Plan:

1. Fix the preview/runtime source of truth in `vite.config.ts`
- Add a `define` fallback for:
  - `import.meta.env.VITE_SUPABASE_URL`
  - `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
  - `import.meta.env.VITE_SUPABASE_PROJECT_ID`
- Use this pattern:
  - prefer `process.env.*` when present
  - otherwise fall back to the connected Lovable Cloud public values
- This avoids touching the auto-generated `src/integrations/supabase/client.ts`.

2. Make the fix global, not one-file-only
- Keep the fix at Vite level so it also covers all other direct usages of `import.meta.env.VITE_SUPABASE_URL` in fetch calls and helpers across the app.
- This is important because there are many frontend references, not just the Supabase client.

3. Validate the env access pattern
- Re-scan for `import.meta.env.VITE_SUPABASE_` usage after the config change.
- Confirm there are no remaining boot blockers caused by undefined backend config.

4. Optional cleanup
- Update README wording so future contributors know the app can run with explicit env vars, but the Lovable preview also has safe public fallbacks for this connected backend.

Files to update:
- `vite.config.ts`
- optionally `README.md`

Technical detail:
- The safest fix is not editing `.env` and not editing the generated client file.
- Vite `define` can inject string replacements at build time, which means every `import.meta.env.VITE_SUPABASE_*` reference gets a value in preview builds.
- The publishable key and project URL are public client-side values, so using them as fallback constants is safe.
- This should remove the current boot error and also prevent related failures in any component calling backend functions with `import.meta.env.VITE_SUPABASE_URL`.
