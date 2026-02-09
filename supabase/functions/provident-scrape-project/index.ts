import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScrapedProjectDetail {
  name: string;
  description: string;
  location: string;
  emirate: string;
  status: string;
  bedrooms: string;
  price_from: number | null;
  price_to: number | null;
  handover_date: string;
  payment_plan: string;
  amenities: string[];
  image_urls: string[];
  video_urls: string[];
  brochure_url: string | null;
  floor_plan_urls: string[];
  payment_plan_url: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!firecrawlKey || !lovableKey) {
    return new Response(JSON.stringify({ error: "Missing API keys" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { projectUrl, projectId, projectName } = await req.json();

    if (!projectUrl || !projectId) {
      return new Response(JSON.stringify({ error: "projectUrl and projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scraping project detail: ${projectName} from ${projectUrl}`);

    // Scrape the project page with Firecrawl - get EVERYTHING
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url: projectUrl,
        formats: ["markdown", "links", "rawHtml"],
        waitFor: 8000,
        timeout: 90000,
        onlyMainContent: false, // Get EVERYTHING
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("Firecrawl error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to scrape project page" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const html = scrapeData.data?.rawHtml || "";

    console.log(`Scraped content length: ${markdown.length}, links: ${links.length}, HTML: ${html.length}`);

    // Extract ALL image URLs from multiple sources (NO LIMITS)
    const imagePatterns = [
      /https?:\/\/[a-z0-9\-\.]+\.cloudfront\.net\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^\s"'<>\)]+provident[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>\)]*)?/gi,
    ];

    const imageSet = new Set<string>();
    
    // Extract from markdown, HTML, and links
    for (const pattern of imagePatterns) {
      (markdown.match(pattern) || []).forEach((url: string) => imageSet.add(url));
      (html.match(pattern) || []).forEach((url: string) => imageSet.add(url));
    }
    
    links.forEach((link: string) => {
      if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(link)) {
        imageSet.add(link);
      }
    });

    // Extract from img tags and data attributes
    const imgTagPattern = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
    let match;
    while ((match = imgTagPattern.exec(html)) !== null) {
      if (match[1] && !match[1].startsWith('data:')) {
        imageSet.add(match[1]);
      }
    }

    // Extract from background-image CSS
    const bgPattern = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
    while ((match = bgPattern.exec(html)) !== null) {
      if (match[1] && !match[1].startsWith('data:')) {
        imageSet.add(match[1]);
      }
    }

    // Filter, upgrade to high-res, and deduplicate
    const seen = new Set<string>();
    const allImageUrls = Array.from(imageSet)
      .map(url => url.replace(/\/x\/\d+x\d+\//, "/x/1200x800/"))
      .filter(url => {
        const lower = url.toLowerCase();
        if (lower.includes("logo") || lower.includes("icon") || 
            lower.includes("avatar") || lower.includes("placeholder") ||
            lower.includes("spinner") || lower.includes("loading")) {
          return false;
        }
        const base = url.split('?')[0];
        if (seen.has(base)) return false;
        seen.add(base);
        return url.length > 20;
      });

    console.log(`Found ${allImageUrls.length} unique images (NO LIMIT)`);

    // Extract ALL video URLs
    const videoPatterns = [
      /https?:\/\/[^\s"'<>\)]+\.(?:mp4|webm|mov)/gi,
      /https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/)([a-zA-Z0-9_-]+)/gi,
      /https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/gi,
      /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi,
    ];

    const videoSet = new Set<string>();
    for (const pattern of videoPatterns) {
      (markdown.match(pattern) || []).forEach((url: string) => videoSet.add(url));
      (html.match(pattern) || []).forEach((url: string) => videoSet.add(url));
    }

    const videoTagPattern = /<(?:video|iframe)[^>]+src=["']([^"']+)["']/gi;
    while ((match = videoTagPattern.exec(html)) !== null) {
      if (match[1]) videoSet.add(match[1]);
    }

    const allVideoUrls = Array.from(videoSet);
    console.log(`Found ${allVideoUrls.length} videos`);

    // Extract ALL PDF/brochure links
    const pdfPattern = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
    const allPdfLinks = [...new Set([
      ...(markdown.match(pdfPattern) || []),
      ...(html.match(pdfPattern) || []),
      ...links.filter((l: string) => l.toLowerCase().includes(".pdf"))
    ])];

    console.log(`Found ${allImageUrls.length} images, ${allVideoUrls.length} videos, ${allPdfLinks.length} PDFs`);

    // Use AI to extract structured data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a real estate data extraction specialist for UAE properties.
Extract COMPLETE project details from the provided content.
Return valid JSON only, no markdown formatting.`
          },
          {
            role: "user",
            content: `Extract project details from this Provident Estate project page:

Project Name: ${projectName}
URL: ${projectUrl}

Content:
${markdown.substring(0, 50000)}

Links found:
${links.slice(0, 150).join("\n")}

Return JSON:
{
  "description": "Full detailed project description (2-4 paragraphs)",
  "location": "Area, Community name",
  "emirate": "Dubai/Abu Dhabi/etc",
  "status": "Ready OR Under Construction",
  "bedrooms": "1-4 BR",
  "price_from": 1500000,
  "price_to": 5000000,
  "handover_date": "Q4 2026",
  "payment_plan": "60/40 or details",
  "amenities": ["Pool", "Gym", "Spa", "etc - list ALL mentioned"],
  "size_sqft_from": 500,
  "size_sqft_to": 3000,
  "property_types": ["Apartment", "Villa", "Townhouse", "Sky Villa"],
  "status_label": "Future Launch|New Phase|New Launch|Coming Soon|null",
  "image_urls": ["ONLY real project image URLs from the page - no placeholders"],
  "video_urls": ["Any video URLs found"],
  "brochure_url": "PDF brochure download URL if available",
  "floor_plan_urls": ["Floor plan PDF URLs if available"],
  "payment_plan_url": "Payment plan PDF URL if available"
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    let extractedData: Partial<ScrapedProjectDetail> = {};

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      // Parse JSON from response
      let jsonStr = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          extractedData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    } else {
      console.error("AI response failed:", aiResponse.status);
    }

    // Merge AI-extracted media with scraped links (NO LIMITS)
    const finalImageUrls = [
      ...(extractedData.image_urls || []),
      ...allImageUrls
    ].filter((url, index, arr) => arr.indexOf(url) === index);

    const finalVideoUrls = [
      ...(extractedData.video_urls || []),
      ...allVideoUrls
    ].filter((url, index, arr) => arr.indexOf(url) === index);

    // Categorize PDFs
    let brochureUrl = extractedData.brochure_url || null;
    let paymentPlanUrl = (extractedData as any).payment_plan_url || null;
    const floorPlanUrls = extractedData.floor_plan_urls || [];

    for (const pdf of allPdfLinks) {
      const lower = pdf.toLowerCase();
      if (!brochureUrl && lower.includes("brochure")) {
        brochureUrl = pdf;
      } else if (!paymentPlanUrl && lower.includes("payment")) {
        paymentPlanUrl = pdf;
      } else if (lower.includes("floor")) {
        if (!floorPlanUrls.includes(pdf)) floorPlanUrls.push(pdf);
      }
    }

    // If no brochure found, use first non-categorized PDF
    if (!brochureUrl && allPdfLinks.length > 0) {
      const remaining = allPdfLinks.filter(p => p !== paymentPlanUrl && !floorPlanUrls.includes(p));
      if (remaining.length > 0) brochureUrl = remaining[0];
    }

    // Update project with extracted data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (extractedData.description) updateData.description = extractedData.description;
    if (extractedData.location) updateData.location = extractedData.location;
    if (extractedData.emirate) updateData.emirate = extractedData.emirate;
    if (extractedData.status) {
      updateData.status = extractedData.status.toLowerCase().includes("ready") ? "Ready" : "Under Construction";
    }
    if (extractedData.price_from) updateData.price_from = extractedData.price_from;
    if (extractedData.price_to) updateData.price_to = extractedData.price_to;
    if (extractedData.handover_date) updateData.handover_date = extractedData.handover_date;
    if (extractedData.payment_plan) updateData.payment_plan = extractedData.payment_plan;
    if (extractedData.amenities && extractedData.amenities.length > 0) {
      updateData.amenities = extractedData.amenities;
    }
    if (extractedData.bedrooms) {
      const bedroomMatch = extractedData.bedrooms.match(/(\d+)/g);
      if (bedroomMatch) {
        updateData.bedrooms_min = parseInt(bedroomMatch[0]);
        updateData.bedrooms_max = parseInt(bedroomMatch[bedroomMatch.length - 1] || bedroomMatch[0]);
      }
    }

    await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    // Clear existing images and insert ALL new ones (NO LIMIT)
    if (finalImageUrls.length > 0) {
      await supabase
        .from("project_images")
        .delete()
        .eq("project_id", projectId);

      // Insert ALL images - NO LIMIT
      const imageRecords = finalImageUrls.map((url, index) => ({
        project_id: projectId,
        image_url: url,
        alt_text: `${projectName} - Image ${index + 1}`,
        display_order: index,
      }));

      // Insert in batches of 50 to avoid payload limits
      for (let i = 0; i < imageRecords.length; i += 50) {
        const batch = imageRecords.slice(i, i + 50);
        await supabase.from("project_images").insert(batch);
      }
    }

    // Handle brochure
    if (brochureUrl) {
      const { data: existingDoc } = await supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("document_type", "brochure")
        .maybeSingle();

      if (existingDoc) {
        await supabase
          .from("project_documents")
          .update({ file_url: brochureUrl })
          .eq("id", existingDoc.id);
      } else {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          document_type: "brochure",
          file_url: brochureUrl,
          file_name: `${projectName} Brochure.pdf`,
        });
      }
    }

    // Handle payment plan
    if (paymentPlanUrl) {
      const { data: existingPP } = await supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("document_type", "payment_plan")
        .maybeSingle();

      if (existingPP) {
        await supabase
          .from("project_documents")
          .update({ file_url: paymentPlanUrl })
          .eq("id", existingPP.id);
      } else {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          document_type: "payment_plan",
          file_url: paymentPlanUrl,
          file_name: `${projectName} Payment Plan.pdf`,
        });
      }
    }

    // Insert ALL floor plans
    for (const fpUrl of floorPlanUrls) {
      const { data: existingFP } = await supabase
        .from("project_documents")
        .select("id")
        .eq("project_id", projectId)
        .eq("file_url", fpUrl)
        .maybeSingle();

      if (!existingFP) {
        await supabase.from("project_documents").insert({
          project_id: projectId,
          document_type: "floor_plan",
          file_url: fpUrl,
          file_name: `${projectName} Floor Plan.pdf`,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      project: projectName,
      images_found: finalImageUrls.length,
      videos_found: finalVideoUrls.length,
      brochure_found: !!brochureUrl,
      payment_plan_found: !!paymentPlanUrl,
      floor_plans_found: floorPlanUrls.length,
      total_pdfs: allPdfLinks.length,
      status: extractedData.status || "unknown",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
