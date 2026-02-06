// Studio Job Complete - Mark jobs as completed after client-side processing
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteJobRequest {
  jobId: string;
  outputPath: string;
  status: "completed" | "failed";
  errorMessage?: string;
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
    // VALIDATE JOB OWNERSHIP
    // ========================================
    if (!jobId || typeof jobId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid jobId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the job to verify ownership
    const { data: job, error: fetchError } = await supabaseAuth
      .from("studio_jobs")
      .select("id, user_id, input_data, status")
      .eq("id", jobId)
      .single();

    if (fetchError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ownership - job must belong to this user
    // Check both user_id column and input_data.userId for compatibility
    const jobUserId = job.user_id || (job.input_data as any)?.userId;
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
      progress: status === "completed" ? 100 : job.input_data?.progress || 0,
      progress_message: status === "completed" ? "Processing complete" : errorMessage || "Failed",
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

    // Generate public URL for the output if completed
    let publicUrl: string | null = null;
    if (status === "completed" && outputPath) {
      const { data: urlData } = supabaseAuth.storage
        .from("video-processing-temp")
        .getPublicUrl(outputPath);
      publicUrl = urlData?.publicUrl || null;
    }

    console.log(`[JOB] Job ${jobId} marked as ${status} by user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        status,
        outputUrl: publicUrl,
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
