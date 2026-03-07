import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchProvidentPageDataDetail } from "../_shared/provident/pagedata-detail.ts";
import { fetchProvidentPageDataPdfUrls } from "../_shared/provident/pagedata.ts";

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

function generateSlugVariants(name: string): string[] {
  const base = slugify(name);
  const variants = [base];

  // Remove common suffixes
  const simplified = base.replace(/-(?:phase|tower|block|building)-?\d*[a-z]?$/i, "");
  if (simplified !== base) variants.push(simplified);

  // Remove "by developer-name" suffix
  const byIdx = base.indexOf("-by-");
  if (byIdx > 0) variants.push(base.substring(0, byIdx));

  return [...new Set(variants)];
}

function nameSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const MAX_DURATION_MS = 50_000; // 50s budget

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 10, 30);
    const action = body.action || "migrate"; // "migrate" | "stats"

    // ========== STATS MODE ==========
    if (action === "stats") {
      const { count: pendingCount } = await sb
        .from("listing_pending_updates")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("field_name", "new_project")
        .eq("change_type", "create");

      const { count: migratedCount } = await sb
        .from("listing_pending_updates")
        .select("id", { count: "exact", head: true })
        .eq("status", "migrated");

      return new Response(JSON.stringify({
        success: true,
        pending: pendingCount ?? 0,
        migrated: migratedCount ?? 0,
        total: (pendingCount ?? 0) + (migratedCount ?? 0),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== MIGRATE MODE ==========
    // Fetch batch of pending new_project updates
    const { data: pendingUpdates, error: fetchErr } = await sb
      .from("listing_pending_updates")
      .select("id, proposed_value, created_at")
      .eq("status", "pending")
      .eq("field_name", "new_project")
      .eq("change_type", "create")
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchErr) {
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingUpdates || pendingUpdates.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        enriched: 0,
        failed: 0,
        remaining: 0,
        results: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Count remaining
    const { count: remainingCount } = await sb
      .from("listing_pending_updates")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("field_name", "new_project")
      .eq("change_type", "create");

    const results: Array<{
      id: string;
      name: string;
      slug_matched: string | null;
      status: string;
      images: number;
      docs: number;
      fields: string[];
    }> = [];

    let enriched = 0;
    let failed = 0;

    for (const update of pendingUpdates) {
      // Time budget check
      if (Date.now() - startTime > MAX_DURATION_MS) {
        console.log("[EnrichPending] Time budget exceeded, stopping.");
        break;
      }

      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(update.proposed_value);
      } catch {
        parsed = { project_name: update.proposed_value };
      }

      const projectName = (parsed.project_name as string) || "Unknown";
      const slugs = generateSlugVariants(projectName);

      console.log(`[EnrichPending] Processing "${projectName}" with slugs: ${slugs.join(", ")}`);

      let detail = null;
      let matchedSlug: string | null = null;

      for (const slug of slugs) {
        try {
          detail = await fetchProvidentPageDataDetail(slug);
          if (detail && (detail.images.length > 0 || detail.amenities.length > 0 || detail.description)) {
            // Name verification
            if (detail.name) {
              const sim = nameSimilarity(projectName, detail.name);
              if (sim < 0.15) {
                console.warn(`[EnrichPending] Name mismatch: "${projectName}" vs "${detail.name}" (${sim.toFixed(2)})`);
                detail = null;
                continue;
              }
            }
            matchedSlug = slug;
            break;
          }
        } catch (e) {
          console.warn(`[EnrichPending] Error fetching slug ${slug}:`, e);
        }
      }

      if (!detail || !matchedSlug) {
        // No Provident data found — still create a basic pending_project_imports record
        const basicSlug = slugify(projectName);

        // Check if already exists in pending_project_imports
        const { data: existing } = await sb
          .from("pending_project_imports")
          .select("id")
          .eq("slug", basicSlug)
          .maybeSingle();

        if (!existing) {
          await sb.from("pending_project_imports").insert({
            name: projectName,
            slug: basicSlug,
            developer_name: (parsed.developer as string) || null,
            location: (parsed.area as string) || null,
            emirate: (parsed.emirate as string) || "Dubai",
            description: null,
            price_from: (parsed.price_from as number) || null,
            images: [],
            documents: [],
            is_new_project: true,
            status: "pending",
            source_url: `https://providentestate.com/new-projects/${basicSlug}`,
            review_notes: "PENDING_SCRAPE",
          });
        }

        // Mark as migrated
        await sb
          .from("listing_pending_updates")
          .update({ status: "migrated" })
          .eq("id", update.id);

        failed++;
        results.push({
          id: update.id,
          name: projectName,
          slug_matched: null,
          status: "no_provident_data",
          images: 0,
          docs: 0,
          fields: [],
        });
        continue;
      }

      // Build fully enriched pending_project_imports record
      const enrichedSlug = matchedSlug;
      const images = detail.images.map(img => ({ url: img.url, alt: img.alt_text }));
      const documents: Array<{ url: string; type: string; name?: string }> = [];

      if (detail.brochureUrl) {
        documents.push({ url: detail.brochureUrl, type: "brochure", name: "Brochure" });
      }
      if (detail.paymentPlanPdfUrl) {
        documents.push({ url: detail.paymentPlanPdfUrl, type: "payment_plan", name: "Payment Plan" });
      }
      for (const fpUrl of detail.floorPlanPdfUrls) {
        documents.push({ url: fpUrl, type: "floor_plan", name: "Floor Plan" });
      }

      // Also fetch PDFs via page-data endpoint
      try {
        const pdfUrls = await fetchProvidentPageDataPdfUrls({
          baseUrl: "https://providentestate.com",
          slug: enrichedSlug,
        });
        if (pdfUrls.brochure && !documents.find(d => d.type === "brochure")) {
          documents.push({ url: pdfUrls.brochure, type: "brochure", name: "Brochure" });
        }
        if (pdfUrls.paymentPlan && !documents.find(d => d.type === "payment_plan")) {
          documents.push({ url: pdfUrls.paymentPlan, type: "payment_plan", name: "Payment Plan" });
        }
      } catch {
        // Non-fatal
      }

      const fields: string[] = [];
      if (detail.description) fields.push("description");
      if (detail.amenities.length > 0) fields.push("amenities");
      if (detail.faqs.length > 0) fields.push("faqs");
      if (detail.uspBullets.length > 0) fields.push("usps");
      if (detail.locationDistances.length > 0) fields.push("location_distances");
      if (detail.paymentPlan) fields.push("payment_plan");
      if (Object.keys(detail.paymentBreakdown).length > 0) fields.push("payment_breakdown");
      if (detail.floorPlanTypes.length > 0) fields.push("floor_plan_types");

      // Build description with USPs
      let fullDescription = detail.description || null;
      if (detail.uspBullets.length > 0 && fullDescription) {
        fullDescription += `\n\n## Key Highlights\n${detail.uspBullets.map(b => `- ${b}`).join("\n")}`;
      }

      // Upsert into pending_project_imports
      const { data: existing } = await sb
        .from("pending_project_imports")
        .select("id")
        .eq("slug", enrichedSlug)
        .maybeSingle();

      const importRecord = {
        name: detail.name || projectName,
        slug: enrichedSlug,
        developer_name: detail.developerName || (parsed.developer as string) || null,
        location: detail.location || (parsed.area as string) || null,
        emirate: (parsed.emirate as string) || "Dubai",
        description: fullDescription,
        price_from: detail.priceFrom || (parsed.price_from as number) || null,
        bedrooms_min: detail.bedroomsMin,
        bedrooms_max: detail.bedroomsMax,
        handover_date: detail.handover,
        payment_plan: detail.paymentPlan,
        property_type_label: detail.propertyType,
        status_label: detail.statusLabel || "Off-Plan",
        images: images,
        documents: documents,
        is_new_project: true,
        status: "pending",
        source_url: `https://providentestate.com/new-projects/${enrichedSlug}`,
        review_notes: images.length === 0 && !fullDescription ? "INCOMPLETE" : null,
      };

      if (existing) {
        await sb.from("pending_project_imports")
          .update(importRecord)
          .eq("id", existing.id);
      } else {
        await sb.from("pending_project_imports").insert(importRecord);
      }

      // Mark original as migrated
      await sb
        .from("listing_pending_updates")
        .update({ status: "migrated" })
        .eq("id", update.id);

      enriched++;
      results.push({
        id: update.id,
        name: projectName,
        slug_matched: matchedSlug,
        status: "enriched",
        images: images.length,
        docs: documents.length,
        fields,
      });

      // Brief delay between projects
      await new Promise(r => setTimeout(r, 800));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      enriched,
      failed,
      remaining: Math.max(0, (remainingCount ?? 0) - results.length),
      elapsed_ms: Date.now() - startTime,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[EnrichPending] Fatal:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
