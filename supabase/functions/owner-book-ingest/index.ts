// Owner-only: take raw extracted book text + filename, ask Lovable AI to
// structure it into chapters, and insert book + module rows.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function requireOwner(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  const userId = data?.claims?.sub;
  if (!userId) return null;
  // Check role via service client (bypasses RLS recursion)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isOwner = (roles ?? []).some(
    (r: { role: string }) => r.role === "owner" || r.role === "admin",
  );
  return isOwner ? { userId, admin } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const ctx = await requireOwner(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json();
    const {
      rawText,
      sourceFileUrl,
      sourceFileName,
      sourceMime,
      sourceSizeBytes,
      learningPath = "general",
    } = body ?? {};

    if (!rawText || typeof rawText !== "string" || rawText.length < 100) {
      return new Response(
        JSON.stringify({ error: "rawText required (min 100 chars)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const trimmed = rawText.slice(0, 180_000); // keep prompt size sane

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content:
                "You structure raw book text into clean chapters for an institutional reading app. Preserve the author's wording. Never invent content. Return ONLY via the structure_book tool.",
            },
            {
              role: "user",
              content: `Filename: ${sourceFileName ?? "unknown"}\n\nText:\n${trimmed}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "structure_book",
                description:
                  "Return the book structured into title, summary, and ordered chapters.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    subtitle: { type: "string" },
                    summary: {
                      type: "string",
                      description: "2-3 sentence summary.",
                    },
                    chapters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          html_content: {
                            type: "string",
                            description:
                              "Chapter content as semantic HTML using <p>, <h3>, <ul>, <blockquote>.",
                          },
                          estimated_minutes: { type: "integer" },
                          ai_summary: { type: "string" },
                        },
                        required: [
                          "title",
                          "html_content",
                          "estimated_minutes",
                          "ai_summary",
                        ],
                      },
                    },
                  },
                  required: ["title", "summary", "chapters"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "structure_book" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Lovable AI credits exhausted. Add funds in Settings > Workspace > Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      console.error("ai gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiResp.json();
    const call = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No structured output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    // Insert book
    const { admin, userId } = ctx;

    // Pick next book_number (max+1)
    const { data: maxRow } = await admin
      .from("broker_education_books")
      .select("book_number")
      .order("book_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextNumber = (maxRow?.book_number ?? 0) + 1;

    const titleFromFile = sourceFileName
      ? sourceFileName.replace(/\.[^.]+$/, "")
      : parsed.title;

    const { data: bookRow, error: bookErr } = await admin
      .from("broker_education_books")
      .insert({
        book_number: nextNumber,
        learning_path: learningPath,
        title: parsed.title || titleFromFile,
        description: parsed.summary,
        learning_objective: parsed.subtitle ?? null,
        is_restricted: false,
        is_published: false,
        sort_order: nextNumber,
        source_file_url: sourceFileUrl ?? null,
        source_file_name: sourceFileName ?? null,
        source_mime: sourceMime ?? null,
        source_size_bytes: sourceSizeBytes ?? null,
        ai_generated_summary: parsed.summary,
        ai_generated_chapter_count: parsed.chapters?.length ?? 0,
        sync_filename: true,
        created_by: userId,
      })
      .select()
      .single();

    if (bookErr) {
      console.error(bookErr);
      return new Response(JSON.stringify({ error: bookErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moduleRows = (parsed.chapters ?? []).map(
      (c: {
        title: string;
        html_content: string;
        estimated_minutes: number;
        ai_summary: string;
      }, i: number) => ({
        book_id: bookRow.id,
        module_number: i + 1,
        title: c.title,
        content: c.html_content,
        estimated_minutes: c.estimated_minutes,
        ai_summary: c.ai_summary,
        sort_order: i + 1,
      }),
    );
    if (moduleRows.length) {
      const { error: modErr } = await admin
        .from("broker_education_modules")
        .insert(moduleRows);
      if (modErr) console.error("module insert error", modErr);
    }

    return new Response(
      JSON.stringify({ bookId: bookRow.id, chapters: moduleRows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
