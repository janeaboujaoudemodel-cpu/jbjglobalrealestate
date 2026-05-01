// Media Ingestion Rollback
// Undoes a merge by deleting the audit-tracked target rows and resetting the job.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RollbackRequest {
  job_ids: string[];
}

async function rollbackJob(supabase: ReturnType<typeof createClient>, jobId: string) {
  const { data: rows } = await supabase
    .from("media_ingestion_audit")
    .select("*")
    .eq("job_id", jobId);

  for (const r of rows ?? []) {
    if (r.target_table === "project_documents") {
      await supabase.from("project_documents").delete().eq("id", r.target_row_id);
    } else if (r.target_table === "project_videos") {
      await supabase.from("project_videos").delete().eq("id", r.target_row_id);
    } else if (r.target_table === "project_images") {
      await supabase.from("project_images").delete().eq("id", r.target_row_id);
    } else if (r.target_table === "projects.video_url") {
      await supabase
        .from("projects")
        .update({ video_url: null })
        .eq("id", r.target_row_id);
    }
  }

  await supabase.from("media_ingestion_audit").delete().eq("job_id", jobId);
  await supabase
    .from("material_ingestion_jobs")
    .update({ status: "needs_review", merged_at: null, merged_by: null, merge_target: null })
    .eq("id", jobId);

  return { jobId, status: "rolled_back" };
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
    const body = (await req.json()) as RollbackRequest;
    if (!Array.isArray(body.job_ids) || body.job_ids.length === 0) {
      return new Response(JSON.stringify({ error: "job_ids required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];
    for (const id of body.job_ids.slice(0, 100)) {
      results.push(await rollbackJob(supabase, id));
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
