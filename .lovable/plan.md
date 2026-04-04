
Issue summary:
- The current crash is not coming from your latest source anymore.
- I verified the repo already contains the Vite fallback in `vite.config.ts`, so the preview error strongly suggests the failing URL is serving an older cached build or a different preview pipeline than the current project source.
- I also confirmed the current project preview URL is a different host (`id-preview--357981e3-cd4c-4c0d-ad5b-a1a379078f50.lovable.app`) and it does not show the same boot overlay. The failing host in your screenshot is `preview--jbjglobalrealestate.lovable.app`, which points to a stale/legacy preview build.

Plan:
1. Replace client-side env dependency at the real source
- Stop relying on raw `import.meta.env.VITE_SUPABASE_*` throughout the app.
- Create a single frontend config module that exports hard-safe public backend values with fallback logic.
- Update `src/integrations/supabase/client.ts` consumers indirectly by importing URL/key constants from that shared config in app code where direct fetches happen.
- For the generated client file, avoid editing it directly; instead wrap access through a separate app-level helper if needed.

2. Remove fragile direct env usage across the app
- Replace direct `import.meta.env.VITE_SUPABASE_URL` / key references in fetch helpers, podcast tools, auth helpers, trackers, e-sign flows, and AI tools with the shared config constants.
- This prevents boot/runtime regressions even if preview env injection fails again.

3. Harden preview compatibility
- Keep the existing `vite.config.ts` fallback, but treat it as backup only.
- Ensure critical startup paths can initialize even when `import.meta.env` is empty in hosted preview.

4. Rule out stale asset/service-worker interference
- Review current service worker files in `public/sw.js` and `public/sw-kill.js`.
- If needed, simplify cache-busting logic so old JS bundles cannot keep serving the broken `data-vendor-CR_EANON.js`.

5. Verify the actual target host behavior
- Compare the current project preview host and the legacy `preview--jbjglobalrealestate.lovable.app` host after the code hardening.
- If the legacy host is still stale, the app should still survive because startup will no longer depend on missing env injection.

Files likely involved:
- `vite.config.ts`
- new shared config file such as `src/config/backend.ts`
- files using direct backend env access, including:
  - `src/features/podcast/podcastTranslate.ts`
  - `src/features/podcast/podcastMusic.ts`
  - `src/features/podcast/usePodcastPlayback.ts`
  - `src/contexts/AuthContext.tsx`
  - `src/utils/downloadProxy.ts`
  - other direct fetch/helper files found in search

Technical detail:
- The persistent error is most likely caused by one of two things:
  1. stale preview assets from the old `preview--jbjglobalrealestate.lovable.app` host, or
  2. reliance on `import.meta.env` in generated/runtime code outside the exact path protected by the Vite fallback.
- The safest permanent fix is to centralize public backend config in normal source code and have app modules import that instead of reading `import.meta.env` everywhere.
