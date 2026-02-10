import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchProvidentPageDataPdfUrls } from "../_shared/provident/pagedata.ts";
import { mirrorRemotePdfToPublicStorage } from "../_shared/provident/storage.ts";
import { sleep } from "../_shared/provident/http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROVIDENT_BASE = "https://providentestate.com";
const BATCH_LIMIT = 25;
const THROTTLE_MS = 3000;

function toProvidentSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeProvidentImageUrl(url: string): string {
  const noQuery = url.split("?")[0];
  return noQuery.replace(/\/x\/\d+x\d+\//, "/x/1200x800/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Backend not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || BATCH_LIMIT, 50);
    const dryRun = body.dry_run === true;

    // Find projects missing documents and images
    // Use a raw query to find projects with 0 documents
    const { data: candidates, error: queryError } = await supabase
      .from("projects")
      .select("id, name, slug, developer_name, cover_image_url")
      .eq("is_published", true)
      .is("cover_image_url", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (queryError) {
      console.error("[batch] Query error:", queryError.message);
      return new Response(JSON.stringify({ error: queryError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no projects without cover images, try projects that have few images
    let projectsToProcess = candidates || [];

    if (projectsToProcess.length === 0) {
      // Fallback: get projects and check which ones have few documents
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, slug, developer_name, cover_image_url")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(200);

      if (allProjects && allProjects.length > 0) {
        // Check which have 0 documents
        const projectIds = allProjects.map((p: any) => p.id);
        const { data: docCounts } = await supabase
          .from("project_documents")
          .select("project_id")
          .in("project_id", projectIds);

        const projectsWithDocs = new Set((docCounts || []).map((d: any) => d.project_id));
        projectsToProcess = allProjects
          .filter((p: any) => !projectsWithDocs.has(p.id))
          .slice(0, limit);
      }
    }

    if (projectsToProcess.length === 0) {
      return new Response(JSON.stringify({
        message: "No projects need enrichment",
        processed: 0,
        results: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[batch] Processing ${projectsToProcess.length} projects`);

    const results: any[] = [];

    for (const project of projectsToProcess) {
      const projectResult: any = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        pdfs_found: 0,
        images_found: 0,
        docs_inserted: 0,
        images_inserted: 0,
        errors: [],
      };

      try {
        // 1. Try page-data.json for PDFs
        const providentSlug = toProvidentSlug(project.name);
        console.log(`[batch] Processing: ${project.name} -> slug: ${providentSlug}`);

        const pdfResult = await fetchProvidentPageDataPdfUrls({
          baseUrl: PROVIDENT_BASE,
          slug: providentSlug,
        });

        projectResult.pdfs_found = pdfResult.all.length;

        if (!dryRun && pdfResult.all.length > 0) {
          // Mirror PDFs to storage and insert documents
          const docInserts: any[] = [];

          if (pdfResult.brochure) {
            const mirrored = await mirrorRemotePdfToPublicStorage({
              supabase,
              bucket: "project-documents",
              slug: project.slug || providentSlug,
              type: "brochure",
              sourceUrl: pdfResult.brochure,
            });
            if (mirrored?.publicUrl) {
              docInserts.push({
                project_id: project.id,
                document_type: "brochure",
                document_url: mirrored.publicUrl,
                document_name: "Brochure",
                data_source: "provident_batch",
              });
            }
          }

          if (pdfResult.paymentPlan) {
            const mirrored = await mirrorRemotePdfToPublicStorage({
              supabase,
              bucket: "project-documents",
              slug: project.slug || providentSlug,
              type: "payment_plan",
              sourceUrl: pdfResult.paymentPlan,
            });
            if (mirrored?.publicUrl) {
              docInserts.push({
                project_id: project.id,
                document_type: "payment_plan",
                document_url: mirrored.publicUrl,
                document_name: "Payment Plan",
                data_source: "provident_batch",
              });
            }
          }

          for (let i = 0; i < pdfResult.floorPlans.length; i++) {
            const mirrored = await mirrorRemotePdfToPublicStorage({
              supabase,
              bucket: "project-documents",
              slug: project.slug || providentSlug,
              type: "floor_plan",
              index: i,
              sourceUrl: pdfResult.floorPlans[i],
            });
            if (mirrored?.publicUrl) {
              docInserts.push({
                project_id: project.id,
                document_type: "floor_plan",
                document_url: mirrored.publicUrl,
                document_name: `Floor Plan ${i + 1}`,
                data_source: "provident_batch",
              });
            }
          }

          if (docInserts.length > 0) {
            const { error: insertErr } = await supabase
              .from("project_documents")
              .upsert(docInserts, { onConflict: "project_id,document_type,document_url" });
            if (insertErr) {
              projectResult.errors.push(`doc insert: ${insertErr.message}`);
            } else {
              projectResult.docs_inserted = docInserts.length;
            }
          }
        }

        // 2. Try Firecrawl for images (if available)
        if (firecrawlKey) {
          try {
            const scrapeUrl = `${PROVIDENT_BASE}/new-projects/${providentSlug}/`;
            const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: scrapeUrl,
                formats: ["links"],
                onlyMainContent: false,
                waitFor: 3000,
                timeout: 30000,
              }),
            });

            if (fcRes.ok) {
              const fcData = await fcRes.json();
              const links: string[] = fcData?.data?.links || fcData?.links || [];
              
              // Extract CloudFront image URLs
              const imageUrls = links
                .filter((l: string) => 
                  l.includes("cloudfront.net") && 
                  /\.(jpg|jpeg|png|webp)/i.test(l) &&
                  !l.toLowerCase().includes("logo") &&
                  !l.toLowerCase().includes("icon")
                )
                .map(normalizeProvidentImageUrl);

              const uniqueImages = [...new Set(imageUrls)].slice(0, 15);
              projectResult.images_found = uniqueImages.length;

              if (!dryRun && uniqueImages.length > 0) {
                const imageInserts = uniqueImages.map((url: string, idx: number) => ({
                  project_id: project.id,
                  image_url: url,
                  alt_text: `${project.name} - Image ${idx + 1}`,
                  display_order: idx,
                  data_source: "provident_batch",
                }));

                const { error: imgErr } = await supabase
                  .from("project_images")
                  .upsert(imageInserts, { onConflict: "project_id,image_url" });
                
                if (imgErr) {
                  projectResult.errors.push(`img insert: ${imgErr.message}`);
                } else {
                  projectResult.images_inserted = uniqueImages.length;
                  
                  // Update cover image if none exists
                  if (!project.cover_image_url && uniqueImages[0]) {
                    await supabase
                      .from("projects")
                      .update({ cover_image_url: uniqueImages[0] })
                      .eq("id", project.id);
                  }
                }
              }
            } else {
              const errBody = await fcRes.text().catch(() => "");
              projectResult.errors.push(`firecrawl ${fcRes.status}: ${errBody.substring(0, 100)}`);
              
              // Stop on 402 (credit exhaustion)
              if (fcRes.status === 402) {
                projectResult.errors.push("FIRECRAWL_CREDITS_EXHAUSTED");
                results.push(projectResult);
                break;
              }
            }
          } catch (fcErr) {
            projectResult.errors.push(`firecrawl: ${fcErr instanceof Error ? fcErr.message : String(fcErr)}`);
          }
        }
      } catch (err) {
        projectResult.errors.push(err instanceof Error ? err.message : String(err));
      }

      results.push(projectResult);

      // Throttle between items
      if (projectsToProcess.indexOf(project) < projectsToProcess.length - 1) {
        await sleep(THROTTLE_MS);
      }
    }

    const summary = {
      processed: results.length,
      total_pdfs_found: results.reduce((s, r) => s + r.pdfs_found, 0),
      total_images_found: results.reduce((s, r) => s + r.images_found, 0),
      total_docs_inserted: results.reduce((s, r) => s + r.docs_inserted, 0),
      total_images_inserted: results.reduce((s, r) => s + r.images_inserted, 0),
      errors: results.filter((r) => r.errors.length > 0).length,
      dry_run: dryRun,
      results,
    };

    console.log(`[batch] Done. Processed=${summary.processed}, Docs=${summary.total_docs_inserted}, Images=${summary.total_images_inserted}`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[batch] Fatal error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
