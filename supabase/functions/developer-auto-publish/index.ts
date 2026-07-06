// Developer Auto-Publish — trust-gated direct write
// If developer.trust_level = 'auto_publish', writes straight to projects/images/docs.
// Otherwise routes to developer_project_submissions for owner review.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  developer_id: string;
  // Either project_id (edit) or null (new project)
  project_id?: string | null;
  publish_live?: boolean;
  patch: {
    name?: string;
    slug?: string;
    description?: string;
    short_description?: string;
    location?: string;
    emirate?: string;
    area_name?: string;
    price_from?: number;
    price_to?: number;
    bedrooms_min?: number;
    bedrooms_max?: number;
    handover_date?: string;
    payment_plan?: string;
    cover_image_url?: string;
    unit_types?: string[];
    [k: string]: unknown;
  };
  images?: Array<{ image_url: string; alt_text?: string; display_order?: number }>;
  documents?: Array<{ file_url: string; file_name: string; document_type?: string; file_size?: number | null; storage_path?: string | null; cover_image_url?: string | null; display_title?: string | null }>;
  // Optional developer profile patch (logo, description)
  developer_patch?: {
    description?: string;
    logo_url?: string;
    website?: string;
  };
}

const FORBIDDEN_COVER = /(screenshot|whatsapp|convert\.io|1080x1080|\/frame\+?\d|logodix\.com)/i;

