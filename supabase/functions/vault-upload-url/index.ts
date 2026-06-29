// Issues a short-lived signed UPLOAD URL into the private "user-vault" bucket.
// Folder convention is enforced: {auth.uid}/{category}/{uuid}.{ext}
// Every issued URL is logged in vault_access_log.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CATEGORIES = ["identity", "property", "contract", "financial", "other"];
const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp", "image/heic",
];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB hard cap

function safeExt(name: string, mime: string): string {
  const fromName = name.toLowerCase().match(/\.([a-z0-9]{1,5})$/)?.[1];
  if (fromName) return fromName.replace(/[^a-z0-9]/g, "");
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/heic") return "heic";
  return "bin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Identify caller via their JWT
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => null);
    const category = String(body?.category ?? "other").toLowerCase();
    const displayName = String(body?.display_name ?? "document");
    const mime = String(body?.mime_type ?? "application/octet-stream");
    const size = Number(body?.size_bytes ?? 0);
    const docType = body?.doc_type ? String(body.doc_type) : null;

    if (!ALLOWED_CATEGORIES.includes(category))
      return new Response(JSON.stringify({ error: "invalid category" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!ALLOWED_MIME.includes(mime))
      return new Response(JSON.stringify({ error: "mime not allowed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!size || size <= 0 || size > MAX_BYTES)
      return new Response(JSON.stringify({ error: "file too large (max 25MB)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const ext = safeExt(displayName, mime);
    const objectId = crypto.randomUUID();
    const storagePath = `${userId}/${category}/${objectId}.${ext}`;

    // Service-role client (signs URL + writes DB + audit log)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: signed, error: signErr } = await admin.storage
      .from("user-vault")
      .createSignedUploadUrl(storagePath);
    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: signErr?.message ?? "sign failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-create the DB row so the file lands attached to the user immediately on upload.
    const { data: row, error: insErr } = await admin
      .from("vault_documents")
      .insert({
        user_id: userId,
        category,
        display_name: displayName.slice(0, 200),
        doc_type: docType,
        storage_path: storagePath,
        mime_type: mime,
        size_bytes: size,
      })
      .select("id")
      .single();

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("vault_access_log").insert({
      actor_id: userId,
      owner_id: userId,
      document_id: row.id,
      action: "upload_url_issued",
      ip: req.headers.get("x-forwarded-for"),
      user_agent: req.headers.get("user-agent"),
      meta: { storage_path: storagePath, mime, size },
    });

    return new Response(
      JSON.stringify({
        document_id: row.id,
        upload_url: signed.signedUrl,
        token: signed.token,
        storage_path: storagePath,
        expires_in_seconds: 120,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
