import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

// Fields we expose over MCP. Never returns internal-only developer contact,
// office location, or unpublished rows.
const PUBLIC_PROJECT_FIELDS =
  "id, name, slug, developer_name, emirate, location, price_from, price_to, bedroom_types, handover_date, total_units, cover_image_url, status";

const PUBLIC_SITE = "https://jbj.ae";

export default defineTool({
  name: "search_projects",
  title: "Search JBJ projects",
  description:
    "Search JBJ Global Real Estate's PUBLISHED off-plan and ready projects. Filters: keyword (matched against name, developer, location), emirate, min/max price in AED, and bedroom count. Returns up to 20 projects with public URL, developer, emirate, price range, bedroom range, handover date, and cover image.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Free-text keyword matched against project name, developer name, and location."),
    emirate: z
      .string()
      .optional()
      .describe("Emirate filter — 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman', 'Umm Al Quwain', 'Fujairah'."),
    min_price: z.number().optional().describe("Minimum starting price in AED."),
    max_price: z.number().optional().describe("Maximum starting price in AED."),
    bedrooms: z
      .number()
      .int()
      .min(0)
      .max(10)
      .optional()
      .describe("Bedroom count that must appear in the project's available layouts (0 = studio)."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .describe("Max results (1-20, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, emirate, min_price, max_price, bedrooms, limit }) => {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return { content: [{ type: "text", text: "Backend is not configured." }], isError: true };
    }
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let q = supabase
      .from("projects")
      .select(PUBLIC_PROJECT_FIELDS)
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(limit ?? 10);

    if (query) {
      const like = `%${query.replace(/[%,]/g, "")}%`;
      q = q.or(
        `name.ilike.${like},developer_name.ilike.${like},location.ilike.${like}`,
      );
    }
    if (emirate) q = q.ilike("emirate", `%${emirate}%`);
    if (typeof min_price === "number") q = q.gte("price_from", min_price);
    if (typeof max_price === "number") q = q.lte("price_from", max_price);
    if (typeof bedrooms === "number") q = q.contains("bedroom_types", [bedrooms]);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const results = (data ?? []).map((p: any) => ({
      ...p,
      url: `${PUBLIC_SITE}/project/${p.slug}`,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
