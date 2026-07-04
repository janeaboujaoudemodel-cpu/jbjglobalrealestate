import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "search_properties",
  title: "Search JBJ properties",
  description:
    "Search JBJ Global Real Estate's published property listings by keyword, city, or price range. Returns up to 20 matching listings with name, city, price, bedrooms, and a public URL.",
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe("Free-text keyword matched against property name and description."),
    city: z.string().optional().describe("City or emirate filter (e.g. 'Dubai')."),
    min_price: z.number().optional().describe("Minimum listing price in AED."),
    max_price: z.number().optional().describe("Maximum listing price in AED."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (1-20, default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, city, min_price, max_price, limit }) => {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return { content: [{ type: "text", text: "Backend is not configured." }], isError: true };
    }
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let q = supabase.from("properties").select("*").limit(limit ?? 10);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (city) q = q.ilike("city", `%${city}%`);
    if (typeof min_price === "number") q = q.gte("price", min_price);
    if (typeof max_price === "number") q = q.lte("price", max_price);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { results: data ?? [] },
    };
  },
});
