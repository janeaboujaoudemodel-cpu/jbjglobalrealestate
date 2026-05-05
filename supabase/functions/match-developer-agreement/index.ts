// Match an uploaded developer agreement PDF to a developer in our DB using AI.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(realty|real estate|properties|developments?|group|holdings?|llc|l\.l\.c|inc|ltd|pjsc|psc|company|co\.|the)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  // Dice's coefficient on bigrams
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const A = bigrams(a), B = bigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size || 1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Owner gate
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Owner role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file_base64, file_type, file_name } = await req.json();
    if (!file_base64 || !file_type) {
      return new Response(JSON.stringify({ error: "file_base64 and file_type required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Ask AI to extract structured fields from the PDF/image
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "You read UAE real estate developer agreements (brokerage, MOU, NDA, addendum, commission letters). Extract structured data. Be conservative — leave fields null if unsure.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Extract the developer (counterparty) name, contract type, effective date, expiry date, commission percentage, signatories, and a short summary from the attached document. File name hint: " +
                  (file_name || "(none)"),
              },
              { type: "image_url", image_url: { url: `data:${file_type};base64,${file_base64}` } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_agreement",
            description: "Return structured agreement fields",
            parameters: {
              type: "object",
              properties: {
                developer_name: { type: "string", description: "Developer / counterparty company name as written in the document" },
                contract_type: { type: "string", description: "e.g. Brokerage Agreement, NDA, MOU, Addendum, Commission Letter" },
                effective_date: { type: "string", description: "ISO date YYYY-MM-DD or null" },
                expiry_date: { type: "string", description: "ISO date YYYY-MM-DD or null" },
                commission_pct: { type: "number" },
                counterparties: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: ["developer_name", "contract_type"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_agreement" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded — try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Top up in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const extracted = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    // Fuzzy-match against developers table
    const { data: devs } = await supabase
      .from("developers")
      .select("id, name")
      .limit(1000);

    const rawName = (extracted.developer_name || "").trim();
    const target = normalize(rawName);
    let best: { id: string; name: string; score: number } | null = null;
    for (const d of devs ?? []) {
      const score = similarity(target, normalize(d.name));
      if (!best || score > best.score) best = { id: d.id, name: d.name, score };
    }
    const matched = best && best.score >= 0.6 ? best : null;

    return new Response(
      JSON.stringify({
        extracted,
        match: matched
          ? { developer_id: matched.id, developer_name: matched.name, confidence: matched.score }
          : { developer_id: null, developer_name: null, confidence: best?.score ?? 0 },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("match-developer-agreement error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
