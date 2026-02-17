import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) throw new Error("REELLY_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 20, 50);
    const offset = body.offset || 0;

    // Step 1: First, run a full developer sync from Reelly API to get the latest logos
    if (body.action === "sync_first") {
      console.log("[mirror-logos] Step 1: Running full developer sync from Reelly API...");
      
      const apiHeaders = {
        "X-API-Key": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };

      let allDevs: any[] = [];
      let pageOffset = 0;
      const pageSize = 100;

      while (true) {
        const url = `https://api-reelly.up.railway.app/api/v2/clients/developers?limit=${pageSize}&offset=${pageOffset}`;
        console.log(`[mirror-logos] Fetching developers page offset=${pageOffset}...`);
        
        const res = await fetch(url, { headers: apiHeaders });
        if (!res.ok) {
          const err = await res.text();
          console.error(`[mirror-logos] API error: ${res.status} - ${err}`);
          break;
        }

        const data = await res.json();
        const devs = Array.isArray(data) ? data : data.results || [];
        allDevs = [...allDevs, ...devs];

        if (devs.length < pageSize || !data.next) break;
        pageOffset += pageSize;
      }

      console.log(`[mirror-logos] Fetched ${allDevs.length} developers from Reelly API`);

      // Update all developer logos from the API
      let updated = 0;
      let skipped = 0;

      for (const dev of allDevs) {
        if (!dev.name?.trim() || !dev.logo?.url) { skipped++; continue; }

        const slug = dev.name.toLowerCase().trim()
          .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");

        // Skip Binghatti (manually curated)
        if (slug === "binghatti") { skipped++; continue; }

        const { data: existing } = await supabase
          .from("developers")
          .select("id, logo_url")
          .or(`slug.eq.${slug},name.ilike.${dev.name.trim()}`)
          .limit(1)
          .maybeSingle();

        if (existing) {
          await supabase.from("developers")
            .update({ logo_url: dev.logo.url, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
          updated++;
        }
      }

      return new Response(JSON.stringify({
        success: true, action: "sync_first",
        total_fetched: allDevs.length, updated, skipped,
        message: "Developer logos synced from Reelly API. Now run action=mirror to re-host vault URLs."
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 2: Mirror vault URLs to Supabase storage
    const { data: developers, error: queryError } = await supabase
      .from("developers")
      .select("id, name, slug, logo_url")
      .like("logo_url", "%api.reelly.io/vault%")
      .range(offset, offset + batchSize - 1);

    if (queryError) throw queryError;
    if (!developers?.length) {
      return new Response(JSON.stringify({
        success: true, message: "No vault logos remaining to mirror", processed: 0
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[mirror-logos] Processing ${developers.length} developers with vault logos (offset=${offset})...`);

    let mirrored = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const dev of developers) {
      try {
        if (!dev.logo_url) continue;

        // Download the logo using the API key (vault URLs are accessible server-side)
        const logoRes = await fetch(dev.logo_url, {
          headers: {
            "X-API-Key": apiKey,
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!logoRes.ok) {
          console.error(`[mirror-logos] Failed to download logo for ${dev.name}: ${logoRes.status}`);
          failed++;
          errors.push(`${dev.name}: download failed (${logoRes.status})`);
          continue;
        }

        const contentType = logoRes.headers.get("content-type") || "image/png";
        const imageData = await logoRes.arrayBuffer();

        if (imageData.byteLength < 100) {
          console.error(`[mirror-logos] Logo too small for ${dev.name}: ${imageData.byteLength} bytes`);
          failed++;
          errors.push(`${dev.name}: logo too small (${imageData.byteLength}b)`);
          continue;
        }

        // Determine file extension
        let ext = "png";
        if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
        else if (contentType.includes("webp")) ext = "webp";
        else if (contentType.includes("svg")) ext = "svg";

        const storagePath = `${dev.slug}.${ext}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from("developer-logos")
          .upload(storagePath, imageData, {
            contentType,
            upsert: true,
          });

        if (uploadError) {
          console.error(`[mirror-logos] Upload failed for ${dev.name}:`, uploadError);
          failed++;
          errors.push(`${dev.name}: upload failed - ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("developer-logos")
          .getPublicUrl(storagePath);

        // Update developer record
        await supabase.from("developers")
          .update({ logo_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })
          .eq("id", dev.id);

        mirrored++;
        console.log(`[mirror-logos] ✅ Mirrored logo for ${dev.name} -> ${storagePath}`);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (err: any) {
        failed++;
        errors.push(`${dev.name}: ${err.message}`);
      }
    }

    // Check remaining
    const { count: remaining } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .like("logo_url", "%api.reelly.io/vault%");

    return new Response(JSON.stringify({
      success: true,
      processed: developers.length,
      mirrored,
      failed,
      remaining_vault_logos: remaining || 0,
      next_offset: (remaining || 0) > 0 ? offset + batchSize : null,
      errors: errors.slice(0, 20),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("[mirror-logos] Fatal error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
