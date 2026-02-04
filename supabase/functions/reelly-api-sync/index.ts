import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reelly API is hosted on Xano - common base URLs to try
const REELLY_API_BASES = [
  "https://api.reelly.io/api:main",
  "https://api.reelly.io/api:v1",
  "https://api.reelly.io/api",
  "https://x8ki-letl-twmt.n7.xano.io/api:main", // Common Xano subdomain pattern
];

interface ReellyProject {
  id: string | number;
  name?: string;
  title?: string;
  slug?: string;
  developer?: { name: string; slug?: string } | string;
  developer_name?: string;
  location?: string;
  area?: string;
  emirate?: string;
  description?: string;
  price_from?: number;
  starting_price?: number;
  price_to?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bedrooms?: string;
  size_min?: number;
  size_max?: number;
  handover_date?: string;
  handover?: string;
  completion_date?: string;
  payment_plan?: string;
  amenities?: string[];
  images?: Array<{ url: string; alt?: string } | string>;
  gallery?: Array<{ url: string; alt?: string } | string>;
  photos?: Array<{ url: string; alt?: string } | string>;
  brochure_url?: string;
  brochure?: string;
  floor_plans?: any[];
  faqs?: Array<{ question: string; answer: string }>;
  unit_types?: any[];
  units?: any[];
  construction_progress?: number;
  progress?: number;
  expected_completion?: string;
  total_units?: number;
  available_units?: number;
  roi_estimate?: number;
  rental_yield_estimate?: number;
  rental_yield?: number;
}

async function tryReellyEndpoint(apiKey: string, baseUrl: string, endpoint: string): Promise<any> {
  const url = `${baseUrl}${endpoint}`;
  console.log(`[Reelly API] Trying: ${url}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text.slice(0, 200)}`);
  }
  
  return response.json();
}

async function discoverReellyApi(apiKey: string): Promise<{ baseUrl: string; endpoint: string; data: any }> {
  const endpoints = [
    "/projects",
    "/project",
    "/off-plan",
    "/offplan",
    "/properties",
    "/listings",
    "/developments",
  ];
  
  for (const baseUrl of REELLY_API_BASES) {
    for (const endpoint of endpoints) {
      try {
        const data = await tryReellyEndpoint(apiKey, baseUrl, endpoint);
        console.log(`[Reelly API] SUCCESS: ${baseUrl}${endpoint}`);
        return { baseUrl, endpoint, data };
      } catch (err) {
        // Continue trying
      }
    }
  }
  
  throw new Error("Could not discover Reelly API endpoint. Please check the API key and contact Reelly support for the correct API base URL.");
}

async function fetchReellyProjects(apiKey: string, options?: { 
  baseUrl?: string; 
  endpoint?: string;
  page?: number; 
  limit?: number;
}): Promise<any> {
  const page = options?.page || 1;
  const limit = options?.limit || 100;
  
  // If we know the endpoint, use it directly
  if (options?.baseUrl && options?.endpoint) {
    const url = `${options.baseUrl}${options.endpoint}?page=${page}&per_page=${limit}`;
    return tryReellyEndpoint(apiKey, options.baseUrl, `${options.endpoint}?page=${page}&per_page=${limit}`);
  }
  
  // Otherwise discover it
  const discovery = await discoverReellyApi(apiKey);
  return discovery.data;
}

async function fetchAllReellyProjects(apiKey: string): Promise<ReellyProject[]> {
  // First discover the API
  const discovery = await discoverReellyApi(apiKey);
  
  const allProjects: ReellyProject[] = [];
  
  // Handle response format
  const initialProjects = Array.isArray(discovery.data) 
    ? discovery.data 
    : discovery.data?.items || discovery.data?.projects || discovery.data?.data || [];
  
  allProjects.push(...initialProjects);
  
  // Check for pagination
  const total = discovery.data?.total || discovery.data?.meta?.total || discovery.data?.pagination?.total;
  const perPage = discovery.data?.per_page || discovery.data?.meta?.per_page || 100;
  
  if (total && allProjects.length < total) {
    const totalPages = Math.ceil(total / perPage);
    
    for (let page = 2; page <= totalPages && page <= 50; page++) {
      try {
        const pageData = await tryReellyEndpoint(
          apiKey, 
          discovery.baseUrl, 
          `${discovery.endpoint}?page=${page}&per_page=${perPage}`
        );
        
        const projects = Array.isArray(pageData) 
          ? pageData 
          : pageData?.items || pageData?.projects || pageData?.data || [];
        
        if (projects.length === 0) break;
        allProjects.push(...projects);
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.warn(`[Reelly API] Page ${page} failed:`, err);
        break;
      }
    }
  }
  
  console.log(`[Reelly API] Total projects fetched: ${allProjects.length}`);
  return allProjects;
}

