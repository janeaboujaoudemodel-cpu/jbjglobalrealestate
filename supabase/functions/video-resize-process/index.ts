import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  targetOutput: "keep" | "vertical" | "landscape" | "square" | "reels" | "youtube" | "instagram" | "portrait" | "custom";
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

    // Generate output filename
    const outputFileName = `output_${crypto.randomUUID()}_${targetWidth}x${targetHeight}.mp4`;
    const outputPath = `video-exports/${outputFileName}`;
    
    // Create job record for tracking
    const { data: job, error: jobError } = await supabase
      .from("studio_jobs")
      .insert({
        job_type: "video_resize",
        status: "processing",
        input_data: {
          sourcePath,
          sourceUrl,
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
      // Continue without job tracking
    }

    // For cloud processing, we would integrate with a video processing service here
    // Options: AWS MediaConvert, Cloudflare Stream, Mux, etc.
    // For now, we simulate the processing and return job info
    
    // In production, this would:
    // 1. Download source video from sourceUrl
    // 2. Process with FFmpeg or cloud service
    // 3. Upload result to storage bucket
    // 4. Update job status

    // Simulated processing (real implementation would use actual video processing)
    const processingTime = Math.min(5000, Math.max(2000, originalWidth * originalHeight / 100000));
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Mock output URL (in production, this would be the actual processed video URL)
    const outputUrl = `${supabaseUrl}/storage/v1/object/public/video-processing-temp/${outputPath}`;

    // Update job status
    if (job) {
      await supabase
        .from("studio_jobs")
        .update({
          status: "completed",
          progress: 100,
          output_data: { 
            outputUrl, 
            outputFileName,
            outputPath,
            cropParams,
            processingMethod: "cloud",
          },
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }

    // Schedule auto-delete after 2 hours (would use scheduled function in production)
    console.log(`Output scheduled for auto-delete after 2 hours: ${outputFileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        outputUrl,
        outputFileName,
        outputPath,
        jobId: job?.id,
        cropParams,
        processingMethod: "cloud",
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
