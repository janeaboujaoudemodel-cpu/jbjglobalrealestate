// Media Ingestion Merge
// Two modes:
//   - attach  (default): file is moved into project-documents / project-media and
//             surfaced on the listing via project_documents / project_videos / project_images.
//   - extract: file is moved into the private ingestion-archive bucket. AI summarises
//             the document and writes structured insights into projects.metadata.ai_enrichment.
//             The source file is NEVER linked from the public listing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const RequestSchema = z.object({
  job_ids: z.array(z.string().uuid()).min(1).max(100),
  mode: z.enum(["attach", "extract"]).optional().default("attach"),
});

const VIDEO_DOC_TYPES = new Set(["video_tour"]);
const IMAGE_DOC_TYPES = new Set(["render"]);

async function hasOwnerOrAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "owner", "listing_admin"]);
  return (data?.length ?? 0) > 0;
}

async function aiExtractEnrichment(textSample: string, projectName: string) {
  if (!LOVABLE_API_KEY || !textSample) return null;
  const body = {
    model: "google/gemini-3-flash-preview",
    messages: [
      {
        role: "system",
        content:
          "You extract structured real estate insights from marketing documents (brochures, fact sheets). Only output the requested JSON.",
      },
      {
        role: "user",
        content: `Project: ${projectName}\n\nDocument text (truncated):\n${textSample.slice(0, 8000)}`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "report_enrichment",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string" },
              price_min: { type: ["number", "null"] },
              price_max: { type: ["number", "null"] },
              price_currency: { type: ["string", "null"] },
              bedrooms: { type: "array", items: { type: "string" } },
              handover_date: { type: ["string", "null"] },
              payment_plan_summary: { type: ["string", "null"] },
              key_amenities: { type: "array", items: { type: "string" } },
              highlights: { type: "array", items: { type: "string" } },
            },
            required: ["summary"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "report_enrichment" } },
  };
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return null;
  }
}

async function extractTextFromPdfBytes(buf: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(new Uint8Array(buf));
  const matches = raw.match(/\(([^)]{3,200})\)/g) || [];
  return matches
    .map((m) => m.slice(1, -1))
    .filter((s) => /[A-Za-z]{3,}/.test(s))
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 16000);
}

async function mergeJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  userId: string,
  mode: "attach" | "extract",
) {
  const { data: job, error: jobErr } = await supabase
    .from("material_ingestion_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobErr || !job) return { jobId, error: "job_not_found" };
  if (!job.matched_project_id) return { jobId, error: "no_project_match" };
  if (job.status === "merged") return { jobId, status: "already_merged" };

  // Mark mode on job
  await supabase
    .from("material_ingestion_jobs")
    .update({ merge_mode: mode })
    .eq("id", jobId);

  if (mode === "extract") {
    return await extractJob(supabase, job, userId);
  }
  return await attachJob(supabase, job, userId);
}

async function extractJob(
  supabase: ReturnType<typeof createClient>,
  job: any,
  userId: string,
) {
  // Pull text sample (PDF only for now); other types get filename + summary.
  let textSample = job.ai_summary ?? "";
  if (job.file_path && job.mime_type?.includes("pdf")) {
    try {
      const { data: dl } = await supabase.storage
        .from("ingestion-staging")
        .download(job.file_path);
      if (dl) {
        const buf = await dl.arrayBuffer();
        textSample = await extractTextFromPdfBytes(buf);
      }
    } catch (e) {
      console.error("extract pdf download failed", e);
    }
  }

  const enrichment = await aiExtractEnrichment(
    textSample || job.file_name || "",
    job.matched_project_name || "",
  );

  // Move file to private archive (never publicly linked)
  let archivePath: string | null = null;
  if (job.file_path) {
    const newPath = `${job.matched_project_id}/${Date.now()}-${job.file_name || "file"}`;
    try {
      const { data: dl } = await supabase.storage
        .from("ingestion-staging")
        .download(job.file_path);
      if (dl) {
        const arr = new Uint8Array(await dl.arrayBuffer());
        const { error: upErr } = await supabase.storage
          .from("ingestion-archive")
          .upload(newPath, arr, {
            contentType: job.mime_type || "application/octet-stream",
            upsert: false,
          });
        if (!upErr) {
          archivePath = newPath;
          await supabase.storage.from("ingestion-staging").remove([job.file_path]);
        }
      }
    } catch (e) {
      console.error("archive move failed", e);
    }
  }

  // Merge enrichment into projects.metadata->'ai_enrichment'
  if (enrichment) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, metadata")
      .eq("id", job.matched_project_id)
      .maybeSingle();
    const meta: any = (proj?.metadata as any) ?? {};
    const existing = Array.isArray(meta.ai_enrichment) ? meta.ai_enrichment : [];
    existing.push({
      job_id: job.id,
      file_name: job.file_name,
      doc_type: job.detected_doc_type,
      extracted_at: new Date().toISOString(),
      ...enrichment,
    });
    meta.ai_enrichment = existing.slice(-50);
    await supabase
      .from("projects")
      .update({ metadata: meta })
      .eq("id", job.matched_project_id);
  }

  await supabase
    .from("media_ingestion_audit")
    .insert({
      job_id: job.id,
      target_table: "projects.metadata",
      target_row_id: job.matched_project_id,
      action: "extract_enrichment",
      payload: { archive_path: archivePath, enrichment },
      performed_by: userId,
    });

  await supabase
    .from("material_ingestion_jobs")
    .update({
      status: "merged",
      merged_at: new Date().toISOString(),
      merged_by: userId,
      merge_mode: "extract",
      merge_target: { mode: "extract", archive_path: archivePath, project_id: job.matched_project_id },
    })
    .eq("id", job.id);

  return { jobId: job.id, status: "extracted" };
}

