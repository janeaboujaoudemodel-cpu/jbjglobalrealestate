import { createClient } from "npm:@supabase/supabase-js@2";
import UPNG from "npm:upng-js@2.1.0";
import jpegJs from "npm:jpeg-js@0.4.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

function colorsAreSimilar(
  c1: [number, number, number],
  c2: [number, number, number],
  threshold = 50
): boolean {
  return (
    Math.abs(c1[0] - c2[0]) < threshold &&
    Math.abs(c1[1] - c2[1]) < threshold &&
    Math.abs(c1[2] - c2[2]) < threshold
  );
}

function getPixelAt(
  data: Uint8Array,
  width: number,
  x: number,
  y: number
): [number, number, number, number] {
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function extractDominantCorner(
  data: Uint8Array,
  width: number,
  height: number
): string {
  const margin = Math.max(1, Math.min(3, Math.floor(Math.min(width, height) * 0.05)));
  const corners = [
    [margin, margin],
    [width - 1 - margin, margin],
    [margin, height - 1 - margin],
    [width - 1 - margin, height - 1 - margin],
  ];

  const cornerColors: [number, number, number][] = [];
  for (const [cx, cy] of corners) {
    const [r, g, b, a] = getPixelAt(data, width, cx, cy);
    if (a < 128) {
      cornerColors.push([255, 255, 255]);
    } else {
      cornerColors.push([r, g, b]);
    }
  }

  let bestColor = cornerColors[0];
  let bestCount = 0;
  for (const c of cornerColors) {
    const count = cornerColors.filter((o) => colorsAreSimilar(c, o)).length;
    if (count > bestCount) {
      bestCount = count;
      bestColor = c;
    }
  }

  return rgbToString(bestColor[0], bestColor[1], bestColor[2]);
}

async function extractColorFromUrl(logoUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(logoUrl, {
      headers: { "User-Agent": "LogoColorExtractor/1.0" },
    });
    if (!resp.ok) return null;

    const arrayBuf = await resp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);

    // Detect format by magic bytes
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8;

    if (isPNG) {
      const img = UPNG.decode(arrayBuf);
      const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
      return extractDominantCorner(rgba, img.width, img.height);
    } else if (isJPEG) {
      const img = jpegJs.decode(arrayBuf, { useTArray: true });
      return extractDominantCorner(img.data, img.width, img.height);
    } else {
      // WebP or other - can't decode with pure JS easily, skip
      console.log(`Unsupported format for ${logoUrl}`);
      return null;
    }
  } catch (e) {
    console.error("Error extracting color from", logoUrl, ":", e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get developers that have a logo but no bg color yet
    const { data: developers, error } = await supabase
      .from("developers")
      .select("id, name, slug, logo_url, logo_bg_color")
      .not("logo_url", "is", null)
      .is("logo_bg_color", null)
      .limit(5);

    if (error) throw error;

    if (!developers || developers.length === 0) {
      return new Response(
        JSON.stringify({ message: "All developers processed", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;
    const results: { name: string; color: string | null }[] = [];

    for (const dev of developers) {
      const color = await extractColorFromUrl(dev.logo_url);
      const finalColor = color || "rgb(255,255,255)";

      const { error: updateError } = await supabase
        .from("developers")
        .update({ logo_bg_color: finalColor })
        .eq("id", dev.id);

      if (!updateError) {
        processed++;
      } else {
        failed++;
      }
      results.push({ name: dev.name, color: finalColor });
    }

    // Check how many remain
    const { count } = await supabase
      .from("developers")
      .select("id", { count: "exact", head: true })
      .not("logo_url", "is", null)
      .is("logo_bg_color", null);

    return new Response(
      JSON.stringify({
        message: `Processed ${processed}, failed ${failed}`,
        remaining: count || 0,
        processed,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
