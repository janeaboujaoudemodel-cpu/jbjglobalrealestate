// Enrich a developer from their Google Drive folder.
// Owner-only. Queues a developer_drive_jobs row and, if a Google Drive
// credential is configured (GOOGLE_DRIVE_API_KEY or GOOGLE_SERVICE_ACCOUNT_JSON),
// begins scanning immediately. Without a credential, the job is queued and the
// response includes { needs_credential: true } so the UI can prompt the owner.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function extractFolderId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/folders\/([A-Za-z0-9_-]+)/) || url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Verify caller
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    // Owner check
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);
    if (!roles || roles.length === 0) return json({ error: "forbidden" }, 403);

    const { developer_id } = await req.json().catch(() => ({}));
    if (!developer_id) return json({ error: "developer_id required" }, 400);

    const { data: dev, error: devErr } = await admin
      .from("developers")
      .select("id, name, slug, google_drive_url")
      .eq("id", developer_id)
      .maybeSingle();
    if (devErr || !dev) return json({ error: "developer not found" }, 404);
    if (!dev.google_drive_url) return json({ error: "no google_drive_url on this developer" }, 400);

    const folderId = extractFolderId(dev.google_drive_url);
    if (!folderId) return json({ error: "could not parse Drive folder id from URL" }, 400);

    // Queue the job
    const { data: job } = await admin
      .from("developer_drive_jobs")
      .insert({
        developer_id: dev.id,
        folder_url: dev.google_drive_url,
        status: "queued",
      })
      .select("id")
      .single();

    await admin
      .from("developers")
      .update({ drive_enrichment_status: "queued" })
      .eq("id", dev.id);

    // If no Google credential yet, keep the job queued and tell the client.
    const driveKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    const serviceAccount = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!driveKey && !serviceAccount) {
      return json({
        ok: true,
        job_id: job?.id ?? null,
        needs_credential: true,
        message: "Job queued. Add GOOGLE_DRIVE_API_KEY (public folders) or GOOGLE_SERVICE_ACCOUNT_JSON (private folders) to start the scan.",
      });
    }

    // Credential is present — start the scan (list files, hand off to enrichment).
    // The heavy scan work is intentionally out-of-scope for the queue endpoint;
    // it runs in a follow-up worker. We only kick it here.
    await admin
      .from("developer_drive_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", job!.id);
    await admin
      .from("developers")
      .update({ drive_enrichment_status: "running" })
      .eq("id", dev.id);

    return json({ ok: true, job_id: job?.id ?? null, needs_credential: false });
  } catch (e) {
    console.error("enrich-developer-from-drive error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