async function attachJob(
  supabase: ReturnType<typeof createClient>,
  job: any,
  userId: string,
) {
  const docType: string = job.detected_doc_type || "unknown";
  const auditRows: any[] = [];

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
          await supabase.storage.from("ingestion-staging").remove([job.file_path]);
        }
      }
    } catch (e) {
      console.error("storage move failed", e);
    }
  } else if (job.source_url) {
    finalUrl = job.source_url;
  }

  if (!finalUrl) return { jobId: job.id, error: "no_file_or_url" };

  if (VIDEO_DOC_TYPES.has(docType)) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, video_url")
      .eq("id", job.matched_project_id)
      .maybeSingle();
    if (proj && !proj.video_url) {
      await supabase.from("projects").update({ video_url: finalUrl }).eq("id", job.matched_project_id);
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
      if (ins?.id)
        auditRows.push({
          target_table: "project_videos",
          target_row_id: ins.id,
          action: "insert",
          payload: { url: finalUrl },
        });
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
    if (ins?.id)
      auditRows.push({
        target_table: "project_images",
        target_row_id: ins.id,
        action: "insert",
        payload: { url: finalUrl },
      });
  } else {
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
    if (ins?.id)
      auditRows.push({
        target_table: "project_documents",
        target_row_id: ins.id,
        action: "insert",
        payload: { url: finalUrl, doc_type: docType },
      });
  }

  if (auditRows.length) {
    await supabase
      .from("media_ingestion_audit")
      .insert(auditRows.map((r) => ({ ...r, job_id: job.id, performed_by: userId })));
  }

  await supabase
    .from("material_ingestion_jobs")
    .update({
      status: "merged",
      merged_at: new Date().toISOString(),
      merged_by: userId,
      merge_mode: "attach",
      merge_target: { mode: "attach", url: finalUrl, doc_type: docType, project_id: job.matched_project_id },
    })
    .eq("id", job.id);

  return { jobId: job.id, status: "attached", url: finalUrl };
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
    if (!(await hasOwnerOrAdmin(supabase, userResp.user.id))) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { job_ids, mode } = parsed.data;

    const results: any[] = [];
    for (const id of job_ids) {
      results.push(await mergeJob(supabase, id, userResp.user.id, mode));
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
