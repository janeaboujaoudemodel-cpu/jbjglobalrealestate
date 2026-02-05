import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  sourceUrl: string;
  sourcePath: string;
  targetWidth: number;
  targetHeight: number;
  targetAspect: string;
  targetOutput: "keep" | "vertical" | "landscape" | "square";
  smartFraming: boolean;
  originalWidth: number;
  originalHeight: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ProcessRequest = await req.json();
    const {
      sourceUrl,
      sourcePath,
      targetWidth,
      targetHeight,
      targetAspect,
      targetOutput,
      smartFraming,
      originalWidth,
      originalHeight,
    } = body;

    console.log(`Processing video: ${sourcePath}`);
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

    // Smart framing logic
    if (smartFraming && sourceAspect !== targetAspectRatio) {
      if (sourceAspect > targetAspectRatio) {
        // Source is wider - crop sides (keep center or detect subject)
        const newWidth = originalHeight * targetAspectRatio;
        cropParams.x = Math.floor((originalWidth - newWidth) / 2);
        cropParams.width = Math.floor(newWidth);
      } else {
        // Source is taller - crop top/bottom (keep center or detect subject)
        const newHeight = originalWidth / targetAspectRatio;
        cropParams.y = Math.floor((originalHeight - newHeight) / 2);
        cropParams.height = Math.floor(newHeight);
      }

      // In a real implementation, this would:
      // 1. Use AI/ML to detect subject regions
      // 2. Adjust crop parameters to keep subject centered
      // 3. For multi-shot videos, analyze each shot separately
      console.log(`Crop params: x=${cropParams.x}, y=${cropParams.y}, w=${cropParams.width}, h=${cropParams.height}`);
    }

    // Generate output filename
    const outputFileName = `output_${crypto.randomUUID()}_${targetWidth}x${targetHeight}.mp4`;
    
    // In production, this would:
    // 1. Download source video
    // 2. Use FFmpeg to resize/crop with smart framing
    // 3. Upload result to storage
    // 4. Set auto-delete timer (2 hours)
    
    // For now, simulate processing with a mock response
    // Real implementation would integrate with a video processing service
    
    // Create job record for tracking
    const { data: job, error: jobError } = await supabase
      .from("studio_jobs")
      .insert({
        job_type: "video_resize",
        status: "processing",
        input_data: {
          sourcePath,
          targetWidth,
          targetHeight,
          targetAspect,
          targetOutput,
          smartFraming,
          cropParams,
        },
        output_data: null,
        progress: 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job record:", jobError);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock output URL (in production, this would be the actual processed video URL)
    const outputUrl = `${supabaseUrl}/storage/v1/object/public/video-processing-temp/${outputFileName}`;

    // Update job status
    if (job) {
      await supabase
        .from("studio_jobs")
        .update({
          status: "completed",
          progress: 100,
          output_data: { outputUrl, outputFileName },
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    // Schedule auto-delete after 2 hours
    // In production, this would use a scheduled function or database trigger
    console.log(`Output will be auto-deleted after 2 hours: ${outputFileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        outputUrl,
        outputFileName,
        jobId: job?.id,
        cropParams,
        message: "Video processed successfully",
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
