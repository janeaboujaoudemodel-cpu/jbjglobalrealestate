import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const PUBLIC_SITE = "https://jbj.ae";

export default defineTool({
  name: "get_project",
  title: "Get JBJ project by slug",
  description:
    "Fetch full public detail for a single JBJ project by its URL slug (e.g. the trailing segment of https://jbj.ae/project/<slug>). Returns developer, emirate, location, price range, bedroom types, handover date, description, cover image and public URL.",
  inputSchema: {
    slug: z.string().min(1).describe("Project URL slug, e.g. 'ammar-signature-residences'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return { content: [{ type: "text", text: "Backend is not configured." }], isError: true };
    }
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, name, slug, developer_name, emirate, location, price_from, price_to, bedroom_types, handover_date, total_units, cover_image_url, status, description, amenities, updated_at",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: `No published project found with slug "${slug}".` }], isError: true };
    }

    const project = { ...data, url: `${PUBLIC_SITE}/project/${data.slug}` };
    return {
      content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
      structuredContent: { project },
    };
  },
});
