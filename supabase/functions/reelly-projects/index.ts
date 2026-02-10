 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
 };
 
 const REELLY_API_URL = "https://api-reelly.up.railway.app/api/v2/clients/projects";
 
 interface ReellyProject {
   id: number;
   name: string;
   developer: string;
   construction_status: string | null;
   sale_status: string | null;
   short_description: string | null;
   completion_date: string | null;
   building_count: number;
   units_count: number;
   location: {
     id: number;
     region: string;
     district: string;
     latitude: number;
     longitude: number;
   } | null;
   min_price: number;
   max_price: number;
   min_size: number;
   max_size: number;
   price_currency: string;
   area_unit: string;
   cover_image: { url: string } | null;
   video_reviews: Array<{ thumbnail_url?: string }>;
   is_published: boolean;
   updated_at: string;
 }
 
 interface TransformedProject {
   id: number;
   name: string;
   slug: string;
   developer_name: string;
   construction_status: string | null;
   sale_status: string | null;
   status_label: string | null;
   description: string | null;
   handover_date: string | null;
   location: string | null;
   emirate: string | null;
   latitude: number | null;
   longitude: number | null;
   price_from: number | null;
   price_to: number | null;
   size_min: number | null;
   size_max: number | null;
   thumbnail: string | null;
   gallery: string[];
   images: Array<{ image_url: string; alt_text: string }>;
 }
 
 function generateSlug(name: string): string {
   return name
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/^-|-$/g, '');
 }
 
 function mapSaleStatus(status: string | null): string | null {
   if (!status) return null;
   const map: Record<string, string> = {
     "announced": "Announced",
     "on_sale": "On Sale",
     "out_of_stock": "Sold Out",
     "presale_eoi": "Presale (EOI)",
     "start_of_sales": "Start of Sales",
   };
   return map[status] || status;
 }
 
 function mapConstructionStatus(status: string | null): string | null {
   if (!status) return null;
   const map: Record<string, string> = {
     "under_construction": "Under Construction",
     "completed": "Completed",
     "presale": "Presale",
   };
   return map[status] || status;
 }
 
 function transformProject(project: ReellyProject): TransformedProject {
   const thumbnail = project.cover_image?.url || null;
   
   // Extract gallery images from video thumbnails
   const gallery: string[] = [];
   if (project.video_reviews) {
     project.video_reviews.forEach(v => {
       if (v.thumbnail_url) gallery.push(v.thumbnail_url);
     });
   }
   
   // Create images array for frontend compatibility
   const images: Array<{ image_url: string; alt_text: string }> = [];
   if (thumbnail) {
     images.push({ image_url: thumbnail, alt_text: project.name });
   }
   gallery.forEach(url => {
     images.push({ image_url: url, alt_text: project.name });
   });
   
   return {
     id: project.id,
     name: project.name,
     slug: generateSlug(project.name),
     developer_name: project.developer,
     construction_status: mapConstructionStatus(project.construction_status),
     sale_status: mapSaleStatus(project.sale_status),
     status_label: mapSaleStatus(project.sale_status),
     description: project.short_description,
     handover_date: project.completion_date,
     location: project.location?.district || null,
     emirate: project.location?.region || null,
     latitude: project.location?.latitude || null,
     longitude: project.location?.longitude || null,
     price_from: project.min_price > 0 ? project.min_price : null,
     price_to: project.max_price > 0 ? project.max_price : null,
     size_min: project.min_size > 0 ? project.min_size : null,
     size_max: project.max_size > 0 ? project.max_size : null,
     thumbnail,
     gallery,
     images,
   };
 }
 
 serve(async (req: Request) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const apiKey = Deno.env.get('REELLY_API_KEY');
     if (!apiKey) {
       return new Response(
         JSON.stringify({ success: false, error: 'REELLY_API_KEY not configured' }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
    // Parse query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '24');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search');
  const saleStatus = url.searchParams.get('sale_status');
     const constructionStatus = url.searchParams.get('construction_status');
     const emirate = url.searchParams.get('emirate');
     const developerName = url.searchParams.get('developer_name');

     // Reverse-map human-readable status labels back to Reelly API enum values
     const saleStatusMap: Record<string, string> = {
       "Announced": "announced",
       "On Sale": "on_sale",
       "Sold Out": "out_of_stock",
       "Presale (EOI)": "presale_eoi",
       "Start of Sales": "start_of_sales",
     };
     const constructionStatusMap: Record<string, string> = {
       "Under Construction": "under_construction",
       "Completed": "completed",
       "Presale": "presale",
     };

     const mappedSaleStatus = saleStatus ? (saleStatusMap[saleStatus] || saleStatus) : null;
     const mappedConstructionStatus = constructionStatus ? (constructionStatusMap[constructionStatus] || constructionStatus) : null;

     // Build Reelly API URL with pagination and filters
     let reellyUrl = `${REELLY_API_URL}?limit=${limit}&offset=${offset}`;
     if (search) reellyUrl += `&search=${encodeURIComponent(search)}`;
     if (mappedSaleStatus) reellyUrl += `&sale_status=${encodeURIComponent(mappedSaleStatus)}`;
     if (mappedConstructionStatus) reellyUrl += `&construction_status=${encodeURIComponent(mappedConstructionStatus)}`;
     if (emirate) reellyUrl += `&region=${encodeURIComponent(emirate)}`;
     if (developerName) reellyUrl += `&developer=${encodeURIComponent(developerName)}`;
    
    console.log(`Fetching from Reelly API: ${reellyUrl}`);
 
     const response = await fetch(reellyUrl, {
       method: 'GET',
       headers: {
         'X-API-Key': apiKey,
         'Accept': 'application/json',
       },
     });
 
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reelly API error:', response.status, errorText);
        // Return empty results instead of propagating upstream errors
        // This prevents the frontend from crashing when Reelly API is temporarily down
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              projects: [],
              pagination: { total: 0, limit, offset, hasMore: false },
            },
            warning: `Reelly API returned ${response.status} — showing empty results`,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
 
     const data = await response.json();
     
     // Reelly API returns paginated response: { count, next, previous, results }
     const total = data.count || 0;
     const projects: ReellyProject[] = data.results || [];
     
     // Transform projects to frontend format
     const transformedProjects = projects.map(transformProject);
     
     const hasMore = offset + limit < total;
 
     return new Response(
       JSON.stringify({
         success: true,
         data: {
           projects: transformedProjects,
           pagination: {
             total,
             limit,
             offset,
             hasMore,
           },
         },
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   } catch (error) {
     console.error('Error in reelly-projects:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     return new Response(
       JSON.stringify({ success: false, error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });