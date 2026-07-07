// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_KEY) throw new Error("Missing LOVABLE_API_KEY");
    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id required");

    const admin = createClient(SB_URL, SB_SERVICE);
    const { data: p, error: pErr } = await admin
      .from("projects")
      .select("id,name,developer_name,location,emirate,price_from,handover_date,unit_types,amenities,description")
      .eq("id", project_id)
      .maybeSingle();
    if (pErr || !p) throw new Error(pErr?.message || "Project not found");

    // Fetch any attached documents (brochure / fact sheet) — we use their titles/urls as hints
    const { data: docs } = await admin
      .from("project_documents")
      .select("title,document_type,file_url")
      .eq("project_id", project_id)
      .limit(5);

    const factSheet = [
      `Project: ${p.name}`,
      p.developer_name && `Developer: ${p.developer_name}`,
      (p.location || p.emirate) && `Location: ${[p.location, p.emirate].filter(Boolean).join(", ")}`,
      p.price_from && `Price from: AED ${Number(p.price_from).toLocaleString()}`,
      p.handover_date && `Handover: ${p.handover_date}`,
      Array.isArray(p.unit_types) && p.unit_types.length && `Unit types: ${(p.unit_types as any[]).join(", ")}`,
      Array.isArray(p.amenities) && p.amenities.length && `Amenities: ${(p.amenities as any[]).slice(0, 12).join(", ")}`,
      (docs?.length ?? 0) > 0 && `Attached documents: ${(docs || []).map((d) => d.title || d.document_type).filter(Boolean).join(", ")}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are writing a marketing description for an off-plan real-estate project in the UAE.
Use the fact sheet below. Write 130-170 words in a confident, aspirational but factual tone.
Do not invent amenities, prices, or dates that are not on the fact sheet.
Do not use markdown, headings, or bullet points — plain paragraphs only.

FACT SHEET:
${factSheet}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write concise, factual real-estate marketing copy." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: `AI gateway ${resp.status}: ${text}` }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const json = await resp.json();
    const description: string = json?.choices?.[0]?.message?.content?.trim() || "";
    if (!description) throw new Error("Empty AI response");

    // Save to DB so publish immediately picks it up
    await admin.from("projects").update({ description }).eq("id", project_id);

    return new Response(JSON.stringify({ description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
