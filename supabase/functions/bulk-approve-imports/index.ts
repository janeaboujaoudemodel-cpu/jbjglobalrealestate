import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Bulk Approve Pending Imports
 * Automatically approves all pending project imports that have valid images
 * and inserts them into the main projects table with their images.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { limit = 100, dryRun = false, minImages = 1 } = await req.json().catch(() => ({}));

    console.log(`[BulkApprove] Starting approval (limit=${limit}, dryRun=${dryRun}, minImages=${minImages})...`);

    // Get developers list for matching (projects table uses 'developers', not 'uae_developers')
    const { data: developersList } = await supabase.from("developers").select("id, name, slug");
    const developers = developersList || [];
    console.log(`[BulkApprove] Loaded ${developers.length} developers for matching`);

    // Get pending imports with valid images
    const { data: pendingImports, error: fetchError } = await supabase
      .from("pending_project_imports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("Failed to fetch pending imports:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch pending imports", details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingImports || pendingImports.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No pending imports to approve",
        stats: { approved: 0, skipped: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[BulkApprove] Found ${pendingImports.length} pending imports`);

    const stats = {
      approved: 0,
      skipped: 0,
      errors: 0,
      noImages: 0,
    };

    const errors: Array<{ name: string; error: string }> = [];

    for (const item of pendingImports) {
      try {
        // Parse images
        const images = Array.isArray(item.images) 
          ? item.images 
          : (typeof item.images === 'string' ? JSON.parse(item.images) : []);

        // Validate images
        if (!images || images.length < minImages) {
          console.log(`[BulkApprove] Skipping ${item.name} - insufficient images (${images?.length || 0})`);
          stats.noImages++;
          stats.skipped++;
          continue;
        }

        // Check if project already exists
        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", item.slug)
          .maybeSingle();

        if (existingProject) {
          console.log(`[BulkApprove] Skipping ${item.name} - already exists`);
          stats.skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`[DryRun] Would approve: ${item.name} (${images.length} images)`);
          stats.approved++;
          continue;
        }

        // Match developer by name from the pending import's developer_name field
        let matchedDeveloperId: string | null = null;
        if (item.developer_name) {
          const devNameLower = item.developer_name.toLowerCase();
          const matchedDev = developers.find((d: { id: string; name: string; slug: string }) => 
            d.name.toLowerCase() === devNameLower || 
            d.name.toLowerCase().includes(devNameLower) ||
            devNameLower.includes(d.name.toLowerCase()) ||
            d.slug === devNameLower.replace(/\s+/g, '-')
          );
          if (matchedDev) {
            matchedDeveloperId = matchedDev.id;
            console.log(`[BulkApprove] Matched developer: ${item.developer_name} -> ${matchedDev.name}`);
          } else {
            console.log(`[BulkApprove] No developer match for: ${item.developer_name}`);
          }
        }

        // Insert into projects table
        const projectData = {
          name: item.name,
          slug: item.slug,
          developer_id: matchedDeveloperId, // Use matched ID from developers table
          location: item.location || null,
          emirate: item.emirate || "Dubai",
          description: item.description || null,
          price_from: item.price_from || null,
          bedrooms_min: item.bedrooms_min || null,
          bedrooms_max: item.bedrooms_max || null,
          handover_date: item.handover_date || null,
          payment_plan: item.payment_plan || null,
          source_url: item.source_url || null,
          property_type_label: item.property_type_label || null,
          status_label: item.status_label || null,
          amenities: item.amenities || null,
          is_offplan: true,
          is_featured: false,
          is_premium: false,
        };

        const { data: newProject, error: insertError } = await supabase
          .from("projects")
          .insert(projectData)
          .select("id")
          .single();

        if (insertError) {
          console.error(`[BulkApprove] Failed to insert project ${item.name}:`, insertError);
          errors.push({ name: item.name, error: insertError.message });
          stats.errors++;
          continue;
        }

        // Insert images
        if (newProject && images.length > 0) {
          const imageInserts = images.map((img: { url: string; alt_text?: string; display_order?: number }, idx: number) => ({
            project_id: newProject.id,
            image_url: img.url,
            alt_text: img.alt_text || `${item.name} - Image ${idx + 1}`,
            display_order: img.display_order ?? idx,
          }));

          const { error: imgError } = await supabase
            .from("project_images")
            .insert(imageInserts);

          if (imgError) {
            console.warn(`[BulkApprove] Image insert warning for ${item.name}:`, imgError.message);
          }
        }

        // Mark as approved
        await supabase
          .from("pending_project_imports")
          .update({ 
            status: "approved", 
            reviewed_at: new Date().toISOString(),
            review_notes: "Auto-approved via bulk-approve-imports"
          })
          .eq("id", item.id);

        console.log(`[BulkApprove] ✓ Approved: ${item.name} (${images.length} images)`);
        stats.approved++;

      } catch (err) {
        console.error(`[BulkApprove] Error processing ${item.name}:`, err);
        errors.push({ name: item.name, error: err instanceof Error ? err.message : String(err) });
        stats.errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Bulk approve error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
