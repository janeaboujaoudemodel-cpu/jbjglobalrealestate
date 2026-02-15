import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function isUrlBroken(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return true;
    const ct = res.headers.get("content-type") || "";
    // If HEAD returned non-image content-type, it's likely broken
    if (ct && !ct.startsWith("image/") && !ct.includes("octet-stream") && !ct.includes("binary")) {
      // Some servers don't support HEAD, try GET
      const res2 = await fetch(url, { method: "GET", signal: AbortSignal.timeout(8000), redirect: "follow" });
      const ct2 = res2.headers.get("content-type") || "";
      if (!ct2.startsWith("image/") && !ct2.includes("octet-stream")) return true;
    }
    return false;
  } catch {
    return true;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode = "scan", batch_size = 50, offset = 0 } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch developers batch
    const { data: developers, error: devErr } = await supabase
      .from("developers")
      .select("id, name, slug, feature_image_url, logo_url")
      .order("name")
      .range(offset, offset + batch_size - 1);

    if (devErr) throw new Error(`Fetch error: ${devErr.message}`);
    if (!developers?.length) {
      return new Response(JSON.stringify({ success: true, message: "No more developers", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[RepairDevURLs] Processing ${developers.length} developers (offset=${offset})`);

    // Check all URLs in parallel
    const checks = await Promise.all(
      developers.map(async (dev) => {
        const featureBroken = dev.feature_image_url ? await isUrlBroken(dev.feature_image_url) : true;
        const logoBroken = dev.logo_url ? await isUrlBroken(dev.logo_url) : false; // null logo is ok
        return { ...dev, featureBroken, logoBroken };
      })
    );

    const broken = checks.filter((d) => d.featureBroken || d.logoBroken);
    console.log(`[RepairDevURLs] ${broken.length}/${developers.length} have broken URLs`);

    if (mode === "scan") {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "scan",
          batch_offset: offset,
          batch_size: developers.length,
          broken_count: broken.length,
          broken: broken.map((d) => ({
            name: d.name,
            slug: d.slug,
            feature_broken: d.featureBroken,
            logo_broken: d.logoBroken,
            feature_url: d.feature_image_url?.substring(0, 80),
            logo_url: d.logo_url?.substring(0, 80),
          })),
          next_offset: offset + batch_size,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // mode === "fix" — find replacements for broken feature images
    // Build project image map
    const { data: projects } = await supabase
      .from("projects")
      .select("developer_id, developer_name, cover_image_url, name")
      .not("cover_image_url", "is", null)
      .not("cover_image_url", "ilike", "%unsplash%")
      .not("cover_image_url", "ilike", "%placeholder%")
      .order("created_at", { ascending: false });

    const devImageMap = new Map<string, string[]>();
    for (const p of projects || []) {
      if (!p.cover_image_url) continue;
      // Map by developer_id
      if (p.developer_id) {
        const imgs = devImageMap.get(p.developer_id) || [];
        imgs.push(p.cover_image_url);
        devImageMap.set(p.developer_id, imgs);
      }
      // Map by developer_name
      if (p.developer_name) {
        const key = p.developer_name.toLowerCase().trim();
        const imgs = devImageMap.get(key) || [];
        imgs.push(p.cover_image_url);
        devImageMap.set(key, imgs);
      }
    }

    // Also check project_images table for gallery images
    const brokenIds = broken.filter(d => d.featureBroken).map(d => d.id);
    if (brokenIds.length > 0) {
      const { data: devProjects } = await supabase
        .from("projects")
        .select("id, developer_id")
        .in("developer_id", brokenIds);
      
      if (devProjects?.length) {
        const projIds = devProjects.map(p => p.id);
        const { data: galleryImgs } = await supabase
          .from("project_images")
          .select("project_id, image_url")
          .in("project_id", projIds)
          .not("image_url", "is", null)
          .not("image_url", "ilike", "%unsplash%")
          .limit(500);

        const projDevMap = new Map<string, string>();
        for (const p of devProjects) {
          if (p.developer_id) projDevMap.set(p.id, p.developer_id);
        }

        for (const gi of galleryImgs || []) {
          const devId = projDevMap.get(gi.project_id);
          if (devId && gi.image_url) {
            const imgs = devImageMap.get(devId) || [];
            imgs.push(gi.image_url);
            devImageMap.set(devId, imgs);
          }
        }
      }
    }

    let fixed = 0;
    let unfixable = 0;
    const results: { name: string; field: string; status: string; newUrl?: string }[] = [];

    for (const dev of broken) {
      if (dev.featureBroken) {
        // Find replacement
        let candidates = devImageMap.get(dev.id) || [];
        if (!candidates.length) {
          candidates = devImageMap.get(dev.name.toLowerCase().trim()) || [];
        }
        // Partial name match
        if (!candidates.length) {
          for (const [key, imgs] of devImageMap.entries()) {
            if (key.includes(dev.name.toLowerCase()) || dev.name.toLowerCase().includes(key)) {
              if (key.length > 4) { candidates = imgs; break; }
            }
          }
        }

        // Test candidates to find a working one
        let replacement: string | null = null;
        for (const url of candidates) {
          if (url === dev.feature_image_url) continue; // skip the broken one
          const broken = await isUrlBroken(url);
          if (!broken) { replacement = url; break; }
        }

        if (replacement) {
          const { error } = await supabase
            .from("developers")
            .update({ feature_image_url: replacement })
            .eq("id", dev.id);
          if (!error) {
            fixed++;
            results.push({ name: dev.name, field: "feature_image_url", status: "fixed", newUrl: replacement.substring(0, 100) });
          } else {
            results.push({ name: dev.name, field: "feature_image_url", status: "error: " + error.message });
          }
        } else {
          unfixable++;
          results.push({ name: dev.name, field: "feature_image_url", status: "no_replacement_found" });
        }
      }

      if (dev.logoBroken) {
        results.push({ name: dev.name, field: "logo_url", status: "broken_logo_noted" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "fix",
        batch_offset: offset,
        total_checked: developers.length,
        broken_found: broken.length,
        fixed,
        unfixable,
        next_offset: offset + batch_size,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[RepairDevURLs] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
