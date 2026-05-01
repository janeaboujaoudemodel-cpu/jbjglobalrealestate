// Media Ingestion Merge
// Approves ingestion jobs and merges them into the matched project.
// PDFs/brochures → project_documents
// Videos → projects.video_url (if empty) or project_videos
// Renders/images → project_images
// Files are moved from ingestion-staging into project-documents / project-media.
// Every merge writes a media_ingestion_audit row for one-click rollback.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MergeRequest {
  job_ids: string[];
}

const VIDEO_DOC_TYPES = new Set(["video_tour"]);
const IMAGE_DOC_TYPES = new Set(["render"]);
const DOCUMENT_DOC_TYPES = new Set([
  "brochure",
  "fact_sheet",
  "presentation",
  "floor_plan",
  "payment_plan",
  "unknown",
]);

async function mergeJob(supabase: ReturnType<typeof createClient>, jobId: string, userId: string) {
  const { data: job, error: jobErr } = await supabase
    .from("material_ingestion_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobErr || !job) return { jobId, error: "job_not_found" };
  if (!job.matched_project_id) return { jobId, error: "no_project_match" };
  if (job.status === "merged") return { jobId, status: "already_merged" };

  const docType: string = job.detected_doc_type || "unknown";
  const auditRows: any[] = [];

  // Resolve a public URL for files. We move ingestion-staging files into the
  // appropriate target bucket so they can be served alongside existing assets.
  let finalUrl: string | null = null;
  let finalStoragePath: string | null = null;
  let targetBucket: string | null = null;

  if (job.file_path) {
    targetBucket =
      VIDEO_DOC_TYPES.has(docType) || IMAGE_DOC_TYPES.has(docType)
        ? "project-media"
        : "project-documents";
    const newPath = `${job.matched_project_id}/${docType}/${Date.now()}-${
      job.file_name || "file"
    }`;
    // Best effort: copy into target bucket. If buckets differ, we use copy via download/upload.
    try {
      const { data: dl } = await supabase.storage
        .from("ingestion-staging")
        .download(job.file_path);
      if (dl) {
        const arr = new Uint8Array(await dl.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from(targetBucket)
          .upload(newPath, arr, {
            contentType: job.mime_type || "application/octet-stream",
            upsert: false,
          });
        if (!upErr) {
          finalStoragePath = newPath;
          const { data: pub } = supabase.storage.from(targetBucket).getPublicUrl(newPath);
          finalUrl = pub?.publicUrl ?? null;
          // Remove original
          await supabase.storage.from("ingestion-staging").remove([job.file_path]);
        }
      }
    } catch (e) {
      console.error("storage move failed", e);
    }
  } else if (job.source_url) {
    finalUrl = job.source_url;
  }

  if (!finalUrl) return { jobId, error: "no_file_or_url" };

  // Branch by doc type
  if (VIDEO_DOC_TYPES.has(docType)) {
    // Try setting projects.video_url if empty
    const { data: proj } = await supabase
      .from("projects")
      .select("id, video_url")
      .eq("id", job.matched_project_id)
      .maybeSingle();

    if (proj && !proj.video_url) {
      await supabase
        .from("projects")
        .update({ video_url: finalUrl })
        .eq("id", job.matched_project_id);
      auditRows.push({
        target_table: "projects.video_url",
        target_row_id: job.matched_project_id,
        action: "set_video_url",
        payload: { url: finalUrl },
      });
    } else {
      const { data: ins } = await supabase
        .from("project_videos")
        .insert({
          project_id: job.matched_project_id,
          url: finalUrl,
          title: job.file_name || job.matched_project_name,
          source_job_id: job.id,
          display_order: 0,
          is_visible: true,
        })
        .select("id")
        .single();
      if (ins?.id) {
        auditRows.push({
          target_table: "project_videos",
          target_row_id: ins.id,
          action: "insert",
          payload: { url: finalUrl },
        });
      }
    }
  } else if (IMAGE_DOC_TYPES.has(docType)) {
    const { data: ins } = await supabase
      .from("project_images")
      .insert({
        project_id: job.matched_project_id,
        image_url: finalUrl,
        alt_text: job.file_name || job.matched_project_name,
        display_order: 99,
        data_source: "media-ingestion",
      })
      .select("id")
      .single();
    if (ins?.id) {
      auditRows.push({
        target_table: "project_images",
        target_row_id: ins.id,
        action: "insert",
        payload: { url: finalUrl },
      });
    }
  } else {
    // Documents
    const { data: ins } = await supabase
      .from("project_documents")
      .insert({
        project_id: job.matched_project_id,
        document_type: docType,
        file_url: finalUrl,
        file_name: job.file_name,
        file_size: job.file_size,
        storage_path: finalStoragePath,
        is_visible: true,
        allow_download: true,
        display_title: job.file_name,
        data_source: "media-ingestion",
        display_order: 0,
      })
      .select("id")
      .single();
    if (ins?.id) {
      auditRows.push({
        target_table: "project_documents",
        target_row_id: ins.id,
        action: "insert",
        payload: { url: finalUrl, doc_type: docType },
      });
    }
  }

  // Audit
  if (auditRows.length) {
    await supabase
      .from("media_ingestion_audit")
      .insert(
        auditRows.map((r) => ({
          ...r,
          job_id: job.id,
          performed_by: userId,
        })),
      );
  }

  await supabase
    .from("material_ingestion_jobs")
    .update({
      status: "merged",
      merged_at: new Date().toISOString(),
      merged_by: userId,
      merge_target: { url: finalUrl, doc_type: docType, project_id: job.matched_project_id },
    })
    .eq("id", job.id);

  return { jobId, status: "merged", url: finalUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userResp } = await userClient.auth.getUser();
    if (!userResp?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json()) as MergeRequest;
    if (!Array.isArray(body.job_ids) || body.job_ids.length === 0) {
      return new Response(JSON.stringify({ error: "job_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    for (const id of body.job_ids.slice(0, 100)) {
      results.push(await mergeJob(supabase, id, userResp.user.id));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
