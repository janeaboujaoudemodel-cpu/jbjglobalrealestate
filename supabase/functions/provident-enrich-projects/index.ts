import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchProvidentPageDataDetail, PageDataProjectDetail } from "../_shared/provident/pagedata-detail.ts";
import { fetchProvidentPageDataPdfUrls } from "../_shared/provident/pagedata.ts";
import { mirrorRemotePdfToPublicStorage } from "../_shared/provident/storage.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Word-token Jaccard similarity for name verification */
function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function isEmptyArray(val: unknown): boolean {
  return !val || (Array.isArray(val) && val.length === 0);
}

function generateSlugVariants(name: string, location?: string | null, developer?: string | null): string[] {
  const base = slugify(name);
  const variants = [base];

  // Remove common suffixes like "Phase 2", "Tower A" for broader match
  const simplified = base.replace(/-(?:phase|tower|block|building)-?\d*[a-z]?$/i, "");
  if (simplified !== base) variants.push(simplified);

  // Append location
  if (location) {
    const locSlug = slugify(location);
    if (locSlug) variants.push(`${base}-${locSlug}`);
  }

  // Append developer
  if (developer) {
    const devSlug = slugify(developer);
    if (devSlug) variants.push(`${base}-${devSlug}`);
  }

  return [...new Set(variants)];
}

interface EnrichResult {
  project_id: string;
  project_name: string;
  slug_tried: string[];
  slug_matched: string | null;
  images_added: number;
  documents_added: number;
  fields_updated: string[];
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  error?: string;
}

