import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { listing_id } = await req.json();
    if (!listing_id) throw new Error("listing_id required");

    // Fetch the listing
    const { data: listing, error: listingErr } = await supabase
      .from("portal_listings")
      .select("id, title, project_name, developer_name, location, images, gallery_images, amenities, documents")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listing) throw new Error("Listing not found");

    const projectName = listing.project_name || listing.title || "";
    if (!projectName.trim()) {
      return new Response(JSON.stringify({ success: true, message: "No project name to match" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fuzzy match: search published projects by name similarity
    const searchTerm = projectName.trim().toLowerCase();
    const { data: candidates } = await supabase
      .from("projects")
      .select("id, name, slug, cover_image_url, amenities, images:project_images(image_url)")
      .eq("is_published", true)
      .ilike("name", `%${searchTerm.split(" ").slice(0, 2).join("%")}%`)
      .limit(5);

    if (!candidates?.length) {
      return new Response(JSON.stringify({ success: true, message: "No matching project found", searched: searchTerm }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick the best match (simple: first result)
    const match = candidates[0];

    // Determine what data the listing has that the project doesn't
    const listingPhotos = [
      ...(Array.isArray(listing.images) ? listing.images : []),
      ...(Array.isArray(listing.gallery_images) ? listing.gallery_images : []),
    ].filter(Boolean);

    const existingPhotos = (match.images || []).map((img: any) => img.image_url);
    const newPhotos = listingPhotos.filter((url: string) => !existingPhotos.includes(url));

    const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
    const existingAmenities = Array.isArray(match.amenities) ? match.amenities : [];
    const newAmenities = listingAmenities.filter((a: string) => 
      !existingAmenities.some((ea: string) => ea.toLowerCase() === a.toLowerCase())
    );

    // Check if listing documents contain sensitive data (SPA, reservation agreements)
    const docs = Array.isArray(listing.documents) ? listing.documents : [];
    const sensitiveKeywords = ["spa", "reservation", "purchase", "agreement", "booking"];
    const hasSensitiveDocs = docs.some((d: any) => {
      const name = (typeof d === "string" ? d : d?.name || "").toLowerCase();
      return sensitiveKeywords.some(kw => name.includes(kw));
    });

    // Only create enrichment suggestion if there's new data to add (and not sensitive)
    if (newPhotos.length === 0 && newAmenities.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No new data to enrich",
        matched_project: match.name 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = [];

    if (newPhotos.length > 0) {
      suggestions.push({
        listing_id,
        project_id: match.id,
        project_name: match.name,
        suggestion_type: "photos",
        before_data: { photo_count: existingPhotos.length },
        after_data: { new_photos: newPhotos, new_count: newPhotos.length },
        status: "pending",
      });
    }

    if (newAmenities.length > 0 && !hasSensitiveDocs) {
      suggestions.push({
        listing_id,
        project_id: match.id,
        project_name: match.name,
        suggestion_type: "amenities",
        before_data: { amenities: existingAmenities },
        after_data: { new_amenities: newAmenities },
        status: "pending",
      });
    }

    if (suggestions.length > 0) {
      const { error: insertErr } = await supabase
        .from("listing_enrichment_suggestions")
        .insert(suggestions);

      if (insertErr) {
        console.error("Insert enrichment error:", insertErr);
        throw new Error("Failed to save enrichment suggestions");
      }
    }

    return new Response(JSON.stringify({
      success: true,
      matched_project: match.name,
      suggestions_created: suggestions.length,
      has_sensitive_docs: hasSensitiveDocs,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Enrichment matcher error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
