import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Google Drive helpers ──────────────────────────────────────────────────────

function isGoogleDriveLink(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com|sheets\.google\.com|slides\.google\.com/i.test(url);
}

function parseGoogleDriveUrl(url: string): { type: 'file' | 'folder' | 'doc' | 'sheet' | 'slide'; id: string } | null {
  // Folder: https://drive.google.com/drive/folders/FOLDER_ID
  let m = url.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'folder', id: m[1] };

  // File view: https://drive.google.com/file/d/FILE_ID/view
  m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'file', id: m[1] };

  // Open by ID: https://drive.google.com/open?id=FILE_ID
  m = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'file', id: m[1] };

  // Google Docs
  m = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'doc', id: m[1] };

  // Google Sheets
  m = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'sheet', id: m[1] };

  // Google Slides
  m = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'slide', id: m[1] };

  // Generic ID in URL
  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'file', id: m[1] };

  return null;
}

async function fetchGoogleDriveContent(parsed: { type: string; id: string }): Promise<{ text: string; images: string[]; files: { name: string; exportUrl: string }[] }> {
  const result = { text: '', images: [] as string[], files: [] as { name: string; exportUrl: string }[] };

  if (parsed.type === 'doc') {
    // Export Google Doc as plain text
    const exportUrl = `https://docs.google.com/document/d/${parsed.id}/export?format=txt`;
    try {
      const res = await fetch(exportUrl);
      if (res.ok) {
        result.text = await res.text();
      }
    } catch (e) { console.warn('Failed to export Google Doc:', e); }

    // Also try HTML for richer extraction
    const htmlUrl = `https://docs.google.com/document/d/${parsed.id}/export?format=html`;
    try {
      const res = await fetch(htmlUrl);
      if (res.ok) {
        const html = await res.text();
        // Extract image URLs from HTML
        const imgMatches = html.matchAll(/src=\"(https?:\/\/[^\"]+)\"/g);
        for (const im of imgMatches) {
          if (!/tracking|pixel|1x1/i.test(im[1])) result.images.push(im[1]);
        }
      }
    } catch { /* skip */ }
  } else if (parsed.type === 'sheet') {
    // Export Google Sheet as CSV
    const exportUrl = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv`;
    try {
      const res = await fetch(exportUrl);
      if (res.ok) {
        result.text = await res.text();
      }
    } catch (e) { console.warn('Failed to export Sheet:', e); }
  } else if (parsed.type === 'slide') {
    // Export as text
    const exportUrl = `https://docs.google.com/presentation/d/${parsed.id}/export?format=txt`;
    try {
      const res = await fetch(exportUrl);
      if (res.ok) {
        result.text = await res.text();
      }
    } catch { /* skip */ }
  } else if (parsed.type === 'file') {
    // Try direct download for PDFs/images
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${parsed.id}`;
    result.files.push({ name: `gdrive-${parsed.id}`, exportUrl: downloadUrl });

    // Try to get file metadata via embed page
    try {
      const metaUrl = `https://drive.google.com/file/d/${parsed.id}/view`;
      const res = await fetch(metaUrl, { redirect: 'follow' });
      if (res.ok) {
        const html = await res.text();
        // Extract title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          result.text += `File: ${titleMatch[1].replace(' - Google Drive', '').trim()}\n`;
        }
      }
    } catch { /* skip */ }
  } else if (parsed.type === 'folder') {
    // For folders, we can try to list public contents via embed
    try {
      const embedUrl = `https://drive.google.com/embeddedfolderview?id=${parsed.id}#list`;
      const res = await fetch(embedUrl, { redirect: 'follow' });
      if (res.ok) {
        const html = await res.text();
        // Extract file names and IDs
        const fileMatches = html.matchAll(/data-id=\"([^\"]+)\"[^>]*>.*?<div class=\"flip-entry-title\">([^<]+)<\/div>/gs);
        for (const fm of fileMatches) {
          const fileId = fm[1];
          const fileName = fm[2].trim();
          result.files.push({ name: fileName, exportUrl: `https://drive.google.com/uc?export=download&id=${fileId}` });
          result.text += `Found file: ${fileName}\n`;
        }

        // Fallback: extract any file IDs from the HTML
        if (result.files.length === 0) {
          const idMatches = html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)/g);
          const seen = new Set<string>();
          for (const idm of idMatches) {
            if (!seen.has(idm[1])) {
              seen.add(idm[1]);
              result.files.push({ name: `file-${idm[1]}`, exportUrl: `https://drive.google.com/uc?export=download&id=${idm[1]}` });
            }
          }
        }

        result.text += `\nGoogle Drive folder contains ${result.files.length} file(s).\n`;
      }
    } catch (e) { console.warn('Failed to list Drive folder:', e); }
  }

  return result;
}

// ── URL type detection ────────────────────────────────────────────────────────

