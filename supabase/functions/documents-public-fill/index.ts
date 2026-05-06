// documents-public-fill: public endpoint used by the recipient signing page.
// GET ?token=...    -> fetches a safe view of the document
// POST { token, field_values?, client_signature_data_url?, action }
//                   -> "open" | "fill" | "sign" | "complete"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) return j({ error: "token required" }, 400);
      const { data } = await admin.rpc("get_document_by_token", { p_token: token });
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return j({ error: "not found" }, 404);
      // mark opened
      await admin.from("crm_documents")
        .update({ opened_at: new Date().toISOString(),
          status: row.status === "sent" ? "opened" : row.status })
        .eq("recipient_token", token).is("opened_at", null);
      return j(row);
    }

    if (req.method === "POST") {
      const { token, field_values, client_signature_data_url, action } = await req.json();
      if (!token || !action) return j({ error: "token and action required" }, 400);
      const { data: docArr } = await admin.from("crm_documents").select("*")
        .eq("recipient_token", token).maybeSingle();
      const doc = docArr as any;
      if (!doc) return j({ error: "not found" }, 404);
      if (doc.status === "completed" || doc.status === "expired" || doc.status === "cancelled")
        return j({ error: "document closed" }, 410);

      const patch: Record<string, unknown> = {};
      if (field_values && typeof field_values === "object") {
        patch.field_values = { ...(doc.field_values || {}), ...field_values };
      }
      if (client_signature_data_url && typeof client_signature_data_url === "string"
          && client_signature_data_url.startsWith("data:image/")
          && client_signature_data_url.length < 600_000) {
        patch.client_signature_data_url = client_signature_data_url;
      }
      const now = new Date().toISOString();
      if (action === "fill") { patch.status = "filled"; patch.filled_at = now; }
      if (action === "sign") {
        if (!patch.client_signature_data_url && !doc.client_signature_data_url)
          return j({ error: "signature required" }, 400);
        patch.status = "signed"; patch.signed_at = now;
      }
      if (action === "complete") { patch.status = "completed"; patch.completed_at = now; }

      const { error } = await admin.from("crm_documents").update(patch).eq("id", doc.id);
      if (error) return j({ error: error.message }, 500);
      return j({ ok: true });
    }

    return j({ error: "method not allowed" }, 405);
  } catch (e) {
    console.error("documents-public-fill error", e);
    return j({ error: String((e as Error).message ?? e) }, 500);
  }
});

function j(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