function validate(p: Payload): string | null {
  if (!p.developer_id) return "developer_id required";
  if (!p.patch || typeof p.patch !== "object") return "patch required";
  if (p.patch.cover_image_url && FORBIDDEN_COVER.test(p.patch.cover_image_url))
    return "cover_image_url matches forbidden pattern (screenshot/whatsapp/convert.io/etc.)";
  if (p.patch.price_from !== undefined && Number(p.patch.price_from) < 100000)
    return "price_from must be >= 100,000";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const payload = (await req.json()) as Payload;
    const verr = validate(payload);
    if (verr) {
      return new Response(JSON.stringify({ error: verr }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    const OWNER_BACKEND_EMAILS = new Set([
      "janeaboujaoudemodel@gmail.com",
      "janeaboujaoudenails@gmail.com",
      "contact@janeaboujaoude.net",
      "infoo.jane@gmail.com",
    ]);
    const userEmail = (userData.user.email || "").toLowerCase().trim();
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isOwner = OWNER_BACKEND_EMAILS.has(userEmail) && (roles || []).some((r: { role: string }) => r.role === "owner" || r.role === "admin");

    // 1. Verify the user is an approved rep for this developer, unless this is the verified owner.
    const { data: rep } = await admin
      .from("developer_representatives")
      .select("id, status, current_developer_id, auto_approve_uploads")
      .eq("user_id", userId)
      .eq("current_developer_id", payload.developer_id)
      .maybeSingle();

    if (!isOwner && (!rep || rep.status !== "approved")) {
      return new Response(
        JSON.stringify({ error: "not an approved rep for this developer" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Trust gate
    const { data: dev } = await admin
      .from("developers")
      .select("id, name, trust_level")
      .eq("id", payload.developer_id)
      .single();

    if (!dev) {
      return new Response(JSON.stringify({ error: "developer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trustLevel = isOwner ? "auto_publish" : dev.trust_level as "pending" | "auto_publish" | "suspended";

    // 3. Suspended → reject
    if (trustLevel === "suspended") {
      return new Response(
        JSON.stringify({ error: "developer trust suspended — contact owner" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Pending → route to review queue (no direct publish)
    if (trustLevel === "pending") {
      const { data: sub, error: subErr } = await admin
        .from("developer_project_submissions")
        .insert({
          user_id: userId,
          developer_id: payload.developer_id,
          project_id: payload.project_id ?? null,
          status: "pending_review",
          project_name: payload.patch.name ?? "(unnamed)",
          description: payload.patch.description ?? null,
          short_description: payload.patch.short_description ?? null,
          community_location: payload.patch.location ?? null,
          city_emirate: payload.patch.emirate ?? null,
          handover_date: payload.patch.handover_date ?? null,
          starting_price: payload.patch.price_from ?? null,
          unit_types: payload.patch.unit_types ?? null,
          payment_plan: payload.patch.payment_plan ?? null,
          attachments: {
            images: payload.images ?? [],
            documents: payload.documents ?? [],
            developer_patch: payload.developer_patch ?? null,
          },
        })
        .select("id")
        .single();

      if (subErr) throw subErr;

      await admin.from("developer_activity_log").insert({
        user_id: userId,
        activity_type: "upload",
        entity_type: "project",
        entity_id: payload.project_id ?? sub.id,
        entity_name: payload.patch.name ?? null,
        details: { route: "review_queue", trust_level: trustLevel },
      });

      return new Response(
        JSON.stringify({ status: "queued_for_review", submission_id: sub.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 5. OWNER/AUTO path. Owner uploads are saved as an internal preview unless the
    // client explicitly asks to publish live. This keeps Preview separate from Publish.
    const shouldPublishLive = isOwner ? payload.publish_live === true : payload.publish_live !== false;
    const projectPatch: Record<string, unknown> = {
      ...payload.patch,
      developer_id: payload.developer_id,
      // New preview records are hidden. Existing live records stay live unless
      // the owner explicitly uses the publish action.
      ...(payload.project_id ? {} : { is_published: shouldPublishLive ? false : false }),
      updated_at: new Date().toISOString(),
      source_updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    let projectId = payload.project_id ?? null;
    let projectSlug: string | null = null;

    if (projectId) {
      const { data: upd, error: updErr } = await admin
        .from("projects")
        .update(projectPatch)
        .eq("id", projectId)
        .select("slug")
        .single();
      if (updErr) throw updErr;
      projectSlug = upd?.slug ?? null;
    } else {
      // Generate slug if missing
      if (!projectPatch.slug && typeof projectPatch.name === "string") {
        projectPatch.slug = (projectPatch.name as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 80) + "-" + Date.now().toString(36);
      }
      const { data: ins, error: insErr } = await admin
        .from("projects")
        .insert(projectPatch as never)
        .select("id, slug")
        .single();
      if (insErr) throw insErr;
      projectId = ins.id;
      projectSlug = ins.slug ?? null;
    }

    // Images
    if (payload.images?.length && projectId) {
      const rows = payload.images.map((img, i) => ({
        project_id: projectId,
        image_url: img.image_url,
        alt_text: img.alt_text ?? null,
        display_order: img.display_order ?? i,
      }));
      await admin.from("project_images").insert(rows as never);
    }

    // Documents
    if (payload.documents?.length && projectId) {
      const rows = payload.documents.map((d, i) => ({
        project_id: projectId,
        file_url: d.file_url,
        file_name: d.file_name,
        document_type: d.document_type ?? "brochure",
        file_size: d.file_size ?? null,
        storage_path: d.storage_path ?? null,
        cover_image_url: d.cover_image_url ?? null,
        display_title: d.display_title ?? null,
        display_order: i,
        is_visible: true,
        allow_download: true,
        data_source: "owner_upload",
      }));
      await admin.from("project_documents").insert(rows as never);
    }

    // Developer profile patch (logo/description)
    if (payload.developer_patch) {
      await admin
        .from("developers")
        .update({ ...payload.developer_patch, updated_at: new Date().toISOString() })
        .eq("id", payload.developer_id);
    }

    await admin
      .from("developers")
      .update({ last_auto_publish_at: new Date().toISOString() })
      .eq("id", payload.developer_id);

    let published = false;
    let publishError: string | null = null;
    if (projectId && shouldPublishLive) {
      const { error: publishErr } = await admin
        .from("projects")
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (!publishErr) {
        published = true;
      } else {
        publishError = publishErr.message;
        console.error("developer-auto-publish publish step failed:", publishErr.message);
      }
    }

    await admin.from("developer_activity_log").insert({
      user_id: userId,
      activity_type: payload.project_id ? "edit" : "upload",
      entity_type: "project",
      entity_id: projectId,
      entity_name: payload.patch.name ?? null,
        details: { route: published ? "auto_publish" : "owner_preview", trust_level: trustLevel, publish_live: shouldPublishLive, patch: payload.patch },
    });

    return new Response(
      JSON.stringify({
        status: published ? "published" : "saved_preview",
        project_id: projectId,
        slug: projectSlug,
        public_path: projectSlug ? `/project/${projectSlug}` : null,
        publish_error: publishError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("developer-auto-publish error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
