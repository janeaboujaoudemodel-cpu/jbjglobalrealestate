import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(name: string): string {
  return name.toLowerCase()
    .replace(/\b(properties|developments|developers|development|group|real estate|realty|llc|l\.l\.c|pjsc|psc|fzco|fze|fz-llc|construction|and|&|the|company|international|holding|limited|ltd|inc|corp|corporation)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function getTokens(name: string): string[] {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 2 && !["the", "and", "for", "llc", "fze", "psc"].includes(t));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("feature_image_url", null);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Source 1: pending_project_imports with S3 images
    const { data: imports } = await supabase
      .from("pending_project_imports")
      .select("developer_name, images, name")
      .not("images", "is", null);

    // Source 2: projects with cover images
    const { data: projects } = await supabase
      .from("projects")
      .select("developer_name, cover_image_url")
      .not("cover_image_url", "is", null);

    // Build normalized name -> image URL map
    const imageMap = new Map<string, string>();
    const tokenMap = new Map<string, string>(); // first significant token -> url

    // Add from pending_project_imports
    for (const imp of imports || []) {
      if (!imp.developer_name || !imp.images) continue;
      const images = imp.images as any[];
      const s3Img = images.find((img: any) => 
        img?.url?.includes("s3.amazonaws") || img?.url?.includes("reelly-backend")
      );
      if (!s3Img?.url) continue;
      
      const norm = normalize(imp.developer_name);
      if (norm && !imageMap.has(norm)) {
        imageMap.set(norm, s3Img.url);
      }
      const tokens = getTokens(imp.developer_name);
      for (const t of tokens) {
        if (t.length > 4 && !tokenMap.has(t)) {
          tokenMap.set(t, s3Img.url);
        }
      }
    }

    // Add from projects
    for (const p of projects || []) {
      if (!p.developer_name || !p.cover_image_url) continue;
      const norm = normalize(p.developer_name);
      if (norm && !imageMap.has(norm)) {
        imageMap.set(norm, p.cover_image_url);
      }
      const tokens = getTokens(p.developer_name);
      for (const t of tokens) {
        if (t.length > 4 && !tokenMap.has(t)) {
          tokenMap.set(t, p.cover_image_url);
        }
      }
    }

    console.log(`Image map: ${imageMap.size} normalized entries, ${tokenMap.size} token entries`);

    let updated = 0;

    for (const dev of devs) {
      const norm = normalize(dev.name);
      let imgUrl = imageMap.get(norm);

      // Try token matching
      if (!imgUrl) {
        const devTokens = getTokens(dev.name).filter(t => t.length > 4);
        // Need at least one distinctive token match
        for (const t of devTokens) {
          if (tokenMap.has(t)) {
            imgUrl = tokenMap.get(t)!;
            break;
          }
        }
      }

      if (imgUrl) {
        const { error } = await supabase
          .from("developers")
          .update({ feature_image_url: imgUrl, updated_at: new Date().toISOString() })
          .eq("id", dev.id);
        if (!error) updated++;
      }
    }

    const { data: remaining } = await supabase
      .from("developers")
      .select("id")
      .is("feature_image_url", null);

    return new Response(JSON.stringify({ 
      success: true, 
      total_missing: devs.length,
      updated,
      still_missing: remaining?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
