import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  try {
    const url = new URL(req.url);
    const documentId = url.searchParams.get("id");
    if (!documentId) return json(400, { error: "Missing document id" });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Look up the document
    const { data: doc, error: docErr } = await admin
      .from("project_documents")
      .select("id, file_url, file_name, document_type, allow_download, is_visible, display_title, storage_path, project_id")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) return json(404, { error: "Document not found" });

    // Enforce flags
    if (!(doc.is_visible ?? true)) return json(403, { error: "Document is not available" });
    if (!(doc.allow_download ?? true)) return json(403, { error: "Download is disabled for this document" });

    const filename = doc.display_title || doc.file_name || `${doc.document_type}-document`;
    const safeName = filename.replace(/[^\w\s.-]/g, "").replace(/\s+/g, "-") + ".pdf";

    // If storage_path is set, generate a signed URL from the bucket
    if (doc.storage_path) {
      const parts = doc.storage_path.split("/");
      const bucket = parts[0];
      const objectPath = parts.slice(1).join("/");

      const { data: signed, error: signErr } = await admin.storage
        .from(bucket)
        .createSignedUrl(objectPath, 300, { download: safeName });

      if (signErr || !signed?.signedUrl) {
        console.error("Signed URL error:", signErr);
        return json(502, { error: "Failed to generate download link" });
      }

      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: signed.signedUrl },
      });
    }

    // Fallback: redirect to file_url with Content-Disposition hint
    const targetUrl = doc.file_url;
    if (!targetUrl) return json(404, { error: "No file URL" });

    // Proxy through our existing download-file function
    const proxyUrl = new URL(`${supabaseUrl}/functions/v1/download-file`);
    proxyUrl.searchParams.set("url", targetUrl);
    proxyUrl.searchParams.set("filename", safeName);

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: proxyUrl.toString() },
    });
  } catch (e) {
    console.error("download-project-document error:", e);
    return json(500, { error: "Unexpected error" });
  }
});
