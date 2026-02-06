import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProcessRequest {
  sourceUrl: string;
  sourcePath: string;
  targetWidth: number;
  targetHeight: number;
  targetAspect: string;
  targetOutput: "keep" | "vertical" | "landscape" | "square" | "reels" | "youtube" | "instagram" | "portrait" | "custom";
  smartFraming: boolean;
  originalWidth: number;
  originalHeight: number;
}

// Validate dimensions are reasonable
function validateDimensions(width: number, height: number): boolean {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= 16 &&
    width <= 7680 &&
    height >= 16 &&
    height <= 4320
  );
}

// Validate aspect ratio string
function validateAspectRatio(aspect: string): boolean {
  return /^\d+:\d+$/.test(aspect);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    console.log(`[AUTH] User authenticated: ${userId}`);

    // Service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ProcessRequest = await req.json();
    const {
      sourcePath,
      targetWidth,
      targetHeight,
      targetAspect,
      targetOutput,
      smartFraming,
      originalWidth,
      originalHeight,
    } = body;

    // ========================================
    // INPUT VALIDATION
    // ========================================
    if (!sourcePath || typeof sourcePath !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid sourcePath" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateDimensions(targetWidth, targetHeight)) {
      return new Response(
        JSON.stringify({ error: "Invalid target dimensions (16-7680 allowed)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateDimensions(originalWidth, originalHeight)) {
      return new Response(
        JSON.stringify({ error: "Invalid original dimensions" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!validateAspectRatio(targetAspect)) {
      return new Response(
        JSON.stringify({ error: "Invalid aspect ratio format (expected N:M)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // PATH OWNERSHIP VALIDATION (STRICT PREFIX MATCHING)
    // Bucket-relative paths only - bucket name is NOT part of sourcePath
    // ========================================
    // Allowed patterns (ALL user-scoped):
    // 1. video-export/{userId}/{jobId}/... - user's export processing jobs
    // 2. video-uploads/{userId}/... - user's own uploads
    // 3. video-processing/{userId}/... - user's own processing folder
    // 4. temp/{userId}/... - user's temp uploads
    
    // Sanitize path - remove any leading slashes and prevent path traversal
    const sanitizedPath = sourcePath.replace(/^\/+/, '').replace(/\.\./g, '');
    if (sanitizedPath !== sourcePath) {
      return new Response(
        JSON.stringify({ error: "Invalid path - path traversal not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check ownership with EXACT prefix matching (no substring matching!)
    // All paths MUST include the userId for proper ownership
    const isOwnedByUser = 
      sanitizedPath.startsWith(`video-export/${userId}/`) || 
      sanitizedPath.startsWith(`video-uploads/${userId}/`) || 
      sanitizedPath.startsWith(`video-processing/${userId}/`) ||
      sanitizedPath.startsWith(`temp/${userId}/`) ||
      sanitizedPath.startsWith(`${userId}/`);
    
    if (!isOwnedByUser) {
      console.warn(`[SECURITY] User ${userId} attempted to access unauthorized path: ${sanitizedPath}`);
      return new Response(
        JSON.stringify({ error: "Access denied - Cannot process files you don't own" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[PROCESS] Video resize job started for user ${userId}`);
    console.log(`Source: ${sourcePath}`);
    console.log(`Target: ${targetWidth}x${targetHeight} (${targetAspect})`);
    console.log(`Smart framing: ${smartFraming}, Output mode: ${targetOutput}`);

    // Calculate crop/resize parameters based on smart framing
    const sourceAspect = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    let cropParams = {
      x: 0,
      y: 0,
      width: originalWidth,
      height: originalHeight,
    };

    // Smart framing logic - calculate crop for aspect ratio change
    if (smartFraming && Math.abs(sourceAspect - targetAspectRatio) > 0.01) {
      if (sourceAspect > targetAspectRatio) {
        // Source is wider - crop sides (center crop)
        const newWidth = originalHeight * targetAspectRatio;
        cropParams.x = Math.floor((originalWidth - newWidth) / 2);
        cropParams.width = Math.floor(newWidth);
      } else {
        // Source is taller - crop top/bottom (center crop)
        const newHeight = originalWidth / targetAspectRatio;
        cropParams.y = Math.floor((originalHeight - newHeight) / 2);
        cropParams.height = Math.floor(newHeight);
      }

      console.log(`Smart framing crop: x=${cropParams.x}, y=${cropParams.y}, w=${cropParams.width}, h=${cropParams.height}`);
    }

    // Build FFmpeg filter string for the transformation
    const filterComplex = smartFraming
      ? `crop=${cropParams.width}:${cropParams.height}:${cropParams.x}:${cropParams.y},scale=${targetWidth}:${targetHeight}:flags=lanczos`
      : `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`;

    console.log(`FFmpeg filter: ${filterComplex}`);

    // ========================================
    // CREATE JOB RECORD
    // RLS requires user_id = auth.uid(), so we must set it explicitly
    // ========================================
    const { data: job, error: jobError } = await supabase
      .from("studio_jobs")
      .insert({
        user_id: userId, // REQUIRED by RLS policy - must match auth.uid()
        job_type: "video_resize",
        status: "requires_client_processing", // HONEST STATUS - not completed
        input_data: {
          sourcePath,
          userId, // Also keep in input_data for backward compatibility
          targetWidth,
          targetHeight,
          targetAspect,
          targetOutput,
          smartFraming,
          cropParams,
          filterComplex,
        },
        output_data: null, // NO FAKE OUTPUT
        progress: 0,
        progress_message: "Awaiting client-side processing"
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job record:", jobError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create processing job",
          details: jobError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // RETURN TRANSFORMATION PARAMETERS
    // Client must do the actual encoding with FFmpeg.wasm
    // ========================================
    // NOTE: Deno Deploy does NOT support FFmpeg binary execution.
    // For real server-side video processing, you would need:
    // - AWS MediaConvert
    // - Mux
    // - Cloudflare Stream
    // - A dedicated server with FFmpeg installed
    //
    // This function returns the transformation parameters for:
    // 1. Client-side FFmpeg.wasm processing (for files <100MB)
    // 2. Future integration with a video processing service

    console.log(`[PROCESS] Job ${job.id} created - awaiting client processing`);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        status: "requires_client_processing",
        message: "Processing parameters calculated. Client must encode with FFmpeg.wasm.",
        processingMethod: "client",
        transformParams: {
          filterComplex,
          targetWidth,
          targetHeight,
          cropParams,
          smartFraming,
          codec: "libx264",
          preset: "medium",
          crf: 23,
        },
        // NO outputUrl or outputPath - nothing was created
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Video resize processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