function normalizeReellyProject(project: ReellyProject): any {
  const name = project.name || project.title || `Project ${project.id}`;
  const slug = project.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || String(project.id);
  
  // Extract developer name
  let developerName = null;
  if (typeof project.developer === "string") {
    developerName = project.developer;
  } else if (project.developer?.name) {
    developerName = project.developer.name;
  } else if (project.developer_name) {
    developerName = project.developer_name;
  }
  
  // Extract images
  const rawImages = project.images || project.gallery || project.photos || [];
  const images = rawImages.map((img, idx) => ({
    url: typeof img === "string" ? img : img.url,
    alt_text: typeof img === "string" ? `${name} - Image ${idx + 1}` : (img.alt || `${name} - Image ${idx + 1}`),
    display_order: idx,
  })).filter(img => img.url);
  
  // Parse bedrooms
  let bedroomsMin = project.bedrooms_min;
  let bedroomsMax = project.bedrooms_max;
  if (!bedroomsMin && project.bedrooms) {
    const nums = project.bedrooms.match(/\d+/g);
    if (nums) {
      bedroomsMin = parseInt(nums[0]);
      bedroomsMax = nums.length > 1 ? parseInt(nums[nums.length - 1]) : bedroomsMin;
    }
  }
  
  return {
    external_id: String(project.id),
    slug,
    name,
    description: project.description || null,
    location: project.location || project.area || null,
    emirate: project.emirate || "Dubai",
    developer_name: developerName,
    price_from: project.price_from || project.starting_price || null,
    price_to: project.price_to || null,
    bedrooms_min: bedroomsMin || null,
    bedrooms_max: bedroomsMax || null,
    size_min: project.size_min || null,
    size_max: project.size_max || null,
    handover_date: project.handover_date || project.handover || project.completion_date || null,
    payment_plan: project.payment_plan || null,
    amenities: project.amenities || [],
    images,
    brochure_url: project.brochure_url || project.brochure || null,
    floor_plan_types: project.floor_plans || null,
    faqs: project.faqs || null,
    unit_types: project.unit_types || project.units || null,
    construction_progress: project.construction_progress || project.progress || null,
    expected_completion: project.expected_completion || null,
    total_units: project.total_units || null,
    available_units: project.available_units || null,
    roi_estimate: project.roi_estimate || null,
    rental_yield_estimate: project.rental_yield_estimate || project.rental_yield || null,
    source_url: `https://soft.reelly.io/projects/${slug}`,
    import_source: "reelly",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      console.error("REELLY_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Reelly API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, project_id } = await req.json().catch(() => ({}));

    // Test API connection and discover endpoint
    if (action === "test" || action === "discover") {
      try {
        const discovery = await discoverReellyApi(apiKey);
        const sampleProjects = Array.isArray(discovery.data) 
          ? discovery.data.slice(0, 3)
          : (discovery.data?.items || discovery.data?.projects || discovery.data?.data || []).slice(0, 3);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Reelly API connection successful",
            discovered_endpoint: `${discovery.baseUrl}${discovery.endpoint}`,
            sample_count: sampleProjects.length,
            sample: sampleProjects,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `API discovery failed: ${err instanceof Error ? err.message : String(err)}`,
            tried_bases: REELLY_API_BASES,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch all projects
    if (action === "fetch-all" || action === "sync") {
      console.log("[Reelly API] Starting full project fetch...");
      
      const projects = await fetchAllReellyProjects(apiKey);
      const normalizedProjects = projects.map(normalizeReellyProject);
      
      console.log(`[Reelly API] Fetched and normalized ${normalizedProjects.length} projects`);
      
      // If sync action, also insert into pending_project_imports
      if (action === "sync") {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        let inserted = 0;
        let updated = 0;
        let errors: string[] = [];
        
        for (const project of normalizedProjects) {
          try {
            // Check if already exists
            const { data: existing } = await supabase
              .from("pending_project_imports")
              .select("id")
              .eq("external_id", project.external_id)
              .eq("import_source", "reelly")
              .maybeSingle();
            
            if (existing) {
              // Update existing
              const { error } = await supabase
                .from("pending_project_imports")
                .update({
                  ...project,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
              
              if (error) throw error;
              updated++;
            } else {
              // Insert new
              const { error } = await supabase
                .from("pending_project_imports")
                .insert({
                  ...project,
                  status: "pending",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              
              if (error) throw error;
              inserted++;
            }
          } catch (err) {
            errors.push(`${project.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            total_fetched: normalizedProjects.length,
            inserted,
            updated,
            errors: errors.slice(0, 10),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          total: normalizedProjects.length,
          projects: normalizedProjects,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Invalid action. Use 'test', 'discover', 'fetch-all', or 'sync'" 
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Reelly API] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
