// Apply the owner's adopted signature + stamp to every signature/initial/stamp
// field on an envelope. Stamps the date on date fields, marks fields completed,
// flips the envelope to 'completed' and writes a row in esign_signed_documents.
//
// Input: { envelope_id, signature_asset_id, stamp_asset_id?, initials_asset_id? }

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const { envelope_id, signature_asset_id, stamp_asset_id, initials_asset_id } = await req.json();
  if (!envelope_id || !signature_asset_id) {
    return new Response(JSON.stringify({ error: "envelope_id and signature_asset_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify ownership of envelope
  const { data: env } = await supabase
    .from("esign_envelopes")
    .select("id, sender_id, name, document_url, document_filename, metadata")
    .eq("id", envelope_id)
    .single();
  if (!env || env.sender_id !== auth.userId) {
    return new Response(JSON.stringify({ error: "Envelope not found or access denied" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load assets (must belong to user)
  const ids = [signature_asset_id, stamp_asset_id, initials_asset_id].filter(Boolean);
  const { data: assets } = await supabase
    .from("owner_signature_assets")
    .select("id, kind, image_url")
    .in("id", ids)
    .eq("user_id", auth.userId);

  const assetMap: Record<string, { kind: string; image_url: string }> = {};
  (assets ?? []).forEach((a) => { assetMap[a.id] = a; });

  const sigAsset = assetMap[signature_asset_id];
  if (!sigAsset) {
    return new Response(JSON.stringify({ error: "Signature asset not found" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const stampAsset = stamp_asset_id ? assetMap[stamp_asset_id] : null;
  const initAsset = initials_asset_id ? assetMap[initials_asset_id] : null;

  // Walk every field
  const { data: fields } = await supabase
    .from("esign_fields")
    .select("id, field_type")
    .eq("envelope_id", envelope_id);

  const today = new Date().toISOString().split("T")[0];
  let filled = 0;

  for (const f of fields ?? []) {
    let value: string | null = null;
    if (f.field_type === "signature") value = sigAsset.image_url;
    else if (f.field_type === "initials") value = (initAsset ?? sigAsset).image_url;
    else if (f.field_type === "stamp") value = (stampAsset ?? sigAsset).image_url;
    else if (f.field_type === "date") value = today;
    else continue;

    await supabase
      .from("esign_fields")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        field_value: value,
      })
      .eq("id", f.id);
    filled++;
  }

  // Update recipients status (mark all as signed by owner)
  await supabase
    .from("esign_recipients")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signature_data: sigAsset.image_url,
      initials_data: (initAsset ?? sigAsset).image_url,
    })
    .eq("envelope_id", envelope_id);

  // Mark envelope completed
  await supabase
    .from("esign_envelopes")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      signed_document_url: env.document_url,
      metadata: { ...(env.metadata ?? {}), adopted_by_owner: true },
    })
    .eq("id", envelope_id);

  // Insert signed_documents row (use original doc URL — frontend handles flatten)
  await supabase.from("esign_signed_documents").insert({
    envelope_id,
    document_url: env.document_url,
    document_filename: env.document_filename,
    certificate_data: {
      signed_at: new Date().toISOString(),
      adopted: true,
      filled_fields: filled,
    },
  });

  return new Response(JSON.stringify({ ok: true, filled_fields: filled }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
