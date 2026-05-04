// Media Ingestion Classify
// Reads a job (file in ingestion-staging or a URL), runs AI matching against
// developers + projects, and updates the job with detected developer/project,
// confidence, and document type.

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
});

async function hasOwnerOrAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "owner", "listing_admin"]);
  return (data?.length ?? 0) > 0;
}

const DOC_TYPES = [
  "brochure",
  "fact_sheet",
  "presentation",
  "floor_plan",
  "payment_plan",
  "video_tour",
  "render",
  "unknown",
] as const;

function guessDocTypeFromName(name: string): string {
  const n = name.toLowerCase();
  if (/\.(mp4|mov|webm|mkv|avi)$/i.test(n)) return "video_tour";
  if (n.includes("brochure")) return "brochure";
  if (n.includes("fact") && n.includes("sheet")) return "fact_sheet";
  if (n.includes("factsheet")) return "fact_sheet";
  if (n.includes("payment") && n.includes("plan")) return "payment_plan";
  if (n.includes("floor") && n.includes("plan")) return "floor_plan";
  if (n.includes("presentation") || n.includes("deck")) return "presentation";
  if (n.includes("render")) return "render";
  return "unknown";
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function filenameHeuristicMatch(
  fileName: string,
  developers: { id: string; name: string; slug?: string | null }[],
  projects: { id: string; name: string; slug?: string | null; developer_id?: string | null; developer_name?: string | null }[],
) {
  const nm = normalizeName(fileName);
  let dev: { id: string; name: string } | null = null;
  for (const d of developers) {
    const variants = [d.name, d.slug ?? ""].filter(Boolean).map((s) => s.toLowerCase());
    if (variants.some((v) => v && nm.includes(v))) {
      dev = { id: d.id, name: d.name };
      break;
    }
  }
  let proj: { id: string; name: string } | null = null;
  for (const p of projects) {
    const variants = [p.name, p.slug ?? ""].filter(Boolean).map((s) => s.toLowerCase());
    if (variants.some((v) => v && nm.includes(v))) {
      proj = { id: p.id, name: p.name };
      if (!dev && p.developer_id) {
        dev = { id: p.developer_id, name: p.developer_name ?? "" };
      }
      break;
    }
  }
  return { dev, proj };
}

async function aiMatch({
  fileName,
  textSample,
  developers,
  projects,
}: {
  fileName: string;
  textSample: string;
  developers: { id: string; name: string }[];
  projects: { id: string; name: string; developer_id?: string | null }[];
}) {
  if (!LOVABLE_API_KEY) {
    return null;
  }

  const devList = developers
    .slice(0, 200)
    .map((d) => `${d.id}::${d.name}`)
    .join("\n");
  const projList = projects
    .slice(0, 500)
    .map((p) => `${p.id}::${p.name}::${p.developer_id ?? ""}`)
    .join("\n");

  const systemPrompt = `You are matching real estate marketing materials (videos, PDFs, brochures, links) to a developer and a project from the lists below. Use only the IDs from the lists. Return null when uncertain. Confidence is between 0 and 1.

DEVELOPERS (id::name):
${devList}

PROJECTS (id::name::developer_id):
${projList}`;

  const userPrompt = `File: ${fileName}

Content sample (truncated):
${textSample.slice(0, 6000)}

Match this material to a developer and a project. Also detect the document type from: ${DOC_TYPES.join(", ")}.`;

  const body = {
    model: "google/gemini-3-flash-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "report_match",
          description: "Return the matched developer/project + document type",
          parameters: {
            type: "object",
            properties: {
              developer_id: { type: ["string", "null"] },
              developer_name: { type: ["string", "null"] },
              developer_confidence: { type: "number" },
              project_id: { type: ["string", "null"] },
              project_name: { type: ["string", "null"] },
              project_confidence: { type: "number" },
              doc_type: { type: "string", enum: [...DOC_TYPES] },
              summary: { type: "string" },
            },
            required: ["developer_confidence", "project_confidence", "doc_type", "summary"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "report_match" } },
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.error("AI gateway error", resp.status, await resp.text());
    return null;
  }

  const data = await resp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments);
  } catch {
    return null;
  }
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // Lightweight: pull readable strings out of the PDF; works for first-pass matching.
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(bytes);
  const matches = raw.match(/\(([^)]{3,200})\)/g) || [];
  const text = matches
    .map((m) => m.slice(1, -1))
    .filter((s) => /[A-Za-z]{3,}/.test(s))
    .join(" ")
    .replace(/\s+/g, " ");
  return text.slice(0, 8000);
}