function detectUrlType(url: string): 'google_drive' | 'pdf_direct' | 'image_direct' | 'property_portal' | 'generic' {
  if (isGoogleDriveLink(url)) return 'google_drive';
  if (/\.(pdf)$/i.test(url)) return 'pdf_direct';
  if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) return 'image_direct';

  const portalDomains = [
    'propertyfinder.ae', 'bayut.com', 'dubizzle.com', 'aqarmap.com',
    'houza.com', 'propsearch.ae', 'provident.ae', 'allsopp', 'betterhomes',
    'emaar.com', 'damacproperties.com', 'meraas.com', 'aldar.com',
    'sobhagroup.com', 'nakheel.com', 'deyaar.ae', 'reportage.ae',
  ];

  if (portalDomains.some(d => url.toLowerCase().includes(d))) return 'property_portal';
  return 'generic';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const { url, extract_mode } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urlType = detectUrlType(url);
    console.log(`[universal-link-extractor] URL type: ${urlType}, URL: ${url}`);

    let extractedText = '';
    let extractedImages: string[] = [];
    let driveFiles: { name: string; exportUrl: string }[] = [];
    let pageTitle = '';
    let scrapedMarkdown = '';

    // ── Step 1: Fetch content based on URL type ───────────────────────────────

    if (urlType === 'google_drive') {
      const parsed = parseGoogleDriveUrl(url);
      if (!parsed) {
        return new Response(JSON.stringify({ success: false, error: "Could not parse Google Drive URL. Make sure the link is shared publicly." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Google Drive parsed: type=${parsed.type}, id=${parsed.id}`);
      const driveContent = await fetchGoogleDriveContent(parsed);
      extractedText = driveContent.text;
      extractedImages = driveContent.images;
      driveFiles = driveContent.files;

      // For individual files, try to download and read content
      if (parsed.type === 'file' || (driveFiles.length > 0 && driveFiles.length <= 5)) {
        for (const df of driveFiles.slice(0, 5)) {
          try {
            const fileRes = await fetch(df.exportUrl, { redirect: 'follow' });
            if (fileRes.ok) {
              const contentType = fileRes.headers.get('content-type') || '';
              if (contentType.includes('text') || contentType.includes('csv') || contentType.includes('json')) {
                const text = await fileRes.text();
                extractedText += `\n\n--- ${df.name} ---\n${text.substring(0, 10000)}`;
              } else if (contentType.includes('image')) {
                // For images, keep the URL
                extractedImages.push(df.exportUrl);
              }
              // PDFs would need specialized handling - noted but skipped for size
            }
          } catch (e) { console.warn(`Failed to download ${df.name}:`, e); }
        }
      }

      // If we couldn't get much text, try Firecrawl as fallback
      if (extractedText.length < 100 && FIRECRAWL_API_KEY) {
        try {
          const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 5000, timeout: 30000 }),
          });
          if (fcRes.ok) {
            const fcData = await fcRes.json();
            scrapedMarkdown = fcData.data?.markdown || fcData.markdown || '';
            pageTitle = fcData.data?.metadata?.title || '';
          }
        } catch { /* skip */ }
      }
    } else if (urlType === 'image_direct') {
      extractedImages.push(url);
    } else {
      // Use Firecrawl for all other URLs
      if (FIRECRAWL_API_KEY) {
        try {
          const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              formats: ["markdown", "links"],
              onlyMainContent: true,
              waitFor: 3000,
              timeout: 30000,
            }),
          });
          if (fcRes.ok) {
            const fcData = await fcRes.json();
            scrapedMarkdown = fcData.data?.markdown || fcData.markdown || '';
            pageTitle = fcData.data?.metadata?.title || fcData.metadata?.title || '';

            // Extract images from links
            const allLinks: string[] = fcData.data?.links || fcData.links || [];
            extractedImages = allLinks.filter((l: string) =>
              /\.(jpg|jpeg|png|webp)/i.test(l) && !/logo|icon|avatar|sprite|badge/i.test(l)
            ).slice(0, 15);

            // Also extract markdown images
            const mdImgs = scrapedMarkdown.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g);
            for (const m of mdImgs) {
              if (!extractedImages.includes(m[1]) && !/logo|icon|avatar/i.test(m[1])) {
                extractedImages.push(m[1]);
              }
            }
            extractedImages = extractedImages.slice(0, 15);
          } else {
            console.warn('Firecrawl error:', fcRes.status, await fcRes.text());
          }
        } catch (e) { console.warn('Firecrawl failed:', e); }
      }

      // Fallback: simple fetch
      if (!scrapedMarkdown && !extractedText) {
        try {
          const res = await fetch(url, { redirect: 'follow' });
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('text') || ct.includes('html')) {
              const html = await res.text();
              const titleM = html.match(/<title>([^<]+)<\/title>/i);
              pageTitle = titleM ? titleM[1].trim() : '';
              // Strip tags for basic text extraction
              extractedText = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 15000);
            }
          }
        } catch { /* skip */ }
      }
    }

    const fullContent = [extractedText, scrapedMarkdown].filter(Boolean).join('\n\n').substring(0, 20000);

    if (!fullContent && extractedImages.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Could not extract content from this link. Make sure the link is publicly accessible (not private/restricted).",
        url_type: urlType,
        hint: urlType === 'google_drive' ? "Google Drive files must be set to 'Anyone with the link can view' for extraction to work." : undefined,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: AI extraction ─────────────────────────────────────────────────

    const mode = extract_mode || 'property_listing';

    const modePrompts: Record<string, string> = {
      property_listing: `You are an expert UAE real estate data extractor. Extract ALL property/listing information from the content below.
Return ONLY valid JSON with this structure:
{
  "title": "listing title",
  "description": "2-3 paragraph professional description",
  "listing_type": "sale|rent|holiday_home",
  "listing_category": "resale|ready|off_plan|land|rental",
  "property_type": "apartment|villa|townhouse|penthouse|studio|land|office|warehouse|shop",
  "developer_name": "developer name",
  "project_name": "project/building name",
  "location": "area/community",
  "emirate": "Dubai|Abu Dhabi|Sharjah|etc",
  "area": "sub-area",
  "bedrooms": null or number,
  "bathrooms": null or number,
  "area_sqft": null or number,
  "price": null or number in AED,
  "price_per_sqft": null or number,
  "furnishing": "furnished|semi_furnished|unfurnished|unknown",
  "handover_date": "date if available",
  "payment_plan": "plan details",
  "amenities": ["list of amenities"],
  "key_features": ["key selling points"],
  "confidence_score": 1-100,
  "extracted_highlights": ["important details extracted"],
  "client_data": null or { "client_name": "", "email": "", "phone": "", "unit_number": "", "purchase_price": null, "purchase_date": "" },
  "mou_data": null or { "buyer_name": "", "seller_name": "", "property_address": "", "agreed_price": null, "deposit_amount": null, "completion_date": "", "special_conditions": "" },
  "commission_data": null or { "agency_commission_pct": null, "referral_commission_pct": null, "total_commission_amount": null, "payment_terms": "" }
}
Use null for missing fields. Extract MOUs, SPAs, commission structures if present.`,

      deal_document: `You are an expert at extracting deal/transaction information from real estate documents (MOU, SPA, Reservation, Booking Forms).
Return ONLY valid JSON:
{
  "document_type": "mou|spa|reservation|booking_form|commission_agreement|other",
  "buyer": { "name": "", "email": "", "phone": "", "nationality": "", "passport_number": "", "address": "" },
  "seller": { "name": "", "email": "", "phone": "", "company": "" },
  "property": { "type": "", "unit_number": "", "building": "", "project": "", "location": "", "area_sqft": null },
  "deal": { "agreed_price": null, "currency": "AED", "deposit": null, "deposit_date": "", "completion_date": "", "handover_date": "" },
  "payment_plan": { "summary": "", "installments": [{"milestone": "", "percentage": null, "amount": null, "due_date": ""}] },
  "commission": { "agency_name": "", "agency_commission_pct": null, "broker_split_pct": null, "referral_fee_pct": null, "total_amount": null, "payment_terms": "" },
  "special_conditions": [""],
  "signatures_present": false,
  "confidence_score": 1-100
}
Use null for missing fields.`,

      general: `Extract ALL structured information from the content. Return valid JSON with every detail you find organized logically. Include names, dates, amounts, addresses, terms, and conditions.`,
    };

    const prompt = modePrompts[mode] || modePrompts.property_listing;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precision data extraction AI. Return only valid JSON. No markdown, no explanation." },
          { role: "user", content: `${prompt}\n\nSource URL: ${url}\nPage title: ${pageTitle}\n\nContent:\n${fullContent}` },
        ],
        temperature: 0.1,
        max_tokens: 6000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit reached — please try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted — please add credits" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiRes.text();
      throw new Error(`AI extraction failed: ${errText}`);
    }

    const aiData = await aiRes.json();
    let rawContent = aiData.choices?.[0]?.message?.content?.trim() || "{}";
    rawContent = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let extracted: Record<string, unknown> = {};
    try {
      extracted = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI JSON:", rawContent.substring(0, 300));
      extracted = { title: pageTitle || "Extracted Listing", description: fullContent.substring(0, 500) };
    }

    return new Response(JSON.stringify({
      success: true,
      data: extracted,
      url_type: urlType,
      images: extractedImages,
      source_url: url,
      page_title: pageTitle,
      drive_files: driveFiles.length > 0 ? driveFiles : undefined,
      content_length: fullContent.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[universal-link-extractor] error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
