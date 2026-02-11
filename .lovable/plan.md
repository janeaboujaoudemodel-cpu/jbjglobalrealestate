

# Fix Plan: Visitor Tracking 401 & Video Errors

## Issue 1: Visitor Tracking 401 Unauthorized (Code Fix)

**Root Cause:** The table privilege hardening (security phase) revoked ALL privileges from the `anon` role on `visitor_sessions`, `visitor_events`, and `visitor_documents`. Since visitor tracking fires for every page view (including anonymous visitors), the Supabase client gets a 401 before RLS policies are even evaluated.

**Fix:** Grant the minimum required privileges to `anon` on the three visitor tracking tables. RLS policies already exist to control what operations are allowed.

**Database Migration:**
```sql
-- Allow anonymous visitors to be tracked
GRANT SELECT, INSERT, UPDATE ON public.visitor_sessions TO anon;
GRANT SELECT, INSERT ON public.visitor_events TO anon;
GRANT SELECT, INSERT ON public.visitor_documents TO anon;

-- Authenticated users also need access
GRANT SELECT, INSERT, UPDATE ON public.visitor_sessions TO authenticated;
GRANT SELECT, INSERT ON public.visitor_events TO authenticated;
GRANT SELECT, INSERT ON public.visitor_documents TO authenticated;
```

This restores tracking functionality while RLS policies (which already allow INSERT/UPDATE with `true`) handle the actual access control.

---

## Issue 2: Video Files ERR_CONNECTION_FAILED (Not a Code Bug)

The errors for `/videos/hero-video.mp4` and `burj-khalifa-day-to-night.mp4` come from `jbj.ae` -- your custom published domain. The files exist in the project and work on the Lovable preview URL. The `ERR_CONNECTION_FAILED` means the domain DNS is not resolving to the server.

**No code change needed.** You need to verify your `jbj.ae` domain DNS records point to the correct Lovable hosting endpoint. You can check this in your domain registrar's DNS settings.

---

## Summary

| # | Issue | Type | Fix |
|---|-------|------|-----|
| 1 | `visitor_sessions` 401 | DB privileges | Grant anon/authenticated INSERT/SELECT/UPDATE |
| 2 | Video ERR_CONNECTION_FAILED | DNS/Hosting | Verify `jbj.ae` domain DNS (not a code fix) |

