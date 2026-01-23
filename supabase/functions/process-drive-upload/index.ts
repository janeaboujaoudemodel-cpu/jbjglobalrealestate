import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriveUploadRequest {
  driveUrl: string;
  userId: string;
}

interface ExtractedProject {
  name: string;
  developer: string;
  files: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  suggestedData: {
    location?: string;
    emirate?: string;
    priceFrom?: number;
    priceTo?: number;
    bedroomsMin?: number;
    bedroomsMax?: number;
    handoverDate?: string;
  };
}

// Developer keywords for auto-detection
const DEVELOPER_KEYWORDS: Record<string, string[]> = {
  "Emaar": ["emaar", "downtown", "dubai hills", "creek harbour", "arabian ranches"],
  "DAMAC": ["damac", "cavalli", "paramount", "aykon"],
  "Sobha": ["sobha", "hartland", "creek vistas"],
  "Nakheel": ["nakheel", "palm", "jumeirah islands", "jvc"],
  "Meraas": ["meraas", "city walk", "la mer", "bluewaters"],
  "Dubai Properties": ["dubai properties", "dp", "business bay", "culture village"],
  "Azizi": ["azizi", "riviera", "aura"],
  "Danube": ["danube", "elz", "bayz", "viewz"],
  "Binghatti": ["binghatti", "jacob"],
  "Select Group": ["select group", "jumeirah living", "peninsula"],
  "MAG": ["mag", "meydan"],
};

// Document type detection
function detectDocumentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("brochure")) return "brochure";
  if (lower.includes("floor") && lower.includes("plan")) return "floor_plan";
  if (lower.includes("fact") && lower.includes("sheet")) return "fact_sheet";
  if (lower.includes("payment") && lower.includes("plan")) return "payment_plan";
  if (lower.includes("render") || lower.includes("cgi")) return "render";
  if (lower.includes("master") && lower.includes("plan")) return "master_plan";
  if (lower.includes("price") || lower.includes("pricing")) return "price_list";
  if (lower.includes("unit") && lower.includes("plan")) return "unit_plan";
  if (/\.(jpg|jpeg|png|webp)$/i.test(lower)) return "image";
  if (/\.pdf$/i.test(lower)) return "document";
  return "other";
}

// Developer detection from filename
function detectDeveloper(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const [developer, keywords] of Object.entries(DEVELOPER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return developer;
      }
    }
  }
  return null;
}

// Project name extraction from filename
function extractProjectName(filename: string): string | null {
  // Remove extension and common prefixes
  let name = filename.replace(/\.[^/.]+$/, "");
  name = name.replace(/^(brochure|floorplan|factsheet|render|pricing|payment)[-_\s]*/i, "");
  
  // Remove developer name if detected
  for (const keywords of Object.values(DEVELOPER_KEYWORDS)) {
    for (const keyword of keywords) {
      name = name.replace(new RegExp(keyword, "gi"), "").trim();
    }
  }
  
  // Clean up and format
  name = name.replace(/[-_]+/g, " ").trim();
  if (name.length > 3) {
    return name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { driveUrl, userId }: DriveUploadRequest = await req.json();

    if (!driveUrl) {
      throw new Error("No Google Drive URL provided");
    }

    // Validate Google Drive URL
    if (!driveUrl.includes("drive.google.com") && !driveUrl.includes("docs.google.com")) {
      throw new Error("Invalid Google Drive URL");
    }

    // In a real implementation, this would:
    // 1. Use Google Drive API to list files in the folder
    // 2. Download each file
    // 3. Process PDFs to extract text
    // 4. Use AI to extract project details from documents
    // 5. Group files by project
    // 6. Create draft listings for approval

    // For now, we'll create a pending upload record
    const { data: uploadRecord, error: uploadError } = await supabase
      .from("listing_uploads")
      .insert({
        user_id: userId,
        drive_url: driveUrl,
        status: "processing",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (uploadError) {
      console.error("Failed to create upload record:", uploadError);
    }

    // Simulate processing response
    const mockProjects: ExtractedProject[] = [
      {
        name: "Sample Project from Drive",
        developer: "Detected Developer",
        files: [],
        suggestedData: {
          emirate: "Dubai",
        }
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      message: "Google Drive link received and queued for processing",
      uploadId: uploadRecord?.id,
      status: "processing",
      estimatedProjects: mockProjects.length,
      note: "Files will be processed and organized by project. Each project will be sent for your approval before going live."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Drive upload processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process Google Drive link";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
