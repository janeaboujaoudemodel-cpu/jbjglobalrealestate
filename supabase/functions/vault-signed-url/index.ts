// Issues a 60-second signed DOWNLOAD/VIEW URL for a vault document.
// Only the document owner OR a user with the 'owner'/'admin' role can request it.
// Every signed URL is recorded in vault_access_log with expiry timestamp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const URL_TTL_SECONDS = 60;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const requester = userData.user.id;

    const body = await req.json().catch(() => null);
    const documentId = String(body?.document_id ?? "");
    if (!documentId)
      return new Response(JSON.stringify({ error: "document_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Pull the doc (service-role bypass RLS to inspect ownership)
    const { data: doc, error: docErr } = await admin
      .from("vault_documents")
      .select("id,user_id,storage_path,display_name,mime_type")
      .eq("id", documentId)
      .maybeSingle();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorisation: self OR owner-role OR admin-role
    let allowed = doc.user_id === requester;
    if (!allowed) {
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", requester);
      allowed = !!roles?.some((r: { role: string }) => r.role === "owner" || r.role === "admin");
    }
    if (!allowed) {
      await admin.from("vault_access_log").insert({
        actor_id: requester,
        owner_id: doc.user_id,
        document_id: doc.id,
        action: "download_denied",
        ip: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: signed, error: signErr } = await admin.storage
      .from("user-vault")
      .createSignedUrl(doc.storage_path, URL_TTL_SECONDS, {
        download: doc.display_name,
      });
    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: signErr?.message ?? "sign failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + URL_TTL_SECONDS * 1000).toISOString();
    await admin.from("vault_access_log").insert({
      actor_id: requester,
      owner_id: doc.user_id,
      document_id: doc.id,
      action: requester === doc.user_id ? "download_self" : "download_owner",
      signed_url_expires_at: expiresAt,
      ip: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(
      JSON.stringify({
        signed_url: signed.signedUrl,
        expires_at: expiresAt,
        expires_in_seconds: URL_TTL_SECONDS,
        display_name: doc.display_name,
        mime_type: doc.mime_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