async function classifyJob(supabase: ReturnType<typeof createClient>, jobId: string) {
  const { data: job, error: jobErr } = await supabase
    .from("material_ingestion_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (jobErr || !job) return { jobId, error: "job_not_found" };

  await supabase
    .from("material_ingestion_jobs")
    .update({ status: "processing" })
    .eq("id", jobId);

  // Pull the developer + project lists once
  const { data: developers } = await supabase
    .from("developers")
    .select("id, name, slug")
    .order("name");
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, developer_id, developer_name")
    .eq("is_published", true)
    .order("name")
    .limit(2000);

  const fileName: string = job.file_name || job.source_url || "unknown";
  let textSample = "";
  let detectedDocType = guessDocTypeFromName(fileName);

  // For PDFs in storage, pull text. For videos/links we pass filename + url.
  if (job.file_path && job.mime_type?.includes("pdf")) {
    try {
      const { data: dl } = await supabase.storage
        .from("ingestion-staging")
        .download(job.file_path);
      if (dl) {
        const buf = await dl.arrayBuffer();
        textSample = await extractTextFromPdf(buf);
      }
    } catch (e) {
      console.error("pdf extract failed", e);
    }
  } else if (job.source_url) {
    textSample = `Link: ${job.source_url}`;
  }

  // Heuristic pre-pass
  const heur = filenameHeuristicMatch(fileName, developers ?? [], projects ?? []);

  let detectedDeveloperId = heur.dev?.id ?? null;
  let detectedDeveloperName = heur.dev?.name ?? null;
  let developerConfidence = heur.dev ? 0.9 : 0;
  let matchedProjectId = heur.proj?.id ?? null;
  let matchedProjectName = heur.proj?.name ?? null;
  let matchConfidence = heur.proj ? 0.92 : 0;
  let aiSummary = heur.proj
    ? `Filename match: ${fileName} → ${heur.proj.name}`
    : "";

  // AI fallback when filename match wasn't conclusive
  if (matchConfidence < 0.85) {
    const ai = await aiMatch({
      fileName,
      textSample,
      developers: (developers ?? []).map((d) => ({ id: d.id, name: d.name })),
      projects: (projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        developer_id: p.developer_id,
      })),
    });
    if (ai) {
      if (ai.developer_id) {
        detectedDeveloperId = ai.developer_id;
        detectedDeveloperName = ai.developer_name ?? detectedDeveloperName;
        developerConfidence = ai.developer_confidence ?? developerConfidence;
      }
      if (ai.project_id) {
        matchedProjectId = ai.project_id;
        matchedProjectName = ai.project_name ?? matchedProjectName;
        matchConfidence = ai.project_confidence ?? matchConfidence;
      }
      detectedDocType = ai.doc_type ?? detectedDocType;
      aiSummary = ai.summary ?? aiSummary;
    }
  }

  let nextStatus = "unmatched";
  if (matchConfidence >= 0.85 && matchedProjectId) nextStatus = "auto_matched";
  else if (matchConfidence >= 0.5) nextStatus = "needs_review";

  const { error: upErr } = await supabase
    .from("material_ingestion_jobs")
    .update({
      detected_doc_type: detectedDocType,
      detected_developer_id: detectedDeveloperId,
      detected_developer_name: detectedDeveloperName,
      developer_confidence: developerConfidence,
      matched_project_id: matchedProjectId,
      matched_project_name: matchedProjectName,
      match_confidence: matchConfidence,
      ai_summary: aiSummary,
      status: nextStatus,
    })
    .eq("id", jobId);

  if (upErr) return { jobId, error: upErr.message };
  return { jobId, status: nextStatus };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: authHeader } },
    });

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
    const { job_ids } = parsed.data;

    // Mark all jobs as queued immediately, process in background to avoid
    // WORKER_RESOURCE_LIMIT (CPU/wall-time) on the request handler.
    await supabase
      .from("material_ingestion_jobs")
      .update({ status: "processing" })
      .in("id", job_ids);

    const runInBackground = async () => {
      for (const id of job_ids) {
        try {
          await classifyJob(supabase, id);
        } catch (err) {
          console.error("classifyJob failed", id, err);
          try {
            await supabase
              .from("material_ingestion_jobs")
              .update({ status: "unmatched", ai_summary: err instanceof Error ? err.message : "failed" })
              .eq("id", id);
          } catch (_) { /* ignore */ }
        }
      }
    };

    // @ts-ignore EdgeRuntime is provided by Supabase edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(runInBackground());
    } else {
      runInBackground();
    }

    return new Response(
      JSON.stringify({ queued: job_ids.length, job_ids, status: "processing" }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
