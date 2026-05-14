// PAA → Listing draft sync.
// Given an esign envelope (PAA template), upsert a draft project linked
// via projects.source_envelope_id. Always strips owner PII fields.
import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || `listing-${Date.now()}`;

const num = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { envelope_id } = await req.json();
    if (!envelope_id || typeof envelope_id !== "string") {
      return new Response(JSON.stringify({ error: "envelope_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: env, error: envErr } = await admin
      .from("esign_envelopes")
      .select("id, sender_id, category, template_field_values, template_key, name")
      .eq("id", envelope_id)
      .maybeSingle();
    if (envErr || !env) {
      return new Response(JSON.stringify({ error: envErr?.message || "envelope not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (env.sender_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Skip non-PAA categories (blank letter, generic) — return success without sync.
    if (env.category !== "leasing" && env.category !== "selling") {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "non-paa-category" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const f = (env.template_field_values || {}) as Record<string, string>;
    const cat = env.category === "selling" ? "resale" : "leasing";

    // PROPERTY-ONLY mapping. Never copy owner_*/landlord_*/email/mobile/passport/emirates_id/trn/poa/unit/signature.
    const propertyName =
      f.building_name?.trim() ||
      f.community?.trim() ||
      env.name?.trim() ||
      "Untitled Listing";

    const description = [
      f.community && `Community: ${f.community}`,
      f.street_name && `Street: ${f.street_name}`,
      f.property_type && `Type: ${f.property_type}`,
      f.furnishing && `Furnishing: ${f.furnishing}`,
      f.bedrooms && `${f.bedrooms} bed · ${f.bathrooms || "?"} bath`,
      f.bua_sqft && `${f.bua_sqft} sqft`,
      f.parking && `Parking: ${f.parking}`,
      f.additional_notes,
    ].filter(Boolean).join("\n");

    const price = cat === "leasing" ? num(f.rental_amount) : num(f.sales_amount);

    // Find existing draft for this envelope
    const { data: existing } = await admin
      .from("projects")
      .select("id, slug")
      .eq("source_envelope_id", envelope_id)
      .maybeSingle();

    const baseSlug = existing?.slug || `${slugify(propertyName)}-${envelope_id.slice(0, 8)}`;

    const payload = {
      name: propertyName,
      slug: baseSlug,
      description,
      location: [f.community, f.street_name].filter(Boolean).join(", ") || null,
      // community_id intentionally omitted — we don't auto-link to communities table
      emirate: "Dubai",
      price_from: price,
      price_to: price,
      bedrooms_min: num(f.bedrooms),
      bedrooms_max: num(f.bedrooms),
      size_min: num(f.bua_sqft),
      size_max: num(f.bua_sqft),
      furnished_status: /furnished/i.test(f.furnishing || "") && !/un/i.test(f.furnishing || "") ? "furnished" : "unfurnished",
      property_type_label: f.property_type || null,
      payment_plan: f.payment_plan || null,
      service_charge: f.service_charge_per_sqft ? `AED ${f.service_charge_per_sqft}/sqft` : null,
      source: "paa-envelope",
      source_id: envelope_id,
      source_envelope_id: envelope_id,
      listing_kind: cat,
      owner_pii_hidden: true,
      is_published: false,
      is_offplan: false,
      is_developer_direct: false,
    };

    let result;
    if (existing) {
      const { data, error } = await admin
        .from("projects")
        .update(payload)
        .eq("id", existing.id)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await admin
        .from("projects")
        .insert(payload)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ ok: true, project: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("paa-sync-listing error", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
