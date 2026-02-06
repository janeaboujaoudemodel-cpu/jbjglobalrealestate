// Studio Job Complete - Mark jobs as completed after client-side processing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed status values - strict whitelist
const ALLOWED_STATUSES = new Set(["completed", "failed"]);

interface CompleteJobRequest {
  jobId: string;
  outputPath?: string;
  status: "completed" | "failed";
  errorMessage?: string;
}

// Helper type for job input_data
interface JobInputData {
  userId?: string;
  [key: string]: unknown;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ========================================
    // AUTHENTICATION CHECK - Required
    // ========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing auth token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const body: CompleteJobRequest = await req.json();
    const { jobId, outputPath, status, errorMessage } = body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!jobId || typeof jobId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid jobId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate status is in allowed list
    if (!ALLOWED_STATUSES.has(status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status - must be 'completed' or 'failed'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // VALIDATE OUTPUT PATH (for completed jobs)
    // ========================================
    if (status === "completed") {
      if (!outputPath || typeof outputPath !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing outputPath for completed job" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SECURITY: Only allow expected prefix - must match the userId AND job ID
      const expectedPrefix = `video-export/${userId}/${jobId}/`;
      if (!outputPath.startsWith(expectedPrefix)) {
        console.warn(`[SECURITY] Invalid outputPath: ${outputPath} - expected prefix: ${expectedPrefix}`);
        return new Response(
          JSON.stringify({ error: "Invalid outputPath - must be in user's job export folder" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent path traversal attacks
      if (outputPath.includes("..") || outputPath.includes("\\") || outputPath.startsWith("/")) {
        console.warn(`[SECURITY] Path traversal attempt: ${outputPath}`);
        return new Response(
          JSON.stringify({ error: "Invalid outputPath - path traversal not allowed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ========================================
    // VALIDATE JOB OWNERSHIP
    // ========================================
    // Fetch the job to verify ownership
    const { data: job, error: fetchError } = await supabaseAuth
      .from("studio_jobs")
      .select("id, user_id, input_data, status, progress")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ownership - job must belong to this user
    // Check both user_id column and input_data.userId for backward compatibility
    const inputData = job.input_data as JobInputData | null;
    const jobUserId = job.user_id || inputData?.userId;
    if (jobUserId !== userId) {
      console.warn(`[SECURITY] User ${userId} attempted to complete job ${jobId} owned by ${jobUserId}`);
      return new Response(
        JSON.stringify({ error: "Access denied - Cannot update jobs you don't own" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent re-completing already completed jobs
    if (job.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Job already completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // UPDATE JOB STATUS
    // ========================================
    const updateData: Record<string, unknown> = {
      status: status,
      // For completed: 100, for failed: keep last known progress or 0
      progress: status === "completed" ? 100 : (job.progress ?? 0),
      progress_message: status === "completed" ? "Processing complete" : (errorMessage || "Failed"),
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.output_data = {
        outputPath,
        completedBy: "client",
        completedAt: new Date().toISOString(),
      };
    } else if (status === "failed") {
      updateData.error_message = errorMessage || "Unknown error";
    }

    const { error: updateError } = await supabaseAuth
      .from("studio_jobs")
      .update(updateData)
      .eq("id", jobId);

    if (updateError) {
      console.error("Failed to update job:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update job status", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // GENERATE SIGNED URL (not public - 1 hour TTL)
    // ========================================
    let signedUrl: string | null = null;
    if (status === "completed" && outputPath) {
      const { data: signed, error: signErr } = await supabaseAuth.storage
        .from("video-processing-temp")
        .createSignedUrl(outputPath, 60 * 60); // 1 hour TTL

      if (signErr) {
        console.warn("Failed to create signed URL:", signErr);
        // Non-fatal - job is still marked complete
      } else {
        signedUrl = signed?.signedUrl ?? null;
      }
    }

    console.log(`[JOB] Job ${jobId} marked as ${status} by user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status,
        outputUrl: signedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Studio job complete error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
