import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, number> = {
      developer_name_from_developer_id: 0,
      developer_name_from_reelly_developer_id: 0,
      status_label_from_sale_status: 0,
      handover_synced: 0,
      total_scanned: 0,
    };

    // Fetch all published projects in batches
    let allProjects: any[] = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("projects")
        .select("id, developer_name, developer_id, reelly_developer_id, sale_status, status_label, expected_completion, handover_date")
        .eq("is_published", true)
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allProjects = allProjects.concat(data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }

    results.total_scanned = allProjects.length;

    // Load developers lookup table
    const { data: developers } = await supabase
      .from("developers")
      .select("id, name, reelly_id");

    const devById = new Map<string, string>();
    const devByReellyId = new Map<number, string>();
    if (developers) {
      for (const d of developers) {
        devById.set(d.id, d.name);
        if (d.reelly_id) devByReellyId.set(d.reelly_id, d.name);
      }
    }

    // Process each project
    for (const project of allProjects) {
      const updates: Record<string, any> = {};

      // Fix 1: developer_name from developer_id
      if (!project.developer_name && project.developer_id) {
        const name = devById.get(project.developer_id);
        if (name) {
          updates.developer_name = name;
          results.developer_name_from_developer_id++;
        }
      }

      // Fix 2: developer_name from reelly_developer_id
      if (!project.developer_name && !updates.developer_name && project.reelly_developer_id) {
        const name = devByReellyId.get(project.reelly_developer_id);
        if (name) {
          updates.developer_name = name;
          results.developer_name_from_reelly_developer_id++;
        }
      }

      // Fix 3: status_label from sale_status
      if (!project.status_label && project.sale_status) {
        const statusMap: Record<string, string> = {
          "on_sale": "On Sale",
          "On Sale": "On Sale",
          "announced": "Announced",
          "Announced": "Announced",
          "out_of_stock": "Sold Out",
          "Sold Out": "Sold Out",
          "presale_eoi": "Presale (EOI)",
          "Presale (EOI)": "Presale (EOI)",
          "start_of_sales": "Start of Sales",
          "Start of Sales": "Start of Sales",
        };
        const label = statusMap[project.sale_status] || project.sale_status;
        updates.status_label = label;
        results.status_label_from_sale_status++;
      }

      // Fix 4: Sync handover_date and expected_completion
      if (!project.handover_date && project.expected_completion) {
        updates.handover_date = project.expected_completion;
        results.handover_synced++;
      } else if (!project.expected_completion && project.handover_date) {
        updates.expected_completion = project.handover_date;
        results.handover_synced++;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await supabase
          .from("projects")
          .update(updates)
          .eq("id", project.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
