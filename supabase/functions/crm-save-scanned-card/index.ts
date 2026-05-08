import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Action = "check" | "insert" | "update" | "merge" | "append_note";

// crm_contact_type enum is: client, broker, developer, investor, vendor, other
function mapContactType(label: string): string {
  const m: Record<string, string> = {
    broker: "broker",
    brokerage_agency: "broker",
    developer: "developer",
    investor: "investor",
    client: "client",
    partner: "vendor",
    media: "other",
    supplier: "vendor",
    other: "other",
  };
  return m[(label || "").toLowerCase()] || "other";
}

function digits(s?: string | null) {
  return (s || "").replace(/\D/g, "");
}

function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const action: Action = body.action || "check";
    const contact = body.contact || {};
    const labels: string[] = Array.isArray(body.labels) ? body.labels.filter(nonEmpty) : [];
    const contactTypeLabel: string = body.contact_type || "client";
    const cardImageBase64: string | undefined = body.card_image_base64;
    const existingId: string | undefined = body.existing_lead_id;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. CRM-wide duplicate detection
    const emailLower = nonEmpty(contact.email) ? contact.email.toLowerCase().trim() : null;
    const mobileDigits = digits(contact.mobile);
    const fullName = nonEmpty(contact.name) ? contact.name.trim() : null;
    const companyName = nonEmpty(contact.company_name) ? contact.company_name.trim() : null;

    const orParts: string[] = [];
    if (emailLower) orParts.push(`email_lower.eq.${emailLower}`);
    if (mobileDigits.length >= 6) {
      orParts.push(`phone_normalized.eq.${mobileDigits}`);
      orParts.push(`phone_e164.eq.${contact.mobile}`);
    }
    let duplicate: any = null;
    if (orParts.length > 0) {
      const { data } = await admin
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, company_name, contact_type, tags, notes")
        .or(orParts.join(","))
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (data) duplicate = data;
    }
    if (!duplicate && fullName && companyName) {
      const { data } = await admin
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, company_name, contact_type, tags, notes")
        .ilike("full_name", fullName)
        .ilike("company_name", companyName)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (data) duplicate = data;
    }

    if (action === "check") {
      return new Response(
        JSON.stringify({ status: duplicate ? "duplicate" : "new", existing: duplicate }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Optional: persist original card image
    let cardImagePath: string | null = null;
    if (cardImageBase64 && typeof cardImageBase64 === "string") {
      try {
        const m = cardImageBase64.match(/^data:(.+);base64,(.*)$/);
        if (m) {
          const mime = m[1];
          const ext = mime.split("/")[1]?.split("+")[0] || "png";
          const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
          const path = `${auth.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await admin.storage
            .from("business-card-scans")
            .upload(path, bin, { contentType: mime, upsert: false });
          if (!upErr) cardImagePath = path;
        }
      } catch (e) {
        console.warn("card image upload failed", e);
      }
    }

    const contactType = mapContactType(contactTypeLabel);
    const vipFlag = labels.map((l) => l.toLowerCase()).includes("vip");

    const baseFields: Record<string, unknown> = {
      full_name: fullName || "Unnamed contact",
      email_lower: emailLower,
      email_normalized: emailLower,
      phone_e164: nonEmpty(contact.mobile) ? contact.mobile : null,
      phone_normalized: mobileDigits || null,
      phone_raw: nonEmpty(contact.mobile) ? contact.mobile : null,
      whatsapp_e164: nonEmpty(contact.whatsapp) ? contact.whatsapp : null,
      company_name: companyName,
      contact_type: contactType,
      tags: labels,
      vip: vipFlag,
      source: "business_card_scan",
      lead_source_type: "scan",
      current_location_city: nonEmpty(contact.city) ? contact.city : null,
      current_location_country: nonEmpty(contact.country) ? contact.country : null,
      notes: nonEmpty(contact.notes) ? contact.notes : null,
      raw_import: {
        ocr: contact,
        labels,
        contact_type_label: contactTypeLabel,
        card_image_path: cardImagePath,
        scanned_at: new Date().toISOString(),
        scanned_by: auth.userId,
      },
    };

    let leadId: string | null = null;

    if (action === "insert" || (action === "merge" && !duplicate)) {
      const { data, error } = await admin
        .from("crm_leads")
        .insert({
          ...baseFields,
          owner_type: "company_assigned",
          created_by_user_id: auth.userId,
          import_approval_status: "approved",
        })
        .select("id")
        .single();
      if (error) throw error;
      leadId = data.id;
    } else if (action === "update" || action === "merge") {
      const target = existingId || duplicate?.id;
      if (!target) throw new Error("No existing lead to update");
      // Merge: never overwrite a non-empty existing field with empty
      const { data: existing } = await admin
        .from("crm_leads")
        .select("*")
        .eq("id", target)
        .maybeSingle();
      const patch: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(baseFields)) {
        if (k === "raw_import" || k === "tags") continue;
        if (v === null || v === undefined || v === "") continue;
        if (existing && nonEmpty((existing as any)[k])) continue;
        patch[k] = v;
      }
      // Tags: union
      const existingTags: string[] = Array.isArray(existing?.tags) ? existing.tags : [];
      const mergedTags = Array.from(new Set([...existingTags, ...labels]));
      patch.tags = mergedTags;
      if (vipFlag) patch.vip = true;
      patch.raw_import = {
        ...(existing?.raw_import || {}),
        last_scan: baseFields.raw_import,
      };
      const { error } = await admin.from("crm_leads").update(patch).eq("id", target);
      if (error) throw error;
      leadId = target;
    } else if (action === "append_note") {
      const target = existingId || duplicate?.id;
      if (!target) throw new Error("No existing lead to append note");
      const { data: existing } = await admin
        .from("crm_leads")
        .select("notes, raw_import")
        .eq("id", target)
        .maybeSingle();
      const stamp = new Date().toISOString().slice(0, 10);
      const noteLine = `[${stamp}] Re-scanned card. ${
        nonEmpty(contact.notes) ? contact.notes : "No additional notes."
      }`;
      const { error } = await admin
        .from("crm_leads")
        .update({
          notes: existing?.notes ? `${existing.notes}\n${noteLine}` : noteLine,
          raw_import: { ...(existing?.raw_import || {}), last_scan: baseFields.raw_import },
        })
        .eq("id", target);
      if (error) throw error;
      leadId = target;
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    // 3. Link to brokerage / developer registry (reuse existing tables)
    if (leadId) {
      if (nonEmpty(contact.agency_name)) {
        const { data: existingBroker } = await admin
          .from("crm_brokerages")
          .select("id")
          .eq("owner_id", auth.userId)
          .ilike("company_name", contact.agency_name.trim())
          .maybeSingle();
        if (!existingBroker) {
          await admin.from("crm_brokerages").insert({
            owner_id: auth.userId,
            company_name: contact.agency_name.trim(),
            website: nonEmpty(contact.website) ? contact.website : null,
            office_location: nonEmpty(contact.address) ? contact.address : null,
            primary_contact: {
              name: fullName,
              email: emailLower,
              mobile: contact.mobile || null,
              title: contact.title || null,
              source: "business_card_scan",
            },
            tags: labels,
            notes: `Created from scanned business card on ${new Date().toISOString().slice(0, 10)}`,
          });
        }
      }
      if (nonEmpty(contact.developer_name)) {
        const slug = contact.developer_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { data: existingDev } = await admin
          .from("crm_developer_registry")
          .select("id")
          .eq("owner_id", auth.userId)
          .eq("developer_slug", slug)
          .maybeSingle();
        if (!existingDev) {
          await admin.from("crm_developer_registry").insert({
            owner_id: auth.userId,
            developer_name: contact.developer_name.trim(),
            developer_slug: slug,
            developer_email: emailLower,
            developer_contact: {
              name: fullName,
              email: emailLower,
              mobile: contact.mobile || null,
              title: contact.title || null,
              source: "business_card_scan",
            },
            tags: labels,
            notes: `Created from scanned business card on ${new Date().toISOString().slice(0, 10)}`,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", lead_id: leadId, card_image_path: cardImagePath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("crm-save-scanned-card error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Save failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
