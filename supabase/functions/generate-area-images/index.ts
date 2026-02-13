import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Area-specific community descriptions for generating accurate masterplan aerial views
const COMMUNITY_DESCRIPTIONS: Record<string, string> = {
  // Top areas by property count - exact DB names
  "JVC (Jumeirah Village Circle)": "distinctive circular road layout from above, low-rise and mid-rise apartment clusters arranged in circles, community parks, retail centers, family-friendly neighborhood",
  "Business Bay": "Dubai Canal waterway, canal-side towers reflecting in water, waterfront promenade, modern commercial and residential skyline, bridges crossing the canal",
  "Dubai Islands": "cluster of artificial islands off Deira coast, beachfront residential towers, marina, resort hotels, waterfront promenade, Arabian Gulf",
  "Dubailand Residence Complex": "large residential community with apartment clusters, community pools, parks, retail facilities, desert-edge setting",
  "Al Marjan Island": "four coral-shaped islands off RAK coast, beachfront resorts, Wynn resort landmark, residential towers along waterfront, turquoise Arabian Gulf",
  "Dubai Hills": "championship golf course winding through the community, Dubai Hills Mall, hillside villas and townhouses, Central Park green space, boulevard with retail",
  "Dubai Hills Estate": "championship golf course winding through the community, Dubai Hills Mall, hillside villas and townhouses, Central Park, boulevard retail, skyline views",
  "JVT (Jumeirah Village Triangle)": "triangular road layout from above, low-rise villa clusters, apartment buildings, community parks, landscaped streets",
  "Arjan": "Dubailand community with mid-rise apartments, Miracle Garden and Butterfly Garden nearby, landscaped streets, affordable family area",
  "Palm Jumeirah": "iconic palm-shaped artificial island seen from above, Atlantis hotel at the crescent tip, rows of beachfront villas along the fronds, trunk area with high-rise apartments, surrounding Arabian Gulf waters",
  "Abu Dhabi": "Abu Dhabi skyline, Corniche waterfront, Etihad Towers, Emirates Palace, Lulu Island, modern city grid, waterfront parks",
  "Al Furjan": "master-planned community with villas and apartments, Pavilion community center, metro station, parks and pool, school zone",
  "Jebel Ali Village": "residential village community, villa clusters, community amenities, proximity to Jebel Ali port, garden neighborhoods",
  "Meydan (Nad Al Sheba  1)": "Meydan Racecourse and grandstand, The Meydan Hotel, canal and lagoon, luxury villas, mixed-use towers, green corridors",
  "Downtown Dubai": "Burj Khalifa as centerpiece, Dubai Mall, The Dubai Fountain lake, Mohammed Bin Rashid Boulevard, Opera District, mixed residential and commercial towers",
  "Dubai South": "Expo City Dubai pavilions, Al Maktoum International Airport proximity, The Pulse boulevard, residential clusters, Aviation District",
  "Damac Hills 2": "affordable villa community, Malibu and Pelham-style clusters, community pool and sports facilities, themed parks, lagoon areas",
  "Damac Hills": "Trump International Golf Club centerpiece, luxury villas around fairways, crystal lagoon, community center, water features and parks",
  "Majan": "residential community in Dubailand, mid-rise apartment buildings, community parks, retail amenities, family-oriented layout",
  "Dubai Creek Harbour": "Creek Tower landmark, waterfront promenade along Dubai Creek, marina with yachts, mixed-use residential towers, retail waterfront district, lush green parks",
  "Al Saadiyat island": "cultural district with Louvre Abu Dhabi museum, Saadiyat Beach, luxury villas and apartments, mangrove areas, golf course",
  "Dubai International City": "distinctly themed country clusters visible from above (China, Persia, England, France), grid pattern layout, Dragon Mart commercial complex",
  "Dubai Production City": "media and production zone, mid-rise residential towers, community facilities, affordable apartments, commercial district",
  "Town Square": "Nshama community with central Town Square Park, Vida hotel, Safi and Zahra apartments, retail boulevard, Reel Cinema, family parks",
  "Maritime City": "waterfront development, maritime-themed community, dry docks heritage, residential towers, marina, creek views",
  "Yas Island": "Ferrari World and Yas Waterworld, Yas Marina Circuit, Yas Mall, Warner Bros World, residential community, Yas Beach",
  "Siniya Island": "natural island in Umm Al Quwain, mangrove forest, beachfront development, eco-resort, archaeological sites, turquoise waters",
  "Emaar South": "community near Al Maktoum Airport, golf course, residential clusters, Town Centre retail, parks and green spaces",
  "The Valley": "Eden-inspired community by Emaar, town center, sports village, community gardens, desert-edge setting, family-oriented layout",
  "Sobha Hartland": "green master-planned community along Dubai Canal, lagoons, parks and gardens, international schools, luxury villas and towers",
  "Sobha Hartland 2": "extension of Sobha Hartland, green parks, canal views, luxury towers and villas, landscaped community",
  "Damac Lagoons": "water-inspired community with themed lagoons, beach-style living, villa clusters around water features, tropical landscaping",
  "Al Jaddaf Waterfront": "waterfront community along Dubai Creek, cultural village area, residential towers, dhow building heritage, creek views",
  "JLT (Jumeirah Lake Towers)": "cluster of towers around artificial lakes, DMCC area, lake promenades, JLT Park, retail podiums between tower clusters",
  "Dubai Sports City": "cricket stadium, football academy pitches, golf course, residential towers around sporting venues, Canal Residence, Victory Heights villas",
  "Dubai Investments Park": "mixed-use industrial and residential zone, Green Community apartments, commercial facilities, landscaped neighborhoods",
  "Mina Rashid": "historic Port Rashid transformed into waterfront destination, Queen Elizabeth 2 hotel ship, residential towers, marina, cruise terminal",
  "Mina Al Arab": "RAK waterfront community, beachfront living, mangrove views, resort-style amenities, lagoon, residential islands",
  "Dubai Marina": "marina waterway cutting through supertall residential towers, JBR beach and The Walk promenade, yacht club with boats, Marina Mall, pedestrian boardwalk",
  "Discovery Gardens": "themed garden districts (Mediterranean, Mogul, Zen), low-rise apartment buildings, community parks, Ibn Battuta Mall nearby",
  "Dubai Motor City": "Dubai Autodrome racing circuit, residential apartments surrounding the track, retail center, Uptown Motor City towers",
  "Dubai Silicon Oasis": "technology park campus, residential towers and villas, university cluster, IT companies, Silicon Central Mall",
  "Jumeirah Beach Residence (JBR)": "beachfront high-rise towers along JBR Walk, The Beach retail complex, Ain Dubai observation wheel, sandy beach",
  "City Walk": "urban lifestyle district, low-rise contemporary architecture, tree-lined boulevards, Coca-Cola Arena, outdoor retail streets",
  "Dubai Harbour": "superyacht marina, cruise terminal, lighthouse tower, beachfront living, views of Palm Jumeirah and Ain Dubai",
  "Jumeirah Golf Estates": "championship golf courses (Earth and Fire), luxury villas around fairways, clubhouse, landscaped community",
  "MJL (Madinat Jumeirah Living)": "community near Madinat Jumeirah resort, low-rise apartments, Burj Al Arab views, beach proximity, landscaped gardens",
  "Dubai Studio City": "media production zone, soundstages, residential apartments, retail amenities, creative community",
  "Dubai Science Park": "research and development hub, residential apartments, laboratory facilities, green campus, innovation center",
  "MBR District 11 (Meydan South)": "Meydan development district, residential towers, canal views, racecourse proximity, green corridors",
  "MBR District 1": "Crystal Lagoon centerpiece, luxury waterfront villas, landscaped parkland, cycling tracks, Meydan Racecourse nearby",
  "Tilal Al Ghaf": "lagoon-centric community, sandy beach lagoon, villas around water features, community farm, sports facilities",
  "Jumeirah Islands": "cluster of 46 islands with luxury villas, interconnected by bridges, central lake, landscaped waterways, Club House",
  "Mudon": "Arabella townhouses and villas, desert-inspired landscaping, community center with pool, Mudon Central Park, cycling tracks",
  "Arabian Ranches 3": "newest phase villa community, modern townhouses and villas, community center, golf course views, desert-edge landscaping",
  "Blue Waters Island": "Ain Dubai observation wheel landmark, beachfront apartments, retail promenade, Caesars Palace hotel, pedestrian bridge to JBR",
  "Bluewater Island Dubai": "Ain Dubai observation wheel landmark, beachfront apartments, retail promenade, Caesars Palace hotel",
  "Beach Front": "Emaar Beachfront private beach peninsula between Palm Jumeirah and JBR, residential towers, beach club, marina",
  "Emaar Beachfront": "private beach peninsula between Palm Jumeirah and JBR, residential towers on waterfront, beach club, marina",
  "DIFC (Dubai International Financial Center)": "financial hub with Gate Building landmark, modern towers, art galleries, restaurants, landscaped walkways",
  "Dubai Design District": "creative hub with modern architecture, d3 building clusters, open plazas, art installations, design studios",
  "Reem Island": "Abu Dhabi island community, cluster of residential towers, Shams development, waterfront parks, retail podiums, marina",
  "Al Reem Island, Abu Dhabi": "Abu Dhabi island community, residential tower clusters, waterfront parks, Shams Abu Dhabi, marina",
  "Dubai Expo City": "Expo 2020 legacy pavilions, Al Wasl dome, themed districts, residential area, innovation hub",
  "Masdar City": "sustainable city prototype, solar-powered buildings, autonomous transport, university, green architecture, desert innovation",
  "Al Wasl": "central Dubai residential area, tree-lined streets, villas, proximity to City Walk, urban community feel",
  "Sharjah": "cultural capital, Heritage Area, Sharjah waterfront, museums, Al Noor Island, University City, residential towers",
  "Fujairah City": "east coast emirate, Hajar Mountains backdrop, Fujairah Fort, corniche, beach resorts, port area",
  "Al Barsha": "mixed residential neighborhood, Mall of the Emirates landmark, schools zone, low-rise villas and apartment buildings",
  "Umm Suqeim": "beachfront residential area, Burj Al Arab views, Kite Beach, low-rise villas, Madinat Jumeirah heritage hotel complex",
  "Palm Jebel Ali": "massive palm-shaped island development, larger than Palm Jumeirah, beachfront plots, waterfront villas, Arabian Gulf",
  "Jumeirah Park": "villa community with landscaped parks, community center, jogging tracks, family neighborhoods, green spaces",
  "Jumeirah Second": "prestigious beachfront residential strip, luxury villas, beach access, Jumeirah Mosque, heritage area",
  "Al Barari": "ultra-luxury botanical community, lush tropical gardens, waterfalls, villa estates, themed garden neighborhoods",
  "Emirates Hills Dubai": "exclusive gated villa community, championship golf course, luxury mansions, lakes, premium landscaping",
  "The Springs": "townhouse community around landscaped lakes, community pools, retail center, jogging paths, family neighborhoods",
  "The Lakes": "premium villa community around interconnected lakes, landscaped gardens, community center, Emirates Hills adjacent",
  "The Greens": "apartment community with lush green gardens, swimming pools, community retail, Emirates Golf Club views",
  "Nad Al Sheba Gardens": "residential community near Meydan, villa clusters, gardens, family parks, equestrian area proximity",
  "World of Islands": "The World archipelago off Dubai coast, artificial island clusters forming world map, luxury developments, turquoise waters",
  "The World Islands": "artificial island archipelago shaped like world map, exclusive developments, turquoise Arabian Gulf waters",
  "Al Hamra Village": "RAK beachfront community, Al Hamra Golf Club, marina, beachfront villas, tower apartments, lagoon",
  "Damac Riverside": "waterway-themed community, residential clusters along water channels, parks, retail, family amenities",
  "Damac Suncity": "solar-inspired community, villa clusters, parks, community amenities, modern desert-edge development",
  "Port De La Mer": "Mediterranean-inspired waterfront community in Jumeirah, marina, beachfront apartments, yacht berths, retail promenade",
  "Jumeirah Bay Island": "seahorse-shaped island off Jumeirah coast, Bulgari Resort, ultra-luxury mansions, marina, exclusive waterfront",
  "Cherrywoods": "Meraas community with townhouses, cherry blossom-inspired landscaping, community farm, cycling tracks, retail village",
  "Remraam": "affordable villa and apartment community, Al Ain Road, community parks, pools, retail facilities, family-oriented",
  "Al Zorah City": "Ajman waterfront development, mangrove nature reserve, golf course, beachfront living, marina, eco-resort",
  "Sobha Central": "modern mixed-use community in MBR City, residential towers, retail, landscaped parks, premium amenities",
  "Al Ain": "Garden City of UAE, oasis heritage, Jebel Hafeet mountain, Al Ain Zoo, green parks, traditional markets",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const body = await req.json().catch(() => ({}));
    const forceRegenerate = body.force_regenerate || false;
    const processAll = body.process_all || false;
    const batchSize = processAll ? 200 : (body.batch_size || 5);

    // Build query - optionally skip the image_url IS NULL filter
    let query = supabase
      .from("areas")
      .select("id, name, slug, image_url")
      .eq("is_active", true)
      .order("property_count", { ascending: false })
      .limit(batchSize);

    if (!forceRegenerate) {
      query = query.is("image_url", null);
    }

    const { data: areas, error: fetchErr } = await query;

    if (fetchErr) throw fetchErr;
    if (!areas || areas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No areas to process", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count remaining
    let remainingQuery = supabase
      .from("areas")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    if (!forceRegenerate) {
      remainingQuery = remainingQuery.is("image_url", null);
    }
    const { count: remaining } = await remainingQuery;

    const results: { area: string; status: string; image_url?: string }[] = [];

    for (const area of areas) {
      try {
        console.log(`Generating community image for: ${area.name}`);

        // Look up area-specific description
        const communityDesc = COMMUNITY_DESCRIPTIONS[area.name];

        const prompts = communityDesc
          ? [
              `Ultra-realistic 8K drone aerial photograph of ${area.name} community in Dubai, UAE. Bird's-eye view showing ${communityDesc}. Full master-planned community layout visible with roads, landscaping, and surrounding context. Golden hour lighting, crystal clear sky, cinematic composition, real estate marketing photography, no text, no watermarks, no logos.`,
              `Stunning bird's-eye view aerial photograph of ${area.name} in the UAE showing ${communityDesc}. Drone perspective, entire neighborhood visible, ultra high resolution, photorealistic, golden hour, no text or watermarks.`,
            ]
          : [
              `Ultra-realistic 8K drone aerial photograph of ${area.name} community in Dubai, UAE. Bird's-eye view showing the full master-planned community layout with residential towers, villas, landscaped parks, swimming pools, roads, and surrounding desert or waterfront. Golden hour lighting, crystal clear sky, cinematic composition, real estate marketing photography, no text, no watermarks, no logos.`,
              `Stunning bird's-eye view photograph of a modern urban residential district in the UAE with towers, parks, and pools under a golden sunset sky. Ultra high resolution, photorealistic, no text or watermarks.`,
            ];

        let imageData: string | undefined;

        for (let attempt = 0; attempt < prompts.length; attempt++) {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-pro-image-preview",
              messages: [{ role: "user", content: prompts[attempt] }],
              modalities: ["image", "text"],
            }),
          });

          if (!aiResponse.ok) {
            const errText = await aiResponse.text();
            console.error(`AI error for ${area.name} (attempt ${attempt + 1}): ${aiResponse.status} ${errText}`);
            if (aiResponse.status === 429) await new Promise(r => setTimeout(r, 5000));
            continue;
          }

          const aiData = await aiResponse.json();
          const candidate = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (candidate && candidate.startsWith("data:image")) {
            imageData = candidate;
            break;
          }
          console.warn(`No image for ${area.name} attempt ${attempt + 1}`);
          await new Promise(r => setTimeout(r, 1000));
        }

        if (!imageData) {
          console.warn(`All prompts failed for ${area.name}`);
          results.push({ area: area.name, status: "no_image_all_attempts" });
          continue;
        }

        // Extract base64 data and upload to storage
        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          results.push({ area: area.name, status: "invalid_base64" });
          continue;
        }

        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const filePath = `${area.slug}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("area-images")
          .upload(filePath, binaryData, {
            contentType: `image/${base64Match[1]}`,
            upsert: true,
          });

        if (uploadErr) {
          console.error(`Upload error for ${area.name}:`, uploadErr);
          results.push({ area: area.name, status: `upload_error: ${uploadErr.message}` });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("area-images")
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // Update area record
        const { error: updateErr } = await supabase
          .from("areas")
          .update({
            image_url: publicUrl,
            hero_image_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", area.id);

        if (updateErr) {
          results.push({ area: area.name, status: `db_error: ${updateErr.message}` });
        } else {
          results.push({ area: area.name, status: "success", image_url: publicUrl });
          console.log(`✅ ${area.name}: ${publicUrl}`);
        }

        // Delay between generations to avoid rate limits
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        console.error(`Error for ${area.name}:`, err);
        results.push({ area: area.name, status: `error: ${err instanceof Error ? err.message : String(err)}` });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        remaining: (remaining || 0) - results.filter(r => r.status === "success").length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-area-images error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