async function enrichProject(
  supabase: ReturnType<typeof createClient>,
  project: {
    id: string;
    name: string;
    area_name?: string | null;
    developer_name?: string | null;
    amenities?: unknown;
    payment_plan?: string | null;
    payment_breakdown?: unknown;
    floor_plan_types?: unknown;
    faqs?: unknown;
    location_distances?: unknown;
    description?: string | null;
  },
  existingImageCount: number,
  existingDocTypes: Set<string>,
): Promise<EnrichResult> {
  const result: EnrichResult = {
    project_id: project.id,
    project_name: project.name,
    slug_tried: [],
    slug_matched: null,
    images_added: 0,
    documents_added: 0,
    fields_updated: [],
  };

  const slugs = generateSlugVariants(project.name, project.area_name, project.developer_name);
  result.slug_tried = slugs;

  let detail: PageDataProjectDetail | null = null;

  for (const slug of slugs) {
    detail = await fetchProvidentPageDataDetail(slug);
    if (detail && (detail.images.length > 0 || detail.amenities.length > 0 || detail.uspBullets.length > 0)) {
      // Name verification guard
      if (detail.name) {
        const sim = nameSimilarity(project.name, detail.name);
        if (sim < 0.2) {
          console.warn(`[Enrich] Name mismatch! Local="${project.name}" vs Provident="${detail.name}" (similarity=${sim.toFixed(2)}). Skipping slug ${slug}.`);
          detail = null;
          continue;
        }
      }
      result.slug_matched = slug;
      break;
    }
  }

  if (!detail || !result.slug_matched) {
    result.error = "No Provident match found";
    return result;
  }

  console.log(`[Enrich] Matched ${project.name} -> ${result.slug_matched} (${detail.images.length} images, ${detail.amenities.length} amenities)`);

  // ========== Merge Images ==========
  if (existingImageCount < 3 && detail.images.length > 0) {
    const imagesToInsert = detail.images.map((img, idx) => ({
      project_id: project.id,
      image_url: img.url,
      alt_text: img.alt_text,
      display_order: existingImageCount + idx,
      data_source: "provident",
    }));

    const { error: imgErr } = await supabase.from("project_images").insert(imagesToInsert);
    if (!imgErr) {
      result.images_added = imagesToInsert.length;
    } else {
      console.warn(`[Enrich] Image insert error: ${imgErr.message}`);
    }
  }

  // ========== Merge Fields (only if NULL) ==========
  const updates: Record<string, unknown> = {};

  if (isEmptyArray(project.amenities) && detail.amenities.length > 0) {
    updates.amenities = detail.amenities;
    result.fields_updated.push("amenities");
  }

  if (!project.payment_plan && detail.paymentPlan) {
    updates.payment_plan = detail.paymentPlan;
    result.fields_updated.push("payment_plan");
  }

  if (isEmptyArray(project.payment_breakdown) && Object.keys(detail.paymentBreakdown).length > 0) {
    updates.payment_breakdown = detail.paymentBreakdown;
    result.fields_updated.push("payment_breakdown");
  }

  if (isEmptyArray(project.floor_plan_types) && detail.floorPlanTypes.length > 0) {
    updates.floor_plan_types = detail.floorPlanTypes;
    result.fields_updated.push("floor_plan_types");
  }

  if (isEmptyArray(project.faqs) && detail.faqs.length > 0) {
    updates.faqs = detail.faqs;
    result.fields_updated.push("faqs");
  }

  if (isEmptyArray(project.location_distances) && detail.locationDistances.length > 0) {
    updates.location_distances = detail.locationDistances;
    result.fields_updated.push("location_distances");
  }

  // Append USPs to description
  if (detail.uspBullets.length > 0) {
    const uspSection = `\n\n## Key Highlights\n${detail.uspBullets.map(b => `- ${b}`).join("\n")}`;
    if (project.description) {
      if (!project.description.includes("Key Highlights")) {
        updates.description = project.description + uspSection;
        result.fields_updated.push("description_usps");
      }
    } else if (detail.description) {
      updates.description = detail.description + uspSection;
      result.fields_updated.push("description");
    }
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    const { error: updateErr } = await supabase.from("projects").update(updates).eq("id", project.id);
    if (updateErr) {
      console.warn(`[Enrich] Update error for ${project.name}: ${updateErr.message}`);
    }
  }

  // ========== Merge Documents (PDFs) ==========
  const slug = result.slug_matched;

  // Also fetch PDF URLs from page-data
  const pdfUrls = await fetchProvidentPageDataPdfUrls({ baseUrl: "https://providentestate.com", slug });

  const docsToAdd: Array<{ type: string; url: string | null }> = [];
  if (pdfUrls.brochure && !existingDocTypes.has("brochure")) {
    docsToAdd.push({ type: "brochure", url: pdfUrls.brochure });
  }
  if (pdfUrls.paymentPlan && !existingDocTypes.has("payment_plan")) {
    docsToAdd.push({ type: "payment_plan", url: pdfUrls.paymentPlan });
  }
  for (const fpUrl of pdfUrls.floorPlans) {
    if (!existingDocTypes.has("floor_plan")) {
      docsToAdd.push({ type: "floor_plan", url: fpUrl });
    }
  }

  // Also check detail brochure/payment URLs
  if (detail.brochureUrl && !existingDocTypes.has("brochure") && !docsToAdd.find(d => d.type === "brochure")) {
    docsToAdd.push({ type: "brochure", url: detail.brochureUrl });
  }
  if (detail.paymentPlanPdfUrl && !existingDocTypes.has("payment_plan") && !docsToAdd.find(d => d.type === "payment_plan")) {
    docsToAdd.push({ type: "payment_plan", url: detail.paymentPlanPdfUrl });
  }

  for (const doc of docsToAdd) {
    if (!doc.url) continue;
    try {
      const mirrored = await mirrorRemotePdfToPublicStorage({
        supabase,
        bucket: "project-documents",
        slug,
        type: doc.type as "brochure" | "payment_plan" | "floor_plan",
        sourceUrl: doc.url,
      });

      if (mirrored && mirrored.publicUrl) {
        const { error: docErr } = await supabase.from("project_documents").insert({
          project_id: project.id,
          document_type: doc.type,
          document_url: mirrored.publicUrl,
          file_name: `${doc.type}.pdf`,
          data_source: "provident",
        });
        if (!docErr) result.documents_added++;
      }
    } catch (e) {
      console.warn(`[Enrich] PDF mirror error for ${doc.type}: ${e}`);
    }
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const projectId = body.project_id as string | undefined;
    const batchSize = Math.min(body.batch_size || 10, 50);
    const offset = body.offset || 0;
    const dryRun = body.dry_run === true;
    const mode = (body.mode as "all" | "published" | "drafts") || "all";

    console.log(`[ProvidentEnrich] Starting. project_id=${projectId || "batch"}, mode=${mode}, batch=${batchSize}, offset=${offset}, dry_run=${dryRun}`);

    // Query projects needing enrichment (strictly Provident-sourced)
    let query = supabase
      .from("projects")
      .select("id, name, source_url, is_published, area_name, developer_name, amenities, payment_plan, payment_breakdown, floor_plan_types, faqs, location_distances, description")
      .ilike("source_url", "%providentestate.com%")
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("id", projectId);
    } else {
      query = query
        .or("amenities.is.null,payment_plan.is.null,payment_breakdown.is.null,description.is.null")
        .range(offset, offset + batchSize - 1);

      if (mode === "published") query = query.eq("is_published", true);
      if (mode === "drafts") query = query.or("is_published.is.null,is_published.eq.false");
    }

    const { data: projects, error: fetchErr } = await query;
    if (fetchErr) {
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No projects need enrichment", results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ProvidentEnrich] Processing ${projects.length} projects`);

    // Get existing image counts and document types for all projects
    const projectIds = projects.map(p => p.id);

    const { data: imageCounts } = await supabase
      .from("project_images")
      .select("project_id")
      .in("project_id", projectIds);

    const imageCountMap = new Map<string, number>();
    for (const img of imageCounts || []) {
      imageCountMap.set(img.project_id, (imageCountMap.get(img.project_id) || 0) + 1);
    }

    const { data: existingDocs } = await supabase
      .from("project_documents")
      .select("project_id, document_type")
      .in("project_id", projectIds);

    const docTypeMap = new Map<string, Set<string>>();
    for (const doc of existingDocs || []) {
      if (!docTypeMap.has(doc.project_id)) docTypeMap.set(doc.project_id, new Set());
      docTypeMap.get(doc.project_id)!.add(doc.document_type);
    }

    if (dryRun) {
      const slugPreviews = projects.map(p => ({
        id: p.id,
        name: p.name,
        slugs: generateSlugVariants(p.name, p.area_name, p.developer_name),
        existing_images: imageCountMap.get(p.id) || 0,
        existing_docs: Array.from(docTypeMap.get(p.id) || []),
        missing: {
          amenities: !p.amenities,
          payment_plan: !p.payment_plan,
          payment_breakdown: !p.payment_breakdown,
          floor_plan_types: !p.floor_plan_types,
          faqs: !p.faqs,
          location_distances: !p.location_distances,
        },
      }));

      return new Response(JSON.stringify({ success: true, dry_run: true, projects: slugPreviews }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process projects
    const results: EnrichResult[] = [];
    for (const project of projects) {
      try {
        const r = await enrichProject(
          supabase,
          project,
          imageCountMap.get(project.id) || 0,
          docTypeMap.get(project.id) || new Set(),
        );
        results.push(r);
        console.log(`[ProvidentEnrich] ${project.name}: matched=${r.slug_matched}, images=${r.images_added}, docs=${r.documents_added}, fields=${r.fields_updated.join(",")}`);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        results.push({
          project_id: project.id,
          project_name: project.name,
          slug_tried: [],
          slug_matched: null,
          images_added: 0,
          documents_added: 0,
          fields_updated: [],
          error: errMsg,
        });
      }

      // Delay between projects to avoid rate limits
      if (projects.length > 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const matched = results.filter(r => r.slug_matched);
    const totalImages = results.reduce((sum, r) => sum + r.images_added, 0);
    const totalDocs = results.reduce((sum, r) => sum + r.documents_added, 0);
    const totalFields = results.reduce((sum, r) => sum + r.fields_updated.length, 0);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        processed: results.length,
        matched: matched.length,
        images_added: totalImages,
        documents_added: totalDocs,
        fields_updated: totalFields,
      },
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[ProvidentEnrich] Fatal:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
