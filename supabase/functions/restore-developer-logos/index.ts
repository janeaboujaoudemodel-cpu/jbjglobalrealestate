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
    // Get developers missing logos
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name, slug")
      .is("logo_url", null);

    if (!devs?.length) {
      return new Response(JSON.stringify({ success: true, updated: 0, message: "All developers have logos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${devs.length} developers missing logos`);

    // Source: pending_project_imports - extract developer logos from raw data
    const { data: imports } = await supabase
      .from("pending_project_imports")
      .select("developer_name, raw_data, images")
      .not("developer_name", "is", null);

    // Build normalized name -> logo URL map (only Reelly S3 URLs)
    const logoMap = new Map<string, string>();
    const tokenMap = new Map<string, string>();

    for (const imp of imports || []) {
      if (!imp.developer_name) continue;

      // Try to find developer logo in raw_data
      const raw = imp.raw_data as any;
      let logoUrl: string | null = null;

      // Check raw_data.developer.logo or similar paths
      if (raw?.developer?.logo && typeof raw.developer.logo === "string" && raw.developer.logo.includes("reelly-backend.s3")) {
        logoUrl = raw.developer.logo;
      } else if (raw?.developer?.image && typeof raw.developer.image === "string" && raw.developer.image.includes("reelly-backend.s3")) {
        logoUrl = raw.developer.image;
      } else if (raw?.developerLogo && typeof raw.developerLogo === "string" && raw.developerLogo.includes("reelly-backend.s3")) {
        logoUrl = raw.developerLogo;
      }

      if (!logoUrl) continue;

      const norm = normalize(imp.developer_name);
      if (norm && !logoMap.has(norm)) {
        logoMap.set(norm, logoUrl);
      }
      const tokens = getTokens(imp.developer_name);
      for (const t of tokens) {
        if (t.length > 4 && !tokenMap.has(t)) {
          tokenMap.set(t, logoUrl);
        }
      }
    }

    console.log(`Logo map: ${logoMap.size} normalized entries, ${tokenMap.size} token entries`);

    let updated = 0;

    for (const dev of devs) {
      const norm = normalize(dev.name);
      let logoUrl = logoMap.get(norm);

      // Try token matching
      if (!logoUrl) {
        const devTokens = getTokens(dev.name).filter(t => t.length > 4);
        for (const t of devTokens) {
          if (tokenMap.has(t)) {
            logoUrl = tokenMap.get(t)!;
            break;
          }
        }
      }

      if (logoUrl) {
        const { error } = await supabase
          .from("developers")
          .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
          .eq("id", dev.id);
        if (!error) {
          updated++;
          console.log(`Restored logo for: ${dev.name}`);
        }
      }
    }

    const { data: remaining } = await supabase
      .from("developers")
      .select("id")
      .is("logo_url", null);

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
