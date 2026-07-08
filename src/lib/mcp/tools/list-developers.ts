import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const PUBLIC_SITE = "https://jbj.ae";

export default defineTool({
  name: "list_developers",
  title: "List JBJ developers",
  description:
    "List UAE property developers featured on JBJ Global Real Estate. Returns each developer's name, slug, active project count and public URL. Never returns internal contact details, office locations, or unverified fields.",
  inputSchema: {
    query: z.string().optional().describe("Optional keyword filter matched against developer name."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results (1-50, default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return { content: [{ type: "text", text: "Backend is not configured." }], isError: true };
    }
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let q = supabase
      .from("developers")
      .select("name, slug, description, offplan_projects, completed_projects, logo_url")
      .eq("is_active", true)
      .order("offplan_projects", { ascending: false, nullsFirst: false })
      .limit(limit ?? 25);

    if (query) q = q.ilike("name", `%${query.replace(/[%,]/g, "")}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const results = (data ?? []).map((d: any) => ({
      ...d,
      url: `${PUBLIC_SITE}/developer/${d.slug}`,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
