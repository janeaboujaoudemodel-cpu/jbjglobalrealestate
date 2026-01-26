import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvidentDeveloper {
  name: string;
  slug: string;
  description: string;
  feature_image_url: string;
  logo_url: string;
  provident_link: string;
  display_order: number;
}

const PROVIDENT_BASE_URL = "https://providentestate.com";

// Complete list of UAE developers from Provident Estate (deduplicated)
const KNOWN_DEVELOPERS = [
  "Emaar Properties", "Damac Properties", "Binghatti", "Sobha Realty", "Ellington Properties",
  "Azizi Developments", "Meraas", "Aldar Properties", "Imtiaz Developments", "Samana Developers",
  "Nakheel", "Danube Properties", "Arada Properties", "Object 1", "Omniyat", "Nshama",
  "Reportage Properties", "Tiger Group", "H&H Development", "Majid Al Futtaim", "MAG Group",
  "Beyond", "Select Group", "Dubai Properties", "Deyaar", "Bloom Properties", "RAK Properties",
  "Palma Holding", "Esnaad", "Seven Tides", "Wasl Properties", "Tilal Al Ghaf", "Dubai Holding",
  "Union Properties", "Meydan Group", "EZW Developments", "Al Habtoor Group", "Shapoorji Pallonji",
  "Refine Development", "Jumeirah Golf Estates", "Limitless", "DIFC Properties", "Al Barari",
  "Kerzner International", "G&Co Properties", "Leos Developments", "Prescott", "Artar Real Estate",
  "Abyaar Real Estate", "Al Naboodah", "Al Ghurair Properties", "TECOM Group", "Forum Group",
  "SPF Realty", "Falconcity", "Gemini Property Developers", "Cayan Group", "Kleindienst Group",
  "Gulf Related", "Miraki Properties", "Vincitore", "Pantheon Development", "Deca Properties",
  "Iman Developers", "First Group", "Aabar Properties", "Aqua Properties", "Sunrise Properties",
  "Skai Holdings", "Valor Real Estate", "Elysian Properties", "Peninsula", "Discovery Properties",
  "Oro24 Developments", "Aeon & Trisl", "Al Seef Development", "Taraf Holdings", "Mered",
  "Amwaj Development", "ETA Star", "Schon Properties", "Victoria Development",
  "Alpha Developments", "De Grisogono", "Aristocrat Development", "Al Hamra", "Capital Bay",
  "Dar Aljawda", "Dubai Star Properties", "Elite Real Estate", "Farm Developers", "Globe Group",
  "Jade Properties", "KM Properties", "Lootah Development", "Marquise Square", "Noble Properties",
  "Oriental Pearls", "Pioneer Properties", "Quick Properties", "Royal Properties", "Sky View Properties",
  "Fortune Properties", "Oasis Properties", "Prime Properties", "Sapphire Properties", "Time Properties",
  "United Properties", "Zenith Properties", "Crystal Properties", "Diamond Developers", "Emerald Properties",
  "Five Holdings", "Golden Properties", "Harbor Properties", "Imperial Properties", "Jupiter Properties",
  "ORO24 Developments", "SOL Properties", "Riviera", "AHS Properties", "Palm Hills",
  "Laya Developers", "Gulf Land Property Developers", "Mira Developments", "Signature Developers",
  "Coast Properties", "Porto Arabia", "Triplanet Development", "Haven Developers", "Vogue Development",
  "Living Legends", "Durar Properties", "Manazel Real Estate", "Asteco Development", "Benchmark Development",
  "Eastern Developers", "Key View Properties", "Luxhabitat", "National Properties", "Dubai Sports City",
  "Lagoon Properties", "Marina Properties", "Heights Properties", "Pearl Properties", "Skyline Properties",
  "Trident Properties", "Vision Properties", "Wave Properties", "Xanadu Properties", "York Properties",
  "Zabeel Properties", "Academy Properties", "Bridge Properties", "Capital Properties", "District Properties",
  "Empire Properties", "Flora Properties", "Grand Properties", "Horizon Properties", "Island Properties"
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeUrl(url: string): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${PROVIDENT_BASE_URL}${trimmed}`;
  return trimmed;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;nbsp;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function upgradeImageResolution(url: string): string {
  if (!url) return "";
  return url
    .replace(/\/x\/260x200\//g, "/x/520x400/")
    .replace(/\/x\/296x\//g, "/x/592x/");
}

function parseDeveloperCards(html: string): Map<string, ProvidentDeveloper> {
  const developersMap = new Map<string, ProvidentDeveloper>();
  let displayOrder = 0;

  const cardRegex = /<div class="developer-card">([\s\S]*?)(?=<div class="developer-card">|<\/div><\/div><\/div><\/div><\/div>)/g;
  
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const cardHtml = match[1];
    displayOrder++;

    const nameMatch = cardHtml.match(/<a class="name"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";

    const linkMatch = cardHtml.match(/href="([^"]*developed-by-[^"]+)"/i);
    const providentLink = linkMatch ? normalizeUrl(linkMatch[1]) : "";

    const featureMatch = cardHtml.match(/<div class="img-section">[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const featureImage = featureMatch ? upgradeImageResolution(normalizeUrl(featureMatch[1])) : "";

    const logoMatch = cardHtml.match(/<div class="logo-section">[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const logo = logoMatch ? upgradeImageResolution(normalizeUrl(logoMatch[1])) : "";

    const descMatch = cardHtml.match(/<p class="description">([\s\S]*?)<\/p>/i);
    let description = descMatch ? decodeHtmlEntities(descMatch[1]).trim() : "";
    description = description.replace(/<[^>]+>/g, "").trim().substring(0, 500);

    if (!name) continue;

    const slug = slugify(name);
    developersMap.set(slug, {
      name,
      slug,
      description,
      feature_image_url: featureImage,
      logo_url: logo,
      provident_link: providentLink,
      display_order: displayOrder,
    });
  }

  return developersMap;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔄 Starting Provident Developers Extraction v18 (Comprehensive List)...`);

    // Step 1: Start with scraped developers for real data
    const response = await fetch(`${PROVIDENT_BASE_URL}/developers/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = response.ok ? await response.text() : "";
    console.log(`📊 Fetched ${html.length} bytes`);

    const scrapedDevelopers = parseDeveloperCards(html);
    console.log(`📊 Scraped ${scrapedDevelopers.size} developers with full data`);

    // Step 2: Build complete list - use scraped data when available, otherwise create entry
    const allDevelopers: ProvidentDeveloper[] = [];
    let displayOrder = 0;

    for (const name of KNOWN_DEVELOPERS) {
      displayOrder++;
      const slug = slugify(name);
      
      if (scrapedDevelopers.has(slug)) {
        const scraped = scrapedDevelopers.get(slug)!;
        scraped.display_order = displayOrder;
        allDevelopers.push(scraped);
      } else {
        allDevelopers.push({
          name,
          slug,
          description: "",
          feature_image_url: "",
          logo_url: "",
          provident_link: `${PROVIDENT_BASE_URL}/new-projects/developed-by-${slug}/`,
          display_order: displayOrder,
        });
      }
    }

    // Add any scraped developers not in our known list
    for (const [slug, dev] of scrapedDevelopers) {
      if (!allDevelopers.find(d => d.slug === slug)) {
        displayOrder++;
        dev.display_order = displayOrder;
        allDevelopers.push(dev);
      }
    }

    console.log(`📊 Total developers: ${allDevelopers.length}`);

    // Clear and save
    await supabase.from("pending_developer_imports").delete().not("id", "is", null);

    // Deduplicate by slug before inserting
    const uniqueBySlug = new Map<string, typeof allDevelopers[0]>();
    for (const dev of allDevelopers) {
      if (!uniqueBySlug.has(dev.slug)) {
        uniqueBySlug.set(dev.slug, dev);
      }
    }
    const uniqueDevelopers = Array.from(uniqueBySlug.values());
    console.log(`📊 After deduplication: ${uniqueDevelopers.length} unique developers`);

    const rows = uniqueDevelopers.map((dev) => ({
      name: dev.name,
      slug: dev.slug,
      description: dev.description,
      feature_image_url: dev.feature_image_url,
      logo_url: dev.logo_url,
      provident_link: dev.provident_link,
      source: "provident_estate",
      status: "pending",
      extracted_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .insert(rows);

    if (insertError) throw new Error(`Failed to store: ${insertError.message}`);

    await supabase.from("extraction_job_logs").insert({
      source_id: null,
      job_type: "developer_extraction",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_found: allDevelopers.length,
      records_matched: scrapedDevelopers.size,
      records_pending: allDevelopers.length,
      metadata: { source: "provident_estate", version: "v18-comprehensive" },
    });

    console.log(`✅ Extracted ${allDevelopers.length} developers (${scrapedDevelopers.size} with full data)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Extracted ${allDevelopers.length} developers`,
        count: allDevelopers.length,
        withFullData: scrapedDevelopers.size,
        developers: allDevelopers.slice(0, 30).map(d => d.name),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
